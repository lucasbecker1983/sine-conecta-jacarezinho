from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DataAccessLog, Job, Referral, Resume, User, Worker
from app.routers import crud
from app.schemas.common import (
    CandidateResumeDetailOut,
    DataAccessLogOut,
    JobCandidateOut,
    ResumeOut,
    WorkerOut,
)
from app.services.audit import log_resume_access


TRIAGE_JOB_STATUSES = {
    "solicitada",
    "em_analise",
    "aprovada",
    "publicada",
    "em_triagem",
    "encaminhando_candidatos",
}


def get_job_for_triage(db: Session, tenant_id: UUID, job_id: UUID) -> Job:
    job = db.get(Job, job_id)
    if not job or job.tenant_id != tenant_id or job.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Vaga nao encontrada")
    return job


def list_job_candidates(
    db: Session,
    tenant_id: UUID,
    job_id: UUID,
    user: User,
    ip_address: str | None = None,
) -> list[JobCandidateOut]:
    job = get_job_for_triage(db, tenant_id, job_id)
    rows = db.execute(
        select(Referral, Worker, Resume)
        .join(Worker, Worker.id == Referral.worker_id)
        .outerjoin(Resume, Resume.id == Referral.resume_id)
        .where(Referral.tenant_id == tenant_id, Referral.job_id == job.id)
        .order_by(Referral.created_at.desc())
    ).all()
    candidates: list[JobCandidateOut] = []
    for referral, worker, resume in rows:
        selected_resume = resume or db.scalar(
            select(Resume)
            .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
            .order_by(Resume.created_at.desc())
        )
        if selected_resume:
            log_resume_access(
                db,
                tenant_id,
                user.id,
                worker.id,
                selected_resume.id,
                "view_resume_for_triage",
                "triagem_vaga",
                ip_address,
            )
        analysis = (
            referral.ai_analysis_json
            or (selected_resume.analysis if selected_resume else None)
            or {}
        )
        candidates.append(
            JobCandidateOut(
                worker_id=worker.id,
                worker_name=worker.full_name,
                worker_email=worker.email,
                worker_phone=worker.phone,
                worker_whatsapp=worker.whatsapp,
                resume_id=selected_resume.id if selected_resume else None,
                resume_filename=(
                    selected_resume.original_filename if selected_resume else None
                ),
                application_status=referral.status,
                referral_id=referral.id,
                created_at=referral.created_at,
                has_lgpd_consent=worker.lgpd_accepted,
                city=worker.city,
                education=worker.education_level,
                desired_role=worker.desired_role,
                ai_summary=analysis.get("summary"),
                match_score=referral.match_score,
                match_explanation=referral.match_explanation,
            )
        )
    return candidates


def get_candidate_resume_detail(
    db: Session,
    tenant_id: UUID,
    job_id: UUID,
    worker_id: UUID,
    user: User,
    ip_address: str | None = None,
) -> CandidateResumeDetailOut:
    get_job_for_triage(db, tenant_id, job_id)
    worker = db.get(Worker, worker_id)
    if not worker or worker.tenant_id != tenant_id or worker.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Candidato nao encontrado")
    referral = db.scalar(
        select(Referral)
        .where(
            Referral.tenant_id == tenant_id,
            Referral.job_id == job_id,
            Referral.worker_id == worker.id,
        )
        .order_by(Referral.created_at.desc())
    )
    resume = (
        db.get(Resume, referral.resume_id) if referral and referral.resume_id else None
    )
    if not resume:
        resume = db.scalar(
            select(Resume)
            .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
            .order_by(Resume.created_at.desc())
        )
    if resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id,
            resume.id,
            "view_resume_for_triage",
            "triagem_vaga",
            ip_address,
        )
    referral_rows = db.scalars(
        select(Referral)
        .where(Referral.tenant_id == tenant_id, Referral.worker_id == worker.id)
        .order_by(Referral.created_at.desc())
        .limit(20)
    ).all()
    access_logs = db.execute(
        select(DataAccessLog, User, Worker, Resume)
        .outerjoin(User, User.id == DataAccessLog.accessed_by_user_id)
        .outerjoin(Worker, Worker.id == DataAccessLog.worker_id)
        .outerjoin(Resume, Resume.id == DataAccessLog.resume_id)
        .where(
            DataAccessLog.tenant_id == tenant_id, DataAccessLog.worker_id == worker.id
        )
        .order_by(DataAccessLog.created_at.desc())
        .limit(20)
    ).all()
    return CandidateResumeDetailOut(
        worker=WorkerOut.model_validate(worker),
        resume=ResumeOut.model_validate(resume) if resume else None,
        extracted_text=resume.extracted_text if resume else None,
        applications=[
            {
                "id": str(item.id),
                "job_id": str(item.job_id),
                "status": item.status,
                "created_at": item.created_at,
            }
            for item in referral_rows
            if item.status == "candidatura_trabalhador"
        ],
        referrals=[
            {
                "id": str(item.id),
                "job_id": str(item.job_id),
                "status": item.status,
                "match_score": item.match_score,
                "created_at": item.created_at,
            }
            for item in referral_rows
        ],
        access_logs=[
            DataAccessLogOut(
                id=log.id,
                accessed_by_user_id=log.accessed_by_user_id,
                accessed_by_name=accessed_by.full_name if accessed_by else None,
                worker_id=log.worker_id,
                worker_name=log_worker.full_name if log_worker else None,
                resume_id=log.resume_id,
                resume_filename=log_resume.original_filename if log_resume else None,
                action=log.action,
                reason=log.reason,
                ip_address=log.ip_address,
                created_at=log.created_at,
            )
            for log, accessed_by, log_worker, log_resume in access_logs
        ],
    )
