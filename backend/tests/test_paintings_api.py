"""End-to-end API tests using TestClient with fakes injected via overrides."""

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_image_storage, get_element_detector
from app.main import app
from tests.conftest import FakeDetector, FakeStorage, make_png


@pytest.fixture
def client():
    storage = FakeStorage()
    detector = FakeDetector()
    app.dependency_overrides[get_image_storage] = lambda: storage
    app.dependency_overrides[get_element_detector] = lambda: detector
    try:
        test_client = TestClient(app)
        # Writes are now auth-guarded; log in once and keep the bearer token on
        # the client so these tests exercise the happy (authenticated) path.
        tokens = test_client.post("/api/auth/login", json={"password": "test-pass"})
        access = tokens.json()["access_token"]
        test_client.headers.update({"Authorization": f"Bearer {access}"})
        yield test_client
    finally:
        app.dependency_overrides.clear()


def test_upload_then_list_then_detail(client):
    # Upload
    response = client.post(
        "/api/paintings",
        files={"file": ("starry.png", make_png(), "image/png")},
        data={"title": "Starry Night", "artist": "Van Gogh"},
    )
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["title"] == "Starry Night"
    assert created["elements"][0]["name"] == "apple"
    assert created["palette"], "palette should be populated"
    painting_id = created["id"]

    # List
    listing = client.get("/api/paintings").json()
    assert any(p["id"] == painting_id for p in listing)
    summary = next(p for p in listing if p["id"] == painting_id)
    assert summary["element_count"] == 1

    # Detail
    detail = client.get(f"/api/paintings/{painting_id}").json()
    assert detail["id"] == painting_id
    assert detail["width"] == 64 and detail["height"] == 48


def test_rejects_non_image(client):
    response = client.post(
        "/api/paintings",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 415


def test_missing_painting_returns_404(client):
    assert client.get("/api/paintings/999999").status_code == 404
