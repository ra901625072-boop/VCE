"""Unit tests for Expense tracking."""
from backend.services.expense_service import ExpenseService
from backend.schemas.expense import ExpenseCreate, ExpenseUpdate


def test_expense_flow(temp_db):
    service = ExpenseService(temp_db)

    # Add expense: ₹500 (50,000 paise)
    exp = service.create(ExpenseCreate(
        title="Domain Registration",
        amount=50000,
        payment_method="Online",
        expense_date="2026-09-20",
        expense_time="11:00:00",
        vendor="Namecheap"
    ))
    assert exp["id"] is not None
    assert exp["amount"] == 50000

    # List expenses
    expenses = service.list_all()
    assert len(expenses) == 1
    assert expenses[0]["title"] == "Domain Registration"
