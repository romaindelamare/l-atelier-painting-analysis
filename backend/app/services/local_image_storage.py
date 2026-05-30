"""Filesystem-backed implementation of :class:`ImageStorage`."""

import uuid
from pathlib import Path

from app.interfaces.image_storage import ImageStorage


class LocalImageStorage(ImageStorage):
    """Stores images as UUID-named files inside a configured directory."""

    def __init__(self, image_dir: str) -> None:
        self._dir = Path(image_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, original_filename: str) -> str:
        suffix = Path(original_filename).suffix.lower() or ".png"
        stored_name = f"{uuid.uuid4().hex}{suffix}"
        (self._dir / stored_name).write_bytes(data)
        return stored_name

    def path_for(self, stored_name: str) -> Path:
        return self._dir / stored_name
