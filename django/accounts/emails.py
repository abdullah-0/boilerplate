from django.conf import settings
from django.core.mail import send_mail


def send_verification_email(email: str, token: str) -> None:
    link = f"{settings.FRONTEND_ORIGINS[0].rstrip('/')}/verify-email?token={token}"
    send_mail(
        subject="Verify your account",
        message=f"Confirm your email by visiting {link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )


def send_password_reset_email(email: str, token: str) -> None:
    link = f"{settings.FRONTEND_ORIGINS[0].rstrip('/')}/reset-password?token={token}"
    send_mail(
        subject="Reset your password",
        message=f"Reset your password by visiting {link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )
