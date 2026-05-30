"""Abstraction for detecting elements in a painting.

The orchestration layer depends on this interface, not on any specific provider,
so the Interfaze implementation can be swapped (or faked in tests) freely.
"""

from abc import ABC, abstractmethod

from app.schemas.detection import DetectedElementOut


class DetectionError(RuntimeError):
    """Raised when element detection cannot be completed (e.g. missing key, API error)."""


class ElementDetector(ABC):
    @abstractmethod
    def detect(self, image_bytes: bytes, content_type: str) -> list[DetectedElementOut]:
        """Return the elements detected in the given image."""
        raise NotImplementedError
