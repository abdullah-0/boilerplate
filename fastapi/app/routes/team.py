from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependency import get_auth_user, get_db
from app.models import Team, TeamMembership, User
from app.notifications import notifier
from app.schemas import (
    TeamCreate,
    TeamDetail,
    TeamInviteRequest,
    TeamMemberDetail,
    TeamMemberUpdate,
)

router = APIRouter()


async def _get_team(db: AsyncSession, team_id: int) -> Team | None:
    result = await db.execute(select(Team).where(Team.id == team_id))
    return result.scalar_one_or_none()


async def _get_team_membership(
    db: AsyncSession, team_id: int, user_id: int
) -> TeamMembership | None:
    stmt = select(TeamMembership).where(
        TeamMembership.team_id == team_id,
        TeamMembership.user_id == user_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _serialize_team(
    db: AsyncSession, team: Team
) -> TeamDetail:
    members = await _fetch_team_members(db, team.id)
    return TeamDetail(
        id=team.id,
        name=team.name,
        owner_id=team.owner_id,
        created_at=team.created_at,
        updated_at=team.updated_at,
        members=members,
    )


async def _fetch_team_members(
    db: AsyncSession, team_id: int
) -> list[TeamMemberDetail]:
    stmt = (
        select(TeamMembership, User)
        .join(User, TeamMembership.user_id == User.id)
        .where(TeamMembership.team_id == team_id)
    )
    result = await db.execute(stmt)
    members: list[TeamMemberDetail] = []
    for membership, user in result.all():
        members.append(
            TeamMemberDetail(
                user_id=user.id,
                email=user.email,
                role=membership.role,
                status=membership.status,
                invited_by_id=membership.invited_by_id,
                joined_at=membership.created_at,
            )
        )
    return members


def _ensure_can_manage(team_membership: TeamMembership | None) -> None:
    if not team_membership or team_membership.role not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this team.",
        )


@router.post("", response_model=TeamDetail, status_code=status.HTTP_201_CREATED)
async def create_team(
    payload: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_auth_user),
) -> TeamDetail:
    result = await db.execute(select(Team).where(Team.name == payload.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with that name already exists.",
        )

    team = Team(name=payload.name, owner_id=current_user.id)
    db.add(team)
    await db.flush()

    membership = TeamMembership(
        team_id=team.id,
        user_id=current_user.id,
        role="owner",
        status="active",
        invited_by_id=current_user.id,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(team)

    return await _serialize_team(db, team)


@router.get("", response_model=list[TeamDetail])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_auth_user),
) -> list[TeamDetail]:
    stmt = (
        select(Team)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(TeamMembership.user_id == current_user.id)
        .order_by(Team.created_at)
    )
    result = await db.execute(stmt)
    teams = result.scalars().unique().all()

    return [await _serialize_team(db, team) for team in teams]


@router.post(
    "/{team_id}/invite",
    response_model=TeamMemberDetail,
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    team_id: int,
    payload: TeamInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_auth_user),
) -> TeamMemberDetail:
    team = await _get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    current_membership = await _get_team_membership(db, team_id, current_user.id)
    _ensure_can_manage(current_membership)

    target_user = await _get_user_by_email(db, payload.email)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invited user not found.",
        )

    existing_membership = await _get_team_membership(db, team_id, target_user.id)
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already part of the team.",
        )

    membership = TeamMembership(
        team_id=team_id,
        user_id=target_user.id,
        role=payload.role,
        status="active",
        invited_by_id=current_user.id,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)

    member_detail = TeamMemberDetail(
        user_id=target_user.id,
        email=target_user.email,
        role=membership.role,
        status=membership.status,
        invited_by_id=membership.invited_by_id,
        joined_at=membership.created_at,
    )

    notifier.send_user_notification(
        user_id=target_user.id,
        payload={
            "event": "team_invitation",
            "team_id": team.id,
            "team_name": team.name,
            "role": membership.role,
        },
    )

    return member_detail


@router.patch(
    "/{team_id}/members/{member_id}",
    response_model=TeamMemberDetail,
)
async def update_member(
    team_id: int,
    member_id: int,
    payload: TeamMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_auth_user),
) -> TeamMemberDetail:
    team = await _get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    actor_membership = await _get_team_membership(db, team_id, current_user.id)
    _ensure_can_manage(actor_membership)

    membership = await _get_team_membership(db, team_id, member_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this team.",
        )

    if payload.role:
        membership.role = payload.role
    if payload.status:
        membership.status = payload.status

    await db.commit()
    await db.refresh(membership)

    member_user = await _get_user_by_id(db, member_id)
    if not member_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )

    detail = TeamMemberDetail(
        user_id=member_user.id,
        email=member_user.email,
        role=membership.role,
        status=membership.status,
        invited_by_id=membership.invited_by_id,
        joined_at=membership.created_at,
    )

    notifier.send_user_notification(
        user_id=member_user.id,
        payload={
            "event": "team_membership_updated",
            "team_id": team.id,
            "team_name": team.name,
            "role": membership.role,
            "status": membership.status,
        },
    )

    return detail
