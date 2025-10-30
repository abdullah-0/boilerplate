from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import auth_router, notifications_router, team_router

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Full-featured FastAPI boilerplate with modern SQLAlchemy patterns.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/user", tags=["user"])
app.include_router(team_router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(notifications_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=9000, reload=True)
