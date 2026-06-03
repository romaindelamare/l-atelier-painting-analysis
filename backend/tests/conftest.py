"""Shared test fixtures.

Environment variables are set BEFORE importing the application so that the cached
settings (and the module-level SQLAlchemy engine) point at throwaway locations.
"""

import io
import os
import tempfile
from pathlib import Path

import pytest

# --- Isolate config before any app import --------------------------------------
_TMP = Path(tempfile.mkdtemp(prefix="pod_tests_"))
os.environ["DB_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["IMAGE_DIR"] = str(_TMP / "images")
os.environ["INTERFAZE_API_KEY"] = "test-key"
os.environ["AUTH_PASSWORD"] = "test-pass"
os.environ["AUTH_JWT_SECRET"] = "test-secret"

from PIL import Image  # noqa: E402

from app.interfaces.image_storage import ImageStorage  # noqa: E402
from app.interfaces.element_detector import ElementDetector  # noqa: E402
from app.schemas.detection import DetectedElementOut  # noqa: E402


def make_png(color: tuple[int, int, int] = (180, 40, 40), size=(64, 48)) -> bytes:
    """Return PNG bytes of a solid-color image (deterministic for tests)."""
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


class FakeStorage(ImageStorage):
    """In-memory storage that records what it was given."""

    def __init__(self) -> None:
        self.saved: dict[str, bytes] = {}

    def save(self, data: bytes, original_filename: str) -> str:
        name = f"stored_{original_filename}"
        self.saved[name] = data
        return name

    def path_for(self, stored_name: str):
        return Path(stored_name)


class FakeDetector(ElementDetector):
    """Returns a fixed element list without any network call."""

    def __init__(self, elements: list[DetectedElementOut] | None = None) -> None:
        self.elements = elements or [
            DetectedElementOut(
                name="apple",
                description="a red apple",
                category="object",
                subcategory="fruit",
                specific_type="apple",
                top_left_x=1,
                top_left_y=2,
                bottom_right_x=10,
                bottom_right_y=12,
            )
        ]
        self.calls = 0

    def detect(self, image_bytes: bytes, content_type: str) -> list[DetectedElementOut]:
        self.calls += 1
        return self.elements


@pytest.fixture
def png_bytes() -> bytes:
    return make_png()
