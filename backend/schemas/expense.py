"""Schemas for Expense data."""
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    category_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    amount: int = Field(..., gt=0, description="Expense amount in integer paise")
    payment_method: str = Field(default="Cash")
    expense_date: str = Field(..., description="Date of expense in YYYY-MM-DD")
    expense_time: str = Field(..., description="Time of expense in HH:MM:SS or HH:MM")
    vendor: Optional[str] = Field(None, max_length=200)
    work_id: Optional[int] = None
    receipt_ref: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Optional[int] = Field(None, gt=0)
    payment_method: Optional[str] = None
    expense_date: Optional[str] = None
    expense_time: Optional[str] = None
    vendor: Optional[str] = None
    work_id: Optional[int] = None
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None
    is_archived: Optional[bool] = None


class ExpenseResponse(ExpenseBase):
    id: int
    is_archived: bool
    created_at: str
    updated_at: str
    category_name: Optional[str] = None
    work_title: Optional[str] = None
