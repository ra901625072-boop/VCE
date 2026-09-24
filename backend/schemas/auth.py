"""Authentication schemas for VCE Pali e-Gram."""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., description="VCE Operator Username / ID", min_length=3)
    password: str = Field(..., description="VCE Operator Password", min_length=4)


class UserInfo(BaseModel):
    id: int
    username: str
    full_name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(28800, description="Session lifetime in seconds (8 hours)")
    expires_at: str
    user: UserInfo


class VerifyResponse(BaseModel):
    valid: bool
    user: UserInfo
    remaining_seconds: int
    expires_at: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
