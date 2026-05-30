"""Abstraction for persisting and locating uploaded image files."""

from abc import ABC, abstractmethod
from pathlib import Path


class ImageStorage(ABC):
    @abstractmethod
    def save(self, data: bytes, original_filename: str) -> str:
        """Persist image bytes and return the stored (unique) filename."""
        raise NotImplementedError

    @abstractmethod
    def path_for(self, stored_name: str) -> Path:
        """Return the absolute path of a previously stored file."""
        raise NotImplementedError
