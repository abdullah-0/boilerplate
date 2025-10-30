from django.urls import re_path

from .views import (
    ForgotPasswordView,
    LoginView,
    MeView,
    RefreshTokenView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    VerifyEmailView,
)

urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="register"),
    re_path(r"^login/?$", LoginView.as_view(), name="login"),
    re_path(r"^refresh/?$", RefreshTokenView.as_view(), name="token_refresh"),
    re_path(r"^me/?$", MeView.as_view(), name="me"),
    re_path(r"^verify-email/?$", VerifyEmailView.as_view(), name="verify_email"),
    re_path(
        r"^resend-verification/?$",
        ResendVerificationView.as_view(),
        name="resend_verification",
    ),
    re_path(r"^forgot-password/?$", ForgotPasswordView.as_view(), name="forgot_password"),
    re_path(r"^reset-password/?$", ResetPasswordView.as_view(), name="reset_password"),
]
