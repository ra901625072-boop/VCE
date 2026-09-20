"""Service for managing categories, payment methods, work statuses, and settings."""
from typing import List, Dict, Any
from backend.database.connection import get_db
from backend.utils.dates import now_utc_iso


class SettingsService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    # Work Categories
    def list_work_categories(self) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            return conn.execute("SELECT * FROM work_categories ORDER BY name ASC").fetchall()

    def add_work_category(self, name: str) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO work_categories (name, is_default, created_at) VALUES (?, 0, ?)",
                (name.strip(), now_utc_iso())
            )
            return {"id": cur.lastrowid, "name": name.strip(), "is_default": False}

    def delete_work_category(self, cat_id: int) -> None:
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM work_categories WHERE id = ? AND is_default = 0", (cat_id,))

    # Expense Categories
    def list_expense_categories(self) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            return conn.execute("SELECT * FROM expense_categories ORDER BY name ASC").fetchall()

    def add_expense_category(self, name: str) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO expense_categories (name, is_default, created_at) VALUES (?, 0, ?)",
                (name.strip(), now_utc_iso())
            )
            return {"id": cur.lastrowid, "name": name.strip(), "is_default": False}

    def delete_expense_category(self, cat_id: int) -> None:
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM expense_categories WHERE id = ? AND is_default = 0", (cat_id,))

    # Payment Methods
    def list_payment_methods(self) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            return conn.execute("SELECT * FROM payment_methods ORDER BY id ASC").fetchall()

    def add_payment_method(self, name: str) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO payment_methods (name, is_system, is_default) VALUES (?, 0, 0)",
                (name.strip(),)
            )
            return {"id": cur.lastrowid, "name": name.strip(), "is_system": False, "is_default": False}

    def delete_payment_method(self, method_id: int) -> None:
        with get_db(self.db_path) as conn:
            conn.execute("DELETE FROM payment_methods WHERE id = ? AND is_system = 0", (method_id,))

    # Work Statuses
    def list_work_statuses(self) -> List[Dict[str, Any]]:
        with get_db(self.db_path) as conn:
            return conn.execute("SELECT * FROM work_statuses ORDER BY sort_order ASC").fetchall()

    def add_work_status(self, name: str, color: str = "#3b82f6", sort_order: int = 0) -> Dict[str, Any]:
        with get_db(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO work_statuses (name, color, sort_order, is_default) VALUES (?, ?, ?, 0)",
                (name.strip(), color, sort_order)
            )
            return {"id": cur.lastrowid, "name": name.strip(), "color": color, "sort_order": sort_order, "is_default": False}

    # App Settings
    def get_all_settings(self) -> Dict[str, str]:
        with get_db(self.db_path) as conn:
            rows = conn.execute("SELECT key, value FROM settings").fetchall()
            return {r["key"]: r["value"] for r in rows}

    def update_setting(self, key: str, value: str) -> None:
        with get_db(self.db_path) as conn:
            conn.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                (key, value, now_utc_iso())
            )
