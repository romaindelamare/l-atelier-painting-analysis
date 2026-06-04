"""Data-access layer for paintings.

All SQLAlchemy queries live here so services depend on intent-revealing methods
rather than on the ORM session directly.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.detected_element import DetectedElement
from app.models.painting import Painting
from app.models.palette_color import PaletteColor
from app.schemas.painting import ElementUpdate, PaintingUpdate

# Level-1 category display order, mirrored on the frontend. Drives the renumber sort.
_CATEGORY_ORDER = [
    "human",
    "animal",
    "plant",
    "nature",
    "structure",
    "vehicle",
    "object",
    "other",
]


def _category_rank(category: str) -> int:
    try:
        return _CATEGORY_ORDER.index(category)
    except ValueError:
        return len(_CATEGORY_ORDER)


# Text fields where an empty string from the edit form means "no value".
_NULLABLE_TEXT_FIELDS = {"subcategory", "specific_type"}


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

    def delete(self, painting_id: int) -> Painting | None:
        painting = self.get(painting_id)
        if painting is None:
            return None
        self._db.delete(painting)
        self._db.commit()
        return painting

    # --- Element-level curation -------------------------------------------------

    def get_element(self, element_id: int) -> DetectedElement | None:
        return self._db.get(DetectedElement, element_id)

    def add_element(
        self, painting_id: int, element: DetectedElement
    ) -> Painting | None:
        """Append a manually-added element and return the refreshed painting."""

        painting = self.get(painting_id)
        if painting is None:
            return None
        element.painting_id = painting_id
        element.source = "manual"
        element.position = self._next_position(painting_id)
        self._db.add(element)
        self._db.commit()
        return self.get(painting_id)

    def update_element(
        self, element_id: int, data: ElementUpdate
    ) -> DetectedElement | None:
        element = self.get_element(element_id)
        if element is None:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            if field in _NULLABLE_TEXT_FIELDS and value == "":
                value = None
            setattr(element, field, value)
        self._db.commit()
        self._db.refresh(element)
        return element

    def soft_delete_elements(self, painting_id: int, ids: list[int]) -> int:
        """Mark elements deleted without removing the rows. Returns the count hidden."""

        elements = self._db.scalars(
            select(DetectedElement).where(
                DetectedElement.painting_id == painting_id,
                DetectedElement.id.in_(ids),
            )
        ).all()
        for element in elements:
            element.is_deleted = True
        self._db.commit()
        return len(elements)

    def renumber(self, painting_id: int) -> Painting | None:
        """Assign positions to visible elements in display order.

        Sort mirrors the frontend ``buildGroups`` logic:
          1. Level-1 category rank (human → animal → … → other)
          2. Subcategory alphabetically; elements with no subcategory sink last
          3. Specific type, then name, alphabetically within the subcategory
        """

        painting = self.get(painting_id)
        if painting is None:
            return None
        visible = [e for e in painting.elements if not e.is_deleted]
        visible.sort(
            key=lambda e: (
                _category_rank(e.category),
                # Null subcategory sinks to bottom, matching the frontend
                (1, "") if e.subcategory is None else (0, e.subcategory.lower()),
                (e.specific_type or e.name or "").lower(),
            )
        )
        for index, element in enumerate(visible, start=1):
            element.position = index
        self._db.commit()
        return self.get(painting_id)

    def revert(self, painting_id: int) -> Painting | None:
        """Restore the painting to the original LLM detection.

        Every LLM element is reset from its frozen snapshot and un-deleted; every
        manually-added element is hidden (it was never part of the detection).
        Positions are then reassigned in display order (same as ``renumber``) so the
        badge numbers always match what the list shows after reverting.
        """

        painting = self.get(painting_id)
        if painting is None:
            return None
        for element in painting.elements:
            if element.source == "manual":
                element.is_deleted = True
                continue
            element.name = element.original_name or element.name
            element.description = element.original_description
            element.category = element.original_category or element.category
            element.subcategory = element.original_subcategory
            element.specific_type = element.original_specific_type
            if element.original_top_left_x is not None:
                element.top_left_x = element.original_top_left_x
                element.top_left_y = element.original_top_left_y
                element.bottom_right_x = element.original_bottom_right_x
                element.bottom_right_y = element.original_bottom_right_y
            if element.original_position is not None:
                element.position = element.original_position
            element.is_deleted = False
        self._db.commit()
        return self.get(painting_id)

    def replace_palette(
        self, painting_id: int, palette: list[PaletteColor]
    ) -> Painting | None:
        """Replace the stored palette for a painting with a freshly-extracted one."""

        painting = self.get(painting_id)
        if painting is None:
            return None
        for old in list(painting.palette):
            self._db.delete(old)
        self._db.flush()
        for color in palette:
            color.painting_id = painting_id
            self._db.add(color)
        self._db.commit()
        return self.get(painting_id)

    def _next_position(self, painting_id: int) -> int:
        positions = self._db.scalars(
            select(DetectedElement.position).where(
                DetectedElement.painting_id == painting_id,
                DetectedElement.is_deleted.is_(False),
            )
        ).all()
        return (max(positions) if positions else 0) + 1
