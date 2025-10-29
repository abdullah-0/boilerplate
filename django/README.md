# Django Auth Boilerplate

Full-featured Django REST Framework starter with JWT auth, email verification, password recovery flows, and reusable account APIs.

## Features
- Custom user model with email login, staff/admin flags, and verification status
- Token tables for email verification + password resets
- JWT issued via `djangorestframework-simplejwt` with refresh token blacklist
- Pinia-style viewsets with class-based API views for auth flows
- CORS, SMTP, and environment management via `django-environ`
- Pre-commit hook support (Black + Ruff) for consistent code style

## Quick start

```bash
cp ..\backend\.env.example ..\backend\.env
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

The API lives at <http://localhost:8000>. JWT endpoints are namespaced under `/api/v1/auth/`.

## Shared configuration

All stacks load variables from `../backend/.env`. Key Django values:

| Variable | Description |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Toggle debug mode |
| `DJANGO_ALLOWED_HOSTS` | Comma separated hosts |
| `DJANGO_DATABASE_URL` | Database DSN (defaults to SQLite) |
| `DJANGO_EMAIL_BACKEND` | Email backend (console by default) |
| `DJANGO_DEFAULT_FROM_EMAIL` | Email sender |
| `AUTH_EMAIL_VERIFICATION_EXPIRATION_HOURS` | Verification token lifetime |
| `AUTH_PASSWORD_RESET_EXPIRATION_MINUTES` | Reset token lifetime |

## API surface

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register/` | Create account and email verification token |
| `POST` | `/api/v1/auth/login/` | Obtain JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh/` | Refresh tokens |
| `GET` | `/api/v1/auth/me/` | Current user profile |
| `POST` | `/api/v1/auth/verify-email/` | Confirm email address |
| `POST` | `/api/v1/auth/resend-verification/` | Re-send verification email |
| `POST` | `/api/v1/auth/forgot-password/` | Trigger password reset email |
| `POST` | `/api/v1/auth/reset-password/` | Submit new password via token |

## Tooling

Install the bundled pre-commit hooks after installing dependencies:

```bash
poetry run pre-commit install
```

Hooks will run Black, Ruff, and common hygiene checks before each commit.

## Superuser

Create an admin user for the Django admin panel:

```bash
poetry run python manage.py createsuperuser
```

The admin includes dashboards for verification + reset tokens for debugging during development.
