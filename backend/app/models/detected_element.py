"""A single element detected within a painting, with its bounding box."""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DetectedElement(Base):
    __tablename__ = "detected_elements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    painting_id: Mapped[int] = mapped_column(
        ForeignKey("paintings.id", ondelete="CASCADE")
    )

    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Three-level taxonomy. ``category`` (level 1) is constrained to a fixed set; the
    # finer levels are null when the model could not identify them confidently.
    category: Mapped[str] = mapped_column(String(64), default="other")
    subcategory: Mapped[str | None] = mapped_column(String(128), nullable=True)
    specific_type: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Bounding box in image-pixel coordinates.
    top_left_x: Mapped[float] = mapped_column(Float)
    top_left_y: Mapped[float] = mapped_column(Float)
    bottom_right_x: Mapped[float] = mapped_column(Float)
    bottom_right_y: Mapped[float] = mapped_column(Float)

    # Curation state. ``source`` distinguishes the original LLM detection from elements
    # a curator added by hand; ``is_deleted`` is a soft-delete flag (rows are hidden,
    # never removed, so the original detection always survives); ``position`` is the
    # display number / sort order.
    source: Mapped[str] = mapped_column(String(16), default="llm")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)

    # Frozen snapshot of the original LLM detection — every field needed to fully revert
    # the painting back to what the model produced. Null for manually-added elements.
    original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    original_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    original_subcategory: Mapped[str | None] = mapped_column(String(128), nullable=True)
    original_specific_type: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    original_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    original_top_left_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_top_left_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_bottom_right_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_bottom_right_y: Mapped[float | None] = mapped_column(Float, nullable=True)

    painting: Mapped["Painting"] = relationship(back_populates="elements")


from app.models.painting import Painting  # noqa: E402
