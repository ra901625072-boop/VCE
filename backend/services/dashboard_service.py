"""Service for Dashboard analytics, cash-flow metrics, and charts."""
from typing import Dict, Any, Optional
from datetime import datetime, date, timedelta
from backend.database.connection import get_db
from backend.schemas.dashboard import DashboardResponse, MetricSummary, BreakdownItem, TrendPoint
from backend.utils.dates import current_date_str, get_date_range


class DashboardService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def get_dashboard_data(
        self,
        preset: str = "this_month",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> DashboardResponse:
        resolved_start, resolved_end = get_date_range(preset, start_date, end_date)
        today = current_date_str()

        with get_db(self.db_path) as conn:
            # 1. Today's Metrics
            today_rev_row = conn.execute(
                """
                SELECT COALESCE(SUM(amount), 0) AS rev
                FROM payments
                WHERE payment_date = ? 
                  AND payment_status = 'received' 
                  AND LOWER(payment_method) != 'udhar'
                """,
                (today,)
            ).fetchone()
            today_revenue = today_rev_row["rev"] if today_rev_row else 0

            today_cash_row = conn.execute(
                """
                SELECT COALESCE(SUM(amount), 0) AS rev
                FROM payments
                WHERE payment_date = ? 
                  AND payment_status = 'received' 
                  AND LOWER(payment_method) = 'cash'
                """,
                (today,)
            ).fetchone()
            today_citizen_cash = today_cash_row["rev"] if today_cash_row else 0

            today_upi_row = conn.execute(
                """
                SELECT COALESCE(SUM(amount), 0) AS rev
                FROM payments
                WHERE payment_date = ? 
                  AND payment_status = 'received' 
                  AND LOWER(payment_method) != 'cash'
                  AND LOWER(payment_method) != 'udhar'
                """,
                (today,)
            ).fetchone()
            today_citizen_upi = today_upi_row["rev"] if today_upi_row else 0

            today_exp_row = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) AS exp FROM expenses WHERE expense_date = ? AND is_archived = 0",
                (today,)
            ).fetchone()
            today_expenses = today_exp_row["exp"] if today_exp_row else 0
            today_profit = today_revenue - today_expenses

            today_work_count_row = conn.execute(
                """
                SELECT COUNT(*) AS c 
                FROM work 
                WHERE is_archived = 0 
                  AND (deadline = ? OR start_date = ? OR (status NOT IN ('Completed', 'Cancelled') AND created_at LIKE ?))
                """,
                (today, today, f"{today}%")
            ).fetchone()
            today_work_count = today_work_count_row["c"] if today_work_count_row else 0

            # 2. Period Metrics (Revenue, Expenses, Profit)
            period_pay_sql = """
            SELECT COALESCE(SUM(amount), 0) AS rev
            FROM payments
            WHERE payment_status = 'received' AND LOWER(payment_method) != 'udhar'
            """
            pay_params = []
            if resolved_start:
                period_pay_sql += " AND payment_date >= ?"
                pay_params.append(resolved_start)
            if resolved_end:
                period_pay_sql += " AND payment_date <= ?"
                pay_params.append(resolved_end)
            period_revenue = conn.execute(period_pay_sql, pay_params).fetchone()["rev"]

            period_exp_sql = "SELECT COALESCE(SUM(amount), 0) AS exp FROM expenses WHERE is_archived = 0"
            exp_params = []
            if resolved_start:
                period_exp_sql += " AND expense_date >= ?"
                exp_params.append(resolved_start)
            if resolved_end:
                period_exp_sql += " AND expense_date <= ?"
                exp_params.append(resolved_end)
            period_expenses = conn.execute(period_exp_sql, exp_params).fetchone()["exp"]

            period_profit = period_revenue - period_expenses

            # Expected Profit = (Total Agreed Work Value in period) - (Period Expenses)
            period_work_sql = "SELECT COALESCE(SUM(agreed_amount), 0) AS agreed FROM work WHERE is_archived = 0 AND status != 'Cancelled'"
            work_params = []
            if resolved_start:
                period_work_sql += " AND (start_date >= ? OR created_at >= ?)"
                work_params.extend([resolved_start, resolved_start])
            if resolved_end:
                period_work_sql += " AND (start_date <= ? OR created_at <= ?)"
                work_params.extend([resolved_end, f"{resolved_end} 23:59:59"])
            period_agreed = conn.execute(period_work_sql, work_params).fetchone()["agreed"]
            expected_profit = period_agreed - period_expenses

            # 3. Overall Outstanding / Udhar
            # Calculated as sum of remaining balances for all non-cancelled work
            outstanding_sql = """
            SELECT 
                COALESCE(SUM(
                    CASE WHEN (w.agreed_amount - COALESCE(paid.total_paid, 0)) > 0 
                         THEN (w.agreed_amount - COALESCE(paid.total_paid, 0)) 
                         ELSE 0 
                    END
                ), 0) AS total_pending
            FROM work w
            LEFT JOIN (
                SELECT work_id, SUM(amount) AS total_paid
                FROM payments
                WHERE payment_status = 'received' AND LOWER(payment_method) != 'udhar'
                GROUP BY work_id
            ) paid ON paid.work_id = w.id
            WHERE w.is_archived = 0 AND w.status != 'Cancelled';
            """
            total_pending_udhar = conn.execute(outstanding_sql).fetchone()["total_pending"]

            # Active vs Completed Work
            work_counts = conn.execute(
                """
                SELECT 
                    SUM(CASE WHEN status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) AS active_c,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_c
                FROM work
                WHERE is_archived = 0
                """
            ).fetchone()
            active_work_count = work_counts["active_c"] or 0
            completed_work_count = work_counts["completed_c"] or 0

            # 4. Trend Data: Last 7 days or filtered range
            trend_points = []
            # Calculate daily points for the last 7 days up to today
            today_d = date.today()
            for i in range(6, -1, -1):
                day_d = today_d - timedelta(days=i)
                day_str = day_d.strftime("%Y-%m-%d")
                day_rev = conn.execute(
                    "SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE payment_date = ? AND payment_status = 'received' AND LOWER(payment_method) != 'udhar'",
                    (day_str,)
                ).fetchone()["s"]
                day_exp = conn.execute(
                    "SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE expense_date = ? AND is_archived = 0",
                    (day_str,)
                ).fetchone()["s"]
                trend_points.append(TrendPoint(
                    date=day_str,
                    revenue=day_rev,
                    expenses=day_exp,
                    profit=day_rev - day_exp
                ))

            # 5. Expenses by Category
            exp_cat_sql = """
            SELECT COALESCE(ec.name, 'Uncategorized') AS label, SUM(e.amount) AS amount, COUNT(e.id) AS count
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.is_archived = 0
            """
            cat_params = []
            if resolved_start:
                exp_cat_sql += " AND e.expense_date >= ?"
                cat_params.append(resolved_start)
            if resolved_end:
                exp_cat_sql += " AND e.expense_date <= ?"
                cat_params.append(resolved_end)
            exp_cat_sql += " GROUP BY ec.id, ec.name ORDER BY amount DESC"
            exp_cats = conn.execute(exp_cat_sql, cat_params).fetchall()

            total_cat_amt = sum(c["amount"] for c in exp_cats) or 1
            expenses_by_cat = [
                BreakdownItem(
                    label=c["label"],
                    amount=c["amount"],
                    count=c["count"],
                    percentage=round((c["amount"] / total_cat_amt) * 100, 1)
                ) for c in exp_cats
            ]

            # 6. Payments by Method
            pay_meth_sql = """
            SELECT payment_method AS label, SUM(amount) AS amount, COUNT(id) AS count
            FROM payments
            WHERE 1=1
            """
            meth_params = []
            if resolved_start:
                pay_meth_sql += " AND payment_date >= ?"
                meth_params.append(resolved_start)
            if resolved_end:
                pay_meth_sql += " AND payment_date <= ?"
                meth_params.append(resolved_end)
            pay_meth_sql += " GROUP BY payment_method ORDER BY amount DESC"
            pay_meths = conn.execute(pay_meth_sql, meth_params).fetchall()

            total_meth_amt = sum(m["amount"] for m in pay_meths) or 1
            payments_by_method = [
                BreakdownItem(
                    label=m["label"],
                    amount=m["amount"],
                    count=m["count"],
                    percentage=round((m["amount"] / total_meth_amt) * 100, 1)
                ) for m in pay_meths
            ]

            # 7. Work Status Distribution
            status_rows = conn.execute(
                """
                SELECT status AS label, COUNT(id) AS count
                FROM work
                WHERE is_archived = 0
                GROUP BY status
                """
            ).fetchall()
            total_statuses = sum(s["count"] for s in status_rows) or 1
            work_status_dist = [
                BreakdownItem(
                    label=s["label"],
                    amount=0,
                    count=s["count"],
                    percentage=round((s["count"] / total_statuses) * 100, 1)
                ) for s in status_rows
            ]

            # 8. Today's Work list
            todays_work = conn.execute(
                """
                SELECT w.*, p.name AS person_name
                FROM work w
                JOIN people p ON w.person_id = p.id
                WHERE w.is_archived = 0 
                  AND (w.deadline = ? OR w.start_date = ? OR (w.status NOT IN ('Completed', 'Cancelled') AND w.created_at LIKE ?))
                ORDER BY w.deadline ASC
                LIMIT 5
                """,
                (today, today, f"{today}%")
            ).fetchall()

            # 9. Upcoming Deadlines
            upcoming_deadlines = conn.execute(
                """
                SELECT w.*, p.name AS person_name
                FROM work w
                JOIN people p ON w.person_id = p.id
                WHERE w.is_archived = 0 
                  AND w.status NOT IN ('Completed', 'Cancelled')
                  AND w.deadline >= ?
                ORDER BY w.deadline ASC
                LIMIT 5
                """,
                (today,)
            ).fetchall()

            # 10. Recent Payments
            recent_payments = conn.execute(
                """
                SELECT p.*, per.name AS person_name, w.title AS work_title
                FROM payments p
                JOIN people per ON p.person_id = per.id
                LEFT JOIN work w ON p.work_id = w.id
                ORDER BY p.payment_date DESC, p.payment_time DESC
                LIMIT 5
                """
            ).fetchall()

            # 11. Recent Expenses
            recent_expenses = conn.execute(
                """
                SELECT e.*, ec.name AS category_name
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                WHERE e.is_archived = 0
                ORDER BY e.expense_date DESC, e.expense_time DESC
                LIMIT 5
                """
            ).fetchall()

            # VCE Pali calculations
            dept_claims_row = conn.execute(
                """SELECT COALESCE(SUM(total_claim_amount - amount_received - COALESCE(tds_deducted, 0) - COALESCE(disallowed_amount, 0)), 0) AS pending 
                   FROM dept_work_orders WHERE claim_status != 'Disbursed'"""
            ).fetchone()
            pending_dept_claims = max(0, dept_claims_row["pending"] if dept_claims_row else 0)

            tds_row = conn.execute("SELECT COALESCE(SUM(tds_deducted), 0) AS total FROM dept_work_orders").fetchone()
            tds_receivable = tds_row["total"] if tds_row else 0

            wallet_sum_row = conn.execute("SELECT COALESCE(SUM(current_balance), 0) AS total FROM portal_wallets").fetchone()
            portal_wallets_balance = wallet_sum_row["total"] if wallet_sum_row else 0

            earned_row = conn.execute(
                "SELECT COALESCE(SUM(panchayat_share), 0) AS total FROM work WHERE is_archived = 0 AND status IN ('Completed', 'Completed / Delivered')"
            ).fetchone()
            total_panchayat_share_earned = earned_row["total"] if earned_row else 0

            remitted_row = conn.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM panchayat_remittances").fetchone()
            total_panchayat_remitted = remitted_row["total"] if remitted_row else 0
            panchayat_share_payable = max(0, total_panchayat_share_earned - total_panchayat_remitted)

            # Net Commission Revenue (VCE's true statutory turnover)
            comm_sql = "SELECT COALESCE(SUM(vce_commission), 0) AS total FROM work WHERE is_archived = 0 AND status IN ('Completed', 'Completed / Delivered')"
            comm_params = []
            if resolved_start:
                comm_sql += " AND (start_date >= ? OR completed_date >= ? OR created_at >= ?)"
                comm_params.extend([resolved_start, resolved_start, resolved_start])
            if resolved_end:
                comm_sql += " AND (start_date <= ? OR completed_date <= ? OR created_at <= ?)"
                comm_params.extend([resolved_end, resolved_end, f"{resolved_end} 23:59:59"])
            period_commission = conn.execute(comm_sql, comm_params).fetchone()["total"]

            dept_disb_sql = "SELECT COALESCE(SUM(amount_received), 0) AS total FROM dept_work_orders WHERE 1=1"
            dept_params = []
            if resolved_start:
                dept_disb_sql += " AND disbursement_date >= ?"
                dept_params.append(resolved_start)
            if resolved_end:
                dept_disb_sql += " AND disbursement_date <= ?"
                dept_params.append(resolved_end)
            period_dept_received = conn.execute(dept_disb_sql, dept_params).fetchone()["total"]
            net_commission_revenue = period_commission + period_dept_received

            prof_row = conn.execute("SELECT * FROM panchayat_profile WHERE id = 1").fetchone()
            panchayat_profile = dict(prof_row) if prof_row else None

            wallets_rows = conn.execute("SELECT * FROM portal_wallets ORDER BY id ASC").fetchall()
            portal_wallets = []
            for w in wallets_rows:
                wd = dict(w)
                wd["is_low_balance"] = wd["current_balance"] <= wd["min_alert_balance"]
                portal_wallets.append(wd)

            dept_rows = conn.execute("SELECT * FROM dept_work_orders WHERE claim_status != 'Disbursed' ORDER BY id DESC LIMIT 5").fetchall()
            pending_dept_orders = []
            for d in dept_rows:
                dd = dict(d)
                dd["pending_claim_amount"] = max(0, dd["total_claim_amount"] - dd["amount_received"] - dd.get("tds_deducted", 0) - dd.get("disallowed_amount", 0))
                pending_dept_orders.append(dd)

            metrics = MetricSummary(
                today_revenue=today_revenue,
                today_expenses=today_expenses,
                today_profit=today_profit,
                today_work_count=today_work_count,
                period_revenue=period_revenue,
                period_expenses=period_expenses,
                period_profit=period_profit,
                expected_profit=expected_profit,
                total_pending_udhar=total_pending_udhar,
                active_work_count=active_work_count,
                completed_work_count=completed_work_count,
                today_citizen_cash=today_citizen_cash,
                today_citizen_upi=today_citizen_upi,
                pending_dept_claims=pending_dept_claims,
                portal_wallets_balance=portal_wallets_balance,
                panchayat_share_payable=panchayat_share_payable,
                total_panchayat_share_earned=total_panchayat_share_earned,
                total_panchayat_remitted=total_panchayat_remitted,
                gross_citizen_collections=period_revenue,
                net_commission_revenue=net_commission_revenue,
                tds_receivable=tds_receivable
            )

            return DashboardResponse(
                date_preset=preset,
                start_date=resolved_start,
                end_date=resolved_end,
                metrics=metrics,
                revenue_vs_expenses_trend=trend_points,
                expenses_by_category=expenses_by_cat,
                payments_by_method=payments_by_method,
                work_status_distribution=work_status_dist,
                todays_work=todays_work,
                upcoming_deadlines=upcoming_deadlines,
                recent_payments=recent_payments,
                recent_expenses=recent_expenses,
                panchayat_profile=panchayat_profile,
                portal_wallets=portal_wallets,
                pending_dept_orders=pending_dept_orders
            )
