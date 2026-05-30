"""SQLAlchemy engine, session factory and declarative base.

Centralizes database wiring so models and repositories depend on a single source
of truth for the engine and session lifecycle.
"""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""


_settings = get_settings()


def _ensure_sqlite_dir(db_url: str) -> None:
    """Create the parent directory for a file-based SQLite database if needed."""

    prefix = "sqlite:///"
    if not db_url.startswith(prefix):
        return
    file_part = db_url[len(prefix) :]
    if file_part in ("", ":memory:"):
        return
    parent = Path(file_part).parent
    if parent and not parent.exists():
        parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_dir(_settings.db_url)

# ``check_same_thread`` is only needed for SQLite + multi-threaded servers.
_connect_args = (
    {"check_same_thread": False} if _settings.db_url.startswith("sqlite") else {}
)

engine = create_engine(_settings.db_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def create_tables() -> None:
    """Create all tables. Import models first so they register with ``Base``."""

    from app import models  # noqa: F401  (ensures models are imported)

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
