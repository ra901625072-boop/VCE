"""Schemas for Work / Application data."""
from typing import Optional
from pydantic import BaseModel, Field


class WorkBase(BaseModel):
    person_id: int = Field(..., description="ID of the citizen/person requesting this service")
    title: str = Field(..., min_length=1, max_length=255, description="Service title or summary")
    description: Optional[str] = None
    category: str = Field(default="General", max_length=100)
    agreed_amount: int = Field(default=0, ge=0, description="Total fee charged to citizen in integer paise")
    status: str = Field(default="New", max_length=50)
    priority: str = Field(default="Medium", max_length=50)
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    completed_date: Optional[str] = None
    notes: Optional[str] = None
    # Gujarat e-Gram Application Details
    service_category: Optional[str] = Field(default="General", max_length=100)
    service_name: Optional[str] = Field(default="", max_length=200)
    portal_name: Optional[str] = Field(default="", max_length=100)
    token_no: Optional[str] = Field(default="", max_length=100)
    ack_no: Optional[str] = Field(default="", max_length=100)
    portal_cost: Optional[int] = Field(default=0, ge=0, description="Government wallet deduction cost in paise")
    panchayat_share: Optional[int] = Field(default=0, ge=0, description="Gram Panchayat share in paise")
    vce_commission: Optional[int] = Field(default=0, ge=0, description="VCE net earning in paise")


class WorkCreate(WorkBase):
    pass


class WorkUpdate(BaseModel):
    person_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    agreed_amount: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    completed_date: Optional[str] = None
    notes: Optional[str] = None
    service_category: Optional[str] = None
    service_name: Optional[str] = None
    portal_name: Optional[str] = None
    token_no: Optional[str] = None
    ack_no: Optional[str] = None
    portal_cost: Optional[int] = Field(None, ge=0)
    panchayat_share: Optional[int] = Field(None, ge=0)
    vce_commission: Optional[int] = Field(None, ge=0)
    is_archived: Optional[bool] = None


class WorkResponse(WorkBase):
    id: int
    is_archived: bool
    created_at: str
    updated_at: str
    person_name: Optional[str] = None
    person_phone: Optional[str] = None
    received_amount: int = 0
    pending_amount: int = 0
