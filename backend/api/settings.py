"""API Endpoints for Categories, Payment Methods, Statuses, and Application Settings."""
from typing import List, Dict
from fastapi import APIRouter, HTTPException, status
from backend.schemas.settings import (
    CategoryCreate, CategoryResponse,
    PaymentMethodCreate, PaymentMethodResponse,
    WorkStatusCreate, WorkStatusResponse,
    SettingUpdate
)
from backend.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])
service = SettingsService()


# Work Categories
@router.get("/work-categories", response_model=List[CategoryResponse])
def list_work_categories():
    return service.list_work_categories()


@router.post("/work-categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_work_category(payload: CategoryCreate):
    try:
        return service.add_work_category(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/work-categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_category(cat_id: int):
    service.delete_work_category(cat_id)


# Expense Categories
@router.get("/expense-categories", response_model=List[CategoryResponse])
def list_expense_categories():
    return service.list_expense_categories()


@router.post("/expense-categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_expense_category(payload: CategoryCreate):
    try:
        return service.add_expense_category(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/expense-categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_category(cat_id: int):
    service.delete_expense_category(cat_id)


# Payment Methods
@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
def list_payment_methods():
    return service.list_payment_methods()


@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(payload: PaymentMethodCreate):
    try:
        return service.add_payment_method(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/payment-methods/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_method(method_id: int):
    service.delete_payment_method(method_id)


# Work Statuses
@router.get("/work-statuses", response_model=List[WorkStatusResponse])
def list_work_statuses():
    return service.list_work_statuses()


@router.post("/work-statuses", response_model=WorkStatusResponse, status_code=status.HTTP_201_CREATED)
def create_work_status(payload: WorkStatusCreate):
    try:
        return service.add_work_status(payload.name, payload.color, payload.sort_order)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# App Key-Value Settings
@router.get("/config")
def get_settings():
    return service.get_all_settings()


@router.put("/config")
def update_setting(payload: SettingUpdate):
    service.update_setting(payload.key, payload.value)
    return {"status": "success", "key": payload.key, "value": payload.value}
