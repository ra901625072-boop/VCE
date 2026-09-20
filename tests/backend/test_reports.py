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
