"""Unit tests for Work management."""
from backend.services.person_service import PersonService
from backend.services.work_service import WorkService
from backend.schemas.person import PersonCreate
from backend.schemas.work import WorkCreate, WorkUpdate


def test_work_creation_and_lifecycle(temp_db):
    p_service = PersonService(temp_db)
    w_service = WorkService(temp_db)

    person = p_service.create(PersonCreate(name="Client A"))
    
    # Create work with agreed amount = ₹25,000 (2500000 paise)
    work = w_service.create(WorkCreate(
        person_id=person["id"],
        title="Web Platform Development",
        agreed_amount=2500000,
        status="Planned"
    ))
    assert work["id"] is not None
    assert work["agreed_amount"] == 2500000
    assert work["received_amount"] == 0
    assert work["pending_amount"] == 2500000

    # Update status to Completed
    updated = w_service.update(work["id"], WorkUpdate(status="Completed"))
    assert updated["status"] == "Completed"
    assert updated["completed_date"] is not None
