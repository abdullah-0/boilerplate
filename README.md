Fullstack Boilerplates
======================

Pick a backend (FastAPI or Django) and pair it with a front-end (React, Next.js, Vue). Each stack ships with matching JWT auth flows: login, signup, email verification, password reset, and axios-powered token refresh logic.

Projects
--------
- astapi/ – FastAPI + SQLAlchemy 2.0 service with email verification + password resets
- django/ – Django REST Framework + Simple JWT auth APIs
- eact/ – Vite + React SPA with auth context and axios interceptors
- 
extjs/ – Next.js App Router implementation with Zustand state
- ue/ – Vue 3 + Pinia + Vue Router SPA auth experience

Shared configuration
--------------------
- ackend/.env (copy from ackend/.env.example) feeds both FastAPI and Django
- rontend/.env (copy from rontend/.env.example) feeds React, Next.js, and Vue

Update the two files once and you can mix-and-match any backend with any frontend client.

Getting started
---------------
1. cp backend/.env.example backend/.env and cp frontend/.env.example frontend/.env
2. Configure database, SMTP, and API base URLs as needed
3. Enter the project directory you want (cd fastapi, cd react, etc.)
4. Follow its README for install scripts, tooling, and pre-commit setup

Each app is production-ready with linting, formatter hooks, and boilerplate auth endpoints so you can start building features in minutes.
