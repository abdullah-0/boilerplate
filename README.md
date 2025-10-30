Fullstack Boilerplates
======================

Pick a backend (FastAPI or Django) and pair it with a frontend (React, Next.js, Vue). Each stack ships with matching JWT auth flows for login, signup, email verification, password reset, and axios powered token refresh logic.

Projects
--------
- fastapi/ - FastAPI and SQLAlchemy 2.0 service with email verification and password resets
- django/ - Django REST Framework with Simple JWT auth APIs
- react/ - Vite and React SPA with auth context and axios interceptors
- nextjs/ - Next.js App Router implementation with Zustand state
- vue/ - Vue 3 with Pinia and Vue Router SPA auth experience

Configuration
-------------
- Copy each .env.example file to .env inside the same boilerplate directory and update the values.
- Every boilerplate folder includes a .gitignore tuned for its tooling.

Getting Started
---------------
1. Choose the backend and frontend directories you want to pair.
2. Copy their .env.example files to .env and update the settings.
3. Install dependencies and run the app using the steps in the selected project README.

Each app is production ready with linting, formatter hooks, and boilerplate auth endpoints so you can start building features in minutes.
