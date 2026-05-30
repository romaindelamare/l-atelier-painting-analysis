"""ORM models package. Importing it registers every model with ``Base``."""

from app.models.detected_element import DetectedElement
from app.models.painting import Painting
from app.models.palette_color import PaletteColor

__all__ = ["Painting", "DetectedElement", "PaletteColor"]
