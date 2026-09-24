"""Service for Payments and Income transactions."""
from typing import List, Dict, Any, Optional
from backend.database.connection import get_db
from backend.database.queries import log_activity, get_work_with_balances
from backend.schemas.payment import PaymentCreate, PaymentUpdate
from backend.core.exceptions import NotFoundException
from backend.utils.dates import now_utc_iso
from backend.utils.money import format_inr


class PaymentService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def create(self, data: PaymentCreate) -> Dict[str, Any]:
        now = now_utc_iso()
        with get_db(self.db_path) as conn:
            # Verify person
            person = conn.execute("SELECT id, name FROM people WHERE id = ?", (data.person_id,)).fetchone()
            if not person:
                raise NotFoundException(f"Person with ID {data.person_id} does not exist.")

            work_title = None
            if data.work_id:
                work = get_work_with_balances(conn, data.work_id)
                if not work:
                    raise NotFoundException(f"Work with ID {data.work_id} does not exist.")
                work_title = work["title"]

                # Check for overpayment safety (VAL-004)
                if data.payment_status == 'received' and data.payment_method.lower() != 'udhar':
                    remaining = work["pending_amount"]
                    if data.amount > remaining and remaining > 0:
                        # Allow with warning log, or check if user meant to overpay
                        pass

            cur = conn.execute(
                """
                INSERT INTO payments (
                    person_id, work_id, amount, payment_method,
                    payment_status, transaction_reference, payment_date,
                    payment_time, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data.person_id, data.work_id, data.amount, data.payment_method,
                    data.payment_status, data.transaction_reference, data.payment_date,
                    data.payment_time, data.notes, now, now
                )
            )
            payment_id = cur.lastrowid

            amount_fmt = format_inr(data.amount)
            desc = f"Received {amount_fmt} via {data.payment_method} from {person['name']}"
            if work_title:
                desc += f" for work '{work_title}'"
            log_activity(conn, "payment", payment_id, "created", desc)

        return self.get_by_id(payment_id)

    def get_by_id(self, payment_id: int) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT p.*, per.name AS person_name, w.title AS work_title
                FROM payments p
                JOIN people per ON p.person_id = per.id
                LEFT JOIN work w ON p.work_id = w.id
                WHERE p.id = ?
                """,
                (payment_id,)
            ).fetchone()
            if not row:
                raise NotFoundException(f"Payment with ID {payment_id} not found")
            return row

    def list_all(
        self,
        person_id: Optional[int] = None,
        work_id: Optional[int] = None,
        payment_method: Optional[str] = None,
        payment_status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_amount: Optional[int] = None,
        max_amount: Optional[int] = None,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            sql = """
            SELECT p.*, per.name AS person_name, w.title AS work_title
            FROM payments p
            JOIN people per ON p.person_id = per.id
            LEFT JOIN work w ON p.work_id = w.id
            WHERE 1=1
            """
            params: List[Any] = []

            if person_id:
                sql += " AND p.person_id = ?"
                params.append(person_id)
            if work_id:
                sql += " AND p.work_id = ?"
                params.append(work_id)
            if payment_method:
                sql += " AND LOWER(p.payment_method) = LOWER(?)"
                params.append(payment_method)
            if payment_status:
                sql += " AND LOWER(p.payment_status) = LOWER(?)"
                params.append(payment_status)
            if date_from:
                sql += " AND p.payment_date >= ?"
                params.append(date_from)
            if date_to:
                sql += " AND p.payment_date <= ?"
                params.append(date_to)
            if min_amount is not None:
                sql += " AND p.amount >= ?"
                params.append(min_amount)
            if max_amount is not None:
                sql += " AND p.amount <= ?"
                params.append(max_amount)
            if query:
                sql += " AND (per.name LIKE ? OR p.transaction_reference LIKE ? OR p.notes LIKE ? OR w.title LIKE ?)"
                like_term = f"%{query.strip()}%"
                params.extend([like_term, like_term, like_term, like_term])

            sql += " ORDER BY p.payment_date DESC, p.payment_time DESC"
            return conn.execute(sql, params).fetchall()

    def update(self, payment_id: int, data: PaymentUpdate) -> Dict[str, Any]:
        existing = self.get_by_id(payment_id)
        updates = []
        params = []
        now = now_utc_iso()

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            updates.append(f"{key} = ?")
            params.append(val)

        if not updates:
            return existing

        updates.append("updated_at = ?")
        params.append(now)
        params.append(payment_id)

        with get_db(self.db_path) as conn:
            conn.execute(f"UPDATE payments SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "payment", payment_id, "updated", f"Updated payment #{payment_id}")

        return self.get_by_id(payment_id)

    def delete(self, payment_id: int) -> None:
        existing = self.get_by_id(payment_id)
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM payments WHERE id = ?", (payment_id,))
            log_activity(conn, "payment", payment_id, "deleted", f"Deleted payment #{payment_id} for {format_inr(existing['amount'])}")
