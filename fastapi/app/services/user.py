from __future__ import annotations

from datetime import UTC, datetime, timedelta
from functools import lru_cache

from fastapi import HTTPException
from jose import ExpiredSignatureError, JWTError, jwt
from starlette import status

from app.core.config import pwd_context, settings


class UserService:
    """Business logic for user authentication-related helpers."""

    def __init__(
        self,
        *,
        secret_key: str | None = None,
        algorithm: str | None = None,
    ) -> None:
        self._secret_key = secret_key or settings.secret_key
        self._algorithm = algorithm or settings.algorithm
        self._pwd_context = pwd_context

    def hash_password(self, password: str) -> str:
        return self._pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self._pwd_context.verify(plain_password, hashed_password)

    def create_tokens(self, user_id: int) -> dict[str, str]:
        access_expire = timedelta(
            minutes=self._as_int(settings.access_token_expire_minutes, default=30)
        )
        refresh_expire = timedelta(
            days=self._as_int(settings.refresh_token_expire_days, default=7)
        )

        access_token = self._encode_token(
            subject=str(user_id),
            expires_delta=access_expire,
            token_type="access",
        )
        refresh_token = self._encode_token(
            subject=str(user_id),
            expires_delta=refresh_expire,
            token_type="refresh",
        )
        return {"access": access_token, "refresh": refresh_token, "type": "bearer"}

    def decode_access_token(self, access_token: str) -> dict[str, str]:
        return self._decode_token(
            access_token,
            expected_type="access",
            invalid_status=status.HTTP_401_UNAUTHORIZED,
            invalid_detail="Invalid access token",
            expired_status=status.HTTP_401_UNAUTHORIZED,
            expired_detail="Access token expired",
        )

    def decode_refresh_token(self, refresh_token: str) -> dict[str, str]:
        return self._decode_token(
            refresh_token,
            expected_type="refresh",
            invalid_status=status.HTTP_401_UNAUTHORIZED,
            invalid_detail="Invalid refresh token",
            expired_status=status.HTTP_401_UNAUTHORIZED,
            expired_detail="Refresh token expired",
        )

    def create_email_verification_token(self, user_id: int) -> str:
        expires = timedelta(
            hours=self._as_int(settings.email_verification_expiration_hours, default=48)
        )
        return self._encode_token(
            subject=str(user_id),
            expires_delta=expires,
            token_type="verify_email",
        )

    def parse_email_verification_token(self, token: str) -> int:
        payload = self._decode_token(
            token,
            expected_type="verify_email",
            invalid_detail="Invalid verification token",
            expired_detail="Verification token expired",
        )
        return int(payload["sub"])

    def create_password_reset_token(self, user_id: int) -> str:
        expires = timedelta(
            minutes=self._as_int(
                settings.password_reset_expiration_minutes, default=30
            )
        )
        return self._encode_token(
            subject=str(user_id),
            expires_delta=expires,
            token_type="password_reset",
        )

    def parse_password_reset_token(self, token: str) -> int:
        payload = self._decode_token(
            token,
            expected_type="password_reset",
            invalid_detail="Invalid password reset token",
            expired_detail="Password reset token expired",
        )
        return int(payload["sub"])

    def _encode_token(
        self,
        *,
        subject: str,
        expires_delta: timedelta,
        token_type: str,
        extra: dict[str, str] | None = None,
    ) -> str:
        now = datetime.now(UTC)
        payload: dict[str, str | datetime] = {
            "sub": subject,
            "type": token_type,
            "iat": now,
            "exp": now + expires_delta,
        }
        if extra:
            payload.update(extra)
        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def _decode_token(
        self,
        token: str,
        *,
        expected_type: str,
        invalid_status: int = status.HTTP_400_BAD_REQUEST,
        invalid_detail: str = "Invalid token",
        expired_status: int = status.HTTP_400_BAD_REQUEST,
        expired_detail: str = "Token expired",
    ) -> dict[str, str]:
        try:
            payload = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
            )
        except ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=expired_status,
                detail=expired_detail,
            ) from exc
        except JWTError as exc:
            raise HTTPException(
                status_code=invalid_status,
                detail=invalid_detail,
            ) from exc

        if payload.get("type") != expected_type:
            raise HTTPException(
                status_code=invalid_status,
                detail=invalid_detail,
            )
        return payload

    @staticmethod
    def _as_int(value: int | str | None, *, default: int) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default


@lru_cache(maxsize=1)
def get_user_service() -> UserService:
    return UserService()
