"""Schemas for Customization Settings, Categories, and Methods."""
from typing import Optional
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str
    is_default: bool
    created_at: Optional[str] = None


class WorkStatusCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#3b82f6", max_length=20)
    sort_order: int = Field(default=0)


class WorkStatusResponse(BaseModel):
    id: int
    name: str
    color: str
    sort_order: int
    is_default: bool


class PaymentMethodCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class PaymentMethodResponse(BaseModel):
    id: int
    name: str
    is_system: bool
    is_default: bool


class SettingUpdate(BaseModel):
    key: str
    value: str
