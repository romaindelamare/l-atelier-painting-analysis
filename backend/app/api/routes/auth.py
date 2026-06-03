"""Authentication endpoints for the single owner account.

Login exchanges the configured password for a short-lived access token plus a
long-lived, server-tracked refresh token. The refresh token rotates on every
use (reuse of an old one is rejected), and can be revoked individually
(``/logout``) or all at once (``/logout-all``).
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_refresh_token_repository, require_auth
from app.config import get_settings
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse
from app.security import (
    auth_configured,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expiry,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _issue_tokens(repo: RefreshTokenRepository) -> TokenResponse:
    """Mint a new access token and a freshly stored refresh token."""

    raw_refresh = generate_refresh_token()
    repo.create(token_hash=hash_refresh_token(raw_refresh), expires_at=refresh_expiry())
    settings = get_settings()
    return TokenResponse(
        access_token=create_access_token(),
        refresh_token=raw_refresh,
        expires_in=settings.access_token_ttl_minutes * 60,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> TokenResponse:
    if not auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on the server.",
        )
    if not verify_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password."
        )
    return _issue_tokens(repo)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest,
    repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> TokenResponse:
    existing = repo.get_active_by_hash(hash_refresh_token(body.refresh_token))
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )
    # Rotate: the presented token is single-use.
    repo.revoke(existing)
    return _issue_tokens(repo)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    body: LogoutRequest,
    repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> None:
    existing = repo.get_active_by_hash(hash_refresh_token(body.refresh_token))
    if existing is not None:
        repo.revoke(existing)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all(
    _: None = Depends(require_auth),
    repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> None:
    repo.revoke_all()


@router.get("/me")
def me(_: None = Depends(require_auth)) -> dict[str, bool]:
    return {"ok": True}
