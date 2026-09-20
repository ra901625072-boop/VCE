"""Unit tests for Payment processing and partial payments."""
from backend.services.person_service import PersonService
from backend.services.work_service import WorkService
from backend.services.payment_service import PaymentService
from backend.schemas.person import PersonCreate
from backend.schemas.work import WorkCreate
from backend.schemas.payment import PaymentCreate


def test_partial_payments_and_balance_calculation(temp_db):
    p_service = PersonService(temp_db)
    w_service = WorkService(temp_db)
    pay_service = PaymentService(temp_db)

    # 1. Create client
    client = p_service.create(PersonCreate(name="Kavita"))

    # 2. Create work with agreed amount ₹10,000 (1,000,000 paise)
    work = w_service.create(WorkCreate(
        person_id=client["id"],
        title="Mobile App Frontend",
        agreed_amount=1000000
    ))
    assert work["pending_amount"] == 1000000

    # 3. First partial payment: ₹3,000 (300,000 paise) Online
    pay_service.create(PaymentCreate(
        person_id=client["id"],
        work_id=work["id"],
        amount=300000,
        payment_method="Online",
        payment_date="2026-09-20",
        payment_time="10:00:00"
    ))
    work_after_pay1 = w_service.get_by_id(work["id"])
    assert work_after_pay1["received_amount"] == 300000
    assert work_after_pay1["pending_amount"] == 700000

    # 4. Second partial payment: ₹2,000 (200,000 paise) Cash
    pay_service.create(PaymentCreate(
        person_id=client["id"],
        work_id=work["id"],
        amount=200000,
        payment_method="Cash",
        payment_date="2026-09-20",
        payment_time="14:30:00"
    ))
    work_after_pay2 = w_service.get_by_id(work["id"])
    assert work_after_pay2["received_amount"] == 500000
    assert work_after_pay2["pending_amount"] == 500000

    # 5. Check Person ledger summary
    person_summary = p_service.get_by_id(client["id"])
    assert person_summary["total_agreed"] == 1000000
    assert person_summary["total_received"] == 500000
    assert person_summary["total_pending"] == 500000
