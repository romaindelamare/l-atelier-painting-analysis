"""The ``Painting`` aggregate root: an uploaded image plus its analysis."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Painting(Base):
    __tablename__ = "paintings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # User-provided metadata (all optional).
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    artist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    year: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Current whereabouts of the work — each field is independently optional.
    location_owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    location_country: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Stored file + dimensions (used to scale the bounding-box overlay).
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(64))
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    elements: Mapped[list["DetectedElement"]] = relationship(
        back_populates="painting",
        cascade="all, delete-orphan",
        order_by="DetectedElement.id",
    )
    palette: Mapped[list["PaletteColor"]] = relationship(
        back_populates="painting",
        cascade="all, delete-orphan",
        order_by="PaletteColor.proportion.desc()",
    )


# Imported for type-checking of the relationship annotations above.
from app.models.detected_element import DetectedElement  # noqa: E402
from app.models.palette_color import PaletteColor  # noqa: E402
