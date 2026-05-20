from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CompanyMessage, Job, LGPDDataSharingRecord, Referral, Resume, User, Worker
from app.routers import crud
from app.schemas.common import ReferCandidateIn, ReferCandidatesIn, ReferCandidatesOut
from app.services.audit import audit, log_resume_access


DEFAULT_COMPANY_MESSAGE = "O SINE Jacarezinho encaminhou candidatos para a vaga {job_title}. Após a entrevista ou análise, registre o retorno de cada candidato para manter o fluxo ativo."


def refer_candidates(
    db: Session,
    tenant_id: UUID,
    job_id: UUID,
    payload: ReferCandidatesIn,
    user: User,
    ip_address: str | None = None,
) -> ReferCandidatesOut:
    job = db.get(Job, job_id)
    if not job or job.tenant_id != tenant_id or job.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Vaga nao encontrada")
    referral_ids: list[UUID] = []
    for candidate in payload.candidates:
        worker = db.get(Worker, candidate.worker_id)
        if not worker or worker.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Candidato nao encontrado")
        resume = db.get(Resume, candidate.resume_id) if candidate.resume_id else None
        if resume and (resume.tenant_id != tenant_id or resume.worker_id != worker.id):
            raise HTTPException(
                status_code=404, detail="Curriculo nao pertence ao candidato"
            )
        referral = db.scalar(
            select(Referral)
            .where(
                Referral.tenant_id == tenant_id,
                Referral.job_id == job.id,
                Referral.worker_id == worker.id,
            )
            .order_by(Referral.created_at.desc())
        )
        if not referral:
            referral = Referral(
                tenant_id=tenant_id,
                job_id=job.id,
                worker_id=worker.id,
                resume_id=resume.id if resume else None,
                referred_by_user_id=user.id,
            )
            db.add(referral)
            db.flush()
        referral.status = "encaminhado"
        referral.resume_id = resume.id if resume else referral.resume_id
        referral.referred_by_user_id = user.id
        referral.referred_at = datetime.now(timezone.utc)
        referral.match_score = candidate.match_score
        referral.match_explanation = candidate.match_explanation
        referral.triage_notes = payload.message_to_company
        referral_ids.append(referral.id)
        existing_sharing = db.scalar(
            select(LGPDDataSharingRecord).where(
                LGPDDataSharingRecord.tenant_id == tenant_id,
                LGPDDataSharingRecord.referral_id == referral.id,
            )
        )
        if not existing_sharing:
            db.add(
                LGPDDataSharingRecord(
                    tenant_id=tenant_id,
                    worker_id=worker.id,
                    company_id=job.company_id,
                    job_id=job.id,
                    referral_id=referral.id,
                    shared_by_user_id=user.id,
                    data_categories=[
                        "nome",
                        "telefone",
                        "whatsapp",
                        "email",
                        "curriculo",
                        "experiencias",
                    ],
                    purpose="Encaminhamento de candidato para avaliacao de vaga solicitada pela empresa",
                    legal_basis="execucao_politica_publica",
                )
            )
        if resume:
            log_resume_access(
                db,
                tenant_id,
                user.id,
                worker.id,
                resume.id,
                "referral_send_to_company",
                "triagem_vaga",
                ip_address,
            )
        thread = crud.get_or_create_referral_thread(
            db, tenant_id, job.company_id, referral, user.id
        )
        db.add(
            CompanyMessage(
                tenant_id=tenant_id,
                thread_id=thread.id,
                sender_user_id=user.id,
                sender_role="sine",
                message_type="referral_sent",
                body=payload.message_to_company
                or DEFAULT_COMPANY_MESSAGE.format(job_title=job.title),
                details={
                    "job_id": str(job.id),
                    "worker_id": str(worker.id),
                    "resume_id": str(resume.id) if resume else None,
                    "match_score": candidate.match_score,
                    "match_explanation": candidate.match_explanation,
                },
            )
        )
    job.status = "aguardando_retorno_empresa"
    crud.notify_company_users(
        db,
        tenant_id,
        job.company_id,
        "Candidatos encaminhados pelo SINE",
        DEFAULT_COMPANY_MESSAGE.format(job_title=job.title),
    )
    audit(
        db,
        tenant_id,
        user.id,
        "job_triage.refer_candidates",
        "Job",
        job.id,
        {"referral_ids": [str(item) for item in referral_ids]},
        ip_address,
    )
    db.commit()
    return ReferCandidatesOut(
        status="ok", referred=len(referral_ids), referral_ids=referral_ids
    )
