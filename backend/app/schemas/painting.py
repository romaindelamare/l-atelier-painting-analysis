"""Request/response schemas for the paintings API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaintingCreate(BaseModel):
    """Optional metadata supplied with an upload (the file arrives separately)."""

    title: str | None = None
    artist: str | None = None
    year: str | None = None
    notes: str | None = None


class PaintingUpdate(BaseModel):
    """Partial metadata update — only provided fields are written."""

    title: str | None = None
    artist: str | None = None
    year: str | None = None
    notes: str | None = None


class DetectedElementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float


class PaletteColorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hex: str
    r: int
    g: int
    b: int
    proportion: float


class PaintingSummary(BaseModel):
    """Lightweight shape for the gallery listing."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    artist: str | None
    year: str | None
    filename: str
    width: int
    height: int
    created_at: datetime
    element_count: int = 0


class PaintingDetail(BaseModel):
    """Full painting with its detected elements and color palette."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    artist: str | None
    year: str | None
    notes: str | None
    filename: str
    content_type: str
    width: int
    height: int
    created_at: datetime
    elements: list[DetectedElementRead]
    palette: list[PaletteColorRead]
