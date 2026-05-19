from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.security import create_token, decode_token, verify_and_upgrade_password
from app.models import User
from app.schemas.common import LoginIn, RefreshTokenIn, TenantOut, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
_login_attempts: dict[str, int] = defaultdict(int)


def serialize_user(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        full_name=user.full_name,
        roles=[role.name for role in user.roles],
    )


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    key = f"{request.client.host if request.client else 'unknown'}:{payload.email.lower()}"
    if _login_attempts[key] >= 10:
        raise HTTPException(status_code=429, detail="Muitas tentativas de login. Aguarde alguns minutos.")
    user = db.scalar(select(User).where(User.email == payload.email.lower(), User.is_active.is_(True)))
    password_valid = False
    upgraded_hash: str | None = None
    if user:
        password_valid, upgraded_hash = verify_and_upgrade_password(payload.password, user.password_hash)
    if not user or not password_valid:
        _login_attempts[key] += 1
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas")
    _login_attempts.pop(key, None)
    settings = get_settings()
    user.last_login_at = datetime.now(timezone.utc)
    if upgraded_hash:
        user.password_hash = upgraded_hash
    db.commit()
    access = create_token(str(user.id), "access", minutes=settings.access_token_expire_minutes, extra={"tenant_id": str(user.tenant_id) if user.tenant_id else None})
    refresh = create_token(str(user.id), "refresh", days=settings.refresh_token_expire_days)
    return TokenOut(access_token=access, refresh_token=refresh, user=serialize_user(user), tenant=TenantOut.model_validate(user.tenant) if user.tenant else None)


@router.post("/refresh", response_model=TokenOut)
def refresh_session(payload: RefreshTokenIn, db: Session = Depends(get_db)):
    try:
        token_payload = decode_token(payload.refresh_token, refresh=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalido") from exc
    if token_payload.get("type") != "refresh" or not token_payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalido")

    user = db.scalar(select(User).where(User.id == token_payload["sub"], User.is_active.is_(True)))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inativo ou inexistente")

    settings = get_settings()
    access = create_token(str(user.id), "access", minutes=settings.access_token_expire_minutes, extra={"tenant_id": str(user.tenant_id) if user.tenant_id else None})
    refresh = create_token(str(user.id), "refresh", days=settings.refresh_token_expire_days)
    return TokenOut(access_token=access, refresh_token=refresh, user=serialize_user(user), tenant=TenantOut.model_validate(user.tenant) if user.tenant else None)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return serialize_user(user)
