from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models import (
    AuditLog,
    Company,
    LGPDConsentHistory,
    LGPDDataSubjectRequest,
    LGPDIncident,
    LGPDProcessingActivity,
    LGPDRequestEvent,
    LGPDRetentionPolicy,
    LGPDRetentionReview,
    LGPDTermsVersion,
    User,
    Worker,
)
from app.routers.crud import current_company, current_worker, require_company_user, require_worker_user, tenant_scope
from app.schemas.common import (
    LgpdCorrectionIn,
    LgpdIncidentIn,
    LgpdIncidentPatchIn,
    LgpdJustificationIn,
    LgpdOwnRequestIn,
    LgpdProcessingActivityIn,
    LgpdProcessingActivityPatchIn,
    LgpdPublicRequestIn,
    LgpdRequestAssignIn,
    LgpdRequestEventOut,
    LgpdRequestOut,
    LgpdRequestPatchIn,
    LgpdRequestResponseIn,
    LgpdRequestStatusIn,
    LgpdRetentionPolicyIn,
    LgpdRetentionPolicyPatchIn,
    LgpdRetentionReviewResolveIn,
    LgpdTermIn,
    LgpdTermOut,
    LgpdTermPatchIn,
)
from app.services.anonymization_service import anonymize_worker, block_worker_processing
from app.services.audit import audit
from app.services.data_retention_service import resolve_review, run_retention_review
from app.services.incident_service import close_incident, get_incident_or_404
from app.services.lgpd_service import (
    add_request_event,
    consent_rows,
    create_data_subject_request,
    export_subject_data,
    get_request_or_404,
    publish_term,
    require_lgpd_admin,
    require_lgpd_staff,
    sharing_rows,
    tenant_for_public,
)

router = APIRouter(prefix="/lgpd", tags=["lgpd"])
PUBLIC_REQUEST_ATTEMPTS: dict[str, list[float]] = {}


def _rate_limit_public_request(request: Request, email: str) -> None:
    key = f"{request.client.host if request.client else 'unknown'}:{email.lower()}"
    now = datetime.now(timezone.utc).timestamp()
    recent = [item for item in PUBLIC_REQUEST_ATTEMPTS.get(key, []) if now - item < 300]
    if len(recent) >= 5:
        raise HTTPException(status_code=429, detail="Muitas solicitacoes. Tente novamente em alguns minutos.")
    recent.append(now)
    PUBLIC_REQUEST_ATTEMPTS[key] = recent


@router.get("/public/terms", response_model=list[LgpdTermOut])
def public_terms(
    term_type: str | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    tenant = tenant_for_public(db)
    query = select(LGPDTermsVersion).where(LGPDTermsVersion.tenant_id == tenant.id)
    if active_only:
        query = query.where(LGPDTermsVersion.is_active.is_(True))
    if term_type:
        query = query.where(LGPDTermsVersion.term_type == term_type)
    return db.scalars(query.order_by(LGPDTermsVersion.term_type, LGPDTermsVersion.published_at.desc())).all()


@router.post("/public/requests", response_model=LgpdRequestOut, status_code=status.HTTP_201_CREATED)
def create_public_request(payload: LgpdPublicRequestIn, request: Request, db: Session = Depends(get_db)):
    if not payload.confirmation:
        raise HTTPException(status_code=422, detail="Confirme a veracidade das informacoes")
    _rate_limit_public_request(request, payload.requester_email)
    tenant = tenant_for_public(db)
    lgpd_request = create_data_subject_request(
        db,
        tenant.id,
        payload.requester_type,
        payload.requester_name,
        str(payload.requester_email),
        payload.request_type,
        payload.description,
        payload.requester_document,
    )
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.get("/terms", response_model=list[LgpdTermOut])
def list_terms(
    term_type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    query = select(LGPDTermsVersion).where(LGPDTermsVersion.tenant_id == tenant_id)
    if term_type:
        query = query.where(LGPDTermsVersion.term_type == term_type)
    return db.scalars(query.order_by(LGPDTermsVersion.term_type, LGPDTermsVersion.created_at.desc())).all()


@router.post("/terms", response_model=LgpdTermOut, status_code=status.HTTP_201_CREATED)
def create_term(payload: LgpdTermIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    term = LGPDTermsVersion(tenant_id=tenant_id, created_by_user_id=user.id, **payload.model_dump())
    db.add(term)
    db.flush()
    if term.is_active:
        publish_term(db, tenant_id, term, user)
    audit(db, tenant_id, user.id, "lgpd.term.created", "LGPDTermsVersion", term.id, {"term_type": term.term_type})
    db.commit()
    db.refresh(term)
    return term


@router.patch("/terms/{term_id}", response_model=LgpdTermOut)
def update_term(term_id: UUID, payload: LgpdTermPatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    term = db.get(LGPDTermsVersion, term_id)
    if not term or term.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Termo LGPD nao encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(term, key, value)
    if payload.is_active is True:
        publish_term(db, tenant_id, term, user)
    audit(db, tenant_id, user.id, "lgpd.term.updated", "LGPDTermsVersion", term.id, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(term)
    return term


@router.post("/terms/{term_id}/publish", response_model=LgpdTermOut)
def publish_term_endpoint(term_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    term = db.get(LGPDTermsVersion, term_id)
    if not term or term.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Termo LGPD nao encontrado")
    publish_term(db, tenant_id, term, user)
    db.commit()
    db.refresh(term)
    return term


@router.post("/terms/{term_id}/deactivate", response_model=LgpdTermOut)
def deactivate_term(term_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    term = db.get(LGPDTermsVersion, term_id)
    if not term or term.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Termo LGPD nao encontrado")
    term.is_active = False
    audit(db, tenant_id, user.id, "lgpd.term.deactivated", "LGPDTermsVersion", term.id, {"term_type": term.term_type})
    db.commit()
    db.refresh(term)
    return term


@router.get("/me/consents")
def my_consents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_worker_user(user)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    return consent_rows(db, tenant_scope(user, db), worker_id=worker.id)


@router.get("/me/data-sharing")
def my_data_sharing(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_worker_user(user)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    return sharing_rows(db, tenant_scope(user, db), worker_id=worker.id)


@router.get("/me/requests", response_model=list[LgpdRequestOut])
def my_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_worker_user(user)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    return db.scalars(
        select(LGPDDataSubjectRequest)
        .where(LGPDDataSubjectRequest.tenant_id == tenant_scope(user, db), LGPDDataSubjectRequest.worker_id == worker.id)
        .order_by(LGPDDataSubjectRequest.created_at.desc())
    ).all()


@router.post("/me/requests", response_model=LgpdRequestOut, status_code=status.HTTP_201_CREATED)
def create_my_request(payload: LgpdOwnRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_worker_user(user)
    worker = current_worker(db, user)
    if not worker:
        raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
    lgpd_request = create_data_subject_request(
        db,
        tenant_scope(user, db),
        "worker",
        worker.full_name,
        worker.email or user.email,
        payload.request_type,
        payload.description,
        worker.cpf,
        worker_id=worker.id,
        requester_user_id=user.id,
    )
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/me/consents/{consent_id}/revoke")
def revoke_my_consent(consent_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_worker_user(user)
    worker = current_worker(db, user)
    tenant_id = tenant_scope(user, db)
    consent = db.get(LGPDConsentHistory, consent_id)
    if not worker or not consent or consent.tenant_id != tenant_id or consent.worker_id != worker.id:
        raise HTTPException(status_code=404, detail="Consentimento nao encontrado")
    consent.consent_status = "revoked"
    consent.revoked_at = datetime.now(timezone.utc)
    audit(db, tenant_id, user.id, "lgpd.consent.revoked", "LGPDConsentHistory", consent.id, {"worker_id": str(worker.id)})
    db.commit()
    return {"status": "revoked", "impact_notice": "A revogacao pode impedir novos encaminhamentos, mas nao remove registros necessarios para obrigacoes legais, auditoria e historico operacional."}


@router.get("/company/consents")
def company_consents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_company_user(user)
    company = current_company(db, user)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    return consent_rows(db, tenant_scope(user, db), company_id=company.id)


@router.get("/company/data-sharing")
def company_data_sharing(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_company_user(user)
    company = current_company(db, user)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    return sharing_rows(db, tenant_scope(user, db), company_id=company.id)


@router.get("/company/requests", response_model=list[LgpdRequestOut])
def company_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_company_user(user)
    company = current_company(db, user)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    return db.scalars(
        select(LGPDDataSubjectRequest)
        .where(LGPDDataSubjectRequest.tenant_id == tenant_scope(user, db), LGPDDataSubjectRequest.company_id == company.id)
        .order_by(LGPDDataSubjectRequest.created_at.desc())
    ).all()


@router.post("/company/requests", response_model=LgpdRequestOut, status_code=status.HTTP_201_CREATED)
def create_company_request(payload: LgpdOwnRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_company_user(user)
    company = current_company(db, user)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    lgpd_request = create_data_subject_request(
        db,
        tenant_scope(user, db),
        "company_user",
        company.responsible_name or company.hr_responsible_name or company.legal_name,
        company.email or user.email,
        payload.request_type,
        payload.description,
        company.cnpj,
        company_id=company.id,
        requester_user_id=user.id,
    )
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.get("/dashboard")
def lgpd_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    now = datetime.now(timezone.utc)
    return {
        "open_requests": db.scalar(select(func.count()).select_from(LGPDDataSubjectRequest).where(LGPDDataSubjectRequest.tenant_id == tenant_id, LGPDDataSubjectRequest.status.in_(["aberta", "em_analise"]))),
        "due_soon_requests": db.scalar(select(func.count()).select_from(LGPDDataSubjectRequest).where(LGPDDataSubjectRequest.tenant_id == tenant_id, LGPDDataSubjectRequest.due_date <= now + timedelta(days=3))),
        "completed_month": db.scalar(select(func.count()).select_from(LGPDDataSubjectRequest).where(LGPDDataSubjectRequest.tenant_id == tenant_id, LGPDDataSubjectRequest.status == "concluida")),
        "active_consents": db.scalar(select(func.count()).select_from(LGPDConsentHistory).where(LGPDConsentHistory.tenant_id == tenant_id, LGPDConsentHistory.consent_status == "accepted")),
        "revoked_consents": db.scalar(select(func.count()).select_from(LGPDConsentHistory).where(LGPDConsentHistory.tenant_id == tenant_id, LGPDConsentHistory.consent_status == "revoked")),
        "data_sharing_records": len(sharing_rows(db, tenant_id)),
        "open_incidents": db.scalar(select(func.count()).select_from(LGPDIncident).where(LGPDIncident.tenant_id == tenant_id, LGPDIncident.status != "encerrado")),
        "pending_retention_reviews": db.scalar(select(func.count()).select_from(LGPDRetentionReview).where(LGPDRetentionReview.tenant_id == tenant_id, LGPDRetentionReview.status == "pendente")),
    }


@router.get("/data-sharing")
def list_data_sharing_records(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    return sharing_rows(db, tenant_scope(user, db))


@router.get("/requests", response_model=list[LgpdRequestOut])
def list_requests(status: str | None = None, request_type: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    query = select(LGPDDataSubjectRequest).where(LGPDDataSubjectRequest.tenant_id == tenant_scope(user, db))
    if status:
        query = query.where(LGPDDataSubjectRequest.status == status)
    if request_type:
        query = query.where(LGPDDataSubjectRequest.request_type == request_type)
    return db.scalars(query.order_by(LGPDDataSubjectRequest.created_at.desc())).all()


@router.get("/requests/{request_id}", response_model=LgpdRequestOut)
def get_request(request_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    return get_request_or_404(db, tenant_scope(user, db), request_id)


@router.patch("/requests/{request_id}", response_model=LgpdRequestOut)
def patch_request(request_id: UUID, payload: LgpdRequestPatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lgpd_request, key, value)
    add_request_event(db, tenant_id, request_id, "response_added", user.id, message="Solicitacao atualizada")
    audit(db, tenant_id, user.id, "lgpd.request.updated", "LGPDDataSubjectRequest", request_id, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/assign", response_model=LgpdRequestOut)
def assign_request(request_id: UUID, payload: LgpdRequestAssignIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    lgpd_request.assigned_to_user_id = payload.assigned_to_user_id
    add_request_event(db, tenant_id, request_id, "assigned", user.id, message=payload.message)
    audit(db, tenant_id, user.id, "lgpd.request.assigned", "LGPDDataSubjectRequest", request_id, {"assigned_to_user_id": str(payload.assigned_to_user_id)})
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/status", response_model=LgpdRequestOut)
def change_request_status(request_id: UUID, payload: LgpdRequestStatusIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    previous = lgpd_request.status
    lgpd_request.status = payload.status
    add_request_event(db, tenant_id, request_id, "status_changed", user.id, previous, payload.status, payload.message)
    audit(db, tenant_id, user.id, "lgpd.request.status_changed", "LGPDDataSubjectRequest", request_id, {"previous": previous, "new": payload.status})
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/response", response_model=LgpdRequestOut)
def add_response(request_id: UUID, payload: LgpdRequestResponseIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    lgpd_request.response_text = payload.response_text
    lgpd_request.internal_notes = payload.internal_notes or lgpd_request.internal_notes
    add_request_event(db, tenant_id, request_id, "response_added", user.id, message=payload.response_text)
    audit(db, tenant_id, user.id, "lgpd.request.response_added", "LGPDDataSubjectRequest", request_id)
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/conclude", response_model=LgpdRequestOut)
def conclude_request(request_id: UUID, payload: LgpdJustificationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    previous = lgpd_request.status
    lgpd_request.status = "concluida"
    lgpd_request.resolved_by_user_id = user.id
    lgpd_request.resolved_at = datetime.now(timezone.utc)
    add_request_event(db, tenant_id, request_id, "concluded", user.id, previous, "concluida", payload.justification)
    audit(db, tenant_id, user.id, "lgpd.request.concluded", "LGPDDataSubjectRequest", request_id, {"justification": payload.justification})
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.get("/requests/{request_id}/events", response_model=list[LgpdRequestEventOut])
def request_events(request_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    tenant_id = tenant_scope(user, db)
    get_request_or_404(db, tenant_id, request_id)
    return db.scalars(select(LGPDRequestEvent).where(LGPDRequestEvent.tenant_id == tenant_id, LGPDRequestEvent.request_id == request_id).order_by(LGPDRequestEvent.created_at.asc())).all()


@router.post("/requests/{request_id}/export-subject-data")
def export_request_subject_data(request_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    if lgpd_request.request_type not in {"access_data", "portability"}:
        raise HTTPException(status_code=400, detail="Exportacao permitida apenas para acesso ou portabilidade")
    data = export_subject_data(db, tenant_id, lgpd_request)
    add_request_event(db, tenant_id, request_id, "data_exported", user.id)
    audit(db, tenant_id, user.id, "lgpd.subject_data.exported", "LGPDDataSubjectRequest", request_id, {"request_type": lgpd_request.request_type})
    db.commit()
    return data


@router.post("/requests/{request_id}/apply-correction", response_model=LgpdRequestOut)
def apply_correction(request_id: UUID, payload: LgpdCorrectionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    allowed_worker_fields = {"phone", "whatsapp", "email", "address", "district", "city", "state", "education_level", "desired_role", "availability", "notes"}
    sensitive_worker_fields = {"cpf", "full_name"}
    if payload.entity_type == "worker":
        worker = db.get(Worker, payload.entity_id)
        if not worker or worker.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Trabalhador nao encontrado")
        if payload.field in sensitive_worker_fields and "tenant_admin" not in {role.name for role in user.roles} and "super_admin" not in {role.name for role in user.roles}:
            raise HTTPException(status_code=403, detail="Campo sensivel exige tenant_admin")
        if payload.field not in allowed_worker_fields | sensitive_worker_fields:
            raise HTTPException(status_code=400, detail="Campo nao permitido para correcao LGPD")
        setattr(worker, payload.field, payload.new_value)
    else:
        company = db.get(Company, payload.entity_id)
        if not company or company.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Empresa nao encontrada")
        if payload.field in {"cnpj", "legal_name"} and "tenant_admin" not in {role.name for role in user.roles} and "super_admin" not in {role.name for role in user.roles}:
            raise HTTPException(status_code=403, detail="Campo sensivel exige tenant_admin")
        if not hasattr(company, payload.field) or payload.field == "deleted_at":
            raise HTTPException(status_code=400, detail="Campo nao permitido")
        setattr(company, payload.field, payload.new_value)
    add_request_event(db, tenant_id, request_id, "correction_applied", user.id, message=payload.reason, metadata=payload.model_dump(mode="json"))
    audit(db, tenant_id, user.id, "lgpd.correction.applied", payload.entity_type, payload.entity_id, payload.model_dump(mode="json"))
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/anonymize", response_model=LgpdRequestOut)
def anonymize_request_subject(request_id: UUID, payload: LgpdJustificationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not {"tenant_admin", "super_admin"}.intersection({role.name for role in user.roles}):
        raise HTTPException(status_code=403, detail="Anonimizacao exige tenant_admin")
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    if not lgpd_request.worker_id:
        raise HTTPException(status_code=400, detail="Anonimizacao automatica disponivel apenas para trabalhador")
    anonymize_worker(db, tenant_id, lgpd_request.worker_id, request_id, user, payload.justification)
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/block-processing", response_model=LgpdRequestOut)
def block_processing(request_id: UUID, payload: LgpdJustificationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    if lgpd_request.worker_id:
        block_worker_processing(db, tenant_id, lgpd_request.worker_id, request_id, user, payload.justification)
    else:
        add_request_event(db, tenant_id, request_id, "status_changed", user.id, message=payload.justification, metadata={"action": "block_processing"})
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.post("/requests/{request_id}/reject-deletion", response_model=LgpdRequestOut)
def reject_deletion(request_id: UUID, payload: LgpdJustificationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    lgpd_request = get_request_or_404(db, tenant_id, request_id)
    previous = lgpd_request.status
    lgpd_request.status = "indeferida"
    add_request_event(db, tenant_id, request_id, "deletion_rejected", user.id, previous, "indeferida", payload.justification)
    audit(db, tenant_id, user.id, "lgpd.deletion.rejected", "LGPDDataSubjectRequest", request_id, {"justification": payload.justification})
    db.commit()
    db.refresh(lgpd_request)
    return lgpd_request


@router.get("/retention/policies")
def list_retention_policies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    return db.scalars(select(LGPDRetentionPolicy).where(LGPDRetentionPolicy.tenant_id == tenant_scope(user, db)).order_by(LGPDRetentionPolicy.entity_type)).all()


@router.post("/retention/policies", status_code=status.HTTP_201_CREATED)
def create_retention_policy(payload: LgpdRetentionPolicyIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    policy = LGPDRetentionPolicy(tenant_id=tenant_id, created_by_user_id=user.id, **payload.model_dump())
    db.add(policy)
    audit(db, tenant_id, user.id, "lgpd.retention.policy_created", "LGPDRetentionPolicy", policy.id, payload.model_dump(mode="json"))
    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/retention/policies/{policy_id}")
def patch_retention_policy(policy_id: UUID, payload: LgpdRetentionPolicyPatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    policy = db.get(LGPDRetentionPolicy, policy_id)
    tenant_id = tenant_scope(user, db)
    if not policy or policy.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Politica de retencao nao encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(policy, key, value)
    audit(db, tenant_id, user.id, "lgpd.retention.policy_updated", "LGPDRetentionPolicy", policy.id, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/retention/reviews")
def list_retention_reviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    return db.scalars(select(LGPDRetentionReview).where(LGPDRetentionReview.tenant_id == tenant_scope(user, db)).order_by(LGPDRetentionReview.created_at.desc())).all()


@router.post("/retention/run-review")
def run_retention(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    created = run_retention_review(db, tenant_scope(user, db), user)
    db.commit()
    return {"status": "ok", "created": created}


@router.post("/retention/reviews/{review_id}/resolve")
def resolve_retention(review_id: UUID, payload: LgpdRetentionReviewResolveIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    review = db.get(LGPDRetentionReview, review_id)
    if not review or review.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Revisao de retencao nao encontrada")
    resolve_review(db, review, user, payload.status, payload.reason)
    db.commit()
    db.refresh(review)
    return review


@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    return db.scalars(select(LGPDIncident).where(LGPDIncident.tenant_id == tenant_scope(user, db)).order_by(LGPDIncident.created_at.desc())).all()


@router.post("/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(payload: LgpdIncidentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    incident = LGPDIncident(
        tenant_id=tenant_id,
        reported_by_user_id=user.id,
        detected_at=payload.detected_at or datetime.now(timezone.utc),
        **payload.model_dump(exclude={"detected_at"}),
    )
    db.add(incident)
    db.flush()
    audit(db, tenant_id, user.id, "lgpd.incident.created", "LGPDIncident", incident.id, {"severity": incident.severity})
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    return get_incident_or_404(db, tenant_scope(user, db), incident_id)


@router.patch("/incidents/{incident_id}")
def patch_incident(incident_id: UUID, payload: LgpdIncidentPatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    incident = get_incident_or_404(db, tenant_id, incident_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, key, value)
    audit(db, tenant_id, user.id, "lgpd.incident.updated", "LGPDIncident", incident.id, payload.model_dump(exclude_unset=True, mode="json"))
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/incidents/{incident_id}/close")
def close_incident_endpoint(incident_id: UUID, payload: LgpdJustificationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    incident = get_incident_or_404(db, tenant_scope(user, db), incident_id)
    close_incident(db, incident, user, payload.justification)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/processing-activities")
def list_processing_activities(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_staff(user)
    return db.scalars(select(LGPDProcessingActivity).where(LGPDProcessingActivity.tenant_id == tenant_scope(user, db)).order_by(LGPDProcessingActivity.name)).all()


@router.post("/processing-activities", status_code=status.HTTP_201_CREATED)
def create_processing_activity(payload: LgpdProcessingActivityIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    activity = LGPDProcessingActivity(tenant_id=tenant_id, **payload.model_dump())
    db.add(activity)
    db.flush()
    audit(db, tenant_id, user.id, "lgpd.processing_activity.created", "LGPDProcessingActivity", activity.id, {"name": activity.name})
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/processing-activities/{activity_id}")
def patch_processing_activity(activity_id: UUID, payload: LgpdProcessingActivityPatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_lgpd_admin(user)
    tenant_id = tenant_scope(user, db)
    activity = db.get(LGPDProcessingActivity, activity_id)
    if not activity or activity.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Atividade de tratamento nao encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    audit(db, tenant_id, user.id, "lgpd.processing_activity.updated", "LGPDProcessingActivity", activity.id, payload.model_dump(exclude_unset=True, mode="json"))
    db.commit()
    db.refresh(activity)
    return activity
