"""Global and multi-criteria search and filtering service."""
from typing import Dict, Any, List, Optional
from backend.database.connection import get_db
from backend.utils.dates import get_date_range


class SearchService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def unified_search(
        self,
        query: Optional[str] = None,
        entity_types: Optional[List[str]] = None,  # ['work', 'payment', 'expense', 'person']
        preset: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_amount: Optional[int] = None,  # in paise
        max_amount: Optional[int] = None,  # in paise
        person_id: Optional[int] = None,
        payment_method: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs a combined, parameterized search across people, work, payments, and expenses."""
        if not entity_types:
            entity_types = ["work", "payment", "expense", "person"]

        start_d, end_d = get_date_range(preset or "all", date_from, date_to)

        results: Dict[str, List[Dict[str, Any]]] = {
            "people": [],
            "work": [],
            "payments": [],
            "expenses": []
        }

        with get_db(self.db_path) as conn:
            # 1. Search People
            if "person" in entity_types:
                p_sql = "SELECT * FROM people WHERE is_archived = 0"
                p_params = []
                if query:
                    p_sql += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ? OR notes LIKE ?)"
                    term = f"%{query.strip()}%"
                    p_params.extend([term, term, term, term])
                if person_id:
                    p_sql += " AND id = ?"
                    p_params.append(person_id)
                p_sql += " ORDER BY name ASC LIMIT 50"
                results["people"] = conn.execute(p_sql, p_params).fetchall()

            # 2. Search Work
            if "work" in entity_types:
                w_sql = """
                SELECT w.*, p.name AS person_name,
                       COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS received_amount
                FROM work w
                JOIN people p ON w.person_id = p.id
                LEFT JOIN payments pay ON pay.work_id = w.id
                WHERE w.is_archived = 0
                """
                w_params = []
                if query:
                    w_sql += " AND (w.title LIKE ? OR w.description LIKE ? OR p.name LIKE ?)"
                    term = f"%{query.strip()}%"
                    w_params.extend([term, term, term])
                if person_id:
                    w_sql += " AND w.person_id = ?"
                    w_params.append(person_id)
                if status:
                    w_sql += " AND LOWER(w.status) = LOWER(?)"
                    w_params.append(status)
                if category:
                    w_sql += " AND LOWER(w.category) = LOWER(?)"
                    w_params.append(category)
                if min_amount is not None:
                    w_sql += " AND w.agreed_amount >= ?"
                    w_params.append(min_amount)
                if max_amount is not None:
                    w_sql += " AND w.agreed_amount <= ?"
                    w_params.append(max_amount)
                if start_d:
                    w_sql += " AND (w.deadline >= ? OR w.start_date >= ? OR w.created_at >= ?)"
                    w_params.extend([start_d, start_d, start_d])
                if end_d:
                    w_sql += " AND (w.deadline <= ? OR w.start_date <= ? OR w.created_at <= ?)"
                    w_params.extend([end_d, end_d, f"{end_d} 23:59:59"])

                w_sql += " GROUP BY w.id ORDER BY w.created_at DESC LIMIT 50"
                work_rows = conn.execute(w_sql, w_params).fetchall()
                for r in work_rows:
                    r["pending_amount"] = max(0, r["agreed_amount"] - r["received_amount"])
                results["work"] = work_rows

            # 3. Search Payments
            if "payment" in entity_types:
                pay_sql = """
                SELECT p.*, per.name AS person_name, w.title AS work_title
                FROM payments p
                JOIN people per ON p.person_id = per.id
                LEFT JOIN work w ON p.work_id = w.id
                WHERE 1=1
                """
                pay_params = []
                if query:
                    pay_sql += " AND (per.name LIKE ? OR p.transaction_reference LIKE ? OR p.notes LIKE ? OR w.title LIKE ?)"
                    term = f"%{query.strip()}%"
                    pay_params.extend([term, term, term, term])
                if person_id:
                    pay_sql += " AND p.person_id = ?"
                    pay_params.append(person_id)
                if payment_method:
                    pay_sql += " AND LOWER(p.payment_method) = LOWER(?)"
                    pay_params.append(payment_method)
                if min_amount is not None:
                    pay_sql += " AND p.amount >= ?"
                    pay_params.append(min_amount)
                if max_amount is not None:
                    pay_sql += " AND p.amount <= ?"
                    pay_params.append(max_amount)
                if start_d:
                    pay_sql += " AND p.payment_date >= ?"
                    pay_params.append(start_d)
                if end_d:
                    pay_sql += " AND p.payment_date <= ?"
                    pay_params.append(end_d)

                pay_sql += " ORDER BY p.payment_date DESC, p.payment_time DESC LIMIT 50"
                results["payments"] = conn.execute(pay_sql, pay_params).fetchall()

            # 4. Search Expenses
            if "expense" in entity_types:
                exp_sql = """
                SELECT e.*, ec.name AS category_name, w.title AS work_title
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                LEFT JOIN work w ON e.work_id = w.id
                WHERE e.is_archived = 0
                """
                exp_params = []
                if query:
                    exp_sql += " AND (e.title LIKE ? OR e.description LIKE ? OR e.vendor LIKE ? OR ec.name LIKE ?)"
                    term = f"%{query.strip()}%"
                    exp_params.extend([term, term, term, term])
                if payment_method:
                    exp_sql += " AND LOWER(e.payment_method) = LOWER(?)"
                    exp_params.append(payment_method)
                if min_amount is not None:
                    exp_sql += " AND e.amount >= ?"
                    exp_params.append(min_amount)
                if max_amount is not None:
                    exp_sql += " AND e.amount <= ?"
                    exp_params.append(max_amount)
                if start_d:
                    exp_sql += " AND e.expense_date >= ?"
                    exp_params.append(start_d)
                if end_d:
                    exp_sql += " AND e.expense_date <= ?"
                    exp_params.append(end_d)

                exp_sql += " ORDER BY e.expense_date DESC, e.expense_time DESC LIMIT 50"
                results["expenses"] = conn.execute(exp_sql, exp_params).fetchall()

        total_matches = sum(len(items) for items in results.values())
        return {
            "query": query,
            "total_matches": total_matches,
            "results": results
        }
