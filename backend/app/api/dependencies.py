"""Dependency-injection wiring.

Provider functions assemble concrete implementations behind the abstract
interfaces and hand them to the routes via FastAPI's ``Depends``. Tests override
these providers to inject fakes.
"""

from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.interfaces.image_storage import ImageStorage
from app.interfaces.element_detector import ElementDetector
from app.interfaces.palette_extractor import PaletteExtractor
from app.repositories.painting_repository import PaintingRepository
from app.services.interfaze_detector import InterfazeElementDetector
from app.services.local_image_storage import LocalImageStorage
from app.services.painting_service import PaintingService
from app.services.pillow_palette import PillowPaletteExtractor


@lru_cache
def get_image_storage() -> ImageStorage:
    return LocalImageStorage(get_settings().image_dir)


@lru_cache
def get_element_detector() -> ElementDetector:
    settings = get_settings()
    return InterfazeElementDetector(
        api_key=settings.interfaze_api_key,
        base_url=settings.interfaze_base_url,
        model=settings.interfaze_model,
    )


@lru_cache
def get_palette_extractor() -> PaletteExtractor:
    return PillowPaletteExtractor(get_settings().palette_size)


def get_painting_repository(db: Session = Depends(get_db)) -> PaintingRepository:
    return PaintingRepository(db)


def get_painting_service(
    storage: ImageStorage = Depends(get_image_storage),
    detector: ElementDetector = Depends(get_element_detector),
    palette_extractor: PaletteExtractor = Depends(get_palette_extractor),
    repository: PaintingRepository = Depends(get_painting_repository),
) -> PaintingService:
    return PaintingService(
        storage=storage,
        detector=detector,
        palette_extractor=palette_extractor,
        repository=repository,
    )


# Re-exported for convenience in route signatures / overrides.
__all__ = [
    "Settings",
    "get_image_storage",
    "get_element_detector",
    "get_palette_extractor",
    "get_painting_repository",
    "get_painting_service",
]
