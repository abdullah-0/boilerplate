# FastAPI Boilerplate

Modern FastAPI starter that ships with JWT authentication, refresh tokens, email verification, password resets, SQLAlchemy 2.0 models, and preconfigured project tooling.

## Highlights
- SQLAlchemy 2.0 ORM with Alembic migrations
- JWT auth flow with refresh tokens, email verification, and password reset endpoints
- SMTP-ready transactional email service (verification + reset)
- Modular architecture (routers, services, schemas, models)
- Tooling: Ruff, Black, MyPy, and pre-commit hooks baked in
- OpenAPI docs at `/docs` with tagged routers

## Quick start

```bash
cp .env.example .env  # adjust secrets once copied
poetry install
# activate the environment (e.g., `poetry shell` or `.venv\Scripts\activate` on Windows)
alembic upgrade head
python main.py
```

The API will be live at <http://localhost:8000> and documented at `/docs`.

## Environment variables

Place a `.env` file in the project root (copy `./.env.example` to `./.env` to get started). The application reads the following keys:

| Variable | Purpose |
| --- | --- |
| `PROJECT_NAME` | Title displayed in FastAPI metadata |
| `DEBUG` | Enables debug mode when set to `1`/`true` |
| `DATABASE_URL` | Primary SQLAlchemy connection URI (e.g., `postgresql+psycopg://user:pass@localhost/db`) |
| `ASYNC_DATABASE_URL` | Optional async database URI (falls back to `DATABASE_URL` if omitted) |
| `SECRET_KEY` | Secret used for JWT signing |
| `ALGORITHM` | JWT signing algorithm (defaults to `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime in days |
| `EMAIL_VERIFICATION_EXPIRATION_HOURS` | Expiration window for verification links |
| `PASSWORD_RESET_EXPIRATION_MINUTES` | Expiration window for password reset links |
| `SMTP_SERVER` / `SMTP_PORT` | SMTP host and port |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | SMTP authentication credentials (optional) |
| `FROM_EMAIL` | From address used for transactional emails |
| `FRONTEND_URL` | Base URL used in verification/reset links |
| `ALLOWED_ORIGINS` | Comma-separated list of origins for CORS (e.g., `http://localhost:3000,http://127.0.0.1:3000`) |

Update values to match your environment before starting the app.

## Auth endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create a user and immediately send a verification email |
| `POST` | `/api/v1/auth/login` | Login with email + password, returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Exchange a refresh token for new access credentials |
| `POST` | `/api/v1/auth/verify-email` | Mark email address verified via emailed token |
| `POST` | `/api/v1/auth/resend-verification` | Re-send verification email |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password using emailed token |
| `GET` | `/api/v1/auth/me` | Retrieve the authenticated profile |

Entity CRUD routes are available under `/api/v1/entities` to serve as a blueprint for resource development.

## Pre-commit hooks

Install hooks once dependencies are available:

```bash
pre-commit install
```

The hook suite runs Ruff, Black, MyPy, and general formatting checks before each commit.

## Database migrations

Create and apply migrations with Alembic (run from the project root with your virtual environment activated):

### Create Revision
```
alembic revision --autogenerate -m "message-here"
```
### Implement Revision
```
alembic upgrade head
```

## Testing the auth lifecycle

1. Register a user via `/api/v1/auth/register`
2. Check the console logs for the verification link (SMTP credentials optional)
3. Hit `/api/v1/auth/verify-email` with the token
4. Log in to receive access + refresh tokens
5. Use `/api/v1/auth/refresh` to rotate tokens when the access token expires
6. Run `/api/v1/auth/forgot-password` to email a password reset link
7. Complete the reset with `/api/v1/auth/reset-password`

With the defaults in place you can develop locally in minutes, then swap the database/SMTP credentials when moving to staging or production.
