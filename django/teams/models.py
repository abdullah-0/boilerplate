from __future__ import annotations

from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Team(models.Model):
    name = models.CharField(max_length=127, unique=True)
    owner = models.ForeignKey(
        User,
        related_name="owned_teams",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)

    def __str__(self) -> str:
        return self.name


class TeamMembership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_SUSPENDED = "suspended"

    ROLE_CHOICES = (
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
    )
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_SUSPENDED, "Suspended"),
    )

    team = models.ForeignKey(
        Team,
        related_name="memberships",
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        User,
        related_name="team_memberships",
        on_delete=models.CASCADE,
    )
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    status = models.CharField(
        max_length=32, choices=STATUS_CHOICES, default=STATUS_ACTIVE
    )
    invited_by = models.ForeignKey(
        User,
        related_name="invited_team_memberships",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("team", "user")
        ordering = ("team_id", "user_id")

    def __str__(self) -> str:
        return f"{self.user} in {self.team}"
