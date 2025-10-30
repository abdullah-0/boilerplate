from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependency import get_auth_user, get_db
from app.models import User
from app.notifications import notifier
from app.schemas import (
    EmailVerificationRequest,
    Message,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshToken,
    ResendVerificationRequest,
    Token,
    UserAuth,
    UserCreate,
    UserDetail,
    UserLogin,
    UserUpdate,
)
from app.services import EmailService, UserService, get_email_service, get_user_service

router = APIRouter()


async def _get_user(
    db: AsyncSession,
    *,
    user_id: int | None = None,
    email: str | None = None,
) -> User | None:
    if user_id is None and email is None:
        raise ValueError("either user_id or email must be provided")

    stmt = select(User)
    if user_id is not None:
        stmt = stmt.where(User.id == user_id)
    if email is not None:
        stmt = stmt.where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_users(db: AsyncSession) -> list[User]:
    stmt = select(User)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/", response_model=list[UserDetail])
async def list_users(
    current_user: User = Depends(get_auth_user),
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list all users.",
        )
    return await _get_users(db)


@router.post("/register", response_model=UserAuth, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    existing = await _get_user(db, email=data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    new_user = User(
        email=data.email,
        password=user_service.hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name or "",
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    verification_token = user_service.create_email_verification_token(new_user.id)
    email_service.send_verification_email(new_user.email, verification_token)

    tokens = user_service.create_tokens(new_user.id)
    return {"user": new_user, "token": tokens}


@router.post("/login", response_model=UserAuth)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    user = await _get_user(db, email=credentials.email)
    if not user or not user_service.verify_password(
        credentials.password, user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address is not verified.",
        )

    tokens = user_service.create_tokens(user.id)
    return {"user": user, "token": tokens}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshToken,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    decoded = user_service.decode_refresh_token(payload.refresh)
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user = await _get_user(db, user_id=int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user_service.create_tokens(user.id)


@router.get("/me", response_model=UserDetail)
def read_user_me(current_user: User = Depends(get_auth_user)):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )
    return current_user


@router.patch("/me", response_model=UserDetail)
async def update_user_me(
    payload: UserUpdate,
    current_user: User = Depends(get_auth_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name

    await db.commit()
    await db.refresh(current_user)

    notifier.send_user_notification(
        user_id=current_user.id,
        payload={
            "event": "profile_updated",
            "user_id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
        },
    )
    return current_user


@router.post("/verify-email", response_model=Message)
async def verify_email(
    request: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    user_id = user_service.parse_email_verification_token(request.token)
    user = await _get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.is_email_verified:
        return Message(message="Email already verified.")

    user.is_email_verified = True
    await db.commit()
    await db.refresh(user)

    notifier.send_user_notification(
        user_id=user.id,
        payload={"event": "email_verified", "user_id": user.id},
    )
    return Message(message="Email verified successfully.")


@router.post("/resend-verification", response_model=Message)
async def resend_verification(
    request: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    user = await _get_user(db, email=request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified"
        )

    verification_token = user_service.create_email_verification_token(user.id)
    email_service.send_verification_email(user.email, verification_token)
    return Message(message="Verification email sent.")


@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    user = await _get_user(db, email=request.email)
    if not user:
        # Avoid leaking which emails exist
        return Message(
            message="If an account exists for that email, a reset link has been sent."
        )

    reset_token = user_service.create_password_reset_token(user.id)
    email_service.send_password_reset_email(user.email, reset_token)
    return Message(
        message="If an account exists for that email, a reset link has been sent."
    )


@router.post("/reset-password", response_model=Message)
async def reset_password(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    user_id = user_service.parse_password_reset_token(request.token)
    user = await _get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.password = user_service.hash_password(request.password)
    await db.commit()
    await db.refresh(user)
    return Message(message="Password updated successfully.")
