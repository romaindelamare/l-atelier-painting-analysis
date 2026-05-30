"""Tests for PaintingService orchestration using fakes (no network, no real disk)."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.repositories.painting_repository import PaintingRepository
from app.schemas.painting import PaintingCreate
from app.services.painting_service import PaintingService
from app.services.pillow_palette import PillowPaletteExtractor
from tests.conftest import FakeDetector, FakeStorage, make_png


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    db = factory()
    try:
        yield db
    finally:
        db.close()


def build_service(session) -> tuple[PaintingService, FakeStorage, FakeDetector]:
    storage = FakeStorage()
    detector = FakeDetector()
    service = PaintingService(
        storage=storage,
        detector=detector,
        palette_extractor=PillowPaletteExtractor(palette_size=4),
        repository=PaintingRepository(session),
    )
    return service, storage, detector


def test_analyze_and_store_persists_everything(session):
    service, storage, detector = build_service(session)

    painting = service.analyze_and_store(
        data=make_png(),
        original_filename="mona.png",
        content_type="image/png",
        meta=PaintingCreate(title="Mona", artist="Da Vinci"),
    )

    assert painting.id is not None
    assert painting.title == "Mona"
    assert painting.artist == "Da Vinci"
    assert painting.width == 64 and painting.height == 48
    assert detector.calls == 1
    assert storage.saved  # file was stored
    assert len(painting.elements) == 1
    assert painting.elements[0].name == "apple"
    assert painting.palette  # palette extracted


def test_title_falls_back_to_filename_stem(session):
    service, _, _ = build_service(session)

    painting = service.analyze_and_store(
        data=make_png(),
        original_filename="sunflowers.jpg",
        content_type="image/jpeg",
        meta=PaintingCreate(),
    )

    assert painting.title == "sunflowers"
