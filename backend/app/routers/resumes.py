from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import ResumeOut


router = APIRouter(tags=["resumes"])

router.add_api_route("/resumes/{worker_id}", crud.upload_resume, methods=["POST"], response_model=ResumeOut, dependencies=[Depends(require_permissions("workers:manage"))])
router.add_api_route("/resumes/{resume_id}", crud.get_resume, methods=["GET"], response_model=ResumeOut, dependencies=[Depends(require_permissions("resumes:view"))])
