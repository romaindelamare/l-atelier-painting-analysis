"""Abstraction for extracting a color palette from an image (no LLM involved)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class ExtractedColor:
    """A dominant color and its share (0..1) of the analysed pixels."""

    hex: str
    r: int
    g: int
    b: int
    proportion: float


class PaletteExtractor(ABC):
    @abstractmethod
    def extract(self, image_bytes: bytes) -> list[ExtractedColor]:
        """Return the dominant colors ordered by descending proportion."""
        raise NotImplementedError
