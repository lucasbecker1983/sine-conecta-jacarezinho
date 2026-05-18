from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import RoleName, require_roles
from app.models import Tenant, User
from app.schemas.common import TenantOut
from app.utils.tenant import get_active_tenant_by_domain

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/current", response_model=TenantOut)
def current_tenant(request: Request, db: Session = Depends(get_db)):
    tenant = get_active_tenant_by_domain(db, request.headers.get("host", "sine.jacarezinho.cloud"))
    if not tenant:
        tenant = db.query(Tenant).filter(Tenant.slug == "jacarezinho").first()
    return tenant


@router.get("", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _: User = Depends(require_roles(RoleName.super_admin))):
    return db.query(Tenant).order_by(Tenant.created_at.desc()).all()
