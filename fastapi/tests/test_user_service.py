from __future__ import annotations

from jose import jwt

from core.config import settings
from models import User
from services.user import UserService


def test_hash_and_verify_password() -> None:
    service = UserService()
    hashed = service.hash_password("Sup3rSecure!")

    assert hashed != "Sup3rSecure!"
    assert service.verify_password("Sup3rSecure!", hashed)


def test_token_creation_and_decoding() -> None:
    service = UserService()

    tokens = service.create_tokens(user_id=42)
    assert tokens["type"] == "bearer"

    decoded = service.decode_refresh_token(tokens["refresh"])
    assert decoded["sub"] == "42"

    access_payload = jwt.decode(
        tokens["access"],
        settings.secret_key,
        algorithms=[settings.algorithm],
    )
    assert access_payload["type"] == "access"


def test_email_verification_flow(db_session) -> None:
    service = UserService()
    user = User(
        email="test@example.com",
        password=service.hash_password("Sup3rSecure!"),
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    first_token = service.create_email_verification_token(db_session, user)
    second_token = service.create_email_verification_token(db_session, user)
    db_session.refresh(first_token)

    assert first_token.consumed_at is not None
    assert second_token.token != first_token.token

    verified_user = service.verify_email_token(db_session, second_token.token)
    assert verified_user.is_email_verified is True


def test_password_reset_flow(db_session) -> None:
    service = UserService()
    user = User(
        email="reset@example.com",
        password=service.hash_password("OldPassword123"),
        first_name="Reset",
        last_name="User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token_record = service.create_password_reset_token(db_session, user)
    updated_user = service.reset_password_with_token(
        db_session, token_record.token, "NewPassword123!"
    )

    assert service.verify_password("NewPassword123!", updated_user.password)
