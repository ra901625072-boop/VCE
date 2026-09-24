"""Service for Person / Client business logic."""
from typing import List, Dict, Any, Optional
from backend.database.connection import get_db
from backend.database.queries import get_person_financial_summary, log_activity
from backend.schemas.person import PersonCreate, PersonUpdate
from backend.core.exceptions import NotFoundException
from backend.utils.dates import now_utc_iso


class PersonService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def create(self, data: PersonCreate) -> Dict[str, Any]:
        now = now_utc_iso()
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                """
                INSERT INTO people (name, phone, email, company, address, notes, tags, village, aadhaar_last4, ration_card_no, khata_no, citizen_type, is_archived, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    data.name.strip(),
                    data.phone,
                    data.email,
                    data.company,
                    data.address,
                    data.notes,
                    data.tags,
                    getattr(data, "village", "") or "",
                    getattr(data, "aadhaar_last4", "") or "",
                    getattr(data, "ration_card_no", "") or "",
                    getattr(data, "khata_no", "") or "",
                    getattr(data, "citizen_type", "General") or "General",
                    now,
                    now
                )
            )
            person_id = cur.lastrowid
            log_activity(conn, "person", person_id, "created", f"Created person: {data.name}")
        return self.get_by_id(person_id)

    def get_by_id(self, person_id: int) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            row = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
            if not row:
                raise NotFoundException(f"Person with ID {person_id} not found")
            summary = get_person_financial_summary(conn, person_id)
            row.update(summary)
            row["is_archived"] = bool(row["is_archived"])
            return row

    def list_all(self, query: Optional[str] = None, include_archived: bool = False) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            sql = "SELECT * FROM people WHERE 1=1"
            params: List[Any] = []
            if not include_archived:
                sql += " AND is_archived = 0"
            if query:
                sql += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ? OR village LIKE ? OR ration_card_no LIKE ? OR khata_no LIKE ?)"
                like_term = f"%{query.strip()}%"
                params.extend([like_term, like_term, like_term, like_term, like_term, like_term])
            sql += " ORDER BY name ASC"
            rows = conn.execute(sql, params).fetchall()
            results = []
            for r in rows:
                summary = get_person_financial_summary(conn, r["id"])
                r.update(summary)
                r["is_archived"] = bool(r["is_archived"])
                results.append(r)
            return results

    def update(self, person_id: int, data: PersonUpdate) -> Dict[str, Any]:
        existing = self.get_by_id(person_id)
        updates = []
        params = []
        now = now_utc_iso()

        update_dict = data.model_dump(exclude_unset=True)
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
        params.append(person_id)

        with get_db(self.db_path) as conn:
            conn.execute(f"UPDATE people SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "person", person_id, "updated", f"Updated person: {existing['name']}")

        return self.get_by_id(person_id)

    def delete(self, person_id: int, cascade: bool = False) -> None:
        """Deletes or archives a person. If cascade=True, hard-deletes linked payments and work as well."""
        existing = self.get_by_id(person_id)
        with get_db(self.db_path) as conn:
            w_count = conn.execute("SELECT COUNT(*) AS c FROM work WHERE person_id = ?", (person_id,)).fetchone()["c"]
            p_count = conn.execute("SELECT COUNT(*) AS c FROM payments WHERE person_id = ?", (person_id,)).fetchone()["c"]
            if cascade:
                conn.execute("DELETE FROM payments WHERE person_id = ?", (person_id,))
                conn.execute("DELETE FROM work WHERE person_id = ?", (person_id,))
                conn.execute("DELETE FROM people WHERE id = ?", (person_id,))
                log_activity(conn, "person", person_id, "deleted", f"Hard deleted person and all linked records: {existing['name']}")
            elif w_count > 0 or p_count > 0:
                conn.execute("UPDATE people SET is_archived = 1, updated_at = ? WHERE id = ?", (now_utc_iso(), person_id))
                log_activity(conn, "person", person_id, "archived", f"Archived person {existing['name']} because {w_count} work and {p_count} payments are linked.")
            else:
                conn.execute("DELETE FROM people WHERE id = ?", (person_id,))
                log_activity(conn, "person", person_id, "deleted", f"Hard deleted person: {existing['name']}")

    def get_full_detail(self, person_id: int) -> Dict[str, Any]:
        """Returns person details along with full work history and payment history."""
        person = self.get_by_id(person_id)
        with get_db(self.db_path) as conn:
            # Linked work
            work_items = conn.execute(
                """
                SELECT w.*, 
                    COALESCE(SUM(CASE WHEN p.payment_status = 'received' AND LOWER(p.payment_method) != 'udhar' THEN p.amount ELSE 0 END), 0) AS received_amount
                FROM work w
                LEFT JOIN payments p ON p.work_id = w.id
                WHERE w.person_id = ?
                GROUP BY w.id
                ORDER BY w.created_at DESC
                """,
                (person_id,)
            ).fetchall()
            for w in work_items:
                w["pending_amount"] = max(0, w["agreed_amount"] - w["received_amount"])

            # Linked payments
            payments = conn.execute(
                """
                SELECT p.*, w.title AS work_title
                FROM payments p
                LEFT JOIN work w ON p.work_id = w.id
                WHERE p.person_id = ?
                ORDER BY p.payment_date DESC, p.payment_time DESC
                """,
                (person_id,)
            ).fetchall()

            person["work_history"] = work_items
            person["payment_history"] = payments
            return person
