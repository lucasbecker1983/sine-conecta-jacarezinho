from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.permissions import require_permissions
from app.models import Referral, Resume, User, Worker
from app.routers import crud
from app.schemas.common import CandidateAnalysisOut, JobCandidateAnalysisOut
from app.services.audit import audit
from app.services.job_triage_service import get_job_for_triage
from app.services.matching_service import analyze_candidate


router = APIRouter(tags=["ai-analysis"])

router.add_api_route(
    "/ai/match/{resume_id}/{job_id}",
    crud.match_resume,
    methods=["POST"],
    dependencies=[Depends(require_permissions("resumes:view"))],
)


@router.post(
    "/ai/jobs/{job_id}/analyze-candidates",
    response_model=JobCandidateAnalysisOut,
    dependencies=[Depends(require_permissions("resumes:view"))],
)
def analyze_job_candidates(
    job_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    job = get_job_for_triage(db, tenant_id, job_id)
    rows = db.execute(
        select(Referral, Worker, Resume)
        .join(Worker, Worker.id == Referral.worker_id)
        .outerjoin(Resume, Resume.id == Referral.resume_id)
        .where(Referral.tenant_id == tenant_id, Referral.job_id == job.id)
        .order_by(Referral.created_at.desc())
    ).all()
    candidates: list[CandidateAnalysisOut] = []
    for referral, worker, resume in rows:
        selected_resume = resume or db.scalar(
            select(Resume)
            .where(Resume.tenant_id == tenant_id, Resume.worker_id == worker.id)
            .order_by(Resume.created_at.desc())
        )
        match = analyze_candidate(job, worker, selected_resume)
        analysis_json = {
            "summary": match.summary,
            "skills": match.skills,
            "strengths": match.strengths,
            "gaps": match.gaps,
            "match_level": match.match_level,
            "suggested_interview_questions": match.suggested_interview_questions,
        }
        referral.match_score = match.match_score
        referral.match_explanation = match.match_explanation
        referral.ai_analysis_json = analysis_json
        referral.last_ai_analyzed_at = datetime.now(timezone.utc)
        candidates.append(
            CandidateAnalysisOut(
                worker_id=worker.id,
                resume_id=selected_resume.id if selected_resume else None,
                worker_name=worker.full_name,
                match_score=match.match_score,
                match_level=match.match_level,
                summary=match.summary,
                skills=match.skills,
                strengths=match.strengths,
                gaps=match.gaps,
                match_explanation=match.match_explanation,
                suggested_interview_questions=match.suggested_interview_questions,
            )
        )
    audit(
        db,
        tenant_id,
        user.id,
        "job_triage.ai_analyze_candidates",
        "Job",
        job.id,
        {"candidate_count": len(candidates)},
        request.client.host if request.client else None,
    )
    db.commit()
    return JobCandidateAnalysisOut(
        job_id=job.id, job_title=job.title, candidates=candidates
    )
