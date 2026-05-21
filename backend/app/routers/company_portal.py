from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import CompanyOut, CompanyReferralOut, JobOut


router = APIRouter(tags=["company-portal"])

router.add_api_route(
    "/company-portal/profile",
    crud.company_portal_profile,
    methods=["GET"],
    response_model=CompanyOut | None,
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/profile",
    crud.save_company_portal_profile,
    methods=["PUT"],
    response_model=CompanyOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/jobs",
    crud.list_company_portal_jobs,
    methods=["GET"],
    response_model=list[JobOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/jobs",
    crud.create_company_portal_job,
    methods=["POST"],
    response_model=JobOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/jobs/{job_id}",
    crud.update_company_portal_job,
    methods=["PATCH"],
    response_model=JobOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/status",
    crud.company_portal_status,
    methods=["GET"],
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/referrals",
    crud.list_company_portal_referrals,
    methods=["GET"],
    response_model=list[CompanyReferralOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/referrals/{referral_id}/feedback",
    crud.create_company_portal_feedback,
    methods=["POST"],
    dependencies=[Depends(require_permissions("company:portal"))],
)
