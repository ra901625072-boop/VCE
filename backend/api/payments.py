"""API Endpoints for Payments and Income transactions."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from backend.services.payment_service import PaymentService
from backend.core.exceptions import NotFoundException, BusinessRuleException

router = APIRouter(prefix="/payments", tags=["Payments"])
service = PaymentService()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate):
    try:
        return service.create(payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except BusinessRuleException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    person_id: Optional[int] = Query(None),
    work_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    min_amount: Optional[int] = Query(None),
    max_amount: Optional[int] = Query(None),
    q: Optional[str] = Query(None)
):
    return service.list_all(
        person_id=person_id,
        work_id=work_id,
        payment_method=payment_method,
        payment_status=payment_status,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        query=q
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int):
    try:
        return service.get_by_id(payment_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, payload: PaymentUpdate):
    try:
        return service.update(payment_id, payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: int):
    try:
        service.delete(payment_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
