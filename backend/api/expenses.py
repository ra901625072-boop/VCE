"""API Endpoints for Expenses."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from backend.services.expense_service import ExpenseService
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/expenses", tags=["Expenses"])
service = ExpenseService()


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate):
    try:
        return service.create(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    min_amount: Optional[int] = Query(None),
    max_amount: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
    include_archived: bool = Query(False)
):
    return service.list_all(
        category_id=category_id,
        payment_method=payment_method,
        vendor=vendor,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        query=q,
        include_archived=include_archived
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int):
    try:
        return service.get_by_id(expense_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, payload: ExpenseUpdate):
    try:
        return service.update(expense_id, payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int):
    try:
        service.delete(expense_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
