from __future__ import annotations

from datetime import timedelta
from secrets import token_urlsafe

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("The email address must be set.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def __str__(self) -> str:
        return self.email


class TokenBase(models.Model):
    token = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="%(class)s_tokens", on_delete=models.CASCADE
    )
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    @classmethod
    def generate_token(cls) -> str:
        return token_urlsafe(48)

    def mark_consumed(self):
        self.consumed_at = timezone.now()
        self.save(update_fields=["consumed_at"])

    def is_valid(self) -> bool:
        return self.consumed_at is None and self.expires_at > timezone.now()


class EmailVerificationToken(TokenBase):
    @classmethod
    def create_for_user(cls, user: User) -> "EmailVerificationToken":
        cls.objects.filter(user=user, consumed_at__isnull=True).update(
            consumed_at=timezone.now()
        )
        token = cls.objects.create(
            user=user,
            token=cls.generate_token(),
            expires_at=timezone.now()
            + timedelta(hours=settings.AUTH_EMAIL_VERIFICATION_EXPIRATION_HOURS),
        )
        return token


class PasswordResetToken(TokenBase):
    @classmethod
    def create_for_user(cls, user: User) -> "PasswordResetToken":
        cls.objects.filter(user=user, consumed_at__isnull=True).update(
            consumed_at=timezone.now()
        )
        token = cls.objects.create(
            user=user,
            token=cls.generate_token(),
            expires_at=timezone.now()
            + timedelta(minutes=settings.AUTH_PASSWORD_RESET_EXPIRATION_MINUTES),
        )
        return token
