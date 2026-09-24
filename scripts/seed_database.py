"""Script to seed the SQLite database with realistic Gujarat e-Gram VCE demo data."""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# Fix Windows console UTF-8 output if needed
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings
from backend.database.connection import get_db
from backend.database.migrations import init_db
from backend.services.person_service import PersonService
from backend.services.work_service import WorkService
from backend.services.payment_service import PaymentService
from backend.services.expense_service import ExpenseService
from backend.schemas.person import PersonCreate
from backend.schemas.work import WorkCreate
from backend.schemas.payment import PaymentCreate
from backend.schemas.expense import ExpenseCreate
from backend.utils.money import rupees_to_paise
from backend.utils.dates import current_time_str, now_utc_iso


def seed():
    print(f"Initializing database at: {settings.DB_PATH}")
    init_db(settings.DB_PATH)

    seed_file = ROOT_DIR / "database" / "seeds" / "demo_data.json"
    if not seed_file.exists():
        print(f"Seed file not found: {seed_file}")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_demo_records = sum(len(data.get(k, [])) for k in ["people", "work", "payments", "expenses", "dept_orders"])
    if total_demo_records == 0:
        print("Demo dataset is empty. Database initialized with clean production schema and system lookup categories.")
        return

    # Reset demo transactional tables for clean idempotent seeding
    with get_db(settings.DB_PATH) as conn:
        conn.execute("DELETE FROM payments")
        conn.execute("DELETE FROM expenses")
        conn.execute("DELETE FROM work")
        conn.execute("DELETE FROM people")
        conn.execute("DELETE FROM dept_work_orders")
        conn.execute("DELETE FROM panchayat_remittances")
        conn.execute("DELETE FROM rojmel_day_closes")
        conn.execute("DELETE FROM wallet_transactions")
        conn.execute("DELETE FROM activity_log")
        conn.execute("DELETE FROM sqlite_sequence WHERE name IN ('people', 'work', 'payments', 'expenses', 'dept_work_orders', 'panchayat_remittances', 'rojmel_day_closes', 'wallet_transactions', 'activity_log')")

    person_service = PersonService(settings.DB_PATH)
    work_service = WorkService(settings.DB_PATH)
    payment_service = PaymentService(settings.DB_PATH)
    expense_service = ExpenseService(settings.DB_PATH)

    today = date.today()

    if "panchayat_profile" in data:
        prof = data["panchayat_profile"]
        with get_db(settings.DB_PATH) as conn:
            conn.execute(
                """UPDATE panchayat_profile 
                   SET district = ?, taluka = ?, gram_panchayat = ?, center_id = ?, vce_name = ?, vce_phone = ?, talati_name = ?, updated_at = ?
                   WHERE id = 1""",
                (prof.get("district", ""), prof.get("taluka", ""), prof.get("gram_panchayat", ""), prof.get("center_id", ""), prof.get("vce_name", ""), prof.get("vce_phone", ""), prof.get("talati_name", ""), now_utc_iso())
            )
            print(f"  + Configured Gram Panchayat Profile: {prof.get('gram_panchayat')}")

    if "portal_wallets" in data:
        print("\nSeeding Portal Wallets...")
        with get_db(settings.DB_PATH) as conn:
            for w in data["portal_wallets"]:
                bal_paise = rupees_to_paise(w.get("current_balance_rupees", 0))
                alert_paise = rupees_to_paise(w.get("min_alert_rupees", 100))
                conn.execute(
                    """INSERT INTO portal_wallets (portal_name, current_balance, min_alert_balance, last_recharge_date, updated_at)
                       VALUES (?, ?, ?, ?, ?)
                       ON CONFLICT(portal_name) DO UPDATE SET 
                           current_balance = excluded.current_balance,
                           min_alert_balance = excluded.min_alert_balance,
                           last_recharge_date = excluded.last_recharge_date,
                           updated_at = excluded.updated_at""",
                    (w["portal_name"], bal_paise, alert_paise, today.strftime("%Y-%m-%d"), now_utc_iso())
                )
                print(f"  + Seeded portal wallet: {w['portal_name']} (Rs.{w.get('current_balance_rupees', 0):.2f})")

    people_map = {}
    print("\nSeeding Gujarat e-Gram Citizens & Farmers...")
    for p_data in data.get("people", []):
        created = person_service.create(PersonCreate(**p_data))
        people_map[created["name"]] = created["id"]
        print(f"  + Created citizen: {created['name']} (ID: {created['id']})")

    work_map = {}
    print("\nSeeding Service Applications (AnyRoR, Digital Gujarat, iKhedut)...")
    for w_data in data.get("work", []):
        p_name = w_data.pop("person_name")
        p_id = people_map.get(p_name)
        if not p_id:
            continue
        rupees = w_data.pop("agreed_amount_rupees")
        days_ahead = w_data.pop("deadline_days_ahead", 0)
        deadline = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        start_days_ago = w_data.pop("days_ago", 0)
        start_date = (today - timedelta(days=start_days_ago)).strftime("%Y-%m-%d")
        completed_days_ago = w_data.pop("completed_days_ago", None)
        completed_date = (today - timedelta(days=completed_days_ago)).strftime("%Y-%m-%d") if completed_days_ago is not None else None

        portal_cost = rupees_to_paise(w_data.pop("portal_cost_rupees", 0))
        panchayat_share = rupees_to_paise(w_data.pop("panchayat_share_rupees", 0))
        vce_commission = rupees_to_paise(w_data.pop("vce_commission_rupees", 0))

        work_payload = WorkCreate(
            person_id=p_id,
            title=w_data["title"],
            description=w_data.get("description"),
            category=w_data.get("service_category", "General"),
            service_category=w_data.get("service_category", "General"),
            service_name=w_data.get("service_name", w_data["title"]),
            portal_name=w_data.get("portal_name", ""),
            token_no=w_data.get("token_no", ""),
            ack_no=w_data.get("ack_no", ""),
            agreed_amount=rupees_to_paise(rupees),
            portal_cost=portal_cost,
            panchayat_share=panchayat_share,
            vce_commission=vce_commission,
            status=w_data.get("status", "New"),
            priority=w_data.get("priority", "Medium"),
            start_date=start_date,
            deadline=deadline,
            completed_date=completed_date
        )
        created_work = work_service.create(work_payload)
        work_map[created_work["title"]] = (created_work["id"], p_id)
        print(f"  + Created application: {created_work['title']} (Token: {created_work['token_no']})")

    print("\nSeeding Payments & Citizen Receipts...")
    for pay_data in data.get("payments", []):
        p_name = pay_data.pop("person_name")
        w_title = pay_data.pop("work_title", None)
        p_id = people_map.get(p_name)
        w_id = work_map.get(w_title)[0] if w_title in work_map else None
        rupees = pay_data.pop("amount_rupees")
        days_ago = pay_data.pop("days_ago", 0)
        pay_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")

        pay_payload = PaymentCreate(
            person_id=p_id,
            work_id=w_id,
            amount=rupees_to_paise(rupees),
            payment_method=pay_data.get("payment_method", "Cash"),
            payment_status="received",
            transaction_reference=pay_data.get("transaction_reference"),
            payment_date=pay_date,
            payment_time=current_time_str(),
            notes=pay_data.get("notes")
        )
        payment_service.create(pay_payload)
        print(f"  + Recorded payment: Rs.{rupees} from {p_name} ({pay_payload.payment_method})")

    print("\nSeeding Center Expenses (Paper, Toner, Internet)...")
    with get_db(settings.DB_PATH) as conn:
        exp_cat_map = {row["name"]: row["id"] for row in conn.execute("SELECT id, name FROM expense_categories").fetchall()}

    for exp_data in data.get("expenses", []):
        rupees = exp_data.pop("amount_rupees")
        days_ago = exp_data.pop("days_ago", 0)
        exp_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        cat_name = exp_data.get("category")
        cat_id = exp_cat_map.get(cat_name)

        exp_payload = ExpenseCreate(
            title=exp_data["title"],
            category_id=cat_id,
            amount=rupees_to_paise(rupees),
            payment_method=exp_data.get("payment_method", "Cash"),
            expense_date=exp_date,
            expense_time=current_time_str(),
            vendor=exp_data.get("vendor"),
            notes=exp_data.get("notes")
        )
        expense_service.create(exp_payload)
        print(f"  + Recorded expense: Rs.{rupees} - {exp_payload.title} (Cat: {cat_name})")

    print("\nSeeding State Dept Work Orders (Mandated Rs.20/unit)...")
    with get_db(settings.DB_PATH) as conn:
        for d in data.get("dept_orders", []):
            rate = rupees_to_paise(d.get("unit_rate_rupees", 20.0))
            completed = d.get("completed_units", 0)
            total_claim = completed * rate
            received = rupees_to_paise(d.get("amount_received_rupees", 0.0))
            now = now_utc_iso()
            order_days_ago = d.get("order_days_ago", 30)
            order_date = (today - timedelta(days=order_days_ago)).strftime("%Y-%m-%d")
            disb_days_ago = d.get("disbursement_days_ago")
            disb_date = (today - timedelta(days=disb_days_ago)).strftime("%Y-%m-%d") if disb_days_ago is not None else None
            submission_days_ago = d.get("submission_days_ago")
            sub_date = (today - timedelta(days=submission_days_ago)).strftime("%Y-%m-%d") if submission_days_ago is not None else None

            conn.execute(
                """INSERT INTO dept_work_orders 
                   (dept_name, scheme_name, order_ref, target_units, completed_units, unit_rate, total_claim_amount, amount_received, claim_status, order_date, submission_date, disbursement_date, notes, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (d["dept_name"], d["scheme_name"], d.get("order_ref"), d.get("target_units", 0), completed, rate, total_claim, received, d.get("claim_status", "In Progress"), order_date, sub_date, disb_date, d.get("notes"), now, now)
            )
            print(f"  + Created dept order: {d['scheme_name']} ({completed} units @ Rs.{rate/100:.2f})")

    if "panchayat_remittances" in data:
        print("\nSeeding Gram Panchayat Remittances...")
        with get_db(settings.DB_PATH) as conn:
            for r in data["panchayat_remittances"]:
                amt = rupees_to_paise(r.get("amount_rupees", 0))
                days_ago = r.get("days_ago", 4)
                rem_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                conn.execute(
                    """INSERT INTO panchayat_remittances 
                       (amount, payment_method, remittance_date, talati_receipt_no, period_from, period_to, notes, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (amt, r.get("payment_method", "Cash"), rem_date, r.get("talati_receipt_no", ""), r.get("period_from", ""), r.get("period_to", ""), r.get("notes", ""), now_utc_iso())
                )
                print(f"  + Recorded panchayat remittance: Rs.{r.get('amount_rupees', 0)} (Receipt: {r.get('talati_receipt_no')})")

    print("\nVCE Pali Database Seeding Completed Successfully!")


if __name__ == "__main__":
    seed()
