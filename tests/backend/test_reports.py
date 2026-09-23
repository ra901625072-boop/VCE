"""Unit tests for Reports and Exports."""
from backend.services.person_service import PersonService
from backend.services.work_service import WorkService
from backend.services.payment_service import PaymentService
from backend.services.expense_service import ExpenseService
from backend.services.report_service import ReportService
from backend.schemas.person import PersonCreate
from backend.schemas.work import WorkCreate
from backend.schemas.payment import PaymentCreate
from backend.schemas.expense import ExpenseCreate


def test_reports_and_export_generation(temp_db):
    p_service = PersonService(temp_db)
    w_service = WorkService(temp_db)
    pay_service = PaymentService(temp_db)
    exp_service = ExpenseService(temp_db)
    rep_service = ReportService(temp_db)

    # Seed 1 client, 1 work, 1 payment, 1 expense
    client = p_service.create(PersonCreate(name="Acme Corp"))
    work = w_service.create(WorkCreate(person_id=client["id"], title="API Task", agreed_amount=100000))
    pay_service.create(PaymentCreate(
        person_id=client["id"], work_id=work["id"], amount=100000,
        payment_method="Online", payment_date="2026-09-20", payment_time="12:00:00"
    ))
    exp_service.create(ExpenseCreate(
        title="Server bill", amount=20000, payment_method="Online",
        expense_date="2026-09-20", expense_time="12:30:00"
    ))

    # Revenue report
    rev_report = rep_service.get_financial_report("revenue", preset="all")
    assert rev_report["total_amount"] == 100000

    # Expense report
    exp_report = rep_service.get_financial_report("expense", preset="all")
    assert exp_report["total_amount"] == 20000

    # Profit report
    profit_report = rep_service.get_financial_report("profit", preset="all")
    assert profit_report["revenue"] == 100000
    assert profit_report["expenses"] == 20000
    assert profit_report["profit"] == 80000

    # CSV Export
    csv_content, mime_csv = rep_service.export("revenue", "csv", preset="all")
    assert "Date,Time,Person" in csv_content
    assert mime_csv == "text/csv"

    # Excel Export
    excel_bytes, mime_excel = rep_service.export("revenue", "excel", preset="all")
    assert len(excel_bytes) > 0

    # PDF Export
    pdf_bytes, mime_pdf = rep_service.export("revenue", "pdf", preset="all")
    assert len(pdf_bytes) > 0


def test_advanced_reporting_and_reconciliation(temp_db):
    p_service = PersonService(temp_db)
    w_service = WorkService(temp_db)
    pay_service = PaymentService(temp_db)
    rep_service = ReportService(temp_db)

    # Client with multiple identical work orders and direct counter payments
    client = p_service.create(PersonCreate(name="Kishan Patel", phone="9876543210"))
    
    # 2 work orders of identical amount (₹500 each = 50000 paise)
    w1 = w_service.create(WorkCreate(person_id=client["id"], title="7/12 RoR", agreed_amount=50000, status="Completed / Delivered"))
    w2 = w_service.create(WorkCreate(person_id=client["id"], title="8-A RoR", agreed_amount=50000, status="In Progress"))

    # Work 1 paid in 2 installments of ₹250 each (25000 paise)
    pay_service.create(PaymentCreate(
        person_id=client["id"], work_id=w1["id"], amount=25000,
        payment_method="Cash", payment_date="2026-09-20", payment_time="10:00:00"
    ))
    pay_service.create(PaymentCreate(
        person_id=client["id"], work_id=w1["id"], amount=25000,
        payment_method="Online", payment_date="2026-09-20", payment_time="10:15:00"
    ))

    # Direct counter walk-in payment (work_id IS NULL) of ₹150 (15000 paise)
    pay_service.create(PaymentCreate(
        person_id=client["id"], work_id=None, amount=15000,
        payment_method="Cash", payment_date="2026-09-20", payment_time="11:00:00"
    ))

    # Direct Udhar (work_id IS NULL) of ₹100 (10000 paise)
    pay_service.create(PaymentCreate(
        person_id=client["id"], work_id=None, amount=10000,
        payment_method="Udhar", payment_date="2026-09-20", payment_time="11:30:00"
    ))

    # 1. Person-wise Report test
    pw_report = rep_service.get_financial_report("person_wise", preset="all")
    assert pw_report["count"] == 1
    row = pw_report["rows"][0]
    assert row["name"] == "Kishan Patel"
    assert row["work_count"] == 2
    # total_agreed = work_agreed (50000 + 50000) + direct_udhar (10000) + direct_received (15000) = 125000
    assert row["total_agreed"] == 125000
    # total_received = 25000 + 25000 + 15000 = 65000 (excluding udhar)
    assert row["total_received"] == 65000
    # work_pending = 100000 - 50000 = 50000. total_pending = 50000 + 10000 (direct udhar) = 60000
    assert row["total_pending"] == 60000

    # 2. Outstanding Report test
    out_report = rep_service.get_financial_report("outstanding", preset="all")
    # Should include w2 (50000 pending) and direct udhar (10000 pending)
    assert out_report["total_amount"] == 60000
    assert len(out_report["rows"]) == 2

    # 3. Balance Sheet test
    bs_report = rep_service.get_financial_report("balance_sheet", preset="all")
    ar_item = next(r for r in bs_report["rows"] if "Citizen Accounts Receivable" in r["item"])
    assert ar_item["amount"] == 60000

    # 4. Accrual P&L test
    pnl_report = rep_service.get_financial_report("accrual_pnl", preset="all")
    # Direct walk-in counter fee should be in rows
    direct_row = next((r for r in pnl_report["rows"] if "Direct Counter Walk-in" in r["detail"]), None)
    assert direct_row is not None
    assert direct_row["amount"] == 15000

