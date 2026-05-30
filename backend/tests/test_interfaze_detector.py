"""The Interfaze detector must fail with a clear, catchable error when unconfigured.

This guards against the regression where a missing API key produced an opaque 500
during dependency injection instead of a meaningful response.
"""

import pytest

from app.interfaces.element_detector import DetectionError
from app.services.interfaze_detector import InterfazeElementDetector
from tests.conftest import make_png


def test_missing_api_key_raises_detection_error():
    detector = InterfazeElementDetector(api_key="", base_url="x", model="m")

    with pytest.raises(DetectionError, match="INTERFAZE_API_KEY"):
        detector.detect(make_png(), "image/png")


def test_constructor_does_not_raise_without_key():
    # Construction must be safe even with no key (clients are created lazily).
    InterfazeElementDetector(api_key="", base_url="x", model="m")
