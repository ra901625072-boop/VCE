"""Service for Expense tracking and categorization."""
from typing import List, Dict, Any, Optional
from backend.database.connection import get_db
from backend.database.queries import log_activity
from backend.schemas.expense import ExpenseCreate, ExpenseUpdate
from backend.core.exceptions import NotFoundException
from backend.utils.dates import now_utc_iso
from backend.utils.money import format_inr


class ExpenseService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def create(self, data: ExpenseCreate) -> Dict[str, Any]:
        now = now_utc_iso()
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                """
                INSERT INTO expenses (
                    category_id, title, description, amount, payment_method,
                    expense_date, expense_time, vendor, work_id, receipt_ref,
                    notes, is_archived, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    data.category_id, data.title.strip(), data.description, data.amount,
                    data.payment_method, data.expense_date, data.expense_time, data.vendor,
                    data.work_id, data.receipt_ref, data.notes, now, now
                )
            )
            expense_id = cur.lastrowid
            log_activity(conn, "expense", expense_id, "created", f"Added expense '{data.title}' for {format_inr(data.amount)}")

        return self.get_by_id(expense_id)

    def get_by_id(self, expense_id: int) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT e.*, ec.name AS category_name, w.title AS work_title
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                LEFT JOIN work w ON e.work_id = w.id
                WHERE e.id = ?
                """,
                (expense_id,)
            ).fetchone()
            if not row:
                raise NotFoundException(f"Expense with ID {expense_id} not found")
            row["is_archived"] = bool(row["is_archived"])
            return row

    def list_all(
        self,
        category_id: Optional[int] = None,
        payment_method: Optional[str] = None,
        vendor: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_amount: Optional[int] = None,
        max_amount: Optional[int] = None,
        query: Optional[str] = None,
        include_archived: bool = False
    ) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            sql = """
            SELECT e.*, ec.name AS category_name, w.title AS work_title
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN work w ON e.work_id = w.id
            WHERE 1=1
            """
            params: List[Any] = []

            if not include_archived:
                sql += " AND e.is_archived = 0"
            if category_id:
                sql += " AND e.category_id = ?"
                params.append(category_id)
            if payment_method:
                sql += " AND LOWER(e.payment_method) = LOWER(?)"
                params.append(payment_method)
            if vendor:
                sql += " AND e.vendor LIKE ?"
                params.append(f"%{vendor.strip()}%")
            if date_from:
                sql += " AND e.expense_date >= ?"
                params.append(date_from)
            if date_to:
                sql += " AND e.expense_date <= ?"
                params.append(date_to)
            if min_amount is not None:
                sql += " AND e.amount >= ?"
                params.append(min_amount)
            if max_amount is not None:
                sql += " AND e.amount <= ?"
                params.append(max_amount)
            if query:
                sql += " AND (e.title LIKE ? OR e.description LIKE ? OR e.vendor LIKE ? OR ec.name LIKE ?)"
                like_term = f"%{query.strip()}%"
                params.extend([like_term, like_term, like_term, like_term])

            sql += " ORDER BY e.expense_date DESC, e.expense_time DESC"
            rows = conn.execute(sql, params).fetchall()
            for r in rows:
                r["is_archived"] = bool(r["is_archived"])
            return rows

    def update(self, expense_id: int, data: ExpenseUpdate) -> Dict[str, Any]:
        existing = self.get_by_id(expense_id)
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
        params.append(expense_id)

        with get_db(self.db_path) as conn:
            conn.execute(f"UPDATE expenses SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "expense", expense_id, "updated", f"Updated expense '{existing['title']}'")

        return self.get_by_id(expense_id)

    def delete(self, expense_id: int) -> None:
        existing = self.get_by_id(expense_id)
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
            log_activity(conn, "expense", expense_id, "deleted", f"Deleted expense '{existing['title']}' for {format_inr(existing['amount'])}")
