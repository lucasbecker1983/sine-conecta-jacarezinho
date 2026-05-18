from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.local_provider import get_ai_provider
from app.core.config import get_settings
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions
from app.models import Company, CompanyFeedback, DataAccessLog, Job, Referral, Resume, Tenant, User, Worker, LGPDConsent
from app.schemas.common import CompanyIn, CompanyOut, FeedbackIn, JobIn, JobOut, ReferralIn, ReferralOut, ResumeOut, WorkerIn, WorkerOut
from app.services.audit import audit, log_resume_access
from app.services.resumes import extract_pdf_text, save_pdf_resume

router = APIRouter(tags=["core"])


def tenant_scope(user: User, db: Session) -> UUID:
    if user.tenant_id is None:
        if "super_admin" not in {role.name for role in user.roles}:
            raise HTTPException(status_code=400, detail="Informe tenant_id para operacao multi-tenant")
        tenant = db.scalar(select(Tenant).where(Tenant.slug == get_settings().tenant_default_slug, Tenant.is_active.is_(True)))
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant padrao nao encontrado")
        return tenant.id
    return user.tenant_id


@router.get("/companies", response_model=list[CompanyOut], dependencies=[Depends(require_permissions("companies:manage"))])
def list_companies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Company).where(Company.tenant_id == tenant_scope(user, db), Company.deleted_at.is_(None)).order_by(Company.created_at.desc())).all()


@router.post("/companies", response_model=CompanyOut, dependencies=[Depends(require_permissions("companies:manage"))])
def create_company(payload: CompanyIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    company = Company(tenant_id=tenant_scope(user, db), **payload.model_dump())
    db.add(company)
    db.flush()
    audit(db, company.tenant_id, user.id, "company.create", "Company", company.id, ip_address=request.client.host if request.client else None)
    db.commit()
    db.refresh(company)
    return company


@router.get("/workers", response_model=list[WorkerOut], dependencies=[Depends(require_permissions("workers:manage"))])
def list_workers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Worker).where(Worker.tenant_id == tenant_scope(user, db), Worker.deleted_at.is_(None)).order_by(Worker.created_at.desc())).all()


@router.post("/workers", response_model=WorkerOut, dependencies=[Depends(require_permissions("workers:manage"))])
def create_worker(payload: WorkerIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = payload.model_dump()
    if data["lgpd_accepted"]:
        data["lgpd_accepted_at"] = datetime.now(timezone.utc)
    worker = Worker(tenant_id=tenant_scope(user, db), **data)
    db.add(worker)
    db.flush()
    if worker.lgpd_accepted:
        db.add(LGPDConsent(tenant_id=worker.tenant_id, worker_id=worker.id, consent_type="cadastro_trabalhador", consent_text="Consentimento para tratamento de dados na intermediacao de mao de obra.", ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent"), version="2026-05-18"))
    audit(db, worker.tenant_id, user.id, "worker.create", "Worker", worker.id, {"sensitive_fields": ["has_disability"] if worker.has_disability is not None else []}, request.client.host if request.client else None)
    db.commit()
    db.refresh(worker)
    return worker


@router.get("/jobs", response_model=list[JobOut], dependencies=[Depends(require_permissions("jobs:manage"))])
def list_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Job).where(Job.tenant_id == tenant_scope(user, db), Job.deleted_at.is_(None)).order_by(Job.created_at.desc())).all()


@router.post("/jobs", response_model=JobOut, dependencies=[Depends(require_permissions("jobs:manage"))])
def create_job(payload: JobIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    company = db.get(Company, payload.company_id)
    if not company or company.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    job = Job(tenant_id=tenant_id, **payload.model_dump())
    db.add(job)
    db.flush()
    audit(db, tenant_id, user.id, "job.create", "Job", job.id, ip_address=request.client.host if request.client else None)
    db.commit()
    db.refresh(job)
    return job


@router.post("/resumes/{worker_id}", response_model=ResumeOut, dependencies=[Depends(require_permissions("workers:manage"))])
async def upload_resume(worker_id: UUID, file: UploadFile, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    worker = db.get(Worker, worker_id)
    if not worker or worker.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    tenant = db.get(Tenant, tenant_id)
    stored, path, size = await save_pdf_resume(file, tenant.slug)
    text = extract_pdf_text(path)
    analysis = get_ai_provider().analyze_resume(text).__dict__
    resume = Resume(tenant_id=tenant_id, worker_id=worker.id, original_filename=file.filename, stored_filename=stored, file_path=str(path), mime_type="application/pdf", size_bytes=size, extracted_text=text, analysis=analysis, status="analisado")
    db.add(resume)
    db.flush()
    log_resume_access(db, tenant_id, user.id, worker.id, resume.id, "upload_and_analyze", "Upload de curriculo pelo SINE", request.client.host if request.client else None)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/resumes/{resume_id}", response_model=ResumeOut, dependencies=[Depends(require_permissions("resumes:view"))])
def get_resume(resume_id: UUID, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    resume = db.get(Resume, resume_id)
    if not resume or resume.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Curriculo nao encontrado")
    log_resume_access(db, tenant_id, user.id, resume.worker_id, resume.id, "view", "Visualizacao de curriculo", request.client.host if request.client else None)
    db.commit()
    return resume


@router.post("/ai/match/{resume_id}/{job_id}", dependencies=[Depends(require_permissions("resumes:view"))])
def match_resume(resume_id: UUID, job_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    resume = db.get(Resume, resume_id)
    job = db.get(Job, job_id)
    if not resume or not job or resume.tenant_id != tenant_id or job.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Dados nao encontrados")
    return get_ai_provider().match_candidate_to_job(resume.extracted_text or "", {"title": job.title, "description": job.description, "required_experience": job.required_experience, "desired_courses": job.desired_courses}).__dict__


@router.post("/referrals", response_model=ReferralOut, dependencies=[Depends(require_permissions("referrals:manage"))])
def create_referral(payload: ReferralIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    job = db.get(Job, payload.job_id)
    worker = db.get(Worker, payload.worker_id)
    if not job or not worker or job.tenant_id != tenant_id or worker.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Vaga ou trabalhador nao encontrado")
    referral = Referral(tenant_id=tenant_id, referred_by_user_id=user.id, **payload.model_dump())
    db.add(referral)
    db.flush()
    audit(db, tenant_id, user.id, "referral.create", "Referral", referral.id, ip_address=request.client.host if request.client else None)
    db.commit()
    db.refresh(referral)
    return referral


@router.post("/feedback", dependencies=[Depends(require_permissions("feedback:create"))])
def create_feedback(payload: FeedbackIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    referral = db.get(Referral, payload.referral_id)
    if not referral or referral.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Encaminhamento nao encontrado")
    feedback = CompanyFeedback(tenant_id=tenant_id, **payload.model_dump())
    referral.status = payload.status
    db.add(feedback)
    db.commit()
    return {"status": "ok"}


@router.get("/reports/summary", dependencies=[Depends(require_permissions("reports:view"))])
def reports_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tenant_id = tenant_scope(user, db)
    return {
        "vagas_solicitadas": db.scalar(select(func.count()).select_from(Job).where(Job.tenant_id == tenant_id, Job.status == "solicitada")),
        "vagas_em_analise": db.scalar(select(func.count()).select_from(Job).where(Job.tenant_id == tenant_id, Job.status == "em_analise")),
        "vagas_ativas": db.scalar(select(func.count()).select_from(Job).where(Job.tenant_id == tenant_id, Job.status.in_(["aprovada", "publicada", "em_triagem", "encaminhando_candidatos"]))),
        "candidatos_cadastrados": db.scalar(select(func.count()).select_from(Worker).where(Worker.tenant_id == tenant_id)),
        "curriculos_pendentes": db.scalar(select(func.count()).select_from(Resume).where(Resume.tenant_id == tenant_id, Resume.status == "pendente_analise")),
        "encaminhamentos_mes": db.scalar(select(func.count()).select_from(Referral).where(Referral.tenant_id == tenant_id)),
        "contratacoes_informadas": db.scalar(select(func.count()).select_from(Referral).where(Referral.tenant_id == tenant_id, Referral.status == "contratado")),
        "empresas_aguardando_retorno": db.scalar(select(func.count()).select_from(Job).where(Job.tenant_id == tenant_id, Job.status == "aguardando_retorno_empresa")),
        "taxa_retorno_empresas": 0,
        "tempo_medio_fechamento_dias": 0,
    }


@router.get("/audit/data-access", dependencies=[Depends(require_permissions("reports:view"))])
def data_access_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(DataAccessLog).where(DataAccessLog.tenant_id == tenant_scope(user, db)).order_by(DataAccessLog.created_at.desc()).limit(100)).all()
