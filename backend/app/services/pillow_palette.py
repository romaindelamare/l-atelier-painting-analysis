"""Color-palette extraction using Pillow's median-cut quantization.

This is a deterministic, non-LLM approach: it reduces the image to a small set of
representative colors and reports each color's share of the (downsampled) pixels.
"""

import io

from PIL import Image

from app.interfaces.palette_extractor import ExtractedColor, PaletteExtractor

# Downsample longest edge to this many pixels before quantizing (speed; the
# palette is unaffected at this resolution).
_MAX_EDGE = 256


class PillowPaletteExtractor(PaletteExtractor):
    def __init__(self, palette_size: int = 6) -> None:
        self._palette_size = max(1, palette_size)

    def extract(self, image_bytes: bytes) -> list[ExtractedColor]:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((_MAX_EDGE, _MAX_EDGE))

        quantized = image.quantize(
            colors=self._palette_size, method=Image.Quantize.MEDIANCUT
        )
        palette = quantized.getpalette() or []
        counts = quantized.getcolors() or []  # list of (pixel_count, palette_index)

        total = sum(count for count, _ in counts) or 1

        colors: list[ExtractedColor] = []
        for count, index in counts:
            r, g, b = palette[index * 3 : index * 3 + 3]
            colors.append(
                ExtractedColor(
                    hex=f"#{r:02x}{g:02x}{b:02x}",
                    r=r,
                    g=g,
                    b=b,
                    proportion=count / total,
                )
            )

        colors.sort(key=lambda c: c.proportion, reverse=True)
        return colors
