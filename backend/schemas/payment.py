"""Schemas for Payment / Income transactions."""
from typing import Optional
from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    person_id: int = Field(..., description="Person who made the payment")
    work_id: Optional[int] = Field(None, description="Optional linked work item")
    amount: int = Field(..., gt=0, description="Payment amount in integer paise")
    payment_method: str = Field(default="Online", description="Online, Cash, Udhar, UPI, Bank Transfer, Cheque, etc.")
    payment_status: str = Field(default="received", description="received or pending")
    transaction_reference: Optional[str] = Field(None, max_length=100)
    payment_date: str = Field(..., description="Actual payment date in YYYY-MM-DD")
    payment_time: str = Field(..., description="Actual payment time in HH:MM:SS or HH:MM")
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    person_id: Optional[int] = None
    work_id: Optional[int] = None
    amount: Optional[int] = Field(None, gt=0)
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    transaction_reference: Optional[str] = None
    payment_date: Optional[str] = None
    payment_time: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    created_at: str
    updated_at: str
    person_name: Optional[str] = None
    work_title: Optional[str] = None
