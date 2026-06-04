"""SQLAlchemy engine, session factory and declarative base.

Centralizes database wiring so models and repositories depend on a single source
of truth for the engine and session lifecycle.
"""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
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


# Columns added to ``detected_elements`` after the table first shipped. ``create_all``
# only creates missing *tables*, never new columns, and this project has no migration
# framework — so we add them idempotently here. (column name -> SQLite column DDL)
_DETECTED_ELEMENT_NEW_COLUMNS: dict[str, str] = {
    "source": "VARCHAR(16) DEFAULT 'llm'",
    "is_deleted": "BOOLEAN DEFAULT 0",
    "position": "INTEGER DEFAULT 0",
    "original_name": "VARCHAR(255)",
    "original_description": "TEXT",
    "original_category": "VARCHAR(64)",
    "original_subcategory": "VARCHAR(128)",
    "original_specific_type": "VARCHAR(128)",
    "original_position": "INTEGER",
    "original_top_left_x": "FLOAT",
    "original_top_left_y": "FLOAT",
    "original_bottom_right_x": "FLOAT",
    "original_bottom_right_y": "FLOAT",
}


def run_migrations() -> None:
    """Idempotently add new ``detected_elements`` columns and backfill existing rows.

    Safe to call on every startup: missing columns are added once, and the backfill
    only touches rows whose snapshot/position have not been populated yet.
    """

    inspector = inspect(engine)
    if "detected_elements" not in inspector.get_table_names():
        return  # Fresh DB: create_all already built the full schema.

    existing = {col["name"] for col in inspector.get_columns("detected_elements")}
    missing = {
        name: ddl
        for name, ddl in _DETECTED_ELEMENT_NEW_COLUMNS.items()
        if name not in existing
    }
    if not missing:
        return

    with engine.begin() as conn:
        for name, ddl in missing.items():
            conn.execute(
                text(f"ALTER TABLE detected_elements ADD COLUMN {name} {ddl}")
            )

        # Backfill: per painting, number elements in id order and snapshot every field
        # into its ``original_*`` column so existing detections are fully revertible.
        rows = conn.execute(
            text(
                "SELECT id, painting_id, name, description, category, subcategory, "
                "specific_type, top_left_x, top_left_y, bottom_right_x, bottom_right_y "
                "FROM detected_elements ORDER BY painting_id, id"
            )
        ).fetchall()

        position_by_painting: dict[int, int] = {}
        for row in rows:
            pos = position_by_painting.get(row.painting_id, 0) + 1
            position_by_painting[row.painting_id] = pos
            conn.execute(
                text(
                    "UPDATE detected_elements SET "
                    "source = COALESCE(source, 'llm'), "
                    "is_deleted = COALESCE(is_deleted, 0), "
                    "position = :pos, "
                    "original_name = :name, "
                    "original_description = :description, "
                    "original_category = :category, "
                    "original_subcategory = :subcategory, "
                    "original_specific_type = :specific_type, "
                    "original_position = :pos, "
                    "original_top_left_x = :tlx, "
                    "original_top_left_y = :tly, "
                    "original_bottom_right_x = :brx, "
                    "original_bottom_right_y = :bry "
                    "WHERE id = :id"
                ),
                {
                    "pos": pos,
                    "name": row.name,
                    "description": row.description,
                    "category": row.category,
                    "subcategory": row.subcategory,
                    "specific_type": row.specific_type,
                    "tlx": row.top_left_x,
                    "tly": row.top_left_y,
                    "brx": row.bottom_right_x,
                    "bry": row.bottom_right_y,
                    "id": row.id,
                },
            )


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
