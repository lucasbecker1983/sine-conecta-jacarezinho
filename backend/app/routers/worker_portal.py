from fastapi import APIRouter

from app.routers import crud
from app.schemas.common import JobOut, ResumeOut, WorkerOut


router = APIRouter(tags=["worker-portal"])

router.add_api_route("/worker-portal/profile", crud.worker_profile, methods=["GET"], response_model=WorkerOut | None)
router.add_api_route("/worker-portal/profile", crud.save_worker_profile, methods=["PUT"], response_model=WorkerOut)
router.add_api_route("/worker-portal/open-jobs", crud.worker_open_jobs, methods=["GET"], response_model=list[JobOut])
router.add_api_route("/worker-portal/resumes", crud.worker_resumes, methods=["GET"], response_model=list[ResumeOut])
router.add_api_route("/worker-portal/resume-pdf", crud.worker_upload_resume_pdf, methods=["POST"], response_model=ResumeOut)
router.add_api_route("/worker-portal/apply/{job_id}", crud.worker_apply, methods=["POST"])
router.add_api_route("/worker-portal/applications", crud.worker_applications, methods=["GET"])
