from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions
from app.models import Company, Job, User
from app.routers import crud
from app.schemas.common import JobOut
from app.services.audit import audit


router = APIRouter(tags=["jobs"])


class JobStatusIn(BaseModel):
    status: str = Field(
        pattern="^(em_analise|aprovada|publicada|correcao_solicitada|cancelada|encerrada)$"
    )
    notes: str | None = None


router.add_api_route(
    "/jobs",
    crud.list_jobs,
    methods=["GET"],
    response_model=list[JobOut],
    dependencies=[Depends(require_permissions("jobs:manage"))],
)
router.add_api_route(
    "/jobs",
    crud.create_job,
    methods=["POST"],
    response_model=JobOut,
    dependencies=[Depends(require_permissions("jobs:manage"))],
)


@router.patch(
    "/jobs/{job_id}/status",
    response_model=JobOut,
    dependencies=[Depends(require_permissions("jobs:manage"))],
)
def update_job_status(
    job_id: UUID,
    payload: JobStatusIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    job = db.get(Job, job_id)
    if not job or job.tenant_id != tenant_id or job.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Vaga nao encontrada")
    job.status = payload.status
    if payload.notes:
        job.notes = f"{job.notes or ''}\n[{datetime.now(timezone.utc).isoformat()}] {payload.notes}".strip()
    company = db.get(Company, job.company_id)
    if company:
        crud.notify_company_users(
            db,
            tenant_id,
            company.id,
            "Atualizacao da vaga",
            f"A vaga {job.title} mudou para {payload.status}.",
        )
    audit(
        db,
        tenant_id,
        user.id,
        "job.status.update",
        "Job",
        job.id,
        {"status": payload.status, "notes": payload.notes},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(job)
    return job
