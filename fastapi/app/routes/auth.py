from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependency import get_auth_user, get_db
from app.models import User
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
)
from app.services import EmailService, UserService, get_email_service, get_user_service

router = APIRouter()


@router.post("/register", response_model=UserAuth, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    stmt = select(User).where(User.email == user_in.email)
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    new_user = User(
        email=user_in.email,
        password=user_service.hash_password(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name or "",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_record = user_service.create_email_verification_token(db, new_user)
    email_service.send_verification_email(new_user.email, token_record.token)

    tokens = user_service.create_tokens(new_user.id)
    return {"user": new_user, "token": tokens}


@router.post("/login", response_model=UserAuth)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    stmt = select(User).where(User.email == credentials.email)
    user = db.execute(stmt).scalar_one_or_none()
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
def refresh_token(
    payload: RefreshToken,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    decoded = user_service.decode_refresh_token(payload.refresh)
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
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


@router.post("/verify-email", response_model=Message)
def verify_email(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    user_service.verify_email_token(db, request.token)
    return Message(message="Email verified successfully.")


@router.post("/resend-verification", response_model=Message)
def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    stmt = select(User).where(User.email == request.email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified"
        )

    token_record = user_service.create_email_verification_token(db, user)
    email_service.send_verification_email(user.email, token_record.token)
    return Message(message="Verification email sent.")


@router.post("/forgot-password", response_model=Message)
def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service),
):
    stmt = select(User).where(User.email == request.email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        # Avoid leaking which emails exist
        return Message(
            message="If an account exists for that email, a reset link has been sent."
        )

    token_record = user_service.create_password_reset_token(db, user)
    email_service.send_password_reset_email(user.email, token_record.token)
    return Message(
        message="If an account exists for that email, a reset link has been sent."
    )


@router.post("/reset-password", response_model=Message)
def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    user_service.reset_password_with_token(db, request.token, request.password)
    return Message(message="Password updated successfully.")
