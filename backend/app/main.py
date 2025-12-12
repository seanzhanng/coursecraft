from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.programs import router as programs_router
from app.api.routes.courses import router as courses_router
import app.models  # noqa: F401


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(programs_router)
    application.include_router(courses_router)

    @application.get("/health")
    async def health_check() -> dict:
        return {"status": "ok", "environment": settings.environment}

    @application.get("/")
    async def root() -> dict:
        return {"message": "CourseCraft backend is running"}

    return application


app = create_application()
