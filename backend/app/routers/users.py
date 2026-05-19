import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions, require_roles, RoleName
from app.core.security import hash_password
from app.models import Role, User
from app.routers import crud
from app.schemas.common import CompanyOut, SineCollaboratorIn, SineCollaboratorOut, SineCollaboratorPatchIn, TemporaryPasswordOut, WorkerOut
from app.services.audit import audit


router = APIRouter(prefix="/users", tags=["users"])
SINE_MANAGED_ROLES = {"sine_staff", "sine_manager", "tenant_admin"}

registry_router = APIRouter(tags=["sine-registries"])
registry_router.add_api_route("/companies", crud.list_companies, methods=["GET"], response_model=list[CompanyOut], dependencies=[Depends(require_permissions("companies:manage"))])
registry_router.add_api_route("/companies", crud.create_company, methods=["POST"], response_model=CompanyOut, dependencies=[Depends(require_permissions("companies:manage"))])
registry_router.add_api_route("/companies/{company_id}/portal-user", crud.create_company_portal_user, methods=["POST"], dependencies=[Depends(require_permissions("companies:manage"))])
registry_router.add_api_route("/workers", crud.list_workers, methods=["GET"], response_model=list[WorkerOut], dependencies=[Depends(require_permissions("workers:manage"))])
registry_router.add_api_route("/workers", crud.create_worker, methods=["POST"], response_model=WorkerOut, dependencies=[Depends(require_permissions("workers:manage"))])


def collaborator_out(user: User) -> SineCollaboratorOut:
    return SineCollaboratorOut(id=user.id, tenant_id=user.tenant_id, email=user.email, full_name=user.full_name, roles=[role.name for role in user.roles], is_active=user.is_active, last_login_at=user.last_login_at)


def get_role(db: Session, role_name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if not role:
        raise HTTPException(status_code=500, detail="Perfil SINE nao configurado")
    return role


def require_manage_allowed(current: User, target_role: str) -> None:
    names = crud.role_names(current)
    if "super_admin" in names or "tenant_admin" in names:
        return
    if "sine_manager" in names and target_role == "sine_staff":
        return
    raise HTTPException(status_code=403, detail="Perfil nao autorizado para gerir este colaborador")


@router.get("/sine-collaborators", response_model=list[SineCollaboratorOut], dependencies=[Depends(require_roles(RoleName.tenant_admin, RoleName.sine_manager))])
def list_sine_collaborators(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = crud.tenant_scope(user, db)
    rows = db.scalars(select(User).where(User.tenant_id == tenant_id).order_by(User.full_name.asc())).all()
    return [collaborator_out(item) for item in rows if crud.role_names(item).intersection(SINE_MANAGED_ROLES)]


@router.post("/sine-collaborators", response_model=TemporaryPasswordOut, dependencies=[Depends(require_roles(RoleName.tenant_admin, RoleName.sine_manager))])
def create_sine_collaborator(payload: SineCollaboratorIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_manage_allowed(user, payload.role)
    tenant_id = crud.tenant_scope(user, db)
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado")
    role = get_role(db, payload.role)
    password = secrets.token_urlsafe(12)
    collaborator = User(tenant_id=tenant_id, email=email, full_name=payload.full_name, password_hash=hash_password(password), is_active=payload.is_active)
    collaborator.roles = [role]
    db.add(collaborator)
    db.flush()
    audit(db, tenant_id, user.id, "sine_collaborator.create", "User", collaborator.id, {"role": payload.role}, request.client.host if request.client else None)
    db.commit()
    return TemporaryPasswordOut(user_id=collaborator.id, temporary_password=password)


@router.patch("/sine-collaborators/{user_id}", response_model=SineCollaboratorOut, dependencies=[Depends(require_roles(RoleName.tenant_admin, RoleName.sine_manager))])
def update_sine_collaborator(user_id: UUID, payload: SineCollaboratorPatchIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = crud.tenant_scope(user, db)
    collaborator = db.get(User, user_id)
    if not collaborator or collaborator.tenant_id != tenant_id or not crud.role_names(collaborator).intersection(SINE_MANAGED_ROLES):
        raise HTTPException(status_code=404, detail="Colaborador nao encontrado")
    target_role = payload.role or next(iter(crud.role_names(collaborator).intersection(SINE_MANAGED_ROLES)))
    require_manage_allowed(user, target_role)
    if payload.full_name is not None:
        collaborator.full_name = payload.full_name
    if payload.is_active is not None:
        collaborator.is_active = payload.is_active
    if payload.role is not None:
        collaborator.roles = [get_role(db, payload.role)]
    audit(db, tenant_id, user.id, "sine_collaborator.update", "User", collaborator.id, payload.model_dump(exclude_none=True), request.client.host if request.client else None)
    db.commit()
    db.refresh(collaborator)
    return collaborator_out(collaborator)


@router.post("/sine-collaborators/{user_id}/reset-password", response_model=TemporaryPasswordOut, dependencies=[Depends(require_roles(RoleName.tenant_admin, RoleName.sine_manager))])
def reset_sine_collaborator_password(user_id: UUID, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = crud.tenant_scope(user, db)
    collaborator = db.get(User, user_id)
    if not collaborator or collaborator.tenant_id != tenant_id or not crud.role_names(collaborator).intersection(SINE_MANAGED_ROLES):
        raise HTTPException(status_code=404, detail="Colaborador nao encontrado")
    target_role = next(iter(crud.role_names(collaborator).intersection(SINE_MANAGED_ROLES)))
    require_manage_allowed(user, target_role)
    password = secrets.token_urlsafe(12)
    collaborator.password_hash = hash_password(password)
    audit(db, tenant_id, user.id, "sine_collaborator.password.reset", "User", collaborator.id, {}, request.client.host if request.client else None)
    db.commit()
    return TemporaryPasswordOut(user_id=collaborator.id, temporary_password=password)
