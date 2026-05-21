from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_permissions
from app.models import User
from app.routers import crud
from app.schemas.common import (
    ResumeBankAISuggestionRead,
    ResumeBankAISuggestionReview,
    ResumeBankEntryCreate,
    ResumeBankEntryListItem,
    ResumeBankEntryRead,
    ResumeBankEntryUpdate,
    ResumeBankMatchRequest,
    ResumeBankMatchResult,
    ResumeBankMoveRequest,
    ResumeBankStatusUpdate,
    WorkerResumeBankStatusOut,
)
from app.services import resume_bank_service
from app.services.audit import audit, log_resume_access


router = APIRouter(tags=["resume-bank"])


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _tenant_user(
    db: Session,
    user: User,
) -> tuple[UUID, User]:
    return crud.tenant_scope(user, db), user


@router.get(
    "/resume-bank/suggestions",
    response_model=list[ResumeBankAISuggestionRead],
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def list_ai_suggestions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.list_suggestions(db, tenant_id)


@router.get(
    "/resume-bank/suggestions/job/{job_id}",
    response_model=list[ResumeBankAISuggestionRead],
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def list_job_ai_suggestions(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.list_suggestions(db, tenant_id, job_id=job_id)


@router.patch(
    "/resume-bank/suggestions/{suggestion_id}/review",
    response_model=ResumeBankAISuggestionRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def review_ai_suggestion(
    suggestion_id: UUID,
    payload: ResumeBankAISuggestionReview,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.review_suggestion(
        db,
        tenant_id,
        suggestion_id,
        payload.status,
        user,
        note=payload.note,
        ip_address=_ip(request),
    )


@router.post(
    "/resume-bank/suggestions/{suggestion_id}/forward",
    response_model=ResumeBankAISuggestionRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def forward_ai_suggestion(
    suggestion_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.forward_suggestion(
        db, tenant_id, suggestion_id, user, ip_address=_ip(request)
    )


@router.post(
    "/resume-bank/match-job/{job_id}",
    response_model=ResumeBankMatchResult,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def match_job_with_resume_bank(
    job_id: UUID,
    payload: ResumeBankMatchRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.match_job(
        db, tenant_id, job_id, user, limit=payload.limit, ip_address=_ip(request)
    )


@router.get(
    "/resume-bank",
    response_model=list[ResumeBankEntryListItem],
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def list_resume_bank_entries(
    search: str | None = None,
    status: str | None = None,
    city: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.list_entries(
        db, tenant_id, search=search, status=status, city=city
    )


@router.post(
    "/resume-bank",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def create_resume_bank_entry(
    payload: ResumeBankEntryCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.create_entry(
        db, tenant_id, payload, user, ip_address=_ip(request)
    )


@router.post(
    "/resume-bank/move-from-application",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def move_from_application(
    payload: ResumeBankMoveRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    if not payload.worker_id:
        raise HTTPException(
            status_code=422,
            detail="Informe o candidato para mover ao Banco de Currículos",
        )
    entry = resume_bank_service.create_entry(
        db,
        tenant_id,
        ResumeBankEntryCreate(
            worker_id=payload.worker_id,
            resume_id=payload.resume_id,
            source_job_id=payload.job_id,
            source_application_id=payload.source_application_id,
            status="ativo",
            entry_reason=payload.entry_reason,
            tags=payload.tags,
            internal_notes=payload.internal_notes,
        ),
        user,
        ip_address=_ip(request),
    )
    audit(
        db,
        tenant_id,
        user.id,
        "resume_bank_moved_from_application",
        "ResumeBankEntry",
        entry.id,
        {
            "worker_id": str(entry.worker_id),
            "job_id": str(payload.job_id) if payload.job_id else None,
            "source_application_id": str(payload.source_application_id)
            if payload.source_application_id
            else None,
        },
        _ip(request),
    )
    db.commit()
    return entry


@router.post(
    "/resume-bank/move-from-referral",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def move_from_referral(
    payload: ResumeBankMoveRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.move_from_referral(
        db, tenant_id, payload, user, ip_address=_ip(request)
    )


@router.get(
    "/resume-bank/{entry_id}",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def get_resume_bank_entry(
    entry_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    entry, worker, resume = resume_bank_service.get_entry(db, tenant_id, entry_id)
    audit(
        db,
        tenant_id,
        user.id,
        "resume_bank_viewed_by_sine",
        "ResumeBankEntry",
        entry.id,
        {"worker_id": str(worker.id), "resume_id": str(resume.id) if resume else None},
        _ip(request),
    )
    if resume:
        log_resume_access(
            db,
            tenant_id,
            user.id,
            worker.id,
            resume.id,
            "resume_bank_view",
            "Banco de Currículos",
            _ip(request),
        )
    db.commit()
    return resume_bank_service.entry_read(entry, worker, resume)


@router.patch(
    "/resume-bank/{entry_id}",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def update_resume_bank_entry(
    entry_id: UUID,
    payload: ResumeBankEntryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.update_entry(
        db, tenant_id, entry_id, payload, user, ip_address=_ip(request)
    )


@router.patch(
    "/resume-bank/{entry_id}/archive",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def archive_resume_bank_entry(
    entry_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.archive_entry(
        db, tenant_id, entry_id, user, ip_address=_ip(request)
    )


@router.post(
    "/resume-bank/{entry_id}/status",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def update_resume_bank_status(
    entry_id: UUID,
    payload: ResumeBankStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.update_entry(
        db,
        tenant_id,
        entry_id,
        ResumeBankEntryUpdate(status=payload.status),
        user,
        ip_address=_ip(request),
    )


@router.post(
    "/resume-bank/{entry_id}/notes",
    response_model=ResumeBankEntryRead,
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def update_resume_bank_notes(
    entry_id: UUID,
    payload: ResumeBankEntryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.update_entry(
        db,
        tenant_id,
        entry_id,
        ResumeBankEntryUpdate(internal_notes=payload.internal_notes),
        user,
        ip_address=_ip(request),
    )


@router.get(
    "/resume-bank/{entry_id}/history",
    dependencies=[Depends(require_permissions("resume_bank:manage"))],
)
def get_resume_bank_history(
    entry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id, _ = _tenant_user(db, user)
    return resume_bank_service.history(db, tenant_id, entry_id)


@router.get(
    "/worker-portal/resume-bank/me",
    response_model=WorkerResumeBankStatusOut,
)
def worker_resume_bank_status(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    crud.require_worker_user(user)
    tenant_id = crud.tenant_scope(user, db)
    worker = crud.current_worker(db, user)
    if not worker:
        return WorkerResumeBankStatusOut(
            status=None,
            entered_at=None,
            updated_at=None,
            desired_roles=[],
            message="Complete seu cadastro para acompanhar futuras oportunidades pelo SINE Jacarezinho.",
        )
    return resume_bank_service.worker_status(
        db, tenant_id, worker, user, ip_address=_ip(request)
    )
