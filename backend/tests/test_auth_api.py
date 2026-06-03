"""Tests for the authentication flow and the write-endpoint guard."""

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_element_detector, get_image_storage
from app.main import app
from tests.conftest import FakeDetector, FakeStorage, make_png

PASSWORD = "test-pass"


@pytest.fixture
def client():
    app.dependency_overrides[get_image_storage] = lambda: FakeStorage()
    app.dependency_overrides[get_element_detector] = lambda: FakeDetector()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _login(client: TestClient, password: str = PASSWORD):
    return client.post("/api/auth/login", json={"password": password})


def _upload(client: TestClient, token: str | None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post(
        "/api/paintings",
        files={"file": ("x.png", make_png(), "image/png")},
        headers=headers,
    )


def test_login_wrong_password_rejected(client):
    assert _login(client, "nope").status_code == 401


def test_login_right_password_returns_tokens(client):
    res = _login(client)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["expires_in"] > 0


def test_write_requires_auth(client):
    # No bearer token → rejected.
    assert _upload(client, None).status_code == 401
    # Garbage token → rejected.
    assert _upload(client, "not-a-jwt").status_code == 401
    # Valid token → accepted.
    token = _login(client).json()["access_token"]
    assert _upload(client, token).status_code == 201


def test_reads_stay_public(client):
    assert client.get("/api/paintings").status_code == 200


def test_refresh_rotates_and_old_token_is_rejected(client):
    refresh = _login(client).json()["refresh_token"]

    first = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert first.status_code == 200, first.text
    new_refresh = first.json()["refresh_token"]
    assert new_refresh != refresh

    # The original refresh token is now single-use spent.
    reused = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert reused.status_code == 401
    # The rotated token still works.
    assert client.post(
        "/api/auth/refresh", json={"refresh_token": new_refresh}
    ).status_code == 200


def test_logout_revokes_single_token(client):
    refresh = _login(client).json()["refresh_token"]
    assert client.post("/api/auth/logout", json={"refresh_token": refresh}).status_code == 204
    assert client.post("/api/auth/refresh", json={"refresh_token": refresh}).status_code == 401


def test_logout_all_revokes_outstanding_tokens(client):
    tokens = _login(client).json()
    access, refresh = tokens["access_token"], tokens["refresh_token"]

    res = client.post(
        "/api/auth/logout-all", headers={"Authorization": f"Bearer {access}"}
    )
    assert res.status_code == 204
    # The outstanding refresh token no longer works.
    assert client.post("/api/auth/refresh", json={"refresh_token": refresh}).status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401
    token = _login(client).json()["access_token"]
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    ).status_code == 200
