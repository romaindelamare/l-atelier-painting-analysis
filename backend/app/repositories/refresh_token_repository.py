"""Data-access layer for refresh tokens.

All queries against ``RefreshToken`` live here so the auth routes depend on
intent-revealing methods rather than on the ORM session directly.
"""

from datetime import datetime, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, *, token_hash: str, expires_at: datetime) -> RefreshToken:
        token = RefreshToken(token_hash=token_hash, expires_at=expires_at)
        self._db.add(token)
        self._db.commit()
        self._db.refresh(token)
        return token

    def get_active_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Return a non-revoked, non-expired token matching the hash, if any."""

        now = _utcnow_naive()
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
        return self._db.scalars(stmt).first()

    def revoke(self, token: RefreshToken) -> None:
        token.revoked = True
        self._db.commit()

    def revoke_all(self) -> int:
        """Revoke every outstanding token. Returns the number affected."""

        result = self._db.execute(
            update(RefreshToken)
            .where(RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        self._db.commit()
        return result.rowcount or 0

    def delete_expired(self) -> None:
        now = _utcnow_naive()
        self._db.execute(delete(RefreshToken).where(RefreshToken.expires_at <= now))
        self._db.commit()


def _utcnow_naive() -> datetime:
    """Naive UTC ``datetime`` for comparison with SQLite-stored timestamps."""

    return datetime.now(timezone.utc).replace(tzinfo=None)
