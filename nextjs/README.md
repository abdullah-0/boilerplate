# Next.js Auth Starter

App Router Next.js 14 template featuring JWT auth, axios interceptors, and Zustand state for SPA-style user management.

## Highlights
- App Router with route groups for auth vs. protected pages
- Zustand store hydrates profile data and syncs with localStorage
- Axios client configured with refresh-token rotation and global logout signal
- Shared auth screens: login, signup, forgot/reset password, email verification
- Husky + lint-staged + Prettier for rapid feedback and clean commits

## Setup

`
pnpm install  # or npm/yarn
cp ..\frontend\.env.example ..\frontend\.env
pnpm dev
`

Environment values are loaded from ../frontend/.env, notably NEXT_PUBLIC_API_BASE_URL for the API origin.

## Commands
- pnpm dev – start Next dev server (port 3000)
- pnpm build – production build
- pnpm start – run production server
- pnpm lint – lint using Next + ESLint flat config
- pnpm format – Prettier check

## Auth lifecycle

1. Register a user and confirm the verification email
2. Sign in to store access/refresh tokens in localStorage
3. Accessing / while unauthenticated redirects to /login
4. Refresh token failures emit a global logout event handled via Zustand
5. Password reset and email verification views read tokens from query params

Run pnpm dlx husky install once to wire git hooks.
