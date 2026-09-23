"""Authentication and session service for VCE Pali e-Gram."""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

from backend.database.connection import get_db
from backend.core.security import verify_password, hash_password, create_access_token, DEFAULT_SESSION_DURATION_HOURS
from backend.schemas.auth import LoginRequest, LoginResponse, UserInfo, VerifyResponse


class AuthService:
    def authenticate(self, credentials: LoginRequest) -> LoginResponse:
        username = credentials.username.strip()
        password = credentials.password

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, username, password_hash, salt, full_name, role, is_active FROM users WHERE LOWER(username) = LOWER(?)",
                (username,)
            )
            row = cursor.fetchone()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Operator ID or Password.",
                    headers={"WWW-Authenticate": "Bearer"}
                )

            user = dict(row)
            if not user.get("is_active", 1):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This operator account has been deactivated. Please contact admin."
                )

            is_valid = verify_password(password, user["password_hash"], user["salt"])
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Operator ID or Password.",
                    headers={"WWW-Authenticate": "Bearer"}
                )

            # Generate 8-Hour Session Token
            session_delta = timedelta(hours=DEFAULT_SESSION_DURATION_HOURS)
            token_payload = {
                "sub": user["username"],
                "uid": user["id"],
                "name": user.get("full_name") or "VCE Operator",
                "role": user.get("role") or "VCE Operator"
            }
            token, expire_dt = create_access_token(token_payload, expires_delta=session_delta)

            user_info = UserInfo(
                id=user["id"],
                username=user["username"],
                full_name=user.get("full_name") or "VCE Operator",
                role=user.get("role") or "VCE Operator"
            )

            return LoginResponse(
                access_token=token,
                token_type="bearer",
                expires_in=int(session_delta.total_seconds()),  # 28,800s = 8 hours
                expires_at=expire_dt.isoformat(),
                user=user_info
            )

    def verify_session(self, token_payload: Dict[str, Any]) -> VerifyResponse:
        username = token_payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims."
            )

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, username, full_name, role, is_active FROM users WHERE LOWER(username) = LOWER(?)",
                (username,)
            )
            row = cursor.fetchone()
            if not row or not row["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Operator account not found or inactive."
                )

            user = dict(row)
            exp_ts = token_payload.get("exp", 0)
            now_ts = datetime.now(timezone.utc).timestamp()
            remaining = max(0, int(exp_ts - now_ts))
            expires_at_dt = datetime.fromtimestamp(exp_ts, tz=timezone.utc).isoformat()

            return VerifyResponse(
                valid=True,
                user=UserInfo(
                    id=user["id"],
                    username=user["username"],
                    full_name=user.get("full_name") or "VCE Operator",
                    role=user.get("role") or "VCE Operator"
                ),
                remaining_seconds=remaining,
                expires_at=expires_at_dt
            )
