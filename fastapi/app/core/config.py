from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List

from dotenv import load_dotenv
from fastapi.security import HTTPBearer
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

oauth2_scheme = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class Settings:
    project_name: str = field(default_factory=lambda: os.getenv("PROJECT_NAME"))
    debug: bool = field(default_factory=lambda: os.getenv("DEBUG"))
    app_url: str = field(default_factory=lambda: os.getenv("FRONTEND_URL"))
    allowed_origins: List[str] = field(
        default_factory=lambda: os.getenv("ALLOWED_ORIGINS").split(",")
    )

    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL"))
    async_database_url: str = field(
        default_factory=lambda: os.getenv("ASYNC_DATABASE_URL")
        or os.getenv("DATABASE_URL")
    )

    secret_key: str = field(default_factory=lambda: os.getenv("SECRET_KEY"))
    algorithm: str = field(default_factory=lambda: os.getenv("ALGORITHM"))
    access_token_expire_minutes: int = field(
        default_factory=lambda: os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    )
    refresh_token_expire_days: int = field(
        default_factory=lambda: os.getenv("REFRESH_TOKEN_EXPIRE_DAYS")
    )
    email_verification_expiration_hours: int = field(
        default_factory=lambda: os.getenv("EMAIL_VERIFICATION_EXPIRATION_HOURS")
    )
    password_reset_expiration_minutes: int = field(
        default_factory=lambda: os.getenv("PASSWORD_RESET_EXPIRATION_MINUTES")
    )

    smtp_server: str = field(default_factory=lambda: os.getenv("SMTP_SERVER"))
    smtp_port: int = field(default_factory=lambda: os.getenv("SMTP_PORT"))
    smtp_username: str | None = field(
        default_factory=lambda: os.getenv("SMTP_USERNAME")
    )
    smtp_password: str | None = field(
        default_factory=lambda: os.getenv("SMTP_PASSWORD")
    )
    from_email: str = field(default_factory=lambda: os.getenv("FROM_EMAIL"))


settings = Settings()
