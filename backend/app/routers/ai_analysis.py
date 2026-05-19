from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud


router = APIRouter(tags=["ai-analysis"])

router.add_api_route("/ai/match/{resume_id}/{job_id}", crud.match_resume, methods=["POST"], dependencies=[Depends(require_permissions("resumes:view"))])
