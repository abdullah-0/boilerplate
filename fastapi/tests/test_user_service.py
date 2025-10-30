from __future__ import annotations

from jose import jwt

from app.core.config import settings
from app.services.user import UserService


def test_hash_and_verify_password() -> None:
    service = UserService()
    hashed = service.hash_password("Sup3rSecure!")

    assert hashed != "Sup3rSecure!"
    assert service.verify_password("Sup3rSecure!", hashed)


def test_hash_and_verify_long_password() -> None:
    service = UserService()
    password = "P" * 150

    hashed = service.hash_password(password)

    assert service.verify_password(password, hashed)


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


def test_email_verification_token_round_trip() -> None:
    service = UserService()

    token = service.create_email_verification_token(user_id=55)
    parsed_user_id = service.parse_email_verification_token(token)

    assert parsed_user_id == 55


def test_password_reset_token_round_trip() -> None:
    service = UserService()

    token = service.create_password_reset_token(user_id=99)
    parsed_user_id = service.parse_password_reset_token(token)

    assert parsed_user_id == 99
