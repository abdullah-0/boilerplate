# Vue Auth Starter

Vue 3 + Vite + Pinia single-page app with reusable auth screens, axios interceptors, and shared token logic.

## Features
- Pinia auth store with hydration + localStorage persistence
- Vue Router navigation guards for protected vs guest routes
- Axios client with automatic refresh token handling
- Ready-made pages: dashboard, login, register, forgot/reset password, email verification
- Husky + lint-staged pipeline for ESLint (Vue) and Prettier formatting

## Getting started

`
pnpm install  # or npm/yarn
cp ..\frontend\.env.example ..\frontend\.env
pnpm dev
`

By default the app points to VITE_API_BASE_URL=http://localhost:8000/api/v1 from the shared ../frontend/.env file.

## Scripts
- pnpm dev – run Vite dev server (port 3002)
- pnpm build – type-check and build for production
- pnpm preview – preview production build
- pnpm lint – run ESLint flat config
- pnpm format – Prettier check

## Auth walkthrough

1. Register to trigger a verification email (captured in backend logs during development)
2. Open the /verify-email route with the token to activate the account
3. Sign in to populate the Pinia store and persist tokens
4. Axios interceptors refresh tokens seamlessly and log out globally when needed
5. Use /forgot-password and /reset-password to test the recovery experience

Invoke pnpm dlx husky install once so lint-staged hooks run on commits.
