from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    Job,
    Referral,
    Resume,
    ResumeBankAISuggestion,
    ResumeBankEntry,
    User,
    Worker,
)
from app.schemas.common import (
    ReferCandidateIn,
    ReferCandidatesIn,
    ResumeBankAISuggestionRead,
    ResumeBankEntryCreate,
    ResumeBankEntryListItem,
    ResumeBankEntryRead,
    ResumeBankEntryUpdate,
    ResumeBankMatchResult,
    ResumeBankMoveRequest,
    ResumeOut,
    WorkerOut,
)
from app.services.audit import audit, log_resume_access
from app.services.matching_service import analyze_candidate
from app.services.referral_service import refer_candidates


ACTIVE_ENTRY_STATUSES = {"ativo", "em_analise", "sugerido_para_vaga", "encaminhado"}
ARCHIVED_ENTRY_STATUSES = {"arquivado", "pausado", "desatualizado", "contratado"}


def mask_cpf(cpf: str | None) -> str | None:
    if not cpf:
        return None
    digits = "".join(char for char in cpf if char.isdigit())
    if len(digits) < 5:
        return "***"
    return f"***.{digits[3:6]}.{digits[6:9]}-**"


def latest_resume(db: Session, tenant_id: UUID, worker_id: UUID) -> Resume | None:
    return db.scalar(
        select(Resume)
        .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker_id)
        .order_by(Resume.created_at.desc())
    )


def entry_list_item(entry: ResumeBankEntry, worker: Worker, resume: Resume | None) -> ResumeBankEntryListItem:
    return ResumeBankEntryListItem(
        id=entry.id,
        worker_id=worker.id,
        worker_name=worker.full_name,
        worker_cpf_masked=mask_cpf(worker.cpf),
        resume_id=resume.id if resume else None,
        resume_filename=resume.original_filename if resume else None,
        status=entry.status,
        entry_reason=entry.entry_reason,
        tags=entry.tags or [],
        desired_roles=entry.desired_roles or [],
        desired_sectors=entry.desired_sectors or [],
        availability=entry.availability,
        city=entry.city,
        education_level=entry.education_level,
        experience_summary=entry.experience_summary,
        ai_summary=entry.ai_summary,
        ai_keywords=entry.ai_keywords or [],
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        archived_at=entry.archived_at,
    )


def entry_read(entry: ResumeBankEntry, worker: Worker, resume: Resume | None) -> ResumeBankEntryRead:
    item = entry_list_item(entry, worker, resume).model_dump()
    return ResumeBankEntryRead(
        **item,
        worker=WorkerOut.model_validate(worker),
        resume=ResumeOut.model_validate(resume) if resume else None,
        internal_notes=entry.internal_notes,
        source_job_id=entry.source_job_id,
        source_application_id=entry.source_application_id,
        source_referral_id=entry.source_referral_id,
    )


def list_entries(
    db: Session,
    tenant_id: UUID,
    search: str | None = None,
    status: str | None = None,
    city: str | None = None,
) -> list[ResumeBankEntryListItem]:
    query = (
        select(ResumeBankEntry, Worker, Resume)
        .join(Worker, Worker.id == ResumeBankEntry.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankEntry.resume_id)
        .where(ResumeBankEntry.tenant_id == tenant_id, ResumeBankEntry.deleted_at.is_(None))
        .order_by(ResumeBankEntry.updated_at.desc())
    )
    if status:
        query = query.where(ResumeBankEntry.status == status)
    if city:
        query = query.where(ResumeBankEntry.city.ilike(f"%{city.strip()}%"))
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Worker.full_name.ilike(term),
                Worker.cpf.ilike(term),
                Worker.desired_role.ilike(term),
                ResumeBankEntry.city.ilike(term),
                ResumeBankEntry.experience_summary.ilike(term),
            )
        )
    return [entry_list_item(entry, worker, resume) for entry, worker, resume in db.execute(query).all()]


def get_entry(db: Session, tenant_id: UUID, entry_id: UUID) -> tuple[ResumeBankEntry, Worker, Resume | None]:
    row = db.execute(
        select(ResumeBankEntry, Worker, Resume)
        .join(Worker, Worker.id == ResumeBankEntry.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankEntry.resume_id)
        .where(
            ResumeBankEntry.id == entry_id,
            ResumeBankEntry.tenant_id == tenant_id,
            ResumeBankEntry.deleted_at.is_(None),
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Entrada do Banco de Currículos não encontrada")
    return row


def create_entry(
    db: Session,
    tenant_id: UUID,
    payload: ResumeBankEntryCreate,
    user: User,
    ip_address: str | None = None,
) -> ResumeBankEntryRead:
    worker = db.get(Worker, payload.worker_id)
    if not worker or worker.tenant_id != tenant_id or worker.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")
    resume = db.get(Resume, payload.resume_id) if payload.resume_id else latest_resume(db, tenant_id, worker.id)
    if resume and (resume.tenant_id != tenant_id or resume.worker_id != worker.id):
        raise HTTPException(status_code=404, detail="Currículo não pertence ao candidato")
    entry = ResumeBankEntry(
        tenant_id=tenant_id,
        worker_id=worker.id,
        resume_id=resume.id if resume else None,
        source_job_id=payload.source_job_id,
        source_application_id=payload.source_application_id,
        source_referral_id=payload.source_referral_id,
        status=payload.status,
        entry_reason=payload.entry_reason,
        tags=payload.tags,
        desired_roles=payload.desired_roles or ([worker.desired_role] if worker.desired_role else []),
        desired_sectors=payload.desired_sectors,
        availability=payload.availability or worker.availability,
        city=payload.city or worker.city,
        education_level=payload.education_level or worker.education_level,
        experience_summary=payload.experience_summary or worker.notes,
        internal_notes=payload.internal_notes,
        ai_summary=(resume.analysis or {}).get("summary") if resume and resume.analysis else None,
        ai_keywords=(resume.analysis or {}).get("skills") if resume and resume.analysis else [],
        created_by_user_id=user.id,
        updated_by_user_id=user.id,
    )
    db.add(entry)
    db.flush()
    audit(db, tenant_id, user.id, "resume_bank_created", "ResumeBankEntry", entry.id, {"worker_id": str(worker.id), "resume_id": str(resume.id) if resume else None}, ip_address)
    if payload.source_referral_id:
        audit(db, tenant_id, user.id, "resume_bank_moved_from_referral", "Referral", payload.source_referral_id, {"resume_bank_entry_id": str(entry.id)}, ip_address)
    if payload.source_application_id:
        audit(db, tenant_id, user.id, "resume_bank_moved_from_application", "Referral", payload.source_application_id, {"resume_bank_entry_id": str(entry.id)}, ip_address)
    if resume:
        log_resume_access(db, tenant_id, user.id, worker.id, resume.id, "resume_bank_create", "Banco de Currículos", ip_address)
    db.commit()
    db.refresh(entry)
    return entry_read(entry, worker, resume)


def move_from_referral(
    db: Session,
    tenant_id: UUID,
    payload: ResumeBankMoveRequest,
    user: User,
    ip_address: str | None = None,
) -> ResumeBankEntryRead:
    if not payload.referral_id:
        raise HTTPException(status_code=422, detail="Informe o encaminhamento")
    referral = db.get(Referral, payload.referral_id)
    if not referral or referral.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    create_payload = ResumeBankEntryCreate(
        worker_id=referral.worker_id,
        resume_id=payload.resume_id or referral.resume_id,
        source_job_id=payload.job_id or referral.job_id,
        source_referral_id=referral.id,
        status="ativo",
        entry_reason=payload.entry_reason,
        tags=payload.tags,
        internal_notes=payload.internal_notes,
    )
    return create_entry(db, tenant_id, create_payload, user, ip_address)


def update_entry(
    db: Session,
    tenant_id: UUID,
    entry_id: UUID,
    payload: ResumeBankEntryUpdate,
    user: User,
    ip_address: str | None = None,
) -> ResumeBankEntryRead:
    entry, worker, resume = get_entry(db, tenant_id, entry_id)
    before_status = entry.status
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    entry.updated_by_user_id = user.id
    audit(db, tenant_id, user.id, "resume_bank_updated", "ResumeBankEntry", entry.id, {"previous_status": before_status, "new_status": entry.status}, ip_address)
    if before_status != entry.status:
        audit(db, tenant_id, user.id, "resume_bank_status_changed", "ResumeBankEntry", entry.id, {"previous_status": before_status, "new_status": entry.status}, ip_address)
    db.commit()
    db.refresh(entry)
    return entry_read(entry, worker, resume)


def archive_entry(db: Session, tenant_id: UUID, entry_id: UUID, user: User, ip_address: str | None = None) -> ResumeBankEntryRead:
    entry, worker, resume = get_entry(db, tenant_id, entry_id)
    previous = entry.status
    entry.status = "arquivado"
    entry.archived_at = datetime.now(timezone.utc)
    entry.updated_by_user_id = user.id
    audit(db, tenant_id, user.id, "resume_bank_archived", "ResumeBankEntry", entry.id, {"previous_status": previous, "new_status": entry.status}, ip_address)
    db.commit()
    db.refresh(entry)
    return entry_read(entry, worker, resume)


def suggestion_read(
    suggestion: ResumeBankAISuggestion,
    job: Job,
    entry: ResumeBankEntry,
    worker: Worker,
    resume: Resume | None,
) -> ResumeBankAISuggestionRead:
    return ResumeBankAISuggestionRead(
        id=suggestion.id,
        job_id=job.id,
        job_title=job.title,
        resume_bank_entry_id=entry.id,
        worker_id=worker.id,
        worker_name=worker.full_name,
        resume_id=resume.id if resume else None,
        resume_filename=resume.original_filename if resume else None,
        desired_role=(entry.desired_roles or [worker.desired_role or None])[0],
        city=entry.city or worker.city,
        education_level=entry.education_level or worker.education_level,
        professional_summary=entry.experience_summary or entry.ai_summary or worker.notes,
        compatibility_score=suggestion.compatibility_score,
        compatibility_level=suggestion.compatibility_level,
        matched_requirements=suggestion.matched_requirements or [],
        missing_requirements=suggestion.missing_requirements or [],
        ai_explanation=suggestion.ai_explanation,
        status=suggestion.status,
        reviewed_at=suggestion.reviewed_at,
        created_at=suggestion.created_at,
        forwarded_at=suggestion.forwarded_at,
    )


def match_job(
    db: Session,
    tenant_id: UUID,
    job_id: UUID,
    user: User,
    limit: int = 20,
    ip_address: str | None = None,
) -> ResumeBankMatchResult:
    job = db.get(Job, job_id)
    if not job or job.tenant_id != tenant_id or job.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    audit(db, tenant_id, user.id, "resume_bank_ai_match_started", "Job", job.id, {"limit": limit}, ip_address)
    rows = db.execute(
        select(ResumeBankEntry, Worker, Resume)
        .join(Worker, Worker.id == ResumeBankEntry.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankEntry.resume_id)
        .where(
            ResumeBankEntry.tenant_id == tenant_id,
            ResumeBankEntry.deleted_at.is_(None),
            ResumeBankEntry.archived_at.is_(None),
            ResumeBankEntry.status.not_in(ARCHIVED_ENTRY_STATUSES),
        )
    ).all()
    created: list[tuple[ResumeBankAISuggestion, Job, ResumeBankEntry, Worker, Resume | None]] = []
    for entry, worker, resume in rows:
        selected_resume = resume or latest_resume(db, tenant_id, worker.id)
        match = analyze_candidate(job, worker, selected_resume)
        if match.match_score < 35:
            continue
        existing = db.scalar(
            select(ResumeBankAISuggestion).where(
                ResumeBankAISuggestion.tenant_id == tenant_id,
                ResumeBankAISuggestion.job_id == job.id,
                ResumeBankAISuggestion.resume_bank_entry_id == entry.id,
            )
        )
        suggestion = existing or ResumeBankAISuggestion(
            tenant_id=tenant_id,
            job_id=job.id,
            resume_bank_entry_id=entry.id,
            worker_id=worker.id,
            resume_id=selected_resume.id if selected_resume else None,
        )
        suggestion.compatibility_score = match.match_score
        suggestion.compatibility_level = match.match_level
        suggestion.matched_requirements = match.strengths
        suggestion.missing_requirements = match.gaps
        suggestion.ai_explanation = match.match_explanation
        if not existing:
            db.add(suggestion)
        entry.status = "sugerido_para_vaga"
        db.flush()
        audit(db, tenant_id, user.id, "resume_bank_ai_suggestion_created", "ResumeBankAISuggestion", suggestion.id, {"job_id": str(job.id), "worker_id": str(worker.id), "compatibility_score": match.match_score}, ip_address)
        created.append((suggestion, job, entry, worker, selected_resume))
    created.sort(key=lambda item: item[0].compatibility_score, reverse=True)
    db.commit()
    suggestions = [suggestion_read(*item) for item in created[:limit]]
    return ResumeBankMatchResult(job_id=job.id, job_title=job.title, total_suggestions=len(suggestions), suggestions=suggestions)


def list_suggestions(db: Session, tenant_id: UUID, job_id: UUID | None = None) -> list[ResumeBankAISuggestionRead]:
    query = (
        select(ResumeBankAISuggestion, Job, ResumeBankEntry, Worker, Resume)
        .join(Job, Job.id == ResumeBankAISuggestion.job_id)
        .join(ResumeBankEntry, ResumeBankEntry.id == ResumeBankAISuggestion.resume_bank_entry_id)
        .join(Worker, Worker.id == ResumeBankAISuggestion.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankAISuggestion.resume_id)
        .where(ResumeBankAISuggestion.tenant_id == tenant_id)
        .order_by(ResumeBankAISuggestion.compatibility_score.desc(), ResumeBankAISuggestion.created_at.desc())
    )
    if job_id:
        query = query.where(ResumeBankAISuggestion.job_id == job_id)
    return [suggestion_read(s, j, e, w, r) for s, j, e, w, r in db.execute(query).all()]


def review_suggestion(db: Session, tenant_id: UUID, suggestion_id: UUID, status: str, user: User, note: str | None = None, ip_address: str | None = None) -> ResumeBankAISuggestionRead:
    row = db.execute(
        select(ResumeBankAISuggestion, Job, ResumeBankEntry, Worker, Resume)
        .join(Job, Job.id == ResumeBankAISuggestion.job_id)
        .join(ResumeBankEntry, ResumeBankEntry.id == ResumeBankAISuggestion.resume_bank_entry_id)
        .join(Worker, Worker.id == ResumeBankAISuggestion.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankAISuggestion.resume_id)
        .where(ResumeBankAISuggestion.id == suggestion_id, ResumeBankAISuggestion.tenant_id == tenant_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada")
    suggestion, job, entry, worker, resume = row
    suggestion.status = status
    suggestion.reviewed_by_user_id = user.id
    suggestion.reviewed_at = datetime.now(timezone.utc)
    audit(db, tenant_id, user.id, "resume_bank_ai_suggestion_reviewed", "ResumeBankAISuggestion", suggestion.id, {"status": status, "note": note}, ip_address)
    db.commit()
    db.refresh(suggestion)
    return suggestion_read(suggestion, job, entry, worker, resume)


def forward_suggestion(db: Session, tenant_id: UUID, suggestion_id: UUID, user: User, ip_address: str | None = None) -> ResumeBankAISuggestionRead:
    row = db.execute(
        select(ResumeBankAISuggestion, Job, ResumeBankEntry, Worker, Resume)
        .join(Job, Job.id == ResumeBankAISuggestion.job_id)
        .join(ResumeBankEntry, ResumeBankEntry.id == ResumeBankAISuggestion.resume_bank_entry_id)
        .join(Worker, Worker.id == ResumeBankAISuggestion.worker_id)
        .outerjoin(Resume, Resume.id == ResumeBankAISuggestion.resume_id)
        .where(ResumeBankAISuggestion.id == suggestion_id, ResumeBankAISuggestion.tenant_id == tenant_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada")
    suggestion, job, entry, worker, resume = row
    refer_candidates(
        db,
        tenant_id,
        job.id,
        ReferCandidatesIn(
            message_to_company="Candidato encaminhado pelo SINE.",
            candidates=[
                ReferCandidateIn(
                    worker_id=worker.id,
                    resume_id=resume.id if resume else None,
                    match_score=suggestion.compatibility_score,
                    match_explanation=suggestion.ai_explanation,
                )
            ],
        ),
        user,
        ip_address,
    )
    suggestion.status = "encaminhado"
    suggestion.forwarded_at = datetime.now(timezone.utc)
    entry.status = "encaminhado"
    audit(db, tenant_id, user.id, "resume_bank_forwarded_to_company", "ResumeBankAISuggestion", suggestion.id, {"job_id": str(job.id), "worker_id": str(worker.id), "compatibility_score": suggestion.compatibility_score}, ip_address)
    db.commit()
    return suggestion_read(suggestion, job, entry, worker, resume)


def worker_status(db: Session, tenant_id: UUID, worker: Worker, user: User, ip_address: str | None = None) -> dict:
    entry = db.scalar(
        select(ResumeBankEntry)
        .where(ResumeBankEntry.tenant_id == tenant_id, ResumeBankEntry.worker_id == worker.id, ResumeBankEntry.deleted_at.is_(None))
        .order_by(ResumeBankEntry.updated_at.desc())
    )
    audit(db, tenant_id, user.id, "resume_bank_worker_viewed_own_status", "Worker", worker.id, {}, ip_address)
    db.commit()
    if not entry:
        return {
            "status": None,
            "entered_at": None,
            "updated_at": None,
            "desired_roles": [],
            "message": "Seu currículo ainda não está no Banco de Currículos. Mantenha seu perfil atualizado para novas oportunidades.",
        }
    return {
        "status": entry.status,
        "entered_at": entry.created_at,
        "updated_at": entry.updated_at,
        "desired_roles": entry.desired_roles or [],
        "message": "Seu currículo está no Banco de Currículos do SINE Jacarezinho e poderá ser considerado para futuras oportunidades compatíveis. Seus dados só serão compartilhados com empresas quando houver encaminhamento oficial do SINE.",
    }


def history(db: Session, tenant_id: UUID, entry_id: UUID) -> list[dict]:
    rows = db.scalars(
        select(AuditLog)
        .where(AuditLog.tenant_id == tenant_id, AuditLog.entity_id == entry_id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
    ).all()
    return [
        {
            "id": str(row.id),
            "action": row.action,
            "details": row.details,
            "created_at": row.created_at,
            "user_id": str(row.user_id) if row.user_id else None,
        }
        for row in rows
    ]
