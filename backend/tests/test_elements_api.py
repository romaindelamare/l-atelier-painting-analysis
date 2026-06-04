"""End-to-end tests for the element-curation endpoints (create/edit/delete/etc)."""

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_element_detector, get_image_storage
from app.database import SessionLocal
from app.main import app
from app.models.detected_element import DetectedElement
from app.schemas.detection import DetectedElementOut
from tests.conftest import FakeDetector, FakeStorage, make_png

# Two LLM elements in two different categories, deliberately out of reading order so
# the renumber test has something to reorder.
_TWO_ELEMENTS = [
    DetectedElementOut(
        name="oak",
        description="a tree",
        category="plant",
        subcategory="tree",
        specific_type="oak",
        top_left_x=50,
        top_left_y=40,
        bottom_right_x=60,
        bottom_right_y=48,
    ),
    DetectedElementOut(
        name="woman",
        description="a figure",
        category="human",
        subcategory="figure",
        specific_type="woman",
        top_left_x=5,
        top_left_y=5,
        bottom_right_x=20,
        bottom_right_y=30,
    ),
]


@pytest.fixture
def client():
    storage = FakeStorage()
    detector = FakeDetector(elements=_TWO_ELEMENTS)
    app.dependency_overrides[get_image_storage] = lambda: storage
    app.dependency_overrides[get_element_detector] = lambda: detector
    try:
        test_client = TestClient(app)
        tokens = test_client.post("/api/auth/login", json={"password": "test-pass"})
        access = tokens.json()["access_token"]
        test_client.headers.update({"Authorization": f"Bearer {access}"})
        yield test_client
    finally:
        app.dependency_overrides.clear()


def _upload(client) -> dict:
    response = client.post(
        "/api/paintings",
        files={"file": ("p.png", make_png(), "image/png")},
        data={"title": "Test"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _element_named(detail: dict, name: str) -> dict:
    return next(e for e in detail["elements"] if e["name"] == name)


def test_create_manual_element(client):
    painting = _upload(client)
    pid = painting["id"]

    detail = client.post(
        f"/api/paintings/{pid}/elements",
        json={
            "category": "animal",
            "subcategory": "bird",
            "specific_type": "owl",
            "top_left_x": 1,
            "top_left_y": 1,
            "bottom_right_x": 9,
            "bottom_right_y": 9,
        },
    ).json()

    owl = _element_named(detail, "owl")  # name defaults to specific_type
    assert owl["source"] == "manual"
    assert owl["category"] == "animal"
    assert owl["original_name"] is None
    assert owl["original_category"] is None
    assert len(detail["elements"]) == 3


def test_edit_element_changes_category_keeps_snapshot(client):
    painting = _upload(client)
    pid = painting["id"]
    woman = _element_named(painting, "woman")

    detail = client.patch(
        f"/api/paintings/{pid}/elements/{woman['id']}",
        json={
            "category": "object",
            "name": "statue",
            "subcategory": "sculpture",
            "specific_type": "marble statue",
        },
    ).json()

    edited = next(e for e in detail["elements"] if e["id"] == woman["id"])
    assert edited["category"] == "object"
    assert edited["name"] == "statue"
    assert edited["specific_type"] == "marble statue"
    # The frozen original is untouched.
    assert edited["original_category"] == "human"
    assert edited["original_name"] == "woman"
    assert edited["original_specific_type"] == "woman"


def test_delete_is_soft_and_keeps_original_in_db(client):
    painting = _upload(client)
    pid = painting["id"]
    oak = _element_named(painting, "oak")

    detail = client.delete(f"/api/paintings/{pid}/elements/{oak['id']}").json()
    assert all(e["id"] != oak["id"] for e in detail["elements"])

    listing = client.get("/api/paintings").json()
    summary = next(p for p in listing if p["id"] == pid)
    assert summary["element_count"] == 1  # only the surviving element is counted

    # The row and its original snapshot still live in the database.
    session = SessionLocal()
    try:
        row = session.get(DetectedElement, oak["id"])
        assert row is not None
        assert row.is_deleted is True
        assert row.original_name == "oak"
        assert row.original_top_left_x == 50
    finally:
        session.close()


def test_bulk_delete(client):
    painting = _upload(client)
    pid = painting["id"]
    ids = [e["id"] for e in painting["elements"]]

    detail = client.post(
        f"/api/paintings/{pid}/elements/bulk-delete", json={"ids": ids}
    ).json()
    assert detail["elements"] == []


def test_renumber_orders_by_category_then_position(client):
    painting = _upload(client)
    pid = painting["id"]

    detail = client.post(f"/api/paintings/{pid}/elements/renumber").json()
    by_name = {e["name"]: e["position"] for e in detail["elements"]}
    # "human" (woman) ranks before "plant" (oak) in the level-1 order.
    assert by_name["woman"] == 1
    assert by_name["oak"] == 2


def test_revert_restores_llm_state_and_drops_manual(client):
    painting = _upload(client)
    pid = painting["id"]
    woman = _element_named(painting, "woman")

    # Edit one, add a manual one, delete the other.
    client.patch(
        f"/api/paintings/{pid}/elements/{woman['id']}",
        json={"category": "object", "name": "statue"},
    )
    client.post(
        f"/api/paintings/{pid}/elements",
        json={
            "category": "animal",
            "specific_type": "owl",
            "top_left_x": 1,
            "top_left_y": 1,
            "bottom_right_x": 5,
            "bottom_right_y": 5,
        },
    )
    oak = _element_named(painting, "oak")
    client.delete(f"/api/paintings/{pid}/elements/{oak['id']}")

    detail = client.post(f"/api/paintings/{pid}/elements/revert").json()

    names = sorted(e["name"] for e in detail["elements"])
    assert names == ["oak", "woman"]  # manual "owl" dropped, deleted "oak" restored
    restored = _element_named(detail, "woman")
    assert restored["category"] == "human"
    assert restored["name"] == "woman"


def test_element_endpoints_require_auth():
    storage = FakeStorage()
    detector = FakeDetector(elements=_TWO_ELEMENTS)
    app.dependency_overrides[get_image_storage] = lambda: storage
    app.dependency_overrides[get_element_detector] = lambda: detector
    try:
        # Authenticated client to create a painting to target.
        auth_client = TestClient(app)
        access = auth_client.post(
            "/api/auth/login", json={"password": "test-pass"}
        ).json()["access_token"]
        auth_client.headers.update({"Authorization": f"Bearer {access}"})
        pid = _upload(auth_client)["id"]

        anon = TestClient(app)
        assert anon.post(f"/api/paintings/{pid}/elements", json={
            "category": "animal", "top_left_x": 1, "top_left_y": 1,
            "bottom_right_x": 5, "bottom_right_y": 5,
        }).status_code == 401
        assert anon.post(f"/api/paintings/{pid}/elements/renumber").status_code == 401
        assert anon.post(f"/api/paintings/{pid}/elements/revert").status_code == 401
    finally:
        app.dependency_overrides.clear()
