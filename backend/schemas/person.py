"""Schemas for Person / Citizen data."""
from typing import Optional
from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Person or citizen full name")
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=150)
    company: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    tags: Optional[str] = None
    # Gujarat e-Gram Citizen attributes
    village: Optional[str] = Field(default="", max_length=200, description="Village or Ward name")
    aadhaar_last4: Optional[str] = Field(default="", max_length=10, description="Last 4 digits of Aadhaar")
    ration_card_no: Optional[str] = Field(default="", max_length=50, description="Ration Card Number")
    khata_no: Optional[str] = Field(default="", max_length=50, description="Land Khata Number")
    citizen_type: Optional[str] = Field(default="General", max_length=50, description="Citizen category (Farmer, Pensioner, Student, General)")


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    village: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    ration_card_no: Optional[str] = None
    khata_no: Optional[str] = None
    citizen_type: Optional[str] = None
    is_archived: Optional[bool] = None


class PersonResponse(PersonBase):
    id: int
    is_archived: bool
    created_at: str
    updated_at: str
    # Dynamically aggregated financial statistics (paise and formatted rupees)
    work_count: int = 0
    active_work_count: int = 0
    completed_work_count: int = 0
    total_agreed: int = 0
    total_received: int = 0
    total_pending: int = 0
    last_payment_date: Optional[str] = None
