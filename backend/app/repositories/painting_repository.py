"""Data-access layer for paintings.

All SQLAlchemy queries live here so services depend on intent-revealing methods
rather than on the ORM session directly.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.detected_element import DetectedElement
from app.models.painting import Painting
from app.models.palette_color import PaletteColor
from app.schemas.painting import PaintingUpdate


class PaintingRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        painting: Painting,
        elements: list[DetectedElement],
        palette: list[PaletteColor],
    ) -> Painting:
        painting.elements = elements
        painting.palette = palette
        self._db.add(painting)
        self._db.commit()
        self._db.refresh(painting)
        return painting

    def list_all(self) -> list[Painting]:
        stmt = (
            select(Painting)
            .options(selectinload(Painting.elements))
            .order_by(Painting.created_at.desc())
        )
        return list(self._db.scalars(stmt).all())

    def get(self, painting_id: int) -> Painting | None:
        stmt = (
            select(Painting)
            .where(Painting.id == painting_id)
            .options(
                selectinload(Painting.elements),
                selectinload(Painting.palette),
            )
        )
        return self._db.scalars(stmt).first()

    def update(self, painting_id: int, data: PaintingUpdate) -> Painting | None:
        painting = self.get(painting_id)
        if painting is None:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(painting, field, value)
        self._db.commit()
        self._db.refresh(painting)
        return painting
