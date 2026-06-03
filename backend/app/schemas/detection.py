"""Schemas describing the elements the detector returns.

Detection now uses Interfaze AI's ``<task>object_detection</task>`` mode, which returns
free-text labels. The detector packs a three-level taxonomy into each label
(``category | subcategory | specific_type``) and parses it into ``DetectedElementOut``.
"""

from typing import Literal

from pydantic import BaseModel, Field

# Level 1 — small, very broad buckets. Always present (``other`` is the catch-all).
Level1Category = Literal[
    "human",
    "animal",
    "plant",
    "nature",
    "structure",
    "vehicle",
    "object",
    "other",
]


class DetectedElementOut(BaseModel):
    """One element located in the painting, with its three-level taxonomy and bbox."""

    name: str = Field(..., description="human-readable name of the element depicted")
    description: str | None = Field(
        None, description="brief note about the element as it appears in the painting"
    )

    # Three-level taxonomy. Level 1 is constrained; levels 2/3 are free text or null.
    category: Level1Category = Field(
        "other", description="level 1 — broad bucket the element belongs to"
    )
    subcategory: str | None = Field(
        None, description="level 2 — finer grouping, e.g. bird, flower, building"
    )
    specific_type: str | None = Field(
        None, description="level 3 — most specific identification, e.g. parrot, oak"
    )

    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float
