"""Authentication primitives: password check, access JWTs, refresh tokens.

Access tokens are stateless signed JWTs (fast to verify, short-lived). Refresh
tokens are opaque random strings whose hash is persisted, so they can be revoked
server-side. Keeping the two concerns here means routes and dependencies depend
on intent-revealing helpers rather than on ``jwt`` / ``secrets`` directly.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.config import get_settings

_ALGORITHM = "HS256"


def auth_configured() -> bool:
    """True only when both a password and a signing secret are set."""

    settings = get_settings()
    return bool(settings.auth_password) and bool(settings.auth_jwt_secret)


def verify_password(candidate: str) -> bool:
    """Constant-time comparison against the configured password."""

    if not auth_configured():
        return False
    return secrets.compare_digest(candidate, get_settings().auth_password)


def create_access_token() -> str:
    """Issue a signed access JWT that expires after the configured TTL."""

    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": "owner",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
    }
    return jwt.encode(payload, settings.auth_jwt_secret, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode/verify an access JWT, raising ``jwt.PyJWTError`` if invalid."""

    return jwt.decode(
        token, get_settings().auth_jwt_secret, algorithms=[_ALGORITHM]
    )


def generate_refresh_token() -> str:
    """Return a fresh opaque refresh token (kept only by the client)."""

    return secrets.token_urlsafe(32)


def hash_refresh_token(raw: str) -> str:
    """SHA-256 hex digest of a refresh token, as stored in the database."""

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def refresh_expiry() -> datetime:
    """Absolute expiry timestamp for a newly issued refresh token.

    Naive UTC so it compares cleanly with the values SQLite stores.
    """

    settings = get_settings()
    future = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_ttl_days)
    return future.replace(tzinfo=None)
