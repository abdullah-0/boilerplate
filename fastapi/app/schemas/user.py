from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Message(BaseModel):
    message: str


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    first_name: str = Field(min_length=1, max_length=63)
    last_name: str | None = Field(default=None, max_length=63)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserDetail(UserBase):
    id: int
    first_name: str
    last_name: str | None = None
    is_active: bool
    is_admin: bool
    is_email_verified: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access: str
    refresh: str
    type: str = "bearer"


class RefreshToken(BaseModel):
    refresh: str


class EmailVerificationRequest(BaseModel):
    token: str


class ResendVerificationRequest(UserBase):
    pass


class PasswordResetRequest(UserBase):
    pass


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class UserAuth(BaseModel):
    user: UserDetail
    token: Token
