"""Application configuration loaded from environment variables.

A single ``Settings`` object is the only place that reads the environment, so the
rest of the code depends on typed configuration rather than ``os.environ`` lookups.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings sourced from the environment / ``.env`` file."""

    interfaze_api_key: str = ""
    interfaze_base_url: str = "https://api.interfaze.ai/v1"
    interfaze_model: str = "interfaze-beta"

    image_dir: str = "./data/images"
    db_url: str = "sqlite:///./data/paintings.db"

    palette_size: int = 6

    # Single-user authentication. ``auth_password`` is the login password and
    # ``auth_jwt_secret`` signs the short-lived access tokens. Leaving either
    # empty disables login (no valid credentials can be issued).
    auth_password: str = ""
    auth_jwt_secret: str = ""
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance (one read of the environment)."""

    return Settings()
