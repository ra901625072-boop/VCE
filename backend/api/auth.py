"""API router for authentication and session management."""
from fastapi import APIRouter, Depends, status
from typing import Dict, Any

from backend.schemas.auth import LoginRequest, LoginResponse, VerifyResponse
from backend.services.auth_service import AuthService
from backend.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


@router.post("/login", response_model=LoginResponse, summary="Operator Login (8-Hour Shift Session)")
def login(credentials: LoginRequest):
    """Authenticates operator credentials (e.g. akrajput2005 / Akshay@05) and returns an 8-hour JWT token."""
    return auth_service.authenticate(credentials)


@router.get("/me", response_model=VerifyResponse, summary="Verify Current Session & Remaining Time")
def get_current_session(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Validates the current session token and returns operator details plus remaining session seconds."""
    return auth_service.verify_session(current_user)


@router.post("/logout", summary="Operator Logout")
def logout():
    """Sign out the operator and acknowledge session termination."""
    return {"status": "ok", "message": "Logged out successfully"}
