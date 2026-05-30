"""Element detector backed by Interfaze AI (OpenAI-compatible API).

Specialized for paintings: the prompt frames the model as an art curator and asks
for every depicted element with bounding-box coordinates.
"""

import base64
import json

from openai import OpenAI

from app.interfaces.element_detector import DetectionError, ElementDetector
from app.schemas.detection import DetectedElementOut, DetectionSchema

_SYSTEM_PROMPT = (
    "You are an expert art curator and computer-vision system specialized in "
    "analyzing paintings. You examine a painting and identify every distinct "
    "figure, person, animal, plant, building and notable element depicted "
    "in the artwork. You always return precise bounding-box coordinates in the "
    "pixel space of the provided image."
)

_USER_PROMPT = (
    "Detect and locate every distinct element depicted in this painting. For each "
    "element give a short name, an optional brief description of how it appears, and "
    "its bounding box (top-left and bottom-right corners) in image pixel "
    "coordinates. Include figures, animals, plants, objects and architectural "
    "elements. Do not invent elements that are not visible."
)


class InterfazeElementDetector(ElementDetector):
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        # Configuration is stored but the client is created lazily, so an
        # unconfigured key produces a clear error at call time (not at startup
        # or during dependency injection).
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
                        "name": "detection_schema",
                        "schema": DetectionSchema.model_json_schema(),
                    },
                },
            )
            raw = response.choices[0].message.content or "{}"
            parsed = DetectionSchema.model_validate(json.loads(raw))
        except DetectionError:
            raise
        except Exception as exc:  # noqa: BLE001 — surface as a clean domain error
            raise DetectionError(f"Element detection failed: {exc}") from exc

        return parsed.elements

    @staticmethod
    def _to_data_uri(image_bytes: bytes, content_type: str) -> str:
        mime = content_type or "image/png"
        encoded = base64.b64encode(image_bytes).decode("ascii")
        return f"data:{mime};base64,{encoded}"
