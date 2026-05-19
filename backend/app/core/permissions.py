from enum import StrEnum

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RoleName(StrEnum):
    super_admin = "super_admin"
    tenant_admin = "tenant_admin"
    sine_manager = "sine_manager"
    sine_staff = "sine_staff"
    company_user = "company_user"
    worker = "worker"


ROLE_PERMISSIONS: dict[str, set[str]] = {
    "super_admin": {"*"},
    "tenant_admin": {"tenant:admin", "reports:view", "users:manage", "jobs:manage", "workers:manage", "companies:manage", "resumes:view", "referrals:manage"},
    "sine_manager": {"reports:view", "jobs:approve", "jobs:manage", "workers:manage", "companies:manage", "resumes:view", "referrals:manage"},
    "sine_staff": {"jobs:manage", "workers:manage", "companies:manage", "resumes:view", "referrals:manage"},
    "company_user": {"company:portal"},
    "worker": {"worker:portal", "resume:own"},
}

SINE_ROLES = {"tenant_admin", "sine_manager", "sine_staff"}
PORTAL_ROLES = {"company_user", "worker"}
SINE_PERMISSIONS = {"tenant:admin", "reports:view", "users:manage", "jobs:approve", "jobs:manage", "workers:manage", "companies:manage", "resumes:view", "referrals:manage"}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc
    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    user = db.scalar(select(User).where(User.id == payload["sub"], User.is_active.is_(True)))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inativo ou inexistente")
    return user


def require_permissions(*permissions: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        names = {role.name for role in user.roles}
        if "super_admin" in names:
            return user
        if names.intersection(PORTAL_ROLES) and set(permissions).intersection(SINE_PERMISSIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil de portal nao acessa area interna do SINE")
        granted = set().union(*(ROLE_PERMISSIONS.get(name, set()) for name in names))
        if not set(permissions).issubset(granted):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissao insuficiente")
        return user

    return dependency


def require_roles(*roles: RoleName):
    role_values = {role.value for role in roles}

    def dependency(user: User = Depends(get_current_user)) -> User:
        if "super_admin" in {role.name for role in user.roles}:
            return user
        if not {role.name for role in user.roles}.intersection(role_values):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil nao autorizado")
        return user

    return dependency
