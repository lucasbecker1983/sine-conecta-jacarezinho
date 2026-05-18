from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AuditLog, DataAccessLog


def audit(db: Session, tenant_id: UUID | None, user_id: UUID | None, action: str, entity_type: str | None = None, entity_id: UUID | None = None, details: dict | None = None, ip_address: str | None = None) -> None:
    db.add(AuditLog(tenant_id=tenant_id, user_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, details=details, ip_address=ip_address))


def log_resume_access(db: Session, tenant_id: UUID, user_id: UUID | None, worker_id: UUID | None, resume_id: UUID | None, action: str, reason: str, ip_address: str | None) -> None:
    db.add(DataAccessLog(tenant_id=tenant_id, accessed_by_user_id=user_id, worker_id=worker_id, resume_id=resume_id, action=action, reason=reason, ip_address=ip_address))
