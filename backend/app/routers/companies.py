from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions
from app.models import AuditLog, Company, CompanyFeedback, Job, Referral, User, Worker
from app.routers import crud
from app.schemas.common import (
    CompanyAdminUpdate,
    CompanyAuditSummary,
    CompanyDetailRead,
    CompanyFeedbackSummary,
    CompanyIn,
    CompanyInternalNoteCreate,
    CompanyJobSummary,
    CompanyListItem,
    CompanyOut,
    CompanyReferralSummary,
    CompanyStatusUpdate,
    CompanySummary,
)
from app.services.audit import audit


router = APIRouter(tags=["companies"])

FINAL_FEEDBACK_STATUSES = {
    "contratado",
    "dispensado",
    "nao_compareceu",
    "banco_futuro",
    "banco_talentos",
    "sem_interesse",
}


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _tenant_id(user: User, db: Session) -> UUID:
    return crud.tenant_scope(user, db)


def _company_or_404(db: Session, tenant_id: UUID, company_id: UUID) -> Company:
    company = db.get(Company, company_id)
    if not company or company.tenant_id != tenant_id or company.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company


def _latest_activity(db: Session, tenant_id: UUID, company_id: UUID):
    latest_job = db.scalar(
        select(func.max(Job.created_at)).where(
            Job.tenant_id == tenant_id,
            Job.company_id == company_id,
            Job.deleted_at.is_(None),
        )
    )
    latest_feedback = db.scalar(
        select(func.max(CompanyFeedback.created_at)).where(
            CompanyFeedback.tenant_id == tenant_id,
            CompanyFeedback.company_id == company_id,
        )
    )
    return max([value for value in [latest_job, latest_feedback] if value], default=None)


def _pending_feedback_count(db: Session, tenant_id: UUID, company_id: UUID) -> int:
    return crud.company_pending_return_count(db, tenant_id, company_id)


def _summary(db: Session, tenant_id: UUID, company: Company) -> CompanySummary:
    open_jobs = db.scalar(
        select(func.count(Job.id)).where(
            Job.tenant_id == tenant_id,
            Job.company_id == company.id,
            Job.deleted_at.is_(None),
            Job.status.in_(["solicitada", "em_analise", "aprovada", "publicada", "em_triagem", "encaminhando_candidatos"]),
        )
    ) or 0
    closed_jobs = db.scalar(
        select(func.count(Job.id)).where(
            Job.tenant_id == tenant_id,
            Job.company_id == company.id,
            Job.deleted_at.is_(None),
            Job.status.in_(["encerrada", "cancelada"]),
        )
    ) or 0
    referrals = db.scalar(
        select(func.count(Referral.id))
        .join(Job, Job.id == Referral.job_id)
        .where(
            Referral.tenant_id == tenant_id,
            Job.company_id == company.id,
            Job.deleted_at.is_(None),
        )
    ) or 0
    pending = _pending_feedback_count(db, tenant_id, company.id)
    hires = db.scalar(
        select(func.count(CompanyFeedback.id)).where(
            CompanyFeedback.tenant_id == tenant_id,
            CompanyFeedback.company_id == company.id,
            CompanyFeedback.status == "contratado",
        )
    ) or 0
    last_return = db.scalar(
        select(func.max(CompanyFeedback.created_at)).where(
            CompanyFeedback.tenant_id == tenant_id,
            CompanyFeedback.company_id == company.id,
        )
    )
    days_since_last_return = None
    if last_return:
        days_since_last_return = (datetime.now(timezone.utc) - last_return).days
    regularity = "Empresa ativa"
    blocking_reason = company.blocking_reason
    if company.status == "bloqueada" or company.blocked_at:
        regularity = "Abertura de novas vagas suspensa"
    elif pending:
        regularity = "Empresa em atenção"
        blocking_reason = blocking_reason or "Feedbacks pendentes impedem novas vagas."
    elif company.status in {"suspensa", "inativa", "rejeitada"}:
        regularity = "Empresa com restrição administrativa"
    return CompanySummary(
        open_jobs=open_jobs,
        closed_jobs=closed_jobs,
        referrals_received=referrals,
        pending_feedbacks=pending,
        hires_reported=hires,
        days_since_last_return=days_since_last_return,
        regularity_status=regularity,
        blocking_reason=blocking_reason,
    )


def _job_summaries(db: Session, tenant_id: UUID, company_id: UUID) -> list[CompanyJobSummary]:
    jobs = db.scalars(
        select(Job)
        .where(Job.tenant_id == tenant_id, Job.company_id == company_id, Job.deleted_at.is_(None))
        .order_by(Job.created_at.desc())
    ).all()
    items: list[CompanyJobSummary] = []
    for job in jobs:
        pending = db.scalar(
            select(func.count(Referral.id)).where(
                Referral.tenant_id == tenant_id,
                Referral.job_id == job.id,
                Referral.status.in_(crud.COMPANY_PENDING_RETURN_STATUSES),
            )
        ) or 0
        items.append(
            CompanyJobSummary(
                id=job.id,
                title=job.title,
                status=job.status,
                is_confidential=job.is_confidential,
                vacancies=job.vacancies,
                created_at=job.created_at,
                closing_deadline=job.closing_deadline,
                pending_feedbacks=pending,
            )
        )
    return items


def _referral_summaries(db: Session, tenant_id: UUID, company_id: UUID) -> list[CompanyReferralSummary]:
    rows = db.execute(
        select(Referral, Job, Worker)
        .join(Job, Job.id == Referral.job_id)
        .join(Worker, Worker.id == Referral.worker_id)
        .where(
            Referral.tenant_id == tenant_id,
            Job.company_id == company_id,
            Job.deleted_at.is_(None),
        )
        .order_by(Referral.created_at.desc())
    ).all()
    return [
        CompanyReferralSummary(
            id=referral.id,
            job_id=job.id,
            job_title=job.title,
            worker_id=worker.id,
            worker_name=worker.full_name,
            status=referral.status,
            feedback_status=referral.feedback_status,
            created_at=referral.created_at,
            referred_at=referral.referred_at,
        )
        for referral, job, worker in rows
    ]


def _feedback_summaries(db: Session, tenant_id: UUID, company_id: UUID) -> list[CompanyFeedbackSummary]:
    rows = db.execute(
        select(Referral, Job, Worker, CompanyFeedback)
        .join(Job, Job.id == Referral.job_id)
        .join(Worker, Worker.id == Referral.worker_id)
        .outerjoin(CompanyFeedback, CompanyFeedback.referral_id == Referral.id)
        .where(
            Referral.tenant_id == tenant_id,
            Job.company_id == company_id,
            Job.deleted_at.is_(None),
        )
        .order_by(Referral.created_at.desc())
    ).all()
    items: list[CompanyFeedbackSummary] = []
    for referral, job, worker, feedback in rows:
        status = feedback.status if feedback else referral.feedback_status or referral.status
        pending = status not in FINAL_FEEDBACK_STATUSES
        items.append(
            CompanyFeedbackSummary(
                id=feedback.id if feedback else None,
                referral_id=referral.id,
                job_title=job.title,
                worker_name=worker.full_name,
                status=status,
                comments=feedback.comments if feedback else None,
                pending=pending,
                created_at=feedback.created_at if feedback else referral.created_at,
            )
        )
    return items


def _audit_summaries(db: Session, tenant_id: UUID, company_id: UUID) -> list[CompanyAuditSummary]:
    rows = db.scalars(
        select(AuditLog)
        .where(
            AuditLog.tenant_id == tenant_id,
            AuditLog.entity_type == "Company",
            AuditLog.entity_id == company_id,
        )
        .order_by(AuditLog.created_at.desc())
        .limit(80)
    ).all()
    return [
        CompanyAuditSummary(
            id=row.id,
            action=row.action,
            user_id=row.user_id,
            details=row.details,
            created_at=row.created_at,
        )
        for row in rows
    ]


def _list_item(db: Session, tenant_id: UUID, company: Company) -> CompanyListItem:
    jobs = _job_summaries(db, tenant_id, company.id)
    pending = _pending_feedback_count(db, tenant_id, company.id)
    referrals = db.scalar(
        select(func.count(Referral.id))
        .join(Job, Job.id == Referral.job_id)
        .where(Referral.tenant_id == tenant_id, Job.company_id == company.id)
    ) or 0
    return CompanyListItem(
        **CompanyOut.model_validate(company).model_dump(),
        open_jobs=sum(1 for job in jobs if job.status not in {"encerrada", "cancelada"}),
        total_jobs=len(jobs),
        pending_feedbacks=pending,
        referrals_count=referrals,
        last_activity_at=_latest_activity(db, tenant_id, company.id) or company.updated_at,
        blocked=bool(company.blocked_at or company.status == "bloqueada" or pending),
    )


def _detail(db: Session, tenant_id: UUID, company: Company) -> CompanyDetailRead:
    return CompanyDetailRead(
        **CompanyOut.model_validate(company).model_dump(),
        approved_by_user_id=company.approved_by_user_id,
        blocked_by_user_id=company.blocked_by_user_id,
        internal_notes=company.internal_notes,
        summary=_summary(db, tenant_id, company),
        jobs=_job_summaries(db, tenant_id, company.id),
        referrals=_referral_summaries(db, tenant_id, company.id),
        feedbacks=_feedback_summaries(db, tenant_id, company.id),
        audit=_audit_summaries(db, tenant_id, company.id),
    )


@router.get(
    "/companies",
    response_model=list[CompanyListItem],
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def list_companies(
    search: str | None = None,
    status: str | None = None,
    city: str | None = None,
    blocked: bool | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = _tenant_id(user, db)
    query = select(Company).where(Company.tenant_id == tenant_id, Company.deleted_at.is_(None))
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Company.legal_name.ilike(term),
                Company.trade_name.ilike(term),
                Company.cnpj.ilike(term),
                Company.city.ilike(term),
                Company.responsible_name.ilike(term),
                Company.hr_responsible_name.ilike(term),
            )
        )
    if status:
        query = query.where(Company.status == status)
    if city:
        query = query.where(Company.city.ilike(f"%{city.strip()}%"))
    companies = db.scalars(query.order_by(Company.created_at.desc())).all()
    items = [_list_item(db, tenant_id, company) for company in companies]
    if blocked is not None:
        items = [item for item in items if item.blocked is blocked]
    return items


@router.post(
    "/companies",
    response_model=CompanyOut,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def create_company(
    payload: CompanyIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return crud.create_company(payload, request, db, user)


@router.get(
    "/companies/{company_id}",
    response_model=CompanyDetailRead,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def get_company_detail(
    company_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = _tenant_id(user, db)
    company = _company_or_404(db, tenant_id, company_id)
    audit(db, tenant_id, user.id, "company_viewed_by_sine", "Company", company.id, {}, _ip(request))
    db.commit()
    return _detail(db, tenant_id, company)


@router.patch(
    "/companies/{company_id}",
    response_model=CompanyDetailRead,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def update_company_admin(
    company_id: UUID,
    payload: CompanyAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = _tenant_id(user, db)
    company = _company_or_404(db, tenant_id, company_id)
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(company, key, value)
    company.profile_complete = bool(
        company.legal_name
        and company.cnpj
        and (company.email or company.phone or company.whatsapp)
        and company.city
    )
    audit(db, tenant_id, user.id, "company_updated_by_sine", "Company", company.id, {"fields": sorted(changes.keys())}, _ip(request))
    db.commit()
    db.refresh(company)
    return _detail(db, tenant_id, company)


@router.patch(
    "/companies/{company_id}/status",
    response_model=CompanyDetailRead,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def update_company_status(
    company_id: UUID,
    payload: CompanyStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = _tenant_id(user, db)
    company = _company_or_404(db, tenant_id, company_id)
    previous = company.status
    company.status = payload.status
    if payload.status == "ativa":
        if not company.approved_at:
            company.approved_at = datetime.now(timezone.utc)
            company.approved_by_user_id = user.id
        company.blocked_at = None
        company.blocked_by_user_id = None
        company.blocking_reason = None
    elif payload.status == "bloqueada":
        company.blocked_at = datetime.now(timezone.utc)
        company.blocked_by_user_id = user.id
        company.blocking_reason = payload.reason or company.blocking_reason
    elif payload.status == "rejeitada":
        company.blocking_reason = payload.reason or company.blocking_reason
    details = {"previous_status": previous, "new_status": payload.status, "reason": payload.reason}
    audit(db, tenant_id, user.id, "company_status_changed", "Company", company.id, details, _ip(request))
    if payload.status == "ativa" and previous == "bloqueada":
        audit(db, tenant_id, user.id, "company_unblocked", "Company", company.id, details, _ip(request))
    if payload.status == "bloqueada":
        audit(db, tenant_id, user.id, "company_blocked", "Company", company.id, details, _ip(request))
    if payload.status == "ativa":
        audit(db, tenant_id, user.id, "company_approved", "Company", company.id, details, _ip(request))
    if payload.status == "rejeitada":
        audit(db, tenant_id, user.id, "company_rejected", "Company", company.id, details, _ip(request))
    db.commit()
    db.refresh(company)
    return _detail(db, tenant_id, company)


@router.post(
    "/companies/{company_id}/notes",
    response_model=CompanyDetailRead,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def create_company_note(
    company_id: UUID,
    payload: CompanyInternalNoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = _tenant_id(user, db)
    company = _company_or_404(db, tenant_id, company_id)
    stamp = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
    line = f"[{stamp}] {user.full_name}: {payload.note}"
    company.internal_notes = f"{company.internal_notes}\n{line}" if company.internal_notes else line
    audit(db, tenant_id, user.id, "company_note_created", "Company", company.id, {"note": payload.note}, _ip(request))
    db.commit()
    db.refresh(company)
    return _detail(db, tenant_id, company)


@router.get("/companies/{company_id}/jobs", response_model=list[CompanyJobSummary], dependencies=[Depends(require_permissions("companies:manage"))])
def company_jobs(company_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = _tenant_id(user, db)
    _company_or_404(db, tenant_id, company_id)
    return _job_summaries(db, tenant_id, company_id)


@router.get("/companies/{company_id}/referrals", response_model=list[CompanyReferralSummary], dependencies=[Depends(require_permissions("companies:manage"))])
def company_referrals(company_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = _tenant_id(user, db)
    _company_or_404(db, tenant_id, company_id)
    return _referral_summaries(db, tenant_id, company_id)


@router.get("/companies/{company_id}/feedbacks", response_model=list[CompanyFeedbackSummary], dependencies=[Depends(require_permissions("companies:manage"))])
def company_feedbacks(company_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = _tenant_id(user, db)
    _company_or_404(db, tenant_id, company_id)
    return _feedback_summaries(db, tenant_id, company_id)


@router.get("/companies/{company_id}/audit", response_model=list[CompanyAuditSummary], dependencies=[Depends(require_permissions("companies:manage"))])
def company_audit(company_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = _tenant_id(user, db)
    _company_or_404(db, tenant_id, company_id)
    return _audit_summaries(db, tenant_id, company_id)


@router.get("/companies/{company_id}/summary", response_model=CompanySummary, dependencies=[Depends(require_permissions("companies:manage"))])
def company_summary(company_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = _tenant_id(user, db)
    company = _company_or_404(db, tenant_id, company_id)
    return _summary(db, tenant_id, company)


router.add_api_route(
    "/companies/{company_id}/portal-user",
    crud.create_company_portal_user,
    methods=["POST"],
    dependencies=[Depends(require_permissions("companies:manage"))],
)
