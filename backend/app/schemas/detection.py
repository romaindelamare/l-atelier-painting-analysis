"""Schemas describing the structured output we request from Interfaze AI.

These mirror the element-detection skill's schema. ``DetectionSchema`` is passed to
the model via ``response_format`` and used to parse the response.
"""

from pydantic import BaseModel, Field


class DetectedElementOut(BaseModel):
    """One element located in the painting, with a pixel-space bounding box."""

    name: str = Field(..., description="short name of the element depicted")
    description: str | None = Field(
        None, description="brief note about the element as it appears in the painting"
    )
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float


class DetectionSchema(BaseModel):
    """Top-level structured-output schema sent to the model."""

    elements: list[DetectedElementOut] = Field(
        ..., description="every distinct figure, animal, plant, object or notable element in the painting"
    )
