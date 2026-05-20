from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    DataAccessLog,
    Job,
    LGPDRetentionPolicy,
    LGPDRetentionReview,
    Referral,
    Resume,
    User,
    Worker,
)
from app.services.audit import audit


ENTITY_MODEL = {
    "worker": Worker,
    "resume": Resume,
    "referral": Referral,
    "audit_log": AuditLog,
    "data_access_log": DataAccessLog,
    "job": Job,
}


def run_retention_review(db: Session, tenant_id: UUID, actor: User) -> int:
    created = 0
    policies = db.scalars(
        select(LGPDRetentionPolicy).where(
            LGPDRetentionPolicy.tenant_id == tenant_id,
            LGPDRetentionPolicy.is_active.is_(True),
        )
    ).all()
    for policy in policies:
        model = ENTITY_MODEL.get(policy.entity_type)
        if not model:
            continue
        rows = db.scalars(select(model).where(model.tenant_id == tenant_id).limit(50)).all()
        for row in rows:
            exists = db.scalar(
                select(LGPDRetentionReview).where(
                    LGPDRetentionReview.tenant_id == tenant_id,
                    LGPDRetentionReview.entity_type == policy.entity_type,
                    LGPDRetentionReview.entity_id == row.id,
                    LGPDRetentionReview.policy_id == policy.id,
                    LGPDRetentionReview.status == "pendente",
                )
            )
            if exists:
                continue
            db.add(
                LGPDRetentionReview(
                    tenant_id=tenant_id,
                    entity_type=policy.entity_type,
                    entity_id=row.id,
                    policy_id=policy.id,
                    status="pendente",
                    reason=f"Revisao gerada pela politica de {policy.retention_days} dias.",
                )
            )
            created += 1
    audit(db, tenant_id, actor.id, "lgpd.retention.review_run", "LGPDRetentionReview", None, {"created": created})
    return created


def resolve_review(db: Session, review: LGPDRetentionReview, actor: User, status: str, reason: str | None) -> LGPDRetentionReview:
    review.status = status
    review.reason = reason
    review.reviewed_by_user_id = actor.id
    review.reviewed_at = datetime.now(timezone.utc)
    audit(
        db,
        review.tenant_id,
        actor.id,
        "lgpd.retention.review_resolved",
        "LGPDRetentionReview",
        review.id,
        {"status": status, "reason": reason},
    )
    return review
