"""Service for Work / Application management and timeline tracking."""
import time
from typing import List, Dict, Any, Optional
from backend.database.connection import get_db
from backend.database.queries import get_work_with_balances, log_activity
from backend.schemas.work import WorkCreate, WorkUpdate
from backend.core.exceptions import NotFoundException, BusinessRuleException
from backend.utils.dates import now_utc_iso, current_date_str


class WorkService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def _deduct_portal_wallet(self, conn, portal_name: str, cost: int, token_no: str, work_id: int) -> None:
        """Automatically debits portal wallet float upon completion of an e-Gram service application."""
        if not portal_name or cost <= 0:
            return

        ref = f"WORK-{work_id}"
        existing = conn.execute(
            "SELECT id FROM wallet_transactions WHERE reference_no = ? AND transaction_type = 'service_debit'",
            (ref,)
        ).fetchone()
        if existing:
            return

        wallet = conn.execute(
            """SELECT * FROM portal_wallets 
               WHERE LOWER(portal_name) = LOWER(?) 
                  OR LOWER(portal_name) LIKE '%' || LOWER(?) || '%' 
                  OR LOWER(?) LIKE '%' || LOWER(portal_name) || '%' 
               LIMIT 1""",
            (portal_name, portal_name, portal_name)
        ).fetchone()

        if wallet:
            wallet_id = wallet["id"]
            new_bal = wallet["current_balance"] - cost
            today = current_date_str()
            now = now_utc_iso()
            conn.execute(
                "UPDATE portal_wallets SET current_balance = ?, updated_at = ? WHERE id = ?",
                (new_bal, now, wallet_id)
            )
            conn.execute(
                """INSERT INTO wallet_transactions 
                   (wallet_id, transaction_type, amount, balance_after, reference_no, transaction_date, notes, created_at)
                   VALUES (?, 'service_debit', ?, ?, ?, ?, ?, ?)""",
                (wallet_id, cost, new_bal, ref, today, f"Service debit for token {token_no}", now)
            )
            log_activity(conn, "portal_wallet", wallet_id, "service_debit", f"Deducted ₹{cost/100:.2f} for token {token_no} ({portal_name})")

    def create(self, data: WorkCreate) -> Dict[str, Any]:
        now = now_utc_iso()
        with get_db(self.db_path) as conn:
            # Validate person exists
            person = conn.execute("SELECT id, name FROM people WHERE id = ?", (data.person_id,)).fetchone()
            if not person:
                raise NotFoundException(f"Person with ID {data.person_id} does not exist.")

            token_no = (getattr(data, "token_no", "") or "").strip()
            if not token_no:
                # Generate token based on timestamp
                date_part = (data.start_date or current_date_str()).replace("-", "")
                ms_suffix = str(int(time.time() * 1000))[-4:]
                token_no = f"TK-{date_part}-{ms_suffix}"

            portal_cost = getattr(data, "portal_cost", 0) or 0
            portal_name = getattr(data, "portal_name", "") or ""

            today_str = current_date_str()
            start_date = data.start_date or today_str
            completed_date = data.completed_date
            if data.status in ("Completed", "Completed / Delivered") and not completed_date:
                completed_date = today_str

            cur = conn.execute(
                """
                INSERT INTO work (
                    person_id, title, description, category, agreed_amount,
                    status, priority, start_date, deadline, completed_date,
                    notes, service_category, service_name, portal_name,
                    token_no, ack_no, portal_cost, panchayat_share, vce_commission,
                    is_archived, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    data.person_id,
                    data.title.strip(),
                    data.description,
                    data.category,
                    data.agreed_amount,
                    data.status,
                    data.priority,
                    start_date,
                    data.deadline,
                    completed_date,
                    data.notes,
                    getattr(data, "service_category", "General") or "General",
                    getattr(data, "service_name", "") or "",
                    portal_name,
                    token_no,
                    getattr(data, "ack_no", "") or "",
                    portal_cost,
                    getattr(data, "panchayat_share", 0) or 0,
                    getattr(data, "vce_commission", 0) or 0,
                    now,
                    now
                )
            )
            work_id = cur.lastrowid
            log_activity(conn, "work", work_id, "created", f"Created application '{data.title}' (Token: {token_no}) for {person['name']}")

            if data.status in ("Completed", "Completed / Delivered") and portal_cost > 0:
                self._deduct_portal_wallet(conn, portal_name, portal_cost, token_no, work_id)

        return self.get_by_id(work_id)

    def get_by_id(self, work_id: int) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            row = get_work_with_balances(conn, work_id)
            if not row:
                raise NotFoundException(f"Work with ID {work_id} not found")
            row["is_archived"] = bool(row["is_archived"])
            return row

    def list_all(
        self,
        person_id: Optional[int] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        deadline_from: Optional[str] = None,
        deadline_to: Optional[str] = None,
        query: Optional[str] = None,
        include_archived: bool = False
    ) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            sql = """
            SELECT 
                w.*,
                p.name AS person_name,
                p.phone AS person_phone,
                COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS received_amount
            FROM work w
            JOIN people p ON w.person_id = p.id
            LEFT JOIN payments pay ON pay.work_id = w.id
            WHERE 1=1
            """
            params: List[Any] = []

            if not include_archived:
                sql += " AND w.is_archived = 0"
            if person_id:
                sql += " AND w.person_id = ?"
                params.append(person_id)
            if status:
                sql += " AND w.status = ?"
                params.append(status)
            if category:
                sql += " AND (w.category = ? OR w.service_category = ?)"
                params.extend([category, category])
            if priority:
                sql += " AND w.priority = ?"
                params.append(priority)
            if deadline_from:
                sql += " AND w.deadline >= ?"
                params.append(deadline_from)
            if deadline_to:
                sql += " AND w.deadline <= ?"
                params.append(deadline_to)
            if query:
                sql += " AND (w.title LIKE ? OR w.description LIKE ? OR p.name LIKE ? OR w.token_no LIKE ? OR w.ack_no LIKE ?)"
                like_term = f"%{query.strip()}%"
                params.extend([like_term, like_term, like_term, like_term, like_term])

            sql += " GROUP BY w.id, p.id ORDER BY w.created_at DESC"

            rows = conn.execute(sql, params).fetchall()
            for r in rows:
                r["pending_amount"] = max(0, r["agreed_amount"] - r["received_amount"])
                r["is_archived"] = bool(r["is_archived"])
            return rows

    def update(self, work_id: int, data: WorkUpdate) -> Dict[str, Any]:
        existing = self.get_by_id(work_id)
        updates = []
        params = []
        now = now_utc_iso()

        update_dict = data.model_dump(exclude_unset=True)
        if "status" in update_dict and update_dict["status"] in ("Completed", "Completed / Delivered") and not existing.get("completed_date"):
            update_dict["completed_date"] = current_date_str()

        for key, val in update_dict.items():
            if key == "is_archived":
                updates.append(f"{key} = ?")
                params.append(1 if val else 0)
            else:
                updates.append(f"{key} = ?")
                params.append(val)

        if not updates:
            return existing

        updates.append("updated_at = ?")
        params.append(now)
        params.append(work_id)

        with get_db(self.db_path) as conn:
            conn.execute(f"UPDATE work SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "work", work_id, "updated", f"Updated work '{existing['title']}'")

            new_status = update_dict.get("status", existing.get("status"))
            portal_cost = update_dict.get("portal_cost", existing.get("portal_cost", 0))
            portal_name = update_dict.get("portal_name", existing.get("portal_name", ""))
            token_no = update_dict.get("token_no", existing.get("token_no", ""))
            if new_status in ("Completed", "Completed / Delivered") and portal_cost > 0:
                self._deduct_portal_wallet(conn, portal_name, portal_cost, token_no, work_id)

        return self.get_by_id(work_id)

    def delete(self, work_id: int) -> None:
        """Deletes work safely, preventing loss of financial history if payments exist."""
        existing = self.get_by_id(work_id)
        with get_db(self.db_path) as conn:
            p_count = conn.execute("SELECT COUNT(*) AS c FROM payments WHERE work_id = ?", (work_id,)).fetchone()["c"]
            if p_count > 0:
                conn.execute("UPDATE work SET is_archived = 1, updated_at = ? WHERE id = ?", (now_utc_iso(), work_id))
                log_activity(conn, "work", work_id, "archived", f"Archived work '{existing['title']}' because {p_count} payments are linked.")
            else:
                conn.execute("DELETE FROM work WHERE id = ?", (work_id,))
                log_activity(conn, "work", work_id, "deleted", f"Deleted work '{existing['title']}'")

    def get_timeline(self, work_id: int) -> Dict[str, Any]:
        """Provides full timeline: Citizen -> Application -> Agreed Amount -> Payments -> Remaining Amount -> Status."""
        work = self.get_by_id(work_id)
        with get_db(self.db_path) as conn:
            payments = conn.execute(
                """
                SELECT * FROM payments 
                WHERE work_id = ? 
                ORDER BY payment_date ASC, payment_time ASC
                """,
                (work_id,)
            ).fetchall()

            expenses = conn.execute(
                """
                SELECT * FROM expenses 
                WHERE work_id = ? 
                ORDER BY expense_date ASC, expense_time ASC
                """,
                (work_id,)
            ).fetchall()

            activities = conn.execute(
                """
                SELECT * FROM activity_log 
                WHERE (entity_type = 'work' AND entity_id = ?) 
                   OR (entity_type = 'payment' AND entity_id IN (SELECT id FROM payments WHERE work_id = ?))
                ORDER BY timestamp ASC
                """,
                (work_id, work_id)
            ).fetchall()

            work["payments"] = payments
            work["expenses"] = expenses
            work["activities"] = activities
            return work
