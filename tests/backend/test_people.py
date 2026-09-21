"""Unit tests for People / Client management."""
from backend.services.person_service import PersonService
from backend.schemas.person import PersonCreate, PersonUpdate


def test_create_and_list_people(temp_db):
    service = PersonService(temp_db)
    
    # Create person
    person = service.create(PersonCreate(
        name="Rahul Verma",
        phone="+91 99999 88888",
        company="Verma Solutions"
    ))
    assert person["id"] is not None
    assert person["name"] == "Rahul Verma"
    assert person["total_agreed"] == 0
    assert person["total_received"] == 0
    assert person["total_pending"] == 0

    # List people
    people = service.list_all()
    assert len(people) == 1
    assert people[0]["name"] == "Rahul Verma"

    # Search
    search_results = service.list_all(query="Rahul")
    assert len(search_results) == 1
    no_results = service.list_all(query="NonExistent")
    assert len(no_results) == 0


def test_update_and_archive_person(temp_db):
    service = PersonService(temp_db)
    created = service.create(PersonCreate(name="Original Name", phone="12345"))
    
    updated = service.update(created["id"], PersonUpdate(name="New Name", notes="Updated notes"))
    assert updated["name"] == "New Name"
    assert updated["notes"] == "Updated notes"

    service.delete(created["id"])
    active_people = service.list_all()
    assert len(active_people) == 0


def test_cascade_delete_person(temp_db):
    from backend.services.work_service import WorkService
    from backend.services.payment_service import PaymentService
    from backend.schemas.work import WorkCreate
    from backend.schemas.payment import PaymentCreate

    p_service = PersonService(temp_db)
    w_service = WorkService(temp_db)
    pay_service = PaymentService(temp_db)

    person = p_service.create(PersonCreate(name="Citizen To Delete", phone="9988776655"))
    work = w_service.create(WorkCreate(
        person_id=person["id"],
        title="7/12 RoR Copy",
        agreed_amount=5000
    ))
    pay_service.create(PaymentCreate(
        person_id=person["id"],
        work_id=work["id"],
        amount=5000,
        payment_method="Cash",
        payment_date="2026-03-31",
        payment_time="10:00:00"
    ))

    # Cascade delete person
    p_service.delete(person["id"], cascade=True)

    # Verify all records removed
    assert len(p_service.list_all(query="Citizen To Delete")) == 0
    assert len(w_service.list_all(person_id=person["id"])) == 0
    assert len(pay_service.list_all(person_id=person["id"])) == 0

