from __future__ import annotations

from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import EmailVerificationToken, PasswordResetToken, User


class UserSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(source="date_joined", read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_email_verified",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "is_email_verified",
            "is_active",
            "created_at",
            "updated_at",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(self.context["request"], email=email, password=password)
            if not user:
                raise serializers.ValidationError(_("Unable to log in with provided credentials."), code="authorization")
            if not user.is_email_verified:
                raise serializers.ValidationError(_("Email address has not been verified."), code="authorization")
        else:
            raise serializers.ValidationError(_("Must include 'email' and 'password'."), code="authorization")

        attrs["user"] = user
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value: str):
        token = EmailVerificationToken.objects.filter(token=value, consumed_at__isnull=True).first()
        if not token or not token.is_valid():
            raise serializers.ValidationError(_("Invalid or expired token."))
        self.context["token_instance"] = token
        return value


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str):
        user = User.objects.filter(email=value).first()
        if not user:
            raise serializers.ValidationError(_("User not found."))
        if user.is_email_verified:
            raise serializers.ValidationError(_("Email already verified."))
        self.context["user"] = user
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        token_value = attrs.get("token")
        token = PasswordResetToken.objects.filter(token=token_value, consumed_at__isnull=True).first()
        if not token or not token.is_valid():
            raise serializers.ValidationError({"token": _("Invalid or expired token.")})
        attrs["token_instance"] = token
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name")
