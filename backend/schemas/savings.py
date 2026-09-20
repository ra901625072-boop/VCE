"""Schemas for Savings goals."""
from typing import Optional
from pydantic import BaseModel, Field


class SavingsBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    target_amount: int = Field(default=0, ge=0, description="Target in integer paise")
    saved_amount: int = Field(default=0, ge=0, description="Currently saved in integer paise")
    target_date: Optional[str] = None
    notes: Optional[str] = None


class SavingsCreate(SavingsBase):
    pass


class SavingsUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    target_amount: Optional[int] = Field(None, ge=0)
    saved_amount: Optional[int] = Field(None, ge=0)
    target_date: Optional[str] = None
    notes: Optional[str] = None


class SavingsResponse(SavingsBase):
    id: int
    created_at: str
    updated_at: str
    progress_percentage: float = 0.0
