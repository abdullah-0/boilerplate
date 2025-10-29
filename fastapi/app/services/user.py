from __future__ import annotations

from datetime import UTC, datetime, timedelta
from functools import lru_cache
from secrets import token_urlsafe
from typing import Type, TypeVar

from fastapi import HTTPException
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from starlette import status

from app.core.config import pwd_context, settings
from app.models import EmailVerificationToken, PasswordResetToken, User

TokenModel = TypeVar("TokenModel", EmailVerificationToken, PasswordResetToken)


class UserService:
    def __init__(self, *, settings_obj=None, password_context=None) -> None:
        self._settings = settings_obj or settings
        self._pwd_context = password_context or pwd_context

    def hash_password(self, password: str) -> str:
        return self._pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self._pwd_context.verify(plain_password, hashed_password)

    def create_tokens(self, user_id: int) -> dict[str, str]:
        now = datetime.now(UTC)
        access_payload = {
            "sub": str(user_id),
            "exp": now + timedelta(minutes=self._settings.access_token_expire_minutes),
            "type": "access",
        }
        refresh_payload = {
            "sub": str(user_id),
            "exp": now + timedelta(days=self._settings.refresh_token_expire_days),
            "type": "refresh",
        }

        access_token = jwt.encode(
            access_payload,
            self._settings.secret_key,
            algorithm=self._settings.algorithm,
        )
        refresh_token = jwt.encode(
            refresh_payload,
            self._settings.secret_key,
            algorithm=self._settings.algorithm,
        )

        return {"access": access_token, "refresh": refresh_token, "type": "bearer"}

    def decode_refresh_token(self, refresh_token: str) -> dict[str, str]:
        try:
            payload = jwt.decode(
                refresh_token,
                self._settings.secret_key,
                algorithms=[self._settings.algorithm],
            )
        except ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            ) from exc
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            ) from exc

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        return payload

    def create_email_verification_token(
        self, db: Session, user: User
    ) -> EmailVerificationToken:
        self._invalidate_tokens(db, EmailVerificationToken, user.id)

        token_value = self._generate_token()
        expires_at = datetime.now(UTC) + timedelta(
            hours=self._settings.email_verification_expiration_hours
        )
        record = EmailVerificationToken(
            token=token_value, user=user, expires_at=expires_at
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def verify_email_token(self, db: Session, token_value: str) -> User:
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token == token_value
        )
        token = db.execute(stmt).scalar_one_or_none()
        if token is None or token.consumed_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
            )
        if self._is_expired(token.expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired"
            )

        user = token.user
        user.is_email_verified = True
        token.consumed_at = datetime.now(UTC)

        db.commit()
        db.refresh(user)
        return user

    def create_password_reset_token(
        self, db: Session, user: User
    ) -> PasswordResetToken:
        self._invalidate_tokens(db, PasswordResetToken, user.id)

        token_value = self._generate_token()
        expires_at = datetime.now(UTC) + timedelta(
            minutes=self._settings.password_reset_expiration_minutes
        )
        record = PasswordResetToken(token=token_value, user=user, expires_at=expires_at)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def reset_password_with_token(
        self, db: Session, token_value: str, new_password: str
    ) -> User:
        stmt = select(PasswordResetToken).where(PasswordResetToken.token == token_value)
        token = db.execute(stmt).scalar_one_or_none()
        if token is None or token.consumed_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
            )
        if self._is_expired(token.expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired"
            )

        user = token.user
        user.password = self.hash_password(new_password)
        token.consumed_at = datetime.now(UTC)

        db.commit()
        db.refresh(user)
        return user

    def _invalidate_tokens(
        self, db: Session, model: Type[TokenModel], user_id: int
    ) -> None:
        db.execute(
            update(model)
            .where(
                model.user_id == user_id,
                model.consumed_at.is_(None),
            )
            .values(consumed_at=datetime.now(UTC))
        )

    @staticmethod
    def _generate_token() -> str:
        return token_urlsafe(48)

    @staticmethod
    def _is_expired(expires_at: datetime) -> bool:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        else:
            expires_at = expires_at.astimezone(UTC)
        return expires_at < datetime.now(UTC)


@lru_cache(maxsize=1)
def get_user_service() -> UserService:
    return UserService()
