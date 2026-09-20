"""API Endpoints for Savings Goals."""
from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas.savings import SavingsCreate, SavingsUpdate, SavingsResponse
from backend.services.savings_service import SavingsService
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/savings", tags=["Savings"])
service = SavingsService()


@router.post("", response_model=SavingsResponse, status_code=status.HTTP_201_CREATED)
def create_savings(payload: SavingsCreate):
    try:
        return service.create(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SavingsResponse])
def list_savings():
    return service.list_all()


@router.get("/{savings_id}", response_model=SavingsResponse)
def get_savings(savings_id: int):
    try:
        return service.get_by_id(savings_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.put("/{savings_id}", response_model=SavingsResponse)
def update_savings(savings_id: int, payload: SavingsUpdate):
    try:
        return service.update(savings_id, payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{savings_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings(savings_id: int):
    try:
        service.delete(savings_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
