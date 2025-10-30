from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, EmailStr, Field


class TeamMemberDetail(BaseModel):
    user_id: int
    email: EmailStr
    role: str
    status: str
    invited_by_id: int | None = None
    joined_at: datetime


class TeamBase(BaseModel):
    name: str = Field(min_length=1, max_length=127)


class TeamCreate(TeamBase):
    pass


class TeamDetail(TeamBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    members: List[TeamMemberDetail] = Field(default_factory=list)

    class Config:
        from_attributes = True


class TeamInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="member", max_length=32)


class TeamMemberUpdate(BaseModel):
    role: str | None = Field(default=None, max_length=32)
    status: str | None = None
