"""Service for Savings tracking."""
from typing import List, Dict, Any
from backend.database.connection import get_db
from backend.database.queries import log_activity
from backend.schemas.savings import SavingsCreate, SavingsUpdate
from backend.core.exceptions import NotFoundException
from backend.utils.dates import now_utc_iso


class SavingsService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def create(self, data: SavingsCreate) -> Dict[str, Any]:
        now = now_utc_iso()
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                """
                INSERT INTO savings (title, target_amount, saved_amount, target_date, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (data.title.strip(), data.target_amount, data.saved_amount, data.target_date, data.notes, now, now)
            )
            savings_id = cur.lastrowid
            log_activity(conn, "savings", savings_id, "created", f"Created savings goal: {data.title}")
        return self.get_by_id(savings_id)

    def get_by_id(self, savings_id: int) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            row = conn.execute("SELECT * FROM savings WHERE id = ?", (savings_id,)).fetchone()
            if not row:
                raise NotFoundException(f"Savings goal with ID {savings_id} not found")
            target = row["target_amount"]
            saved = row["saved_amount"]
            pct = round((saved / target * 100), 1) if target > 0 else 100.0
            row["progress_percentage"] = min(pct, 100.0)
            return row

    def list_all(self) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            rows = conn.execute("SELECT * FROM savings ORDER BY created_at DESC").fetchall()
            for r in rows:
                target = r["target_amount"]
                saved = r["saved_amount"]
                pct = round((saved / target * 100), 1) if target > 0 else 100.0
                r["progress_percentage"] = min(pct, 100.0)
            return rows

    def update(self, savings_id: int, data: SavingsUpdate) -> Dict[str, Any]:
        existing = self.get_by_id(savings_id)
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
        params.append(savings_id)

        with get_db(self.db_path) as conn:
            conn.execute(f"UPDATE savings SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "savings", savings_id, "updated", f"Updated savings goal: {existing['title']}")

        return self.get_by_id(savings_id)

    def delete(self, savings_id: int) -> None:
        self.get_by_id(savings_id)
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM savings WHERE id = ?", (savings_id,))
            log_activity(conn, "savings", savings_id, "deleted", f"Deleted savings goal #{savings_id}")
