from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, Worker
from app.services.audit import audit
from app.services.lgpd_service import add_request_event


def anonymize_worker(
    db: Session,
    tenant_id: UUID,
    worker_id: UUID,
    request_id: UUID,
    actor: User,
    justification: str,
) -> Worker:
    worker = db.get(Worker, worker_id)
    if not worker or worker.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    now = datetime.now(timezone.utc)
    worker.full_name = "Titular anonimizado"
    worker.email = None
    worker.phone = None
    worker.whatsapp = None
    worker.address = None
    worker.district = None
    worker.cpf = f"anon-{str(worker.id)[:8]}"
    worker.notes = "Registro anonimizado por solicitacao LGPD; historico operacional preservado."
    worker.is_anonymized = True
    worker.anonymized_at = now
    worker.processing_blocked = True
    worker.processing_blocked_at = now
    add_request_event(
        db,
        tenant_id,
        request_id,
        "anonymization_applied",
        actor.id,
        message=justification,
        metadata={"worker_id": str(worker.id)},
    )
    audit(
        db,
        tenant_id,
        actor.id,
        "lgpd.worker.anonymized",
        "Worker",
        worker.id,
        {"request_id": str(request_id), "justification": justification},
    )
    return worker


def block_worker_processing(
    db: Session,
    tenant_id: UUID,
    worker_id: UUID,
    request_id: UUID,
    actor: User,
    justification: str,
) -> Worker:
    worker = db.get(Worker, worker_id)
    if not worker or worker.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    worker.processing_blocked = True
    worker.processing_blocked_at = datetime.now(timezone.utc)
    add_request_event(
        db,
        tenant_id,
        request_id,
        "status_changed",
        actor.id,
        message=justification,
        metadata={"action": "block_processing", "worker_id": str(worker.id)},
    )
    audit(
        db,
        tenant_id,
        actor.id,
        "lgpd.worker.processing_blocked",
        "Worker",
        worker.id,
        {"request_id": str(request_id), "justification": justification},
    )
    return worker
