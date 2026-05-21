from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models import Job, Referral, Resume, User
from app.routers import crud
from app.schemas.common import ResumeOut, WorkerOut, WorkerPortalJobOut
from app.services.audit import audit, log_resume_access


router = APIRouter(tags=["worker-portal"])


class WorkerJobApplyIn(BaseModel):
    resume_id: UUID | None = None
    confirm_lgpd: bool = False


router.add_api_route(
    "/worker-portal/profile",
    crud.worker_profile,
    methods=["GET"],
    response_model=WorkerOut | None,
)
router.add_api_route(
    "/worker-portal/profile",
    crud.save_worker_profile,
    methods=["PUT"],
    response_model=WorkerOut,
)
router.add_api_route(
    "/worker-portal/open-jobs",
    crud.worker_open_jobs,
    methods=["GET"],
    response_model=list[WorkerPortalJobOut],
)
router.add_api_route(
    "/worker-portal/resumes",
    crud.worker_resumes,
    methods=["GET"],
    response_model=list[ResumeOut],
)
router.add_api_route(
    "/worker-portal/resume-pdf",
    crud.worker_upload_resume_pdf,
    methods=["POST"],
    response_model=ResumeOut,
)
router.add_api_route(
    "/worker-portal/apply/{job_id}", crud.worker_apply, methods=["POST"]
)


@router.post("/worker-portal/jobs/{job_id}/apply")
def worker_apply_to_job(
    job_id: UUID,
    payload: WorkerJobApplyIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    crud.require_worker_user(user)
    tenant_id = crud.tenant_scope(user, db)
    worker = crud.current_worker(db, user)
    if not worker:
        raise HTTPException(
            status_code=400,
            detail="Complete seu cadastro antes de concorrer a uma vaga",
        )
    if not payload.confirm_lgpd or not worker.lgpd_accepted:
        raise HTTPException(
            status_code=400,
            detail="Confirme a LGPD para enviar sua candidatura ao SINE",
        )
    job = crud.get_worker_open_job(db, tenant_id, job_id)
    resume = db.get(Resume, payload.resume_id) if payload.resume_id else None
    if resume and (resume.tenant_id != tenant_id or resume.worker_id != worker.id):
        raise HTTPException(status_code=404, detail="Curriculo nao encontrado")
    if not resume:
        resume = db.scalar(
            select(Resume)
            .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
            .order_by(Resume.created_at.desc())
        )
    existing = db.scalar(
        select(Referral).where(
            Referral.tenant_id == tenant_id,
            Referral.job_id == job.id,
            Referral.worker_id == worker.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Voce ja se candidatou a esta vaga",
        )
    referral = existing or Referral(
        tenant_id=tenant_id,
        job_id=job.id,
        worker_id=worker.id,
        referred_by_user_id=user.id,
        status="candidatura_trabalhador",
    )
    referral.resume_id = resume.id if resume else referral.resume_id
    referral.notes = "Candidatura direta pelo Portal Público de Vagas"
    db.add(referral)
    db.flush()
    if resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id,
            resume.id,
            "worker_apply_with_resume",
            "candidatura_vaga_publica",
            request.client.host if request.client else None,
        )
    crud.notify_sine(
        db,
        tenant_id,
        "Nova candidatura do portal publico",
        f"{worker.full_name} confirmou candidatura para a vaga {job.title}.",
    )
    audit(
        db,
        tenant_id,
        user.id,
        "worker.public_job.apply",
        "Referral",
        referral.id,
        {
            "job_id": str(job.id),
            "worker_id": str(worker.id),
            "resume_id": str(resume.id) if resume else None,
        },
        request.client.host if request.client else None,
    )
    db.commit()
    return {
        "status": "applied",
        "referral_id": str(referral.id),
        "message": "Sua candidatura foi enviada ao SINE. A equipe fará a triagem e, se houver compatibilidade, poderá encaminhar seu perfil à empresa.",
    }


router.add_api_route(
    "/worker-portal/applications", crud.worker_applications, methods=["GET"]
)
