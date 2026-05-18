from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Tenant, User


def user_tenant_id(user: User):
    if user.tenant_id is None and "super_admin" not in {role.name for role in user.roles}:
        raise HTTPException(status_code=403, detail="Usuario sem tenant")
    return user.tenant_id


def get_active_tenant_by_domain(db: Session, host: str) -> Tenant | None:
    domain = host.split(":")[0].lower()
    return db.query(Tenant).filter(Tenant.domain == domain, Tenant.is_active.is_(True)).first()
