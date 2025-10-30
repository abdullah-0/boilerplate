from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for SQLAlchemy models."""


def _as_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


database_url = settings.async_database_url or settings.database_url

if not database_url:
    raise RuntimeError("DATABASE_URL is not configured; check your environment variables.")

driver_name = (database_url.split("://", 1)[0] or "").lower()
if "+" not in driver_name:
    raise RuntimeError(
        "The configured DATABASE_URL must use an async driver (e.g. 'postgresql+asyncpg://'). "
        "Provide ASYNC_DATABASE_URL or update DATABASE_URL accordingly."
    )

engine = create_async_engine(
    database_url,
    echo=_as_bool(getattr(settings, "debug", False)),
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, autoflush=False, expire_on_commit=False)
