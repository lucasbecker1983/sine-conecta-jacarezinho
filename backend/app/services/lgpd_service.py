from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Company,
    CompanyUser,
    Job,
    LGPDConsent,
    LGPDConsentHistory,
    LGPDDataSharingRecord,
    LGPDDataSubjectRequest,
    LGPDRequestEvent,
    LGPDTermsVersion,
    Notification,
    Referral,
    Resume,
    Tenant,
    User,
    Worker,
)
from app.services.audit import audit

LGPD_ADMIN_ROLES = {"super_admin", "tenant_admin", "sine_manager"}
LGPD_STAFF_ROLES = LGPD_ADMIN_ROLES | {"sine_staff"}


def role_names(user: User) -> set[str]:
    return {role.name for role in user.roles}


def require_lgpd_admin(user: User) -> None:
    if not role_names(user).intersection(LGPD_ADMIN_ROLES):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil nao autorizado para governanca LGPD")


def require_lgpd_staff(user: User) -> None:
    if not role_names(user).intersection(LGPD_STAFF_ROLES):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil nao autorizado para governanca LGPD")


def tenant_for_public(db: Session) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == "jacarezinho"))
    if tenant:
        return tenant
    tenant = db.scalar(select(Tenant).order_by(Tenant.created_at.asc()))
    if not tenant:
        raise HTTPException(status_code=503, detail="Tenant padrao nao configurado")
    return tenant


def scoped_tenant_id(user: User) -> UUID:
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="Usuario sem tenant vinculado")
    return user.tenant_id


def default_due_date() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=15)


def add_request_event(
    db: Session,
    tenant_id: UUID,
    request_id: UUID,
    event_type: str,
    actor_user_id: UUID | None = None,
    previous_status: str | None = None,
    new_status: str | None = None,
    message: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        LGPDRequestEvent(
            tenant_id=tenant_id,
            request_id=request_id,
            actor_user_id=actor_user_id,
            event_type=event_type,
            previous_status=previous_status,
            new_status=new_status,
            message=message,
            metadata_json=metadata,
        )
    )


def create_data_subject_request(
    db: Session,
    tenant_id: UUID,
    requester_type: str,
    requester_name: str,
    requester_email: str,
    request_type: str,
    description: str,
    requester_document: str | None = None,
    worker_id: UUID | None = None,
    company_id: UUID | None = None,
    requester_user_id: UUID | None = None,
    priority: str = "normal",
) -> LGPDDataSubjectRequest:
    lgpd_request = LGPDDataSubjectRequest(
        tenant_id=tenant_id,
        requester_type="public" if requester_type == "other" else requester_type,
        requester_name=requester_name,
        requester_email=requester_email,
        requester_document=requester_document,
        request_type=request_type,
        description=description,
        worker_id=worker_id,
        company_id=company_id,
        requester_user_id=requester_user_id,
        priority=priority,
        due_date=default_due_date(),
    )
    db.add(lgpd_request)
    db.flush()
    add_request_event(db, tenant_id, lgpd_request.id, "created", requester_user_id, new_status="aberta")
    db.add(
        Notification(
            tenant_id=tenant_id,
            user_id=None,
            title="Nova solicitação LGPD",
            message=f"{requester_name} abriu solicitação LGPD do tipo {request_type}.",
        )
    )
    audit(
        db,
        tenant_id,
        requester_user_id,
        "lgpd.request.created",
        "LGPDDataSubjectRequest",
        lgpd_request.id,
        {"request_type": request_type, "requester_type": requester_type},
    )
    return lgpd_request


def get_request_or_404(db: Session, tenant_id: UUID, request_id: UUID) -> LGPDDataSubjectRequest:
    lgpd_request = db.get(LGPDDataSubjectRequest, request_id)
    if not lgpd_request or lgpd_request.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Solicitacao LGPD nao encontrada")
    return lgpd_request


def active_terms_query(tenant_id: UUID):
    return select(LGPDTermsVersion).where(
        LGPDTermsVersion.tenant_id == tenant_id,
        LGPDTermsVersion.is_active.is_(True),
    )


def publish_term(db: Session, tenant_id: UUID, term: LGPDTermsVersion, user: User) -> LGPDTermsVersion:
    db.query(LGPDTermsVersion).filter(
        LGPDTermsVersion.tenant_id == tenant_id,
        LGPDTermsVersion.term_type == term.term_type,
        LGPDTermsVersion.id != term.id,
    ).update({LGPDTermsVersion.is_active: False}, synchronize_session=False)
    term.is_active = True
    term.published_at = datetime.now(timezone.utc)
    audit(db, tenant_id, user.id, "lgpd.term.published", "LGPDTermsVersion", term.id, {"term_type": term.term_type})
    return term


def worker_for_user(db: Session, user: User) -> Worker:
    worker = db.scalar(select(Worker).where(Worker.tenant_id == user.tenant_id, Worker.email == user.email))
    if not worker:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado para o usuario")
    return worker


def company_for_user(db: Session, user: User) -> Company:
    link = db.scalar(select(CompanyUser).where(CompanyUser.tenant_id == user.tenant_id, CompanyUser.user_id == user.id))
    if not link:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada para o usuario")
    company = db.get(Company, link.company_id)
    if not company or company.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada para o usuario")
    return company


def consent_rows(db: Session, tenant_id: UUID, worker_id: UUID | None = None, company_id: UUID | None = None) -> list[dict]:
    history_query = (
        select(LGPDConsentHistory, LGPDTermsVersion)
        .join(LGPDTermsVersion, LGPDConsentHistory.term_version_id == LGPDTermsVersion.id)
        .where(LGPDConsentHistory.tenant_id == tenant_id)
        .order_by(LGPDConsentHistory.created_at.desc())
    )
    if worker_id:
        history_query = history_query.where(LGPDConsentHistory.worker_id == worker_id)
    if company_id:
        history_query = history_query.where(LGPDConsentHistory.company_id == company_id)
    rows = [
        {
            "id": consent.id,
            "consent_type": consent.consent_type,
            "consent_status": consent.consent_status,
            "term_title": term.title,
            "term_version": term.version,
            "legal_basis": consent.legal_basis,
            "purpose": consent.purpose,
            "accepted_at": consent.accepted_at,
            "revoked_at": consent.revoked_at,
            "created_at": consent.created_at,
        }
        for consent, term in db.execute(history_query).all()
    ]
    if worker_id:
        legacy = db.scalars(
            select(LGPDConsent)
            .where(LGPDConsent.tenant_id == tenant_id, LGPDConsent.worker_id == worker_id)
            .order_by(LGPDConsent.accepted_at.desc())
        ).all()
        rows.extend(
            {
                "id": item.id,
                "consent_type": item.consent_type,
                "consent_status": "accepted",
                "term_title": item.consent_text[:120],
                "term_version": item.version,
                "legal_basis": "consentimento",
                "purpose": item.consent_text,
                "accepted_at": item.accepted_at,
                "revoked_at": None,
                "created_at": item.accepted_at,
            }
            for item in legacy
        )
    return rows


def sharing_rows(db: Session, tenant_id: UUID, worker_id: UUID | None = None, company_id: UUID | None = None) -> list[dict]:
    query = (
        select(LGPDDataSharingRecord, Worker, Company, Job)
        .join(Worker, LGPDDataSharingRecord.worker_id == Worker.id)
        .join(Company, LGPDDataSharingRecord.company_id == Company.id)
        .join(Job, LGPDDataSharingRecord.job_id == Job.id, isouter=True)
        .where(LGPDDataSharingRecord.tenant_id == tenant_id)
        .order_by(LGPDDataSharingRecord.shared_at.desc())
    )
    if worker_id:
        query = query.where(LGPDDataSharingRecord.worker_id == worker_id)
    if company_id:
        query = query.where(LGPDDataSharingRecord.company_id == company_id)
    rows = []
    for record, worker, company, job in db.execute(query).all():
        mask_company = bool(worker_id and job and job.is_confidential)
        rows.append(
            {
                "id": record.id,
                "worker_id": record.worker_id,
                "company_id": None if mask_company else record.company_id,
                "worker_name": worker.full_name,
                "company_name": (
                    "Empresa confidencial"
                    if mask_company
                    else company.trade_name or company.legal_name
                ),
                "job_id": record.job_id,
                "job_title": job.title if job else None,
                "referral_id": record.referral_id,
                "data_categories": record.data_categories,
                "purpose": record.purpose,
                "legal_basis": record.legal_basis,
                "shared_at": record.shared_at,
                "revoked_at": record.revoked_at,
                "notes": record.notes,
            }
        )
    return rows


def export_subject_data(db: Session, tenant_id: UUID, lgpd_request: LGPDDataSubjectRequest) -> dict:
    if lgpd_request.worker_id:
        worker = db.get(Worker, lgpd_request.worker_id)
        if not worker or worker.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Titular trabalhador nao encontrado")
        resumes = db.scalars(select(Resume).where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)).all()
        referrals = db.scalars(select(Referral).where(Referral.tenant_id == tenant_id, Referral.worker_id == worker.id)).all()
        return {
            "subject_type": "worker",
            "worker": {
                "id": str(worker.id),
                "full_name": worker.full_name,
                "email": worker.email,
                "phone": worker.phone,
                "whatsapp": worker.whatsapp,
                "cpf_masked": worker.cpf[:3] + "***" + worker.cpf[-2:] if worker.cpf else None,
                "city": worker.city,
                "state": worker.state,
            },
            "resumes": [{"id": str(item.id), "filename": item.original_filename, "status": item.status, "created_at": item.created_at.isoformat()} for item in resumes],
            "referrals": [{"id": str(item.id), "job_id": str(item.job_id), "status": item.status, "created_at": item.created_at.isoformat()} for item in referrals],
            "data_sharing": sharing_rows(db, tenant_id, worker_id=worker.id),
            "consents": consent_rows(db, tenant_id, worker_id=worker.id),
        }
    if lgpd_request.company_id:
        company = db.get(Company, lgpd_request.company_id)
        if not company or company.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Titular empresa nao encontrado")
        jobs = db.scalars(select(Job).where(Job.tenant_id == tenant_id, Job.company_id == company.id)).all()
        return {
            "subject_type": "company",
            "company": {
                "id": str(company.id),
                "legal_name": company.legal_name,
                "trade_name": company.trade_name,
                "email": company.email,
                "cnpj": company.cnpj,
            },
            "jobs": [{"id": str(item.id), "title": item.title, "status": item.status, "created_at": item.created_at.isoformat()} for item in jobs],
            "data_sharing_received": sharing_rows(db, tenant_id, company_id=company.id),
            "consents": consent_rows(db, tenant_id, company_id=company.id),
        }
    return {
        "subject_type": "public",
        "requester_name": lgpd_request.requester_name,
        "requester_email": lgpd_request.requester_email,
        "requests": [
            {
                "id": str(item.id),
                "request_type": item.request_type,
                "status": item.status,
                "created_at": item.created_at.isoformat(),
            }
            for item in db.scalars(
                select(LGPDDataSubjectRequest).where(
                    LGPDDataSubjectRequest.tenant_id == tenant_id,
                    func.lower(LGPDDataSubjectRequest.requester_email) == lgpd_request.requester_email.lower(),
                )
            ).all()
        ],
    }
