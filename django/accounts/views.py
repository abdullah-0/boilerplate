from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .emails import send_password_reset_email, send_verification_email
from .models import EmailVerificationToken, PasswordResetToken, User
from .serializers import (
    EmailVerificationSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.save()
        token = EmailVerificationToken.create_for_user(user)
        send_verification_email(user.email, token.token)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "token": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "type": "bearer",
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user: User = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "token": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "type": "bearer",
                },
            }
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token: EmailVerificationToken = serializer.context["token_instance"]
        user = token.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        token.mark_consumed()
        return Response({"message": "Email verified successfully."})


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.context["user"]
        token = EmailVerificationToken.create_for_user(user)
        send_verification_email(user.email, token.token)
        return Response({"message": "Verification email sent."})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email).first()
        if user:
            token = PasswordResetToken.create_for_user(user)
            send_password_reset_email(user.email, token.token)
        return Response(
            {"message": "If an account exists for that email, a reset link has been sent."}
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token: PasswordResetToken = serializer.validated_data["token_instance"]
        user = token.user
        user.set_password(serializer.validated_data["password"])
        user.save()
        token.mark_consumed()
        return Response({"message": "Password updated successfully."})


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
