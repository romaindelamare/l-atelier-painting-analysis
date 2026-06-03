"""Request/response shapes for the authentication endpoints."""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int  # access-token lifetime, in seconds
