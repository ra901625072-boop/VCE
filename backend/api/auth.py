"""API router for authentication and session management."""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import ValidationError
from typing import Dict, Any

from backend.schemas.auth import LoginRequest, LoginResponse, VerifyResponse
from backend.services.auth_service import AuthService
from backend.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Operator Login (8-Hour Shift Session)",
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": LoginRequest.model_json_schema()
                },
                "application/x-www-form-urlencoded": {
                    "schema": LoginRequest.model_json_schema()
                }
            }
        }
    }
)
async def login(request: Request):
    """Authenticates operator credentials and returns an 8-hour JWT session token.
    Supports both JSON and application/x-www-form-urlencoded payloads.
    """
    content_type = request.headers.get("content-type", "").lower()
    username = None
    password = None

    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = body.get("username")
                password = body.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Operator ID (username) and password are required."
        )

    try:
        credentials = LoginRequest(username=str(username), password=str(password))
    except ValidationError as val_err:
        errors = val_err.errors()
        err_msg = "; ".join([str(e.get("msg", "invalid")) for e in errors])
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=err_msg
        )

    return auth_service.authenticate(credentials)


@router.get("/me", response_model=VerifyResponse, summary="Verify Current Session & Remaining Time")
def get_current_session(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Validates the current session token and returns operator details plus remaining session seconds."""
    return auth_service.verify_session(current_user)


@router.post("/logout", summary="Operator Logout")
def logout():
    """Sign out the operator and acknowledge session termination."""
    return {"status": "ok", "message": "Logged out successfully"}
