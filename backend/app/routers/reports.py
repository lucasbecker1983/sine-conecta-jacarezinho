from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import DataAccessLogOut


router = APIRouter(tags=["reports"])

router.add_api_route(
    "/reports/summary",
    crud.reports_summary,
    methods=["GET"],
    dependencies=[Depends(require_permissions("reports:view"))],
)
router.add_api_route(
    "/audit/data-access",
    crud.data_access_logs,
    methods=["GET"],
    response_model=list[DataAccessLogOut],
    dependencies=[Depends(require_permissions("reports:view"))],
)
