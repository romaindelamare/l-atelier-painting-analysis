"""Color-palette extraction using Pillow's fast-octree quantization.

This is a deterministic, non-LLM approach: it over-extracts a large candidate set
then selects the most visually distinct colors so that minority regions (e.g. a blue
sky in a warm-toned painting) are not swamped by near-duplicate dominant clusters.
"""

import io

from PIL import Image

from app.interfaces.palette_extractor import ExtractedColor, PaletteExtractor

# Downsample longest edge before quantizing — larger than the old 256 so that
# smaller but visually important regions contribute enough pixels.
_MAX_EDGE = 400

# Minimum RGB Euclidean distance for two colors to be considered distinct.
# sqrt(3 * 255²) ≈ 441 is the maximum possible distance; 40 ≈ 9 % of that range.
_DISTINCT_THRESHOLD = 40


class PillowPaletteExtractor(PaletteExtractor):
    def __init__(self, palette_size: int = 6) -> None:
        self._palette_size = max(1, palette_size)

    def extract(self, image_bytes: bytes) -> list[ExtractedColor]:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((_MAX_EDGE, _MAX_EDGE))

        # Over-extract: ask for 4× more candidate colors so that minor but
        # visually distinct regions (e.g. a blue sky among warm tones) are
        # represented before we down-select.
        n_candidates = min(self._palette_size * 4, 32)

        # FASTOCTREE divides the RGB cube into octants rather than splitting by
        # the widest range, which preserves saturated / distinct colors better
        # than MEDIANCUT for photographic paintings.  dither=0 keeps pixel
        # counts clean.
        quantized = image.quantize(
            colors=n_candidates, method=Image.Quantize.FASTOCTREE, dither=0
        )
        palette_raw = quantized.getpalette() or []
        counts = quantized.getcolors() or []  # list of (pixel_count, palette_index)

        total = sum(count for count, _ in counts) or 1

        candidates: list[ExtractedColor] = []
        for count, index in counts:
            r, g, b = palette_raw[index * 3 : index * 3 + 3]
            candidates.append(
                ExtractedColor(
                    hex=f"#{r:02x}{g:02x}{b:02x}",
                    r=r,
                    g=g,
                    b=b,
                    proportion=count / total,
                )
            )

        candidates.sort(key=lambda c: c.proportion, reverse=True)
        return self._select_distinct(candidates, self._palette_size)

    def _select_distinct(
        self, candidates: list[ExtractedColor], k: int
    ) -> list[ExtractedColor]:
        """Pick up to k colors that are visually distinct from each other.

        Iterates candidates in descending proportion order; a candidate is
        accepted only if it is at least _DISTINCT_THRESHOLD RGB-distance away
        from every already-selected color.  This prevents near-duplicate warm
        shades from consuming all palette slots.
        """
        selected: list[ExtractedColor] = []
        for color in candidates:
            if all(_rgb_distance(color, s) >= _DISTINCT_THRESHOLD for s in selected):
                selected.append(color)
            if len(selected) >= k:
                break

        # Re-normalise proportions so they still sum to 1.
        total = sum(c.proportion for c in selected) or 1.0
        return [
            ExtractedColor(
                hex=c.hex,
                r=c.r,
                g=c.g,
                b=c.b,
                proportion=c.proportion / total,
            )
            for c in selected
        ]


def _rgb_distance(a: ExtractedColor, b: ExtractedColor) -> float:
    return ((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) ** 0.5
