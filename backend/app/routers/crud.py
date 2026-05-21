import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.local_provider import get_ai_provider
from app.core.config import get_settings
from app.core.database import get_db
from app.core.permissions import (
    PORTAL_ROLES,
    SINE_ROLES,
    get_current_user,
    require_permissions,
)
from app.core.security import hash_password
from app.models import (
    Company,
    CompanyFeedback,
    CompanyMessage,
    CompanyMessageThread,
    CompanyUser,
    DataAccessLog,
    Job,
    Notification,
    Referral,
    Resume,
    Role,
    Tenant,
    User,
    Worker,
    LGPDConsent,
)
from app.schemas.common import (
    CommunicationMessageIn,
    CommunicationMessageOut,
    CommunicationThreadIn,
    CommunicationThreadOut,
    CompanyIn,
    CompanyOut,
    CompanyPortalJobIn,
    CompanyPortalUserIn,
    CompanyPortalUserOut,
    CompanyReferralFeedbackIn,
    CompanyReferralOut,
    DataAccessLogOut,
    FeedbackIn,
    JobIn,
    JobOut,
    NotificationOut,
    ReferralIn,
    ReferralOut,
    ResumeOut,
    SineJobOut,
    SineReferralOut,
    WorkerIn,
    WorkerOut,
    WorkerPortalJobOut,
    WorkerProfileIn,
)
from app.services.audit import audit, log_resume_access
from app.services.resumes import extract_pdf_text, save_pdf_resume

router = APIRouter(tags=["core"])

COMPANY_PENDING_RETURN_STATUSES = {
    "encaminhado",
    "entrevista_agendada",
    "entrevistado",
    "aguardando_retorno",
    "aguardando_retorno_empresa",
}

COMPANY_FINAL_FEEDBACK_STATUSES = {
    "contratado",
    "dispensado",
    "nao_compareceu",
    "banco_futuro",
    "sem_interesse",
}


def tenant_scope(user: User, db: Session) -> UUID:
    if user.tenant_id is None:
        if "super_admin" not in {role.name for role in user.roles}:
            raise HTTPException(
                status_code=400, detail="Informe tenant_id para operacao multi-tenant"
            )
        tenant = db.scalar(
            select(Tenant).where(
                Tenant.slug == get_settings().tenant_default_slug,
                Tenant.is_active.is_(True),
            )
        )
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant padrao nao encontrado")
        return tenant.id
    return user.tenant_id


def require_worker_user(user: User) -> None:
    names = role_names(user)
    if "worker" not in names:
        raise HTTPException(status_code=403, detail="Acesso exclusivo do trabalhador")
    if names.intersection(SINE_ROLES) or "company_user" in names:
        raise HTTPException(
            status_code=403,
            detail="Perfil de trabalhador nao acessa area de empresa ou SINE",
        )


def require_company_user(user: User) -> None:
    names = role_names(user)
    if "company_user" not in names:
        raise HTTPException(status_code=403, detail="Acesso exclusivo da empresa")
    if names.intersection(SINE_ROLES) or "worker" in names:
        raise HTTPException(
            status_code=403,
            detail="Perfil de empresa nao acessa area de trabalhador ou SINE",
        )


def current_worker(db: Session, user: User) -> Worker | None:
    tenant_id = tenant_scope(user, db)
    return db.scalar(
        select(Worker).where(
            Worker.tenant_id == tenant_id,
            Worker.email == user.email,
            Worker.deleted_at.is_(None),
        )
    )


def current_company(db: Session, user: User) -> Company | None:
    tenant_id = tenant_scope(user, db)
    return db.scalar(
        select(Company)
        .join(CompanyUser, CompanyUser.company_id == Company.id)
        .where(
            Company.tenant_id == tenant_id,
            Company.deleted_at.is_(None),
            CompanyUser.user_id == user.id,
        )
    )


def role_names(user: User) -> set[str]:
    return {role.name for role in user.roles}


def is_sine_user(user: User) -> bool:
    return bool(
        role_names(user).intersection(
            {"super_admin", "tenant_admin", "sine_manager", "sine_staff"}
        )
    )


def ensure_portal_role_exclusive(user: User, role: Role) -> None:
    names = role_names(user)
    conflicting_roles = (SINE_ROLES | PORTAL_ROLES) - {role.name}
    if names.intersection(conflicting_roles) or "super_admin" in names:
        raise HTTPException(
            status_code=409,
            detail="Este e-mail ja possui outro perfil de acesso. Use um e-mail exclusivo para a empresa.",
        )
    user.roles = [role]


def notify_sine(db: Session, tenant_id: UUID, title: str, message: str) -> None:
    db.add(
        Notification(tenant_id=tenant_id, user_id=None, title=title, message=message)
    )


def notify_company_users(
    db: Session, tenant_id: UUID, company_id: UUID, title: str, message: str
) -> None:
    user_ids = db.scalars(
        select(CompanyUser.user_id).where(
            CompanyUser.tenant_id == tenant_id, CompanyUser.company_id == company_id
        )
    ).all()
    for user_id in user_ids:
        db.add(
            Notification(
                tenant_id=tenant_id, user_id=user_id, title=title, message=message
            )
        )


def get_company_owned_thread(
    db: Session, tenant_id: UUID, company_id: UUID, thread_id: UUID
) -> CompanyMessageThread:
    thread = db.get(CompanyMessageThread, thread_id)
    if (
        not thread
        or thread.tenant_id != tenant_id
        or thread.company_id != company_id
        or thread.deleted_at is not None
    ):
        raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    return thread


def get_sine_thread(
    db: Session, tenant_id: UUID, thread_id: UUID
) -> CompanyMessageThread:
    thread = db.get(CompanyMessageThread, thread_id)
    if not thread or thread.tenant_id != tenant_id or thread.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    return thread


def validate_thread_context(
    db: Session,
    tenant_id: UUID,
    company_id: UUID,
    job_id: UUID | None = None,
    referral_id: UUID | None = None,
) -> tuple[Job | None, Referral | None, Worker | None, Resume | None]:
    job: Job | None = None
    referral: Referral | None = None
    worker: Worker | None = None
    resume: Resume | None = None
    if job_id:
        job = db.get(Job, job_id)
        if (
            not job
            or job.tenant_id != tenant_id
            or job.company_id != company_id
            or job.deleted_at is not None
        ):
            raise HTTPException(
                status_code=404, detail="Vaga nao encontrada para esta empresa"
            )
    if referral_id:
        referral = db.get(Referral, referral_id)
        if not referral or referral.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Encaminhamento nao encontrado")
        referral_job = db.get(Job, referral.job_id)
        if (
            not referral_job
            or referral_job.company_id != company_id
            or referral_job.tenant_id != tenant_id
        ):
            raise HTTPException(
                status_code=403, detail="Encaminhamento nao pertence a esta empresa"
            )
        job = job or referral_job
        worker = db.get(Worker, referral.worker_id)
        resume = db.get(Resume, referral.resume_id) if referral.resume_id else None
    return job, referral, worker, resume


def get_or_create_referral_thread(
    db: Session,
    tenant_id: UUID,
    company_id: UUID,
    referral: Referral,
    user_id: UUID | None,
    subject: str | None = None,
) -> CompanyMessageThread:
    thread = db.scalar(
        select(CompanyMessageThread).where(
            CompanyMessageThread.tenant_id == tenant_id,
            CompanyMessageThread.company_id == company_id,
            CompanyMessageThread.referral_id == referral.id,
            CompanyMessageThread.deleted_at.is_(None),
        )
    )
    if thread:
        return thread
    job, _referral, worker, resume = validate_thread_context(
        db, tenant_id, company_id, referral.job_id, referral.id
    )
    thread = CompanyMessageThread(
        tenant_id=tenant_id,
        company_id=company_id,
        job_id=job.id if job else referral.job_id,
        referral_id=referral.id,
        created_by_user_id=user_id,
        topic="feedback_contratacao",
        subject=subject
        or f"Encaminhamento: {worker.full_name if worker else 'candidato'} para {job.title if job else 'vaga'}",
        status="aberta",
        priority="normal",
        last_message_at=datetime.now(timezone.utc),
    )
    db.add(thread)
    db.flush()
    if resume:
        details = {
            "resume_id": str(resume.id),
            "resume_filename": resume.original_filename,
            "worker_id": str(referral.worker_id),
            "job_id": str(referral.job_id),
        }
    else:
        details = {"worker_id": str(referral.worker_id), "job_id": str(referral.job_id)}
    db.add(
        CompanyMessage(
            tenant_id=tenant_id,
            thread_id=thread.id,
            sender_user_id=user_id,
            sender_role="sine",
            message_type="referral_sent",
            body="Candidato encaminhado oficialmente pelo SINE para avaliacao da empresa.",
            details=details,
        )
    )
    return thread


def add_thread_message(
    db: Session,
    thread: CompanyMessageThread,
    user: User,
    sender_role: str,
    body: str,
    message_type: str = "message",
    details: dict | None = None,
) -> CompanyMessage:
    now = datetime.now(timezone.utc)
    message = CompanyMessage(
        tenant_id=thread.tenant_id,
        thread_id=thread.id,
        sender_user_id=user.id,
        sender_role=sender_role,
        message_type=message_type,
        body=body,
        details=details,
    )
    thread.last_message_at = now
    if sender_role == "company":
        thread.company_last_read_at = now
    else:
        thread.sine_last_read_at = now
    db.add(message)
    db.flush()
    return message


def thread_rows_query(tenant_id: UUID):
    return (
        select(CompanyMessageThread, Company, Job, Referral, Worker, Resume)
        .join(Company, Company.id == CompanyMessageThread.company_id)
        .outerjoin(Job, Job.id == CompanyMessageThread.job_id)
        .outerjoin(Referral, Referral.id == CompanyMessageThread.referral_id)
        .outerjoin(Worker, Worker.id == Referral.worker_id)
        .outerjoin(Resume, Resume.id == Referral.resume_id)
        .where(
            CompanyMessageThread.tenant_id == tenant_id,
            CompanyMessageThread.deleted_at.is_(None),
        )
        .order_by(
            CompanyMessageThread.last_message_at.desc().nullslast(),
            CompanyMessageThread.created_at.desc(),
        )
    )


def serialize_thread(
    thread: CompanyMessageThread,
    company: Company,
    job: Job | None,
    referral: Referral | None,
    worker: Worker | None,
    resume: Resume | None,
) -> CommunicationThreadOut:
    return CommunicationThreadOut(
        id=thread.id,
        company_id=company.id,
        company_name=company.trade_name or company.legal_name,
        job_id=job.id if job else None,
        job_title=job.title if job else None,
        referral_id=referral.id if referral else None,
        worker_name=worker.full_name if worker else None,
        resume_id=resume.id if resume else None,
        resume_filename=resume.original_filename if resume else None,
        topic=thread.topic,
        subject=thread.subject,
        status=thread.status,
        priority=thread.priority,
        last_message_at=thread.last_message_at,
        created_at=thread.created_at,
    )


def serialize_message(
    message: CompanyMessage, sender: User | None
) -> CommunicationMessageOut:
    return CommunicationMessageOut(
        id=message.id,
        thread_id=message.thread_id,
        sender_user_id=message.sender_user_id,
        sender_name=sender.full_name if sender else None,
        sender_role=message.sender_role,
        message_type=message.message_type,
        body=message.body,
        details=message.details,
        created_at=message.created_at,
    )


def company_pending_return_count(db: Session, tenant_id: UUID, company_id: UUID) -> int:
    waiting_referrals = (
        db.scalar(
            select(func.count())
            .select_from(Referral)
            .join(Job, Job.id == Referral.job_id)
            .where(
                Referral.tenant_id == tenant_id,
                Job.company_id == company_id,
                Referral.status.in_(COMPANY_PENDING_RETURN_STATUSES),
            )
        )
        or 0
    )
    return waiting_referrals


def company_pending_return_details(
    db: Session, tenant_id: UUID, company_id: UUID
) -> list[dict]:
    rows = db.execute(
        select(Referral, Job, Worker)
        .join(Job, Job.id == Referral.job_id)
        .join(Worker, Worker.id == Referral.worker_id)
        .where(
            Referral.tenant_id == tenant_id,
            Job.company_id == company_id,
            Referral.status.in_(COMPANY_PENDING_RETURN_STATUSES),
        )
        .order_by(Referral.created_at.desc())
    ).all()
    return [
        {
            "referral_id": str(referral.id),
            "job_id": str(job.id),
            "job_title": job.title,
            "worker_name": worker.full_name,
            "status": referral.status,
            "created_at": (
                referral.created_at.isoformat() if referral.created_at else None
            ),
        }
        for referral, job, worker in rows
    ]


def sync_job_return_status(db: Session, tenant_id: UUID, job: Job) -> None:
    pending = (
        db.scalar(
            select(func.count())
            .select_from(Referral)
            .where(
                Referral.tenant_id == tenant_id,
                Referral.job_id == job.id,
                Referral.status.in_(COMPANY_PENDING_RETURN_STATUSES),
            )
        )
        or 0
    )
    if pending:
        job.status = "aguardando_retorno_empresa"
    elif job.status == "aguardando_retorno_empresa":
        job.status = "retorno_registrado"


def get_worker_open_job(db: Session, tenant_id: UUID, job_id: UUID) -> Job:
    job = db.get(Job, job_id)
    if (
        not job
        or job.tenant_id != tenant_id
        or job.deleted_at is not None
        or job.status
        not in ["aprovada", "publicada", "em_triagem", "encaminhando_candidatos"]
    ):
        raise HTTPException(
            status_code=404,
            detail="Selecione uma vaga aberta antes de enviar o curriculo",
        )
    return job


def create_or_update_worker_application(
    db: Session,
    tenant_id: UUID,
    user: User,
    worker: Worker,
    job: Job,
    request: Request,
    resume: Resume | None = None,
) -> Referral:
    referral = db.scalar(
        select(Referral).where(
            Referral.tenant_id == tenant_id,
            Referral.job_id == job.id,
            Referral.worker_id == worker.id,
            Referral.status == "candidatura_trabalhador",
        )
    )
    if referral:
        if resume:
            referral.resume_id = resume.id
            notify_sine(
                db,
                tenant_id,
                "Curriculo atualizado pelo candidato",
                f"{worker.full_name} atualizou o curriculo para a vaga {job.title}.",
            )
        return referral
    referral = Referral(
        tenant_id=tenant_id,
        job_id=job.id,
        worker_id=worker.id,
        resume_id=resume.id if resume else None,
        referred_by_user_id=user.id,
        status="candidatura_trabalhador",
        notes="Candidatura realizada pelo Portal do Trabalhador",
    )
    db.add(referral)
    db.flush()
    notify_sine(
        db,
        tenant_id,
        "Nova candidatura de trabalhador",
        f"{worker.full_name} demonstrou interesse na vaga {job.title}.",
    )
    audit(
        db,
        tenant_id,
        user.id,
        "worker.apply_job",
        "Referral",
        referral.id,
        {
            "job_id": str(job.id),
            "worker_id": str(worker.id),
            "resume_id": str(resume.id) if resume else None,
        },
        request.client.host if request.client else None,
    )
    return referral


@router.get(
    "/companies",
    response_model=list[CompanyOut],
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def list_companies(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return db.scalars(
        select(Company)
        .where(
            Company.tenant_id == tenant_scope(user, db), Company.deleted_at.is_(None)
        )
        .order_by(Company.created_at.desc())
    ).all()


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
    data = payload.model_dump()
    if not data["lgpd_accepted"]:
        raise HTTPException(
            status_code=400, detail="Aceite LGPD obrigatorio para cadastrar a empresa"
        )
    data["lgpd_accepted_at"] = datetime.now(timezone.utc)
    company = Company(tenant_id=tenant_scope(user, db), **data)
    db.add(company)
    db.flush()
    audit(
        db,
        company.tenant_id,
        user.id,
        "company.create",
        "Company",
        company.id,
        {"lgpd_accepted": True},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(company)
    return company


@router.post(
    "/companies/{company_id}/portal-user",
    response_model=CompanyPortalUserOut,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
def create_company_portal_user(
    company_id: UUID,
    payload: CompanyPortalUserIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    company = db.get(Company, company_id)
    if not company or company.tenant_id != tenant_id or company.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    role = db.scalar(select(Role).where(Role.name == "company_user"))
    if not role:
        raise HTTPException(
            status_code=500, detail="Perfil company_user nao configurado"
        )
    email = payload.email.lower()
    portal_user = db.scalar(select(User).where(User.email == email))
    temporary_password: str | None = None
    created = False
    if portal_user:
        if portal_user.tenant_id not in (None, tenant_id):
            raise HTTPException(
                status_code=409, detail="Usuario ja pertence a outro tenant"
            )
        portal_user.tenant_id = tenant_id
        portal_user.full_name = payload.full_name
        portal_user.is_active = True
    else:
        temporary_password = secrets.token_urlsafe(12)
        portal_user = User(
            tenant_id=tenant_id,
            email=email,
            full_name=payload.full_name,
            password_hash=hash_password(temporary_password),
            is_active=True,
        )
        db.add(portal_user)
        created = True
    ensure_portal_role_exclusive(portal_user, role)
    db.flush()
    link = db.scalar(
        select(CompanyUser).where(
            CompanyUser.tenant_id == tenant_id,
            CompanyUser.company_id == company.id,
            CompanyUser.user_id == portal_user.id,
        )
    )
    if not link:
        db.add(
            CompanyUser(
                tenant_id=tenant_id,
                company_id=company.id,
                user_id=portal_user.id,
                position=payload.position,
            )
        )
    elif payload.position:
        link.position = payload.position
    audit(
        db,
        tenant_id,
        user.id,
        "company.portal_user.create",
        "User",
        portal_user.id,
        {"company_id": str(company.id), "created": created},
        request.client.host if request.client else None,
    )
    db.commit()
    return CompanyPortalUserOut(
        user_id=portal_user.id,
        company_id=company.id,
        email=portal_user.email,
        full_name=portal_user.full_name,
        temporary_password=temporary_password,
        created=created,
    )


@router.get(
    "/workers",
    response_model=list[WorkerOut],
    dependencies=[Depends(require_permissions("workers:manage"))],
)
def list_workers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Worker)
        .where(Worker.tenant_id == tenant_scope(user, db), Worker.deleted_at.is_(None))
        .order_by(Worker.created_at.desc())
    ).all()


@router.post(
    "/workers",
    response_model=WorkerOut,
    dependencies=[Depends(require_permissions("workers:manage"))],
)
def create_worker(
    payload: WorkerIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    if data["lgpd_accepted"]:
        data["lgpd_accepted_at"] = datetime.now(timezone.utc)
    worker = Worker(tenant_id=tenant_scope(user, db), **data)
    db.add(worker)
    db.flush()
    if worker.lgpd_accepted:
        db.add(
            LGPDConsent(
                tenant_id=worker.tenant_id,
                worker_id=worker.id,
                consent_type="cadastro_trabalhador",
                consent_text="Consentimento para tratamento de dados na intermediacao de mao de obra.",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                version="2026-05-18",
            )
        )
    audit(
        db,
        worker.tenant_id,
        user.id,
        "worker.create",
        "Worker",
        worker.id,
        {
            "sensitive_fields": (
                ["has_disability"] if worker.has_disability is not None else []
            )
        },
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(worker)
    return worker


@router.get(
    "/jobs",
    response_model=list[SineJobOut],
    dependencies=[Depends(require_permissions("jobs:manage"))],
)
def list_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    rows = db.execute(
        select(Job, Company)
        .join(Company, Company.id == Job.company_id)
        .where(
            Job.tenant_id == tenant_id,
            Job.deleted_at.is_(None),
            Company.deleted_at.is_(None),
        )
        .order_by(Job.created_at.desc())
    ).all()
    return [
        SineJobOut(
            **{
                **JobOut.model_validate(job).model_dump(),
                "company_name": company.trade_name or company.legal_name,
                "company_legal_name": company.legal_name,
                "company_trade_name": company.trade_name,
                "company_cnpj": company.cnpj,
                "company_email": company.email,
                "company_phone": company.phone,
                "company_whatsapp": company.whatsapp,
                "company_responsible_name": company.responsible_name
                or company.hr_responsible_name,
            }
        )
        for job, company in rows
    ]


@router.post(
    "/jobs",
    response_model=JobOut,
    dependencies=[Depends(require_permissions("jobs:manage"))],
)
def create_job(
    payload: JobIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    company = db.get(Company, payload.company_id)
    if not company or company.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    job = Job(tenant_id=tenant_id, **payload.model_dump())
    db.add(job)
    db.flush()
    audit(
        db,
        tenant_id,
        user.id,
        "job.create",
        "Job",
        job.id,
        {"is_confidential": job.is_confidential},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(job)
    return job


@router.get(
    "/company-portal/profile",
    response_model=CompanyOut | None,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def company_portal_profile(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_company_user(user)
    return current_company(db, user)


@router.put(
    "/company-portal/profile",
    response_model=CompanyOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def save_company_portal_profile(
    payload: CompanyIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    data = payload.model_dump()
    if not data["lgpd_accepted"]:
        raise HTTPException(
            status_code=400,
            detail="Aceite LGPD obrigatorio para salvar o cadastro da empresa",
        )
    company = current_company(db, user)
    existing = db.scalar(
        select(Company).where(
            Company.tenant_id == tenant_id,
            Company.cnpj == data["cnpj"],
            Company.deleted_at.is_(None),
        )
    )
    if existing and (not company or existing.id != company.id):
        if existing.email and existing.email.lower() == user.email.lower():
            company = existing
            db.add(
                CompanyUser(
                    tenant_id=tenant_id,
                    company_id=company.id,
                    user_id=user.id,
                    position="Responsavel pelo RH",
                )
            )
        else:
            raise HTTPException(
                status_code=409, detail="CNPJ ja cadastrado para outra empresa"
            )
    if company:
        for key, value in data.items():
            setattr(company, key, value)
    else:
        company = Company(tenant_id=tenant_id, **data)
        db.add(company)
        db.flush()
        db.add(
            CompanyUser(
                tenant_id=tenant_id,
                company_id=company.id,
                user_id=user.id,
                position="Responsavel pelo RH",
            )
        )
    if company.lgpd_accepted and not company.lgpd_accepted_at:
        company.lgpd_accepted_at = datetime.now(timezone.utc)
    db.flush()
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.profile.save",
        "Company",
        company.id,
        {"lgpd_accepted": True},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(company)
    return company


@router.get(
    "/company-portal/jobs",
    response_model=list[JobOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
def list_company_portal_jobs(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        return []
    return db.scalars(
        select(Job)
        .where(
            Job.tenant_id == tenant_id,
            Job.company_id == company.id,
            Job.deleted_at.is_(None),
        )
        .order_by(Job.created_at.desc())
    ).all()


@router.get(
    "/company-portal/status",
    dependencies=[Depends(require_permissions("company:portal"))],
)
def company_portal_status(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    pending_returns = (
        company_pending_return_count(db, tenant_id, company.id) if company else 0
    )
    pending_feedbacks = (
        company_pending_return_details(db, tenant_id, company.id) if company else []
    )
    return {
        "profile_complete": bool(company and company.lgpd_accepted),
        "pending_returns": pending_returns,
        "pending_feedbacks": pending_feedbacks,
        "can_open_job": bool(
            company and company.lgpd_accepted and pending_returns == 0
        ),
        "blocking_reason": (
            "Registre o feedback final da contratacao ou nao contratacao anterior para liberar novas vagas."
            if pending_returns
            else None
        ),
        "ai_scope": "A IA auxilia exclusivamente os colaboradores do SINE na triagem. A empresa registra vagas e retornos, sem decisao automatizada.",
    }


@router.post(
    "/company-portal/jobs",
    response_model=JobOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def create_company_portal_job(
    payload: CompanyPortalJobIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(
            status_code=400,
            detail="Complete o cadastro da empresa antes de abrir vagas",
        )
    if not company.lgpd_accepted:
        raise HTTPException(
            status_code=400, detail="Aceite LGPD obrigatorio para abrir vagas"
        )
    pending_returns = company_pending_return_count(db, tenant_id, company.id)
    if pending_returns:
        raise HTTPException(
            status_code=409,
            detail="Empresa bloqueada: registre o feedback final da contratacao ou nao contratacao anterior antes de abrir uma nova vaga",
        )
    job = Job(
        tenant_id=tenant_id,
        company_id=company.id,
        status="solicitada",
        **payload.model_dump(),
    )
    db.add(job)
    db.flush()
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.job.request",
        "Job",
        job.id,
        {
            "company_id": str(company.id),
            "ai_scope": "sine_only",
            "is_confidential": job.is_confidential,
        },
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(job)
    return job


@router.patch(
    "/company-portal/jobs/{job_id}",
    response_model=JobOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def update_company_portal_job(
    job_id: UUID,
    payload: CompanyPortalJobIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(status_code=400, detail="Cadastro da empresa nao encontrado")
    job = db.get(Job, job_id)
    if (
        not job
        or job.tenant_id != tenant_id
        or job.company_id != company.id
        or job.deleted_at is not None
    ):
        raise HTTPException(status_code=404, detail="Vaga nao encontrada")
    if job.status in {"encerrada", "cancelada"}:
        raise HTTPException(status_code=409, detail="Vaga encerrada nao pode ser editada")
    previous_confidentiality = job.is_confidential
    for key, value in payload.model_dump().items():
        setattr(job, key, value)
    audit_details = {"job_id": str(job.id)}
    if previous_confidentiality != job.is_confidential:
        audit_details["is_confidential"] = job.is_confidential
        audit_details["previous_is_confidential"] = previous_confidentiality
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.job.update",
        "Job",
        job.id,
        audit_details,
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(job)
    return job


@router.get(
    "/company-portal/referrals",
    response_model=list[CompanyReferralOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
def list_company_portal_referrals(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        return []
    rows = db.execute(
        select(Referral, Job, Worker, Resume)
        .join(Job, Job.id == Referral.job_id)
        .join(Worker, Worker.id == Referral.worker_id)
        .outerjoin(Resume, Resume.id == Referral.resume_id)
        .where(Referral.tenant_id == tenant_id, Job.company_id == company.id)
        .where(
            Referral.status.in_(
                [
                    "encaminhado",
                    "entrevista_agendada",
                    "aguardando_retorno_empresa",
                    "contratado",
                    "nao_contratado",
                    "nao_selecionado",
                ]
            )
        )
        .order_by(Referral.created_at.desc())
    ).all()
    for referral, _job, worker, resume in rows:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id,
            resume.id if resume else None,
            "company_referral_view",
            "Empresa visualizou encaminhamento enviado pelo SINE",
            request.client.host if request.client else None,
        )
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.referrals.list",
        "Company",
        company.id,
        {"count": len(rows)},
        request.client.host if request.client else None,
    )
    db.commit()
    return [
        CompanyReferralOut(
            id=referral.id,
            job_id=job.id,
            job_title=job.title,
            worker_id=worker.id,
            worker_name=worker.full_name,
            worker_email=worker.email,
            worker_phone=worker.phone,
            worker_whatsapp=worker.whatsapp,
            resume_id=resume.id if resume else None,
            resume_filename=resume.original_filename if resume else None,
            status=referral.status,
            match_score=referral.match_score,
            notes=referral.notes,
            created_at=referral.created_at,
        )
        for referral, job, worker, resume in rows
    ]


@router.post(
    "/company-portal/referrals/{referral_id}/feedback",
    dependencies=[Depends(require_permissions("company:portal"))],
)
def create_company_portal_feedback(
    referral_id: UUID,
    payload: CompanyReferralFeedbackIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(
            status_code=400, detail="Cadastro da empresa nao encontrado"
        )
    referral = db.get(Referral, referral_id)
    if not referral or referral.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Encaminhamento nao encontrado")
    job = db.get(Job, referral.job_id)
    if not job or job.company_id != company.id:
        raise HTTPException(
            status_code=403, detail="Encaminhamento nao pertence a esta empresa"
        )
    feedback = CompanyFeedback(
        tenant_id=tenant_id,
        referral_id=referral.id,
        company_id=company.id,
        status=payload.status,
        comments=payload.comments,
    )
    referral.status = payload.status
    sync_job_return_status(db, tenant_id, job)
    db.add(feedback)
    thread = get_or_create_referral_thread(db, tenant_id, company.id, referral, user.id)
    add_thread_message(
        db,
        thread,
        user,
        "company",
        payload.comments or f"Empresa registrou retorno: {payload.status}",
        "feedback",
        {"feedback_status": payload.status, "referral_id": str(referral.id)},
    )
    notify_sine(
        db,
        tenant_id,
        "Feedback de contratacao recebido",
        f"{company.trade_name or company.legal_name} registrou {payload.status} para um candidato encaminhado.",
    )
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.feedback.create",
        "Referral",
        referral.id,
        {"company_id": str(company.id), "status": payload.status},
        request.client.host if request.client else None,
    )
    db.commit()
    return {"status": "ok"}


@router.post(
    "/resumes/{worker_id}",
    response_model=ResumeOut,
    dependencies=[Depends(require_permissions("workers:manage"))],
)
async def upload_resume(
    worker_id: UUID,
    file: UploadFile,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    worker = db.get(Worker, worker_id)
    if not worker or worker.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    tenant = db.get(Tenant, tenant_id)
    stored, path, size = await save_pdf_resume(file, tenant.slug)
    text = extract_pdf_text(path)
    analysis = get_ai_provider().analyze_resume(text).__dict__
    resume = Resume(
        tenant_id=tenant_id,
        worker_id=worker.id,
        original_filename=file.filename,
        stored_filename=stored,
        file_path=str(path),
        mime_type="application/pdf",
        size_bytes=size,
        extracted_text=text,
        analysis=analysis,
        status="analisado",
    )
    db.add(resume)
    db.flush()
    log_resume_access(
        db,
        tenant_id,
        user.id,
        worker.id,
        resume.id,
        "upload_and_analyze",
        "Upload de curriculo pelo SINE",
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(resume)
    return resume


@router.get(
    "/resumes/{resume_id}",
    response_model=ResumeOut,
    dependencies=[Depends(require_permissions("resumes:view"))],
)
def get_resume(
    resume_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    resume = db.get(Resume, resume_id)
    if not resume or resume.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Curriculo nao encontrado")
    log_resume_access(
        db,
        tenant_id,
        user.id,
        resume.worker_id,
        resume.id,
        "view",
        "Visualizacao de curriculo",
        request.client.host if request.client else None,
    )
    db.commit()
    return resume


@router.post(
    "/ai/match/{resume_id}/{job_id}",
    dependencies=[Depends(require_permissions("resumes:view"))],
)
def match_resume(
    resume_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    resume = db.get(Resume, resume_id)
    job = db.get(Job, job_id)
    if (
        not resume
        or not job
        or resume.tenant_id != tenant_id
        or job.tenant_id != tenant_id
    ):
        raise HTTPException(status_code=404, detail="Dados nao encontrados")
    return (
        get_ai_provider()
        .match_candidate_to_job(
            resume.extracted_text or "",
            {
                "title": job.title,
                "description": job.description,
                "required_experience": job.required_experience,
                "desired_courses": job.desired_courses,
            },
        )
        .__dict__
    )


@router.post(
    "/referrals",
    response_model=ReferralOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def create_referral(
    payload: ReferralIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    job = db.get(Job, payload.job_id)
    worker = db.get(Worker, payload.worker_id)
    if (
        not job
        or not worker
        or job.tenant_id != tenant_id
        or worker.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=404, detail="Vaga ou trabalhador nao encontrado"
        )
    resume = db.get(Resume, payload.resume_id) if payload.resume_id else None
    if resume and (resume.tenant_id != tenant_id or resume.worker_id != worker.id):
        raise HTTPException(
            status_code=404, detail="Curriculo nao pertence ao trabalhador informado"
        )
    referral = Referral(
        tenant_id=tenant_id, referred_by_user_id=user.id, **payload.model_dump()
    )
    db.add(referral)
    db.flush()
    sync_job_return_status(db, tenant_id, job)
    get_or_create_referral_thread(db, tenant_id, job.company_id, referral, user.id)
    if resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id,
            resume.id,
            "referral_send_to_company",
            "Curriculo escolhido pelo SINE e vinculado ao encaminhamento para empresa",
            request.client.host if request.client else None,
        )
    audit(
        db,
        tenant_id,
        user.id,
        "referral.create",
        "Referral",
        referral.id,
        {
            "company_id": str(job.company_id),
            "job_id": str(job.id),
            "worker_id": str(worker.id),
            "resume_id": str(resume.id) if resume else None,
        },
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(referral)
    return referral


@router.get(
    "/referrals",
    response_model=list[SineReferralOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def list_referrals(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    rows = db.execute(
        select(Referral, Job, Company, Worker, Resume)
        .join(Job, Job.id == Referral.job_id)
        .join(Company, Company.id == Job.company_id)
        .join(Worker, Worker.id == Referral.worker_id)
        .outerjoin(Resume, Resume.id == Referral.resume_id)
        .where(Referral.tenant_id == tenant_id)
        .order_by(Referral.created_at.desc())
    ).all()
    audit(
        db,
        tenant_id,
        user.id,
        "referrals.list",
        "Referral",
        None,
        {"count": len(rows)},
        request.client.host if request.client else None,
    )
    db.commit()
    return [
        SineReferralOut(
            id=referral.id,
            job_id=job.id,
            job_title=job.title,
            company_id=company.id,
            company_name=company.trade_name or company.legal_name,
            worker_id=worker.id,
            worker_name=worker.full_name,
            worker_email=worker.email,
            worker_phone=worker.phone,
            worker_whatsapp=worker.whatsapp,
            resume_id=resume.id if resume else None,
            resume_filename=resume.original_filename if resume else None,
            status=referral.status,
            match_score=referral.match_score,
            notes=referral.notes,
            triage_notes=referral.triage_notes,
            created_at=referral.created_at,
            referred_at=referral.referred_at,
        )
        for referral, job, company, worker, resume in rows
    ]


@router.post(
    "/feedback", dependencies=[Depends(require_permissions("referrals:manage"))]
)
def create_feedback(
    payload: FeedbackIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    referral = db.get(Referral, payload.referral_id)
    if not referral or referral.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Encaminhamento nao encontrado")
    feedback = CompanyFeedback(tenant_id=tenant_id, **payload.model_dump())
    referral.status = payload.status
    db.add(feedback)
    job = db.get(Job, referral.job_id)
    if job:
        sync_job_return_status(db, tenant_id, job)
        thread = get_or_create_referral_thread(
            db, tenant_id, job.company_id, referral, user.id
        )
        add_thread_message(
            db,
            thread,
            user,
            "sine",
            payload.comments or f"SINE registrou feedback: {payload.status}",
            "feedback",
            {"feedback_status": payload.status, "referral_id": str(referral.id)},
        )
        notify_company_users(
            db,
            tenant_id,
            job.company_id,
            "Feedback registrado pelo SINE",
            f"O SINE atualizou um encaminhamento da vaga {job.title}.",
        )
    db.commit()
    return {"status": "ok"}


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    tenant_id = tenant_scope(user, db)
    query = select(Notification).where(Notification.tenant_id == tenant_id)
    if is_sine_user(user):
        query = query.where(
            (Notification.user_id == user.id) | (Notification.user_id.is_(None))
        )
    else:
        query = query.where(Notification.user_id == user.id)
    return db.scalars(query.order_by(Notification.created_at.desc()).limit(30)).all()


@router.get("/notifications/summary")
def notifications_summary(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    tenant_id = tenant_scope(user, db)
    query = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.tenant_id == tenant_id, Notification.read_at.is_(None))
    )
    if is_sine_user(user):
        query = query.where(
            (Notification.user_id == user.id) | (Notification.user_id.is_(None))
        )
    else:
        query = query.where(Notification.user_id == user.id)
    return {"unread": db.scalar(query) or 0}


@router.post("/notifications/read-all")
def read_all_notifications(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    tenant_id = tenant_scope(user, db)
    now = datetime.now(timezone.utc)
    query = select(Notification).where(
        Notification.tenant_id == tenant_id, Notification.read_at.is_(None)
    )
    if is_sine_user(user):
        query = query.where(
            (Notification.user_id == user.id) | (Notification.user_id.is_(None))
        )
    else:
        query = query.where(Notification.user_id == user.id)
    for notification in db.scalars(query).all():
        notification.read_at = now
    db.commit()
    return {"status": "ok"}


@router.get(
    "/communication/threads",
    response_model=list[CommunicationThreadOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def list_sine_threads(
    company_id: UUID | None = None,
    job_id: UUID | None = None,
    referral_id: UUID | None = None,
    topic: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    query = thread_rows_query(tenant_id)
    if company_id:
        query = query.where(CompanyMessageThread.company_id == company_id)
    if job_id:
        query = query.where(CompanyMessageThread.job_id == job_id)
    if referral_id:
        query = query.where(CompanyMessageThread.referral_id == referral_id)
    if topic:
        query = query.where(CompanyMessageThread.topic == topic)
    if status:
        query = query.where(CompanyMessageThread.status == status)
    rows = db.execute(query.limit(200)).all()
    return [
        serialize_thread(thread, company, job, referral, worker, resume)
        for thread, company, job, referral, worker, resume in rows
    ]


@router.post(
    "/communication/threads",
    response_model=CommunicationThreadOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def create_sine_thread(
    payload: CommunicationThreadIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    if not payload.company_id:
        raise HTTPException(
            status_code=400, detail="Informe a empresa para iniciar a conversa"
        )
    company = db.get(Company, payload.company_id)
    if not company or company.tenant_id != tenant_id or company.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    job, referral, worker, resume = validate_thread_context(
        db, tenant_id, company.id, payload.job_id, payload.referral_id
    )
    thread = CompanyMessageThread(
        tenant_id=tenant_id,
        company_id=company.id,
        job_id=job.id if job else None,
        referral_id=referral.id if referral else None,
        created_by_user_id=user.id,
        topic=payload.topic,
        subject=payload.subject,
        status="aberta",
        priority=payload.priority,
        last_message_at=datetime.now(timezone.utc),
        sine_last_read_at=datetime.now(timezone.utc),
    )
    db.add(thread)
    db.flush()
    add_thread_message(
        db,
        thread,
        user,
        "sine",
        payload.body,
        details={
            "job_id": str(job.id) if job else None,
            "referral_id": str(referral.id) if referral else None,
        },
    )
    notify_company_users(
        db,
        tenant_id,
        company.id,
        "Nova mensagem do SINE",
        f"{payload.subject}: {payload.body[:140]}",
    )
    if referral and resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id if worker else None,
            resume.id,
            "sine_thread_create_referral_context",
            "SINE abriu conversa vinculada a curriculo encaminhado",
            request.client.host if request.client else None,
        )
    audit(
        db,
        tenant_id,
        user.id,
        "communication.thread.create",
        "CompanyMessageThread",
        thread.id,
        {
            "company_id": str(company.id),
            "job_id": str(job.id) if job else None,
            "referral_id": str(referral.id) if referral else None,
            "topic": payload.topic,
        },
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(thread)
    return serialize_thread(thread, company, job, referral, worker, resume)


@router.get(
    "/communication/threads/{thread_id}/messages",
    response_model=list[CommunicationMessageOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def list_sine_thread_messages(
    thread_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    thread = get_sine_thread(db, tenant_id, thread_id)
    thread.sine_last_read_at = datetime.now(timezone.utc)
    rows = db.execute(
        select(CompanyMessage, User)
        .outerjoin(User, User.id == CompanyMessage.sender_user_id)
        .where(
            CompanyMessage.tenant_id == tenant_id, CompanyMessage.thread_id == thread.id
        )
        .order_by(CompanyMessage.created_at.asc())
    ).all()
    if thread.referral_id:
        referral = db.get(Referral, thread.referral_id)
        resume = (
            db.get(Resume, referral.resume_id)
            if referral and referral.resume_id
            else None
        )
        if referral and resume:
            log_resume_access(
                db,
                tenant_id,
                user.id,
                referral.worker_id,
                resume.id,
                "sine_thread_view_referral_context",
                "SINE visualizou conversa vinculada a curriculo encaminhado",
                request.client.host if request.client else None,
            )
    audit(
        db,
        tenant_id,
        user.id,
        "communication.thread.view",
        "CompanyMessageThread",
        thread.id,
        {"side": "sine"},
        request.client.host if request.client else None,
    )
    db.commit()
    return [serialize_message(message, sender) for message, sender in rows]


@router.post(
    "/communication/threads/{thread_id}/messages",
    response_model=CommunicationMessageOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
def create_sine_thread_message(
    thread_id: UUID,
    payload: CommunicationMessageIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = tenant_scope(user, db)
    thread = get_sine_thread(db, tenant_id, thread_id)
    message = add_thread_message(db, thread, user, "sine", payload.body)
    notify_company_users(
        db,
        tenant_id,
        thread.company_id,
        "Nova resposta do SINE",
        f"{thread.subject}: {payload.body[:140]}",
    )
    audit(
        db,
        tenant_id,
        user.id,
        "communication.message.create",
        "CompanyMessage",
        message.id,
        {"thread_id": str(thread.id), "side": "sine"},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(message)
    return serialize_message(message, user)


@router.get(
    "/company-portal/communication/threads",
    response_model=list[CommunicationThreadOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
def list_company_threads(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        return []
    rows = db.execute(
        thread_rows_query(tenant_id)
        .where(CompanyMessageThread.company_id == company.id)
        .limit(200)
    ).all()
    return [
        serialize_thread(thread, company_row, job, referral, worker, resume)
        for thread, company_row, job, referral, worker, resume in rows
    ]


@router.post(
    "/company-portal/communication/threads",
    response_model=CommunicationThreadOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def create_company_thread(
    payload: CommunicationThreadIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(
            status_code=400, detail="Cadastro da empresa nao encontrado"
        )
    job, referral, worker, resume = validate_thread_context(
        db, tenant_id, company.id, payload.job_id, payload.referral_id
    )
    thread = CompanyMessageThread(
        tenant_id=tenant_id,
        company_id=company.id,
        job_id=job.id if job else None,
        referral_id=referral.id if referral else None,
        created_by_user_id=user.id,
        topic=payload.topic,
        subject=payload.subject,
        status="aberta",
        priority=payload.priority,
        last_message_at=datetime.now(timezone.utc),
        company_last_read_at=datetime.now(timezone.utc),
    )
    db.add(thread)
    db.flush()
    add_thread_message(
        db,
        thread,
        user,
        "company",
        payload.body,
        details={
            "job_id": str(job.id) if job else None,
            "referral_id": str(referral.id) if referral else None,
        },
    )
    notify_sine(
        db,
        tenant_id,
        "Nova mensagem de empresa",
        f"{company.trade_name or company.legal_name}: {payload.subject}",
    )
    if referral and resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id if worker else None,
            resume.id,
            "company_thread_create_referral_context",
            "Empresa abriu conversa sobre curriculo encaminhado",
            request.client.host if request.client else None,
        )
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.communication.thread.create",
        "CompanyMessageThread",
        thread.id,
        {
            "company_id": str(company.id),
            "job_id": str(job.id) if job else None,
            "referral_id": str(referral.id) if referral else None,
            "topic": payload.topic,
        },
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(thread)
    return serialize_thread(thread, company, job, referral, worker, resume)


@router.get(
    "/company-portal/communication/threads/{thread_id}/messages",
    response_model=list[CommunicationMessageOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
def list_company_thread_messages(
    thread_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(
            status_code=400, detail="Cadastro da empresa nao encontrado"
        )
    thread = get_company_owned_thread(db, tenant_id, company.id, thread_id)
    thread.company_last_read_at = datetime.now(timezone.utc)
    rows = db.execute(
        select(CompanyMessage, User)
        .outerjoin(User, User.id == CompanyMessage.sender_user_id)
        .where(
            CompanyMessage.tenant_id == tenant_id, CompanyMessage.thread_id == thread.id
        )
        .order_by(CompanyMessage.created_at.asc())
    ).all()
    if thread.referral_id:
        referral = db.get(Referral, thread.referral_id)
        resume = (
            db.get(Resume, referral.resume_id)
            if referral and referral.resume_id
            else None
        )
        if referral and resume:
            log_resume_access(
                db,
                tenant_id,
                user.id,
                referral.worker_id,
                resume.id,
                "company_thread_view_referral_context",
                "Empresa visualizou conversa vinculada a curriculo encaminhado",
                request.client.host if request.client else None,
            )
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.communication.thread.view",
        "CompanyMessageThread",
        thread.id,
        {"company_id": str(company.id)},
        request.client.host if request.client else None,
    )
    db.commit()
    return [serialize_message(message, sender) for message, sender in rows]


@router.post(
    "/company-portal/communication/threads/{thread_id}/messages",
    response_model=CommunicationMessageOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
def create_company_thread_message(
    thread_id: UUID,
    payload: CommunicationMessageIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_company_user(user)
    tenant_id = tenant_scope(user, db)
    company = current_company(db, user)
    if not company:
        raise HTTPException(
            status_code=400, detail="Cadastro da empresa nao encontrado"
        )
    thread = get_company_owned_thread(db, tenant_id, company.id, thread_id)
    message = add_thread_message(db, thread, user, "company", payload.body)
    notify_sine(
        db,
        tenant_id,
        "Nova resposta de empresa",
        f"{company.trade_name or company.legal_name} respondeu em {thread.subject}.",
    )
    audit(
        db,
        tenant_id,
        user.id,
        "company_portal.communication.message.create",
        "CompanyMessage",
        message.id,
        {"thread_id": str(thread.id), "company_id": str(company.id)},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(message)
    return serialize_message(message, user)


@router.get(
    "/reports/summary", dependencies=[Depends(require_permissions("reports:view"))]
)
def reports_summary(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    tenant_id = tenant_scope(user, db)
    return {
        "vagas_solicitadas": db.scalar(
            select(func.count())
            .select_from(Job)
            .where(Job.tenant_id == tenant_id, Job.status == "solicitada")
        ),
        "vagas_em_analise": db.scalar(
            select(func.count())
            .select_from(Job)
            .where(Job.tenant_id == tenant_id, Job.status == "em_analise")
        ),
        "vagas_ativas": db.scalar(
            select(func.count())
            .select_from(Job)
            .where(
                Job.tenant_id == tenant_id,
                Job.status.in_(
                    ["aprovada", "publicada", "em_triagem", "encaminhando_candidatos"]
                ),
            )
        ),
        "candidatos_cadastrados": db.scalar(
            select(func.count())
            .select_from(Worker)
            .where(Worker.tenant_id == tenant_id)
        ),
        "curriculos_pendentes": db.scalar(
            select(func.count())
            .select_from(Resume)
            .where(Resume.tenant_id == tenant_id, Resume.status == "pendente_analise")
        ),
        "encaminhamentos_mes": db.scalar(
            select(func.count())
            .select_from(Referral)
            .where(Referral.tenant_id == tenant_id)
        ),
        "contratacoes_informadas": db.scalar(
            select(func.count())
            .select_from(Referral)
            .where(Referral.tenant_id == tenant_id, Referral.status == "contratado")
        ),
        "empresas_aguardando_retorno": db.scalar(
            select(func.count())
            .select_from(Job)
            .where(
                Job.tenant_id == tenant_id, Job.status == "aguardando_retorno_empresa"
            )
        ),
        "taxa_retorno_empresas": 0,
        "tempo_medio_fechamento_dias": 0,
    }


@router.get(
    "/audit/data-access",
    response_model=list[DataAccessLogOut],
    dependencies=[Depends(require_permissions("reports:view"))],
)
def data_access_logs(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    rows = db.execute(
        select(DataAccessLog, User, Worker, Resume)
        .outerjoin(User, User.id == DataAccessLog.accessed_by_user_id)
        .outerjoin(Worker, Worker.id == DataAccessLog.worker_id)
        .outerjoin(Resume, Resume.id == DataAccessLog.resume_id)
        .where(DataAccessLog.tenant_id == tenant_scope(user, db))
        .order_by(DataAccessLog.created_at.desc())
        .limit(200)
    ).all()
    return [
        DataAccessLogOut(
            id=log.id,
            accessed_by_user_id=log.accessed_by_user_id,
            accessed_by_name=accessed_by.full_name if accessed_by else None,
            worker_id=log.worker_id,
            worker_name=worker.full_name if worker else None,
            resume_id=log.resume_id,
            resume_filename=resume.original_filename if resume else None,
            action=log.action,
            reason=log.reason,
            ip_address=log.ip_address,
            created_at=log.created_at,
        )
        for log, accessed_by, worker, resume in rows
    ]


@router.get("/worker-portal/profile", response_model=WorkerOut | None)
def worker_profile(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_worker_user(user)
    return current_worker(db, user)


@router.put("/worker-portal/profile", response_model=WorkerOut)
def save_worker_profile(
    payload: WorkerProfileIn,
    request: Request,
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    job = get_worker_open_job(db, tenant_id, job_id)
    data = payload.model_dump()
    data["email"] = user.email
    worker = current_worker(db, user)
    if worker:
        for key, value in data.items():
            setattr(worker, key, value)
    else:
        worker = Worker(tenant_id=tenant_id, **data)
        db.add(worker)
    if worker.lgpd_accepted and not worker.lgpd_accepted_at:
        worker.lgpd_accepted_at = datetime.now(timezone.utc)
        db.flush()
        db.add(
            LGPDConsent(
                tenant_id=tenant_id,
                worker_id=worker.id,
                consent_type="portal_trabalhador",
                consent_text="Consentimento para tratamento de dados e candidatura a vagas pelo portal do trabalhador.",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                version="2026-05-18",
            )
        )
    db.flush()
    audit(
        db,
        tenant_id,
        user.id,
        "worker.self_profile.save",
        "Worker",
        worker.id,
        {"source": "worker_portal"},
        request.client.host if request.client else None,
    )
    create_or_update_worker_application(db, tenant_id, user, worker, job, request)
    db.commit()
    db.refresh(worker)
    return worker


def serialize_worker_portal_job(job: Job, company: Company | None) -> WorkerPortalJobOut:
    is_confidential = bool(job.is_confidential)
    visible_company_name = (
        "Empresa confidencial"
        if is_confidential
        else (
            (company.trade_name or company.legal_name)
            if company
            else "Empresa cadastrada no SINE Jacarezinho"
        )
    )
    return WorkerPortalJobOut(
        id=job.id,
        title=job.title,
        description=job.description,
        vacancies=job.vacancies,
        salary_range=job.salary_range,
        benefits=job.benefits,
        workday=job.workday,
        schedule=job.schedule,
        workplace=job.workplace,
        modality=job.modality,
        minimum_education=job.minimum_education,
        required_experience=job.required_experience,
        desired_courses=job.desired_courses,
        cnh_required=job.cnh_required,
        travel_required=job.travel_required,
        contract_type=job.contract_type,
        status=job.status,
        is_confidential=is_confidential,
        company_name=visible_company_name,
        city=(company.city if company else None) or job.workplace or "Jacarezinho",
        state=(company.state if company else None) or "PR",
        created_at=job.created_at,
        closing_deadline=job.closing_deadline,
    )


@router.get("/worker-portal/open-jobs", response_model=list[WorkerPortalJobOut])
def worker_open_jobs(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    open_statuses = ["aprovada", "publicada", "em_triagem", "encaminhando_candidatos"]
    rows = db.execute(
        select(Job, Company)
        .join(Company, Company.id == Job.company_id)
        .where(
            Job.tenant_id == tenant_id,
            Job.deleted_at.is_(None),
            Job.status.in_(open_statuses),
            Company.deleted_at.is_(None),
        )
        .order_by(Job.created_at.desc())
    ).all()
    return [serialize_worker_portal_job(job, company) for job, company in rows]

@router.get("/worker-portal/resumes", response_model=list[ResumeOut])
def worker_resumes(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    worker = current_worker(db, user)
    if not worker:
        return []
    return db.scalars(
        select(Resume)
        .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
        .order_by(Resume.created_at.desc())
    ).all()


@router.post("/worker-portal/resume-pdf", response_model=ResumeOut)
async def worker_upload_resume_pdf(
    request: Request,
    file: UploadFile,
    job_id: UUID = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    job = get_worker_open_job(db, tenant_id, job_id)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(
            status_code=400, detail="Salve o curriculo preenchido antes de enviar o PDF"
        )
    if not worker.lgpd_accepted:
        raise HTTPException(
            status_code=400, detail="Aceite LGPD obrigatorio para enviar curriculo"
        )
    tenant = db.get(Tenant, tenant_id)
    stored, path, size = await save_pdf_resume(file, tenant.slug)
    text = extract_pdf_text(path)
    analysis = get_ai_provider().analyze_resume(text).__dict__
    resume = Resume(
        tenant_id=tenant_id,
        worker_id=worker.id,
        original_filename=file.filename,
        stored_filename=stored,
        file_path=str(path),
        mime_type="application/pdf",
        size_bytes=size,
        extracted_text=text,
        analysis=analysis,
        status="analisado",
    )
    db.add(resume)
    db.flush()
    log_resume_access(
        db,
        tenant_id,
        user.id,
        worker.id,
        resume.id,
        "worker_upload_and_analyze",
        "Upload de curriculo PDF pelo trabalhador",
        request.client.host if request.client else None,
    )
    audit(
        db,
        tenant_id,
        user.id,
        "worker.resume_pdf.upload",
        "Resume",
        resume.id,
        {"original_filename": file.filename},
        request.client.host if request.client else None,
    )
    create_or_update_worker_application(
        db, tenant_id, user, worker, job, request, resume
    )
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/worker-portal/apply/{job_id}")
def worker_apply(
    job_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(
            status_code=400,
            detail="Complete seu curriculo antes de concorrer a uma vaga",
        )
    if not worker.lgpd_accepted:
        raise HTTPException(
            status_code=400, detail="Aceite LGPD obrigatorio para concorrer a vagas"
        )
    job = get_worker_open_job(db, tenant_id, job_id)
    latest_resume = db.scalar(
        select(Resume)
        .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
        .order_by(Resume.created_at.desc())
    )
    referral = create_or_update_worker_application(
        db, tenant_id, user, worker, job, request, latest_resume
    )
    db.commit()
    return {"status": "applied", "referral_id": str(referral.id)}


@router.get("/worker-portal/applications")
def worker_applications(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_worker_user(user)
    tenant_id = tenant_scope(user, db)
    worker = current_worker(db, user)
    if not worker:
        return []
    rows = db.execute(
        select(Referral, Job)
        .join(Job, Job.id == Referral.job_id)
        .where(Referral.tenant_id == tenant_id, Referral.worker_id == worker.id)
        .order_by(Referral.created_at.desc())
    ).all()
    return [
        {
            "id": str(referral.id),
            "job_id": str(job.id),
            "job_title": job.title,
            "status": referral.status,
            "created_at": referral.created_at,
        }
        for referral, job in rows
    ]
