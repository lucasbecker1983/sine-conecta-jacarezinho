from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import CompanyOut


router = APIRouter(tags=["companies"])

router.add_api_route(
    "/companies",
    crud.list_companies,
    methods=["GET"],
    response_model=list[CompanyOut],
    dependencies=[Depends(require_permissions("companies:manage"))],
)
router.add_api_route(
    "/companies",
    crud.create_company,
    methods=["POST"],
    response_model=CompanyOut,
    dependencies=[Depends(require_permissions("companies:manage"))],
)
router.add_api_route(
    "/companies/{company_id}/portal-user",
    crud.create_company_portal_user,
    methods=["POST"],
    dependencies=[Depends(require_permissions("companies:manage"))],
)
