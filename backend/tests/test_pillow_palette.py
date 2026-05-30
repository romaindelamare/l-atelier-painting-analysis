"""Tests for the non-LLM color palette extractor."""

from app.services.pillow_palette import PillowPaletteExtractor
from tests.conftest import make_png


def test_extracts_dominant_color_of_solid_image():
    extractor = PillowPaletteExtractor(palette_size=4)

    colors = extractor.extract(make_png(color=(200, 30, 60)))

    assert colors, "expected at least one color"
    top = colors[0]
    # Dominant color should be close to the solid fill and cover ~all pixels.
    assert top.proportion > 0.9
    assert abs(top.r - 200) <= 8
    assert abs(top.g - 30) <= 8
    assert abs(top.b - 60) <= 8
    assert top.hex.startswith("#") and len(top.hex) == 7


def test_proportions_sum_to_one():
    extractor = PillowPaletteExtractor(palette_size=6)

    colors = extractor.extract(make_png(color=(10, 120, 200)))

    assert abs(sum(c.proportion for c in colors) - 1.0) < 1e-6
    # Ordered by descending proportion.
    assert colors == sorted(colors, key=lambda c: c.proportion, reverse=True)
