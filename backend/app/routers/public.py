from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_token, hash_password
from app.models import (
    Company,
    DataAccessLog,
    Job,
    LGPDConsent,
    Referral,
    Role,
    Tenant,
    User,
    Worker,
)
from app.routers import crud
from app.routers.auth import serialize_user
from app.schemas.common import (
    PublicJobOut,
    PublicWorkerRegisterIn,
    PublicWorkerRegisterOut,
    TenantOut,
)
from app.services.audit import audit
from app.utils.tenant import get_active_tenant_by_domain

router = APIRouter(prefix="/public", tags=["public"])

PUBLIC_JOB_STATUSES = {"publicada", "em_triagem", "encaminhando_candidatos"}
LGPD_TEXT = (
    "Seus dados serão utilizados pela equipe do SINE para análise de "
    "compatibilidade com vagas, contato sobre oportunidades e possível "
    "encaminhamento para empresas parceiras. A empresa só receberá seus dados "
    "quando houver encaminhamento oficial pelo SINE."
)


def public_tenant(request: Request, db: Session) -> Tenant:
    tenant = get_active_tenant_by_domain(
        db, request.headers.get("host", "sine.jacarezinho.cloud")
    )
    if not tenant:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == "jacarezinho"))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant nao encontrado")
    return tenant


def serialize_public_job(job: Job, company: Company) -> PublicJobOut:
    return PublicJobOut(
        id=job.id,
        title=job.title,
        company_name=company.trade_name or "Empresa parceira do SINE",
        city=company.city or job.workplace or "Jacarezinho",
        state=company.state or "PR",
        vacancies=job.vacancies,
        salary_range=job.salary_range,
        workday=job.workday or job.schedule,
        modality=job.modality,
        minimum_education=job.minimum_education,
        required_experience=job.required_experience,
        desired_courses=job.desired_courses,
        cnh_required=job.cnh_required,
        description=job.description,
        benefits=job.benefits,
        schedule=job.schedule,
        workplace=job.workplace,
        created_at=job.created_at,
        expires_at=job.closing_deadline,
    )


@router.get("/jobs", response_model=list[PublicJobOut])
def list_public_jobs(
    request: Request,
    search: str | None = None,
    city: str | None = None,
    modality: str | None = None,
    education: str | None = None,
    db: Session = Depends(get_db),
):
    tenant = public_tenant(request, db)
    query = (
        select(Job, Company)
        .join(Company, Company.id == Job.company_id)
        .where(
            Job.tenant_id == tenant.id,
            Job.deleted_at.is_(None),
            Company.deleted_at.is_(None),
            Job.status.in_(PUBLIC_JOB_STATUSES),
        )
        .order_by(Job.created_at.desc())
    )
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Job.title.ilike(term),
                Job.description.ilike(term),
                Job.required_experience.ilike(term),
                Job.desired_courses.ilike(term),
            )
        )
    if city:
        term = f"%{city.strip()}%"
        query = query.where(or_(Company.city.ilike(term), Job.workplace.ilike(term)))
    if modality:
        query = query.where(Job.modality.ilike(f"%{modality.strip()}%"))
    if education:
        query = query.where(Job.minimum_education.ilike(f"%{education.strip()}%"))
    return [serialize_public_job(job, company) for job, company in db.execute(query)]


@router.get("/jobs/{job_id}", response_model=PublicJobOut)
def get_public_job(
    job_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    tenant = public_tenant(request, db)
    row = db.execute(
        select(Job, Company)
        .join(Company, Company.id == Job.company_id)
        .where(
            Job.id == job_id,
            Job.tenant_id == tenant.id,
            Job.deleted_at.is_(None),
            Company.deleted_at.is_(None),
            Job.status.in_(PUBLIC_JOB_STATUSES),
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Vaga publica nao encontrada")
    job, company = row
    return serialize_public_job(job, company)


@router.post("/workers/register", response_model=PublicWorkerRegisterOut)
def register_public_worker(
    payload: PublicWorkerRegisterIn,
    request: Request,
    db: Session = Depends(get_db),
):
    tenant = public_tenant(request, db)
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=422, detail="As senhas nao conferem")
    if not payload.lgpd_accepted:
        raise HTTPException(status_code=400, detail="Aceite LGPD obrigatorio")
    email = payload.email.lower()
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado")
    existing_worker = db.scalar(
        select(Worker).where(
            Worker.tenant_id == tenant.id,
            Worker.cpf == payload.cpf,
            Worker.deleted_at.is_(None),
        )
    )
    if existing_worker:
        raise HTTPException(status_code=409, detail="CPF ja cadastrado")
    job = None
    if payload.job_id:
        job = db.get(Job, payload.job_id)
        if (
            not job
            or job.tenant_id != tenant.id
            or job.deleted_at is not None
            or job.status not in PUBLIC_JOB_STATUSES
        ):
            raise HTTPException(status_code=404, detail="Vaga publica nao encontrada")
    role = db.scalar(select(Role).where(Role.name == "worker"))
    if not role:
        raise HTTPException(status_code=500, detail="Perfil worker nao configurado")

    user = User(
        tenant_id=tenant.id,
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    user.roles.append(role)
    db.add(user)
    db.flush()

    worker = Worker(
        tenant_id=tenant.id,
        cpf=payload.cpf,
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        phone=payload.phone,
        whatsapp=payload.whatsapp,
        email=email,
        city=payload.city,
        state=payload.state,
        education_level=payload.education_level,
        desired_role=payload.desired_role,
        availability=payload.availability,
        cnh=payload.cnh,
        notes=payload.notes,
        lgpd_accepted=True,
        lgpd_accepted_at=datetime.now(timezone.utc),
    )
    db.add(worker)
    db.flush()
    db.add(
        LGPDConsent(
            tenant_id=tenant.id,
            worker_id=worker.id,
            consent_type="public_worker_register",
            consent_text=LGPD_TEXT,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            version="2026-05-19",
        )
    )
    if job:
        referral = Referral(
            tenant_id=tenant.id,
            job_id=job.id,
            worker_id=worker.id,
            referred_by_user_id=user.id,
            status="candidatura_trabalhador",
            notes="Candidatura direta pelo Portal Público de Vagas",
        )
        db.add(referral)
        db.flush()
        db.add(
            DataAccessLog(
                tenant_id=tenant.id,
                accessed_by_user_id=user.id,
                worker_id=worker.id,
                action="public_worker_register_apply",
                reason="Cadastro publico com candidatura vinculada",
                ip_address=request.client.host if request.client else None,
            )
        )
        crud.notify_sine(
            db,
            tenant.id,
            "Nova candidatura do portal publico",
            f"{worker.full_name} se cadastrou e demonstrou interesse na vaga {job.title}.",
        )
    audit(
        db,
        tenant.id,
        user.id,
        "public.worker.register",
        "Worker",
        worker.id,
        {"job_id": str(job.id) if job else None},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(user)
    settings = get_settings()
    access = create_token(
        str(user.id),
        "access",
        minutes=settings.access_token_expire_minutes,
        extra={"tenant_id": str(user.tenant_id)},
    )
    refresh = create_token(
        str(user.id), "refresh", days=settings.refresh_token_expire_days
    )
    return PublicWorkerRegisterOut(
        access_token=access,
        refresh_token=refresh,
        user=serialize_user(user),
        tenant=TenantOut.model_validate(tenant),
        job_id=job.id if job else None,
        message="Cadastro criado. Continue sua candidatura pelo Portal do Trabalhador.",
    )
