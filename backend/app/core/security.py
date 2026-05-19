from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings


pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated=["bcrypt"],
    argon2__type="ID",
    argon2__memory_cost=19456,
    argon2__rounds=2,
    argon2__parallelism=1,
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def verify_and_upgrade_password(password: str, hashed_password: str) -> tuple[bool, str | None]:
    valid, upgraded_hash = pwd_context.verify_and_update(password, hashed_password)
    return bool(valid), upgraded_hash


def create_token(subject: str, token_type: str, minutes: int | None = None, days: int | None = None, extra: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires = now + (timedelta(days=days) if days else timedelta(minutes=minutes or settings.access_token_expire_minutes))
    payload: dict[str, Any] = {"sub": subject, "type": token_type, "iat": int(now.timestamp()), "exp": expires}
    if extra:
        payload.update(extra)
    secret = settings.refresh_secret if token_type == "refresh" else settings.jwt_secret
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, refresh: bool = False) -> dict[str, Any]:
    settings = get_settings()
    secret = settings.refresh_secret if refresh else settings.jwt_secret
    try:
        return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Token invalido") from exc
