from __future__ import annotations

from rest_framework import serializers

from .models import Team, TeamMembership


class TeamMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    invited_by_id = serializers.IntegerField(read_only=True)
    joined_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = TeamMembership
        fields = ("user_id", "email", "role", "status", "invited_by_id", "joined_at")
        read_only_fields = fields


class TeamSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(read_only=True)
    members = TeamMemberSerializer(source="memberships", many=True, read_only=True)

    class Meta:
        model = Team
        fields = ("id", "name", "owner_id", "created_at", "updated_at", "members")
        read_only_fields = ("id", "owner_id", "created_at", "updated_at", "members")


class TeamCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ("name",)


class TeamInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=TeamMembership.ROLE_CHOICES, default=TeamMembership.ROLE_MEMBER
    )


class TeamMemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=TeamMembership.ROLE_CHOICES, required=False, allow_null=True
    )
    status = serializers.ChoiceField(
        choices=TeamMembership.STATUS_CHOICES, required=False, allow_null=True
    )

    def validate(self, attrs):
        if not any(value is not None for value in attrs.values()):
            raise serializers.ValidationError(
                "Provide at least one field (role or status) to update."
            )
        return attrs
