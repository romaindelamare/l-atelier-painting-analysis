"""Request/response schemas for the paintings API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.detection import Level1Category


class PaintingCreate(BaseModel):
    """Optional metadata supplied with an upload (the file arrives separately)."""

    title: str | None = None
    artist: str | None = None
    year: str | None = None
    notes: str | None = None
    location_owner: str | None = None
    location_city: str | None = None
    location_country: str | None = None


class PaintingUpdate(BaseModel):
    """Partial metadata update — only provided fields are written."""

    title: str | None = None
    artist: str | None = None
    year: str | None = None
    notes: str | None = None
    location_owner: str | None = None
    location_city: str | None = None
    location_country: str | None = None


class DetectedElementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    category: str
    subcategory: str | None
    specific_type: str | None
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float

    # Curation state + frozen original detection (so the UI can flag edited elements).
    source: str
    position: int
    original_name: str | None = None
    original_description: str | None = None
    original_category: str | None = None
    original_subcategory: str | None = None
    original_specific_type: str | None = None
    original_position: int | None = None
    original_top_left_x: float | None = None
    original_top_left_y: float | None = None
    original_bottom_right_x: float | None = None
    original_bottom_right_y: float | None = None


class ElementCreate(BaseModel):
    """A manually-added element: the curator picks a category and draws a box."""

    category: Level1Category = "other"
    subcategory: str | None = None
    specific_type: str | None = None
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float


class ElementUpdate(BaseModel):
    """Partial edit of an element. The bounding box is left untouched here."""

    category: Level1Category | None = None
    subcategory: str | None = None
    specific_type: str | None = None


class ElementBulkDelete(BaseModel):
    """Soft-delete several elements in one request."""

    ids: list[int]


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
    title: str | None
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
    title: str | None
    artist: str | None
    year: str | None
    notes: str | None
    location_owner: str | None
    location_city: str | None
    location_country: str | None
    filename: str
    content_type: str
    width: int
    height: int
    created_at: datetime
    elements: list[DetectedElementRead]
    palette: list[PaletteColorRead]
