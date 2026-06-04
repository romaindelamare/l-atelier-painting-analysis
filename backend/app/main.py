"""FastAPI application entrypoint.

Creates the app, enables CORS for local development, mounts the image directory
as static files, registers the paintings router and creates database tables.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, elements, paintings
from app.config import get_settings
from app.database import create_tables, run_migrations


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Painting Element Detection")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    create_tables()
    run_migrations()

    image_dir = Path(settings.image_dir)
    image_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/images", StaticFiles(directory=image_dir), name="images")

    app.include_router(auth.router)
    app.include_router(paintings.router)
    app.include_router(elements.router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
