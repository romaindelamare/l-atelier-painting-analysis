"""Element detector backed by Interfaze AI (OpenAI-compatible API).

Uses a custom ``json_schema`` response format so the model returns the three-level
taxonomy (category / subcategory / specific_type) and pixel bounding box directly as
structured fields — no label-separator tricks, no post-parsing ambiguity.
"""

import base64
import json

from openai import OpenAI

from app.interfaces.element_detector import DetectionError, ElementDetector
from app.schemas.detection import DetectedElementOut

_LEVEL1_VALUES: set[str] = {
    "human",
    "animal",
    "plant",
    "nature",
    "structure",
    "vehicle",
    "object",
    "other",
}

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are an expert art curator and computer-vision analyst. "
    "Your task is to detect and locate every distinct, individually recognisable "
    "element depicted in a painting and return them as structured JSON."
)

_USER_PROMPT = (
    "Analyse the painting and return every distinct element you can see.\n\n"
    "For each element fill in the following fields:\n"
    "  • name         — short human-readable label (e.g. 'red rose', 'old man')\n"
    "  • category     — EXACTLY one of: human | animal | plant | nature | structure | vehicle | object | other\n"
    "      human     : people, figures, faces, portraits\n"
    "      animal    : any creature\n"
    "      plant     : vegetation of any kind (trees, flowers, grass clumps, wreaths…)\n"
    "      nature    : only DISCRETE identifiable natural features — lake, river, waterfall,\n"
    "                  mountain, volcano, sun, moon, stars, rainbow, a distinct isolated cloud\n"
    "      structure : buildings, architecture, bridges, walls, fences, the built environment\n"
    "      vehicle   : boats, ships, carriages, carts, any means of transport\n"
    "      object    : any other man-made thing — furniture, tools, clothing, food, vessels,\n"
    "                  musical instruments, books, inscriptions, decorative objects\n"
    "      other     : only when none of the above fit\n"
    "  • subcategory  — finer grouping within the category (e.g. 'bird', 'flower', 'building');\n"
    "                   null when you are not confident\n"
    "  • specific_type — most specific identification (e.g. 'parrot', 'rose', 'church');\n"
    "                   null when you are not confident — NEVER hallucinate\n"
    "  • top_left_x, top_left_y, bottom_right_x, bottom_right_y\n"
    "                 — bounding box in PIXELS from the top-left corner of the image\n\n"
    "Rules:\n"
    "  - Do NOT detect generic background/ambient nature: plain sky, open sea, generic "
    "ground or terrain. Only emit a 'nature' entry for a discrete, named feature.\n"
    "  - Set subcategory / specific_type to null rather than guessing.\n"
    "  - Every visible, distinct element should have its own entry.\n\n"
    "Few-shot examples of correct outputs:\n"
    "  { name:'woman', category:'human', subcategory:'woman', specific_type:null }\n"
    "  { name:'parrot', category:'animal', subcategory:'bird', specific_type:'parrot' }\n"
    "  { name:'rose', category:'plant', subcategory:'flower', specific_type:'rose' }\n"
    "  { name:'waterfall', category:'nature', subcategory:'waterfall', specific_type:null }\n"
    "  { name:'church', category:'structure', subcategory:'building', specific_type:'church' }\n"
    "  { name:'sailboat', category:'vehicle', subcategory:'boat', specific_type:'sailboat' }\n"
    "  { name:'guitar', category:'object', subcategory:'instrument', specific_type:'guitar' }\n"
)

# ---------------------------------------------------------------------------
# JSON Schema for the response
# ---------------------------------------------------------------------------

_DETECTION_SCHEMA = {
    "type": "object",
    "properties": {
        "detected_objects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "category": {
                        "type": "string",
                        "enum": sorted(_LEVEL1_VALUES),
                    },
                    "subcategory": {
                        "anyOf": [{"type": "string"}, {"type": "null"}]
                    },
                    "specific_type": {
                        "anyOf": [{"type": "string"}, {"type": "null"}]
                    },
                    "top_left_x": {"type": "number"},
                    "top_left_y": {"type": "number"},
                    "bottom_right_x": {"type": "number"},
                    "bottom_right_y": {"type": "number"},
                },
                "required": [
                    "name",
                    "category",
                    "subcategory",
                    "specific_type",
                    "top_left_x",
                    "top_left_y",
                    "bottom_right_x",
                    "bottom_right_y",
                ],
            },
        }
    },
    "required": ["detected_objects"],
}


# ---------------------------------------------------------------------------
# Detector
# ---------------------------------------------------------------------------


class InterfazeElementDetector(ElementDetector):
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if not self._api_key:
            raise DetectionError(
                "INTERFAZE_API_KEY is not set. Add it to backend/.env to enable "
                "element detection."
            )
        if self._client is None:
            self._client = OpenAI(base_url=self._base_url, api_key=self._api_key)
        return self._client

    def detect(self, image_bytes: bytes, content_type: str) -> list[DetectedElementOut]:
        client = self._get_client()
        data_uri = self._to_data_uri(image_bytes, content_type)

        try:
            response = client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": _USER_PROMPT},
                            {"type": "image_url", "image_url": {"url": data_uri}},
                        ],
                    },
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "painting_detections",
                        "schema": _DETECTION_SCHEMA,
                    },
                },
            )
            raw = response.choices[0].message.content or "{}"
            payload = json.loads(raw)
        except DetectionError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise DetectionError(f"Element detection failed: {exc}") from exc

        return self._parse_detections(payload)

    # --- parsing -----------------------------------------------------------

    @classmethod
    def _parse_detections(cls, payload: object) -> list[DetectedElementOut]:
        items = cls._locate_items(payload)
        elements: list[DetectedElementOut] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            try:
                x1 = float(item["top_left_x"])
                y1 = float(item["top_left_y"])
                x2 = float(item["bottom_right_x"])
                y2 = float(item["bottom_right_y"])
            except (KeyError, TypeError, ValueError):
                continue

            raw_cat = str(item.get("category") or "").strip().lower()
            category: str = raw_cat if raw_cat in _LEVEL1_VALUES else "other"

            def clean(v: object) -> str | None:
                s = str(v).strip() if v is not None else ""
                return None if not s or s.lower() == "null" else s

            subcategory = clean(item.get("subcategory"))
            specific_type = clean(item.get("specific_type"))
            name = str(item.get("name") or "").strip() or specific_type or subcategory or category

            elements.append(
                DetectedElementOut(
                    name=name,
                    description=None,
                    category=category,  # type: ignore[arg-type]
                    subcategory=subcategory,
                    specific_type=specific_type,
                    top_left_x=x1,
                    top_left_y=y1,
                    bottom_right_x=x2,
                    bottom_right_y=y2,
                )
            )
        return elements

    @staticmethod
    def _locate_items(payload: object) -> list:
        """Find the detection list wherever the model placed it."""
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            for key in ("detected_objects", "objects", "elements", "detections"):
                value = payload.get(key)
                if isinstance(value, list):
                    return value
        return []

    @staticmethod
    def _to_data_uri(image_bytes: bytes, content_type: str) -> str:
        mime = content_type or "image/png"
        encoded = base64.b64encode(image_bytes).decode("ascii")
        return f"data:{mime};base64,{encoded}"
