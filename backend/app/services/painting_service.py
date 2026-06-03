"""Use case orchestration: turn an uploaded image into a stored, analysed painting.

This service coordinates the collaborators (storage, detector, palette extractor,
repository) but contains no provider-specific or persistence-specific detail of
its own — each collaborator is an injected abstraction.
"""

import io
from PIL import Image

from app.interfaces.image_storage import ImageStorage
from app.interfaces.element_detector import ElementDetector
from app.interfaces.palette_extractor import PaletteExtractor
from app.models.detected_element import DetectedElement
from app.models.painting import Painting
from app.models.palette_color import PaletteColor
from app.repositories.painting_repository import PaintingRepository
from app.schemas.painting import PaintingCreate


class PaintingService:
    def __init__(
        self,
        *,
        storage: ImageStorage,
        detector: ElementDetector,
        palette_extractor: PaletteExtractor,
        repository: PaintingRepository,
    ) -> None:
        self._storage = storage
        self._detector = detector
        self._palette = palette_extractor
        self._repository = repository

    def analyze_and_store(
        self,
        *,
        data: bytes,
        original_filename: str,
        content_type: str,
        meta: PaintingCreate,
    ) -> Painting:
        width, height = self._dimensions(data)

        # Detect first: if detection fails we avoid leaving an orphaned image file.
        detected = self._detector.detect(data, content_type)
        colors = self._palette.extract(data)
        stored_name = self._storage.save(data, original_filename)

        painting = Painting(
            title=meta.title or None,
            artist=meta.artist,
            year=meta.year,
            notes=meta.notes,
            location_owner=meta.location_owner,
            location_city=meta.location_city,
            location_country=meta.location_country,
            filename=stored_name,
            content_type=content_type or "image/png",
            width=width,
            height=height,
        )

        elements = [
            DetectedElement(
                name=e.name,
                description=e.description,
                category=e.category,
                subcategory=e.subcategory,
                specific_type=e.specific_type,
                top_left_x=e.top_left_x,
                top_left_y=e.top_left_y,
                bottom_right_x=e.bottom_right_x,
                bottom_right_y=e.bottom_right_y,
            )
            for e in detected
        ]
        palette = [
            PaletteColor(
                hex=c.hex, r=c.r, g=c.g, b=c.b, proportion=c.proportion
            )
            for c in colors
        ]

        return self._repository.create(
            painting=painting, elements=elements, palette=palette
        )

    @staticmethod
    def _dimensions(data: bytes) -> tuple[int, int]:
        with Image.open(io.BytesIO(data)) as image:
            return image.width, image.height
