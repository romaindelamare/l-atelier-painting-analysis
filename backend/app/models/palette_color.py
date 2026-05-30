"""A single dominant color extracted from a painting."""

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PaletteColor(Base):
    __tablename__ = "palette_colors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    painting_id: Mapped[int] = mapped_column(
        ForeignKey("paintings.id", ondelete="CASCADE")
    )

    hex: Mapped[str] = mapped_column(String(7))  # e.g. "#a1b2c3"
    r: Mapped[int] = mapped_column(Integer)
    g: Mapped[int] = mapped_column(Integer)
    b: Mapped[int] = mapped_column(Integer)
    proportion: Mapped[float] = mapped_column(Float)  # 0..1 share of pixels

    painting: Mapped["Painting"] = relationship(back_populates="palette")


from app.models.painting import Painting  # noqa: E402
