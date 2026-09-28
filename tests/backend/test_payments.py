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


def test_walkin_and_other_income_receipts(temp_db):
    pay_service = PaymentService(temp_db)
    p_service = PersonService(temp_db)

    # 1. Direct walk-in without person_id
    receipt1 = pay_service.create(PaymentCreate(
        amount=5000,
        payment_method="Cash",
        person_name="Walk-in Citizen",
        notes="Photocopy 5 copies"
    ))
    assert receipt1["amount"] == 5000
    assert receipt1["person_id"] is not None
    assert "Walk-in" in receipt1["person_name"]

    # 2. Other income source (e.g. CSC Commission)
    receipt2 = pay_service.create(PaymentCreate(
        amount=25000,
        payment_method="UPI",
        person_name="CSC Portal Commission",
        notes="Monthly commission bonus"
    ))
    assert receipt2["amount"] == 25000
    assert "CSC Portal Commission" in receipt2["notes"]

    # 3. New citizen auto-created
    receipt3 = pay_service.create(PaymentCreate(
        amount=10000,
        payment_method="Cash",
        person_name="Rameshbhai Thakor",
        auto_create_person=True,
        notes="Income certificate application"
    ))
    assert receipt3["amount"] == 10000
    # Ensure person was registered in people table
    registered_person = p_service.get_by_id(receipt3["person_id"])
    assert registered_person["name"] == "Rameshbhai Thakor"


def test_direct_udhar_creation(temp_db):
    pay_service = PaymentService(temp_db)
    p_service = PersonService(temp_db)

    citizen = p_service.create(PersonCreate(name="Bhavik Patel", village="Pali"))

    # Direct Udhar given to Bhavik (work_id=None, payment_method="Udhar")
    udhar_entry = pay_service.create(PaymentCreate(
        person_id=citizen["id"],
        amount=15000,
        payment_method="Udhar",
        notes="7/12 Land record copy credit"
    ))
    assert udhar_entry["amount"] == 15000
    assert udhar_entry["payment_method"] == "Udhar"

    # Check Bhavik's financial summary
    summary = p_service.get_by_id(citizen["id"])
    assert summary["total_pending"] == 15000
    assert summary["total_agreed"] == 15000
    assert summary["total_received"] == 0

