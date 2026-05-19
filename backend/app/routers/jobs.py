from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions
from app.models import Company, CompanyMessageThread, Job, User
from app.routers import crud
from app.schemas.common import (
    CandidateResumeDetailOut,
    JobCandidateOut,
    JobOut,
    ReferCandidatesIn,
    ReferCandidatesOut,
)
from app.services.audit import audit
from app.services.job_triage_service import (
    get_candidate_resume_detail,
    list_job_candidates,
)
from app.services.referral_service import refer_candidates


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
        if payload.status == "correcao_solicitada" and payload.notes:
            thread = CompanyMessageThread(
                tenant_id=tenant_id,
                company_id=company.id,
                job_id=job.id,
                created_by_user_id=user.id,
                topic="correcao_vaga",
                subject=f"Correção solicitada: {job.title}",
                status="aberta",
                priority="alta",
                last_message_at=datetime.now(timezone.utc),
                sine_last_read_at=datetime.now(timezone.utc),
            )
            db.add(thread)
            db.flush()
            crud.add_thread_message(
                db,
                thread,
                user,
                "sine",
                payload.notes,
                message_type="correcao_vaga",
                details={"job_id": str(job.id), "status": payload.status},
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


@router.get(
    "/jobs/{job_id}/candidates",
    response_model=list[JobCandidateOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def job_candidates(
    job_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    candidates = list_job_candidates(
        db, tenant_id, job_id, user, request.client.host if request.client else None
    )
    db.commit()
    return candidates


@router.get(
    "/jobs/{job_id}/candidates/{worker_id}/resume",
    response_model=CandidateResumeDetailOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def job_candidate_resume(
    job_id: UUID,
    worker_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    detail = get_candidate_resume_detail(
        db,
        tenant_id,
        job_id,
        worker_id,
        user,
        request.client.host if request.client else None,
    )
    db.commit()
    return detail


@router.post(
    "/jobs/{job_id}/refer-candidates",
    response_model=ReferCandidatesOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def refer_job_candidates(
    job_id: UUID,
    payload: ReferCandidatesIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    return refer_candidates(
        db,
        tenant_id,
        job_id,
        payload,
        user,
        request.client.host if request.client else None,
    )
