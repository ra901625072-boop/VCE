"""Service for financial reporting, summaries, and file export formatting."""
from typing import Dict, Any, List, Optional
from backend.database.connection import get_db
from backend.utils.dates import get_date_range
from backend.utils.money import paise_to_rupees, format_inr
from backend.utils.exports import generate_csv, generate_excel, generate_pdf


class ReportService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def get_financial_report(
        self,
        report_type: str,  # 'revenue', 'expense', 'profit', 'person_wise', 'work_wise', 'outstanding', 'payment_method'
        preset: str = "this_month",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        start_d, end_d = get_date_range(preset, start_date, end_date)

        with get_db(self.db_path) as conn:
            if report_type == "revenue":
                sql = """
                SELECT p.payment_date, p.payment_time, per.name AS person_name, 
                       w.title AS work_title, p.payment_method, p.amount, p.transaction_reference, p.notes
                FROM payments p
                JOIN people per ON p.person_id = per.id
                LEFT JOIN work w ON p.work_id = w.id
                WHERE p.payment_status = 'received' AND LOWER(p.payment_method) != 'udhar'
                """
                params = []
                if start_d:
                    sql += " AND p.payment_date >= ?"
                    params.append(start_d)
                if end_d:
                    sql += " AND p.payment_date <= ?"
                    params.append(end_d)
                sql += " ORDER BY p.payment_date DESC, p.payment_time DESC"
                rows = conn.execute(sql, params).fetchall()

                total_amount = sum(r["amount"] for r in rows)
                return {
                    "report_type": report_type,
                    "title": "Revenue Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_amount": total_amount,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "expense":
                sql = """
                SELECT e.expense_date, e.expense_time, ec.name AS category_name, e.title,
                       e.vendor, e.amount, e.payment_method, w.title AS work_title, e.notes
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                LEFT JOIN work w ON e.work_id = w.id
                WHERE e.is_archived = 0
                """
                params = []
                if start_d:
                    sql += " AND e.expense_date >= ?"
                    params.append(start_d)
                if end_d:
                    sql += " AND e.expense_date <= ?"
                    params.append(end_d)
                sql += " ORDER BY e.expense_date DESC, e.expense_time DESC"
                rows = conn.execute(sql, params).fetchall()

                total_amount = sum(r["amount"] for r in rows)
                return {
                    "report_type": report_type,
                    "title": "Expense Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_amount": total_amount,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "person_wise":
                sql = """
                SELECT 
                    p.id, p.name, p.phone, p.company,
                    COUNT(DISTINCT w.id) AS work_count,
                    COALESCE(SUM(DISTINCT CASE WHEN w.status != 'Cancelled' THEN w.agreed_amount ELSE 0 END), 0) AS total_agreed,
                    COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS total_received
                FROM people p
                LEFT JOIN work w ON w.person_id = p.id AND w.is_archived = 0
                LEFT JOIN payments pay ON pay.person_id = p.id
                WHERE p.is_archived = 0
                GROUP BY p.id
                ORDER BY total_agreed DESC
                """
                rows = conn.execute(sql).fetchall()
                for r in rows:
                    r["total_pending"] = max(0, r["total_agreed"] - r["total_received"])
                return {
                    "report_type": report_type,
                    "title": "Person-Wise Financial Summary",
                    "start_date": start_d,
                    "end_date": end_d,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "work_wise":
                sql = """
                SELECT 
                    w.id, w.title, p.name AS person_name, w.category, w.status, w.deadline,
                    w.agreed_amount,
                    COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS received_amount
                FROM work w
                JOIN people p ON w.person_id = p.id
                LEFT JOIN payments pay ON pay.work_id = w.id
                WHERE w.is_archived = 0
                GROUP BY w.id
                ORDER BY w.created_at DESC
                """
                rows = conn.execute(sql).fetchall()
                for r in rows:
                    r["pending_amount"] = max(0, r["agreed_amount"] - r["received_amount"])
                return {
                    "report_type": report_type,
                    "title": "Work-Wise Financial Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "outstanding":
                sql = """
                SELECT 
                    w.id, w.title, p.name AS person_name, p.phone AS person_phone,
                    w.agreed_amount,
                    COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS received_amount
                FROM work w
                JOIN people p ON w.person_id = p.id
                LEFT JOIN payments pay ON pay.work_id = w.id
                WHERE w.is_archived = 0 AND w.status != 'Cancelled'
                GROUP BY w.id
                HAVING (w.agreed_amount - received_amount) > 0
                ORDER BY (w.agreed_amount - received_amount) DESC
                """
                rows = conn.execute(sql).fetchall()
                for r in rows:
                    r["pending_amount"] = r["agreed_amount"] - r["received_amount"]
                total_pending = sum(r["pending_amount"] for r in rows)
                return {
                    "report_type": report_type,
                    "title": "Outstanding / Udhar Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_amount": total_pending,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "dept_claims":
                sql = """
                SELECT dept_name, scheme_name, order_ref, target_units, completed_units, unit_rate,
                       total_claim_amount, amount_received, claim_status, submission_date, disbursement_date
                FROM dept_work_orders
                ORDER BY id DESC
                """
                rows = conn.execute(sql).fetchall()
                for r in rows:
                    r["pending_amount"] = max(0, r["total_claim_amount"] - r["amount_received"])
                total_claim = sum(r["total_claim_amount"] for r in rows)
                total_received = sum(r["amount_received"] for r in rows)
                total_pending = sum(r["pending_amount"] for r in rows)
                return {
                    "report_type": report_type,
                    "title": "State Dept ₹20/Unit Work Orders & Claims Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_amount": total_claim,
                    "total_received": total_received,
                    "total_pending": total_pending,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "panchayat_share":
                sql = """
                SELECT w.id, w.title, p.name AS person_name, w.service_category, w.portal_name,
                       w.agreed_amount, w.portal_cost, w.panchayat_share, w.vce_commission, w.status, w.created_at
                FROM work w
                JOIN people p ON w.person_id = p.id
                WHERE w.is_archived = 0 AND w.panchayat_share > 0
                ORDER BY w.created_at DESC
                """
                rows = conn.execute(sql).fetchall()
                total_share = sum(r["panchayat_share"] for r in rows)
                return {
                    "report_type": report_type,
                    "title": "Gram Panchayat Revenue Share Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_amount": total_share,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "payment_method":
                sql = """
                SELECT payment_method, COUNT(id) AS transaction_count, SUM(amount) AS total_amount
                FROM payments
                WHERE 1=1
                """
                params = []
                if start_d:
                    sql += " AND payment_date >= ?"
                    params.append(start_d)
                if end_d:
                    sql += " AND payment_date <= ?"
                    params.append(end_d)
                sql += " GROUP BY payment_method ORDER BY total_amount DESC"
                rows = conn.execute(sql, params).fetchall()
                return {
                    "report_type": report_type,
                    "title": "Payment Method Breakdown",
                    "start_date": start_d,
                    "end_date": end_d,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "balance_sheet":
                # Assets
                cash_in = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE payment_status = 'received' AND LOWER(payment_method) = 'cash'").fetchone()["s"]
                cash_out = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE is_archived = 0 AND LOWER(payment_method) = 'cash'").fetchone()["s"]
                wallet_cash = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM wallet_transactions WHERE transaction_type = 'topup' AND (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')").fetchone()["s"]
                remit_cash = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM panchayat_remittances WHERE LOWER(payment_method) = 'cash'").fetchone()["s"]
                cash_in_hand = cash_in - (cash_out + wallet_cash + remit_cash)

                online_in = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE payment_status = 'received' AND LOWER(payment_method) != 'cash' AND LOWER(payment_method) != 'udhar'").fetchone()["s"]
                dept_in = conn.execute("SELECT COALESCE(SUM(amount_received), 0) AS s FROM dept_work_orders").fetchone()["s"]
                online_out = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE is_archived = 0 AND LOWER(payment_method) != 'cash'").fetchone()["s"]
                wallet_online = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM wallet_transactions WHERE transaction_type = 'topup' AND NOT (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')").fetchone()["s"]
                remit_online = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM panchayat_remittances WHERE LOWER(payment_method) != 'cash'").fetchone()["s"]
                bank_balance = (online_in + dept_in) - (online_out + wallet_online + remit_online)

                wallet_float = conn.execute("SELECT COALESCE(SUM(current_balance), 0) AS s FROM portal_wallets").fetchone()["s"]

                udhar_row = conn.execute("""
                    SELECT COALESCE(SUM(w.agreed_amount - COALESCE(p.paid, 0)), 0) AS s
                    FROM work w
                    LEFT JOIN (SELECT work_id, SUM(amount) AS paid FROM payments WHERE payment_status = 'received' AND LOWER(payment_method) != 'udhar' GROUP BY work_id) p ON p.work_id = w.id
                    WHERE w.is_archived = 0 AND w.status != 'Cancelled' AND (w.agreed_amount - COALESCE(p.paid, 0)) > 0
                """).fetchone()["s"]
                accounts_receivable = udhar_row

                accrued_dept = conn.execute("SELECT COALESCE(SUM(total_claim_amount - amount_received - COALESCE(tds_deducted, 0) - COALESCE(disallowed_amount, 0)), 0) AS s FROM dept_work_orders WHERE claim_status != 'Disbursed'").fetchone()["s"]
                tds_receivable = conn.execute("SELECT COALESCE(SUM(tds_deducted), 0) AS s FROM dept_work_orders").fetchone()["s"]

                total_assets = cash_in_hand + bank_balance + wallet_float + accounts_receivable + max(0, accrued_dept) + tds_receivable

                # Liabilities
                panchayat_earned = conn.execute("SELECT COALESCE(SUM(panchayat_share), 0) AS s FROM work WHERE is_archived = 0 AND status IN ('Completed', 'Completed / Delivered')").fetchone()["s"]
                panchayat_remitted = conn.execute("SELECT COALESCE(SUM(amount), 0) AS s FROM panchayat_remittances").fetchone()["s"]
                panchayat_payable = max(0, panchayat_earned - panchayat_remitted)
                total_liabilities = panchayat_payable

                equity = total_assets - total_liabilities

                rows = [
                    {"category": "Current Assets", "item": "Cash in Hand (Center Drawer)", "amount": cash_in_hand},
                    {"category": "Current Assets", "item": "Bank / UPI Settlement Balance", "amount": bank_balance},
                    {"category": "Current Assets", "item": "Prepaid Portal Wallets Float (AnyRoR, Digital Gujarat, CSC)", "amount": wallet_float},
                    {"category": "Current Assets", "item": "Citizen Accounts Receivable (Udhar Khata)", "amount": accounts_receivable},
                    {"category": "Current Assets", "item": "Accrued State Dept Work Claims", "amount": max(0, accrued_dept)},
                    {"category": "Current Assets", "item": "TDS Receivable Tax Asset (Sec 194C)", "amount": tds_receivable},
                    {"category": "Current Liabilities", "item": "Gram Panchayat Revenue Share Payable", "amount": panchayat_payable},
                    {"category": "Proprietor Equity", "item": "VCE Accumulated Surplus / Center Net Worth", "amount": equity}
                ]

                return {
                    "report_type": report_type,
                    "title": "Statement of Financial Position (Balance Sheet)",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_assets": total_assets,
                    "total_liabilities": total_liabilities,
                    "equity": equity,
                    "count": len(rows),
                    "rows": rows
                }

            elif report_type == "accrual_pnl":
                # Revenue: Commissions earned on completed work + Govt Claims
                comm_sql = "SELECT COALESCE(SUM(vce_commission), 0) AS s FROM work WHERE is_archived = 0 AND status IN ('Completed', 'Completed / Delivered')"
                comm_params = []
                if start_d:
                    comm_sql += " AND (start_date >= ? OR completed_date >= ?)"
                    comm_params.extend([start_d, start_d])
                if end_d:
                    comm_sql += " AND (start_date <= ? OR completed_date <= ?)"
                    comm_params.extend([end_d, end_d])
                vce_comm = conn.execute(comm_sql, comm_params).fetchone()["s"]

                dept_sql = "SELECT COALESCE(SUM(amount_received), 0) AS s FROM dept_work_orders WHERE 1=1"
                dept_params = []
                if start_d:
                    dept_sql += " AND disbursement_date >= ?"
                    dept_params.append(start_d)
                if end_d:
                    dept_sql += " AND disbursement_date <= ?"
                    dept_params.append(end_d)
                dept_rev = conn.execute(dept_sql, dept_params).fetchone()["s"]

                total_operating_revenue = vce_comm + dept_rev

                # Expenses in period
                exp_sql = "SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE is_archived = 0"
                exp_params = []
                if start_d:
                    exp_sql += " AND expense_date >= ?"
                    exp_params.append(start_d)
                if end_d:
                    exp_sql += " AND expense_date <= ?"
                    exp_params.append(end_d)
                total_exp = conn.execute(exp_sql, exp_params).fetchone()["s"]

                net_operating_profit = total_operating_revenue - total_exp
                presumptive_income_44ada = int(total_operating_revenue * 0.5)

                rows = [
                    {"component": "Operating Revenue", "detail": "e-Gram Service Commissions (AnyRoR, Digital Gujarat)", "amount": vce_comm},
                    {"component": "Operating Revenue", "detail": "State Dept ₹20/Unit Survey Work Claims Disbursed", "amount": dept_rev},
                    {"component": "Operating Expense", "detail": "Center Consumables & Operational Expenses", "amount": total_exp},
                    {"component": "Net Operating Surplus", "detail": "Net Operating Profit Before Tax", "amount": net_operating_profit},
                    {"component": "Income Tax Guidance", "detail": "Presumptive Taxable Income (50% u/s 44ADA)", "amount": presumptive_income_44ada}
                ]

                return {
                    "report_type": report_type,
                    "title": "Accrual Profit & Loss Statement (P&L)",
                    "start_date": start_d,
                    "end_date": end_d,
                    "total_revenue": total_operating_revenue,
                    "total_expenses": total_exp,
                    "net_profit": net_operating_profit,
                    "presumptive_taxable_turnover": total_operating_revenue,
                    "presumptive_income_44ada": presumptive_income_44ada,
                    "count": len(rows),
                    "rows": rows
                }

            else:  # profit report default
                rev_sql = "SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE payment_status = 'received' AND LOWER(payment_method) != 'udhar'"
                exp_sql = "SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE is_archived = 0"
                params = []
                if start_d:
                    rev_sql += " AND payment_date >= ?"
                    exp_sql += " AND expense_date >= ?"
                    params.append(start_d)
                if end_d:
                    rev_sql += " AND payment_date <= ?"
                    exp_sql += " AND expense_date <= ?"
                    params.append(end_d)

                rev = conn.execute(rev_sql, params).fetchone()["s"]
                exp = conn.execute(exp_sql, params).fetchone()["s"]
                profit = rev - exp

                return {
                    "report_type": "profit",
                    "title": "Cash-Flow Profit Report",
                    "start_date": start_d,
                    "end_date": end_d,
                    "revenue": rev,
                    "expenses": exp,
                    "profit": profit
                }

    def export(self, report_type: str, format_type: str, preset: str = "this_month", start_date: str = None, end_date: str = None):
        """Generates exported content as string (CSV) or bytes (Excel/PDF)."""
        data = self.get_financial_report(report_type, preset, start_date, end_date)
        title = data.get("title", "Report")
        rows_data = data.get("rows", [])

        if report_type == "revenue":
            headers = ["Date", "Time", "Person", "Work", "Method", "Amount (₹)", "Reference", "Notes"]
            table_rows = [
                [
                    r["payment_date"], r["payment_time"], r["person_name"], r.get("work_title") or "-",
                    r["payment_method"], paise_to_rupees(r["amount"]), r.get("transaction_reference") or "-", r.get("notes") or ""
                ]
                for r in rows_data
            ]
        elif report_type == "expense":
            headers = ["Date", "Time", "Category", "Title", "Vendor", "Amount (₹)", "Method", "Notes"]
            table_rows = [
                [
                    r["expense_date"], r["expense_time"], r.get("category_name") or "General", r["title"],
                    r.get("vendor") or "-", paise_to_rupees(r["amount"]), r["payment_method"], r.get("notes") or ""
                ]
                for r in rows_data
            ]
        elif report_type == "person_wise":
            headers = ["Name", "Phone", "Company", "Work Items", "Agreed (₹)", "Received (₹)", "Pending (₹)"]
            table_rows = [
                [
                    r["name"], r.get("phone") or "-", r.get("company") or "-", r["work_count"],
                    paise_to_rupees(r["total_agreed"]), paise_to_rupees(r["total_received"]), paise_to_rupees(r["total_pending"])
                ]
                for r in rows_data
            ]
        elif report_type == "outstanding":
            headers = ["Work Title", "Person", "Phone", "Agreed (₹)", "Received (₹)", "Pending / Udhar (₹)"]
            table_rows = [
                [
                    r["title"], r["person_name"], r.get("person_phone") or "-",
                    paise_to_rupees(r["agreed_amount"]), paise_to_rupees(r["received_amount"]), paise_to_rupees(r["pending_amount"])
                ]
                for r in rows_data
            ]
        elif report_type == "balance_sheet":
            headers = ["Classification", "Balance Sheet Item", "Amount (₹)"]
            table_rows = [
                [r["category"], r["item"], paise_to_rupees(r["amount"])]
                for r in rows_data
            ]
        elif report_type == "accrual_pnl":
            headers = ["Component", "Details & Reference", "Amount (₹)"]
            table_rows = [
                [r["component"], r["detail"], paise_to_rupees(r["amount"])]
                for r in rows_data
            ]
        elif report_type == "dept_claims":
            headers = ["Department", "Scheme / Task", "Order Ref", "Completed Units", "Rate (₹)", "Total Claim (₹)", "Received (₹)", "Pending (₹)", "Status"]
            table_rows = [
                [
                    r["dept_name"], r["scheme_name"], r.get("order_ref") or "-", str(r["completed_units"]),
                    paise_to_rupees(r["unit_rate"]), paise_to_rupees(r["total_claim_amount"]),
                    paise_to_rupees(r["amount_received"]), paise_to_rupees(r["pending_amount"]), r["claim_status"]
                ]
                for r in rows_data
            ]
        elif report_type == "panchayat_share":
            headers = ["Application", "Citizen", "Service Category", "Total Fee (₹)", "Portal Cost (₹)", "GP Share (₹)", "VCE Share (₹)", "Status"]
            table_rows = [
                [
                    r["title"], r["person_name"], r.get("service_category") or "-",
                    paise_to_rupees(r["agreed_amount"]), paise_to_rupees(r["portal_cost"]),
                    paise_to_rupees(r["panchayat_share"]), paise_to_rupees(r["vce_commission"]), r["status"]
                ]
                for r in rows_data
            ]
        else:
            headers = ["Work Title", "Person", "Category", "Status", "Deadline", "Agreed (₹)", "Received (₹)", "Pending (₹)"]
            table_rows = [
                [
                    r["title"], r["person_name"], r["category"], r["status"], r.get("deadline") or "-",
                    paise_to_rupees(r["agreed_amount"]), paise_to_rupees(r["received_amount"]), paise_to_rupees(r["pending_amount"])
                ]
                for r in rows_data
            ]

        if format_type == "csv":
            return generate_csv(headers, table_rows), "text/csv"
        elif format_type == "excel":
            return generate_excel(title, headers, table_rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif format_type == "pdf":
            summary = {
                "Period": f"{data.get('start_date') or 'All time'} to {data.get('end_date') or 'Present'}",
                "Count": str(len(table_rows)),
                "Total Amount": format_inr(data.get("total_amount", 0)) if "total_amount" in data else "-"
            }
            return generate_pdf(title, headers, table_rows, summary), "application/pdf"
        else:
            raise ValueError(f"Unsupported format: {format_type}")
