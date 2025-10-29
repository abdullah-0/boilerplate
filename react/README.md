# React Auth Starter

Vite + React + TypeScript starter with JWT auth, axios interceptors, and ready-to-use screens for login, signup, verification, and password recovery.

## Features
- React Router v6 SPA with protected routes and guest redirects
- Auth context powered by localStorage + profile hydration
- Axios instance with automatic token refresh and global logout event
- Forms for register, login, forgot password, reset password, and email verification
- Husky + lint-staged pre-commit workflow (ESLint, Prettier)

## Getting started

`
pnpm install  # or npm/yarn
cp ..\frontend\.env.example ..\frontend\.env
pnpm dev
`

The app reads VITE_API_BASE_URL from ../frontend/.env with a default of http://localhost:8000/api/v1.

## Scripts
- pnpm dev – start Vite dev server (port 3001)
- pnpm build – production build
- pnpm preview – preview built app
- pnpm lint – ESLint flat config
- pnpm format – Prettier check

## Pre-commit

`
pnpm dlx husky install
`

Husky runs lint-staged to auto-fix staged TypeScript, CSS, and JSON files.

## Auth flow

1. Register in the React UI (verification email logged by FastAPI/Django during dev)
2. Follow the verification link and confirm the token
3. Sign in to load your profile; tokens stored in localStorage
4. Axios interceptors refresh tokens automatically on 401 responses
5. Use “Forgot password” to trigger a reset email and test the reset screen

The UI is intentionally minimal, letting you swap in your design system without touching the data layer.
