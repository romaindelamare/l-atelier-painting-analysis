"""A single element detected within a painting, with its bounding box."""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
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

    painting: Mapped["Painting"] = relationship(back_populates="elements")


from app.models.painting import Painting  # noqa: E402
