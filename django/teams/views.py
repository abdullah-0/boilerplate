from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications import notifier

from .models import Team, TeamMembership
from .serializers import (
    TeamCreateSerializer,
    TeamInviteSerializer,
    TeamMemberSerializer,
    TeamMemberUpdateSerializer,
    TeamSerializer,
)

User = get_user_model()


class TeamListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        teams = (
            Team.objects.filter(memberships__user=request.user)
            .select_related("owner")
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=TeamMembership.objects.select_related("user"),
                )
            )
            .distinct()
            .order_by("id")
        )
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TeamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if Team.objects.filter(name__iexact=serializer.validated_data["name"]).exists():
            return Response(
                {"detail": "A team with that name already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            team = Team.objects.create(
                name=serializer.validated_data["name"],
                owner=request.user,
            )
            TeamMembership.objects.create(
                team=team,
                user=request.user,
                role=TeamMembership.ROLE_OWNER,
                status=TeamMembership.STATUS_ACTIVE,
                invited_by=request.user,
            )

        detail = TeamSerializer(team)
        return Response(detail.data, status=status.HTTP_201_CREATED)


class TeamInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, team_id: int):
        team = get_object_or_404(Team.objects.select_related("owner"), pk=team_id)
        actor_membership = TeamMembership.objects.filter(
            team=team, user=request.user
        ).first()
        _ensure_can_manage(actor_membership)

        serializer = TeamInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = User.objects.filter(
            email__iexact=serializer.validated_data["email"]
        ).first()
        if target_user is None:
            return Response(
                {"detail": "Invited user not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if TeamMembership.objects.filter(team=team, user=target_user).exists():
            return Response(
                {"detail": "User is already part of the team."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            membership = TeamMembership.objects.create(
                team=team,
                user=target_user,
                role=serializer.validated_data["role"],
                status=TeamMembership.STATUS_ACTIVE,
                invited_by=request.user,
            )
        except IntegrityError:
            return Response(
                {"detail": "User is already part of the team."},
                status=status.HTTP_400_BAD_REQUEST,
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

        return Response(
            TeamMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class TeamMemberUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, team_id: int, member_id: int):
        team = get_object_or_404(Team.objects.select_related("owner"), pk=team_id)
        actor_membership = TeamMembership.objects.filter(
            team=team, user=request.user
        ).first()
        _ensure_can_manage(actor_membership)

        membership = get_object_or_404(
            TeamMembership.objects.select_related("user"),
            team=team,
            user_id=member_id,
        )

        serializer = TeamMemberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("role"):
            membership.role = data["role"]
        if data.get("status"):
            membership.status = data["status"]
        membership.save(update_fields=["role", "status", "updated_at"])

        notifier.send_user_notification(
            user_id=membership.user_id,
            payload={
                "event": "team_membership_updated",
                "team_id": team.id,
                "team_name": team.name,
                "role": membership.role,
                "status": membership.status,
            },
        )

        return Response(TeamMemberSerializer(membership).data)


def _ensure_can_manage(membership: TeamMembership | None) -> None:
    if membership is None or membership.role not in (
        TeamMembership.ROLE_OWNER,
        TeamMembership.ROLE_ADMIN,
    ):
        raise PermissionDenied("You do not have permission to manage this team.")
