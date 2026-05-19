from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import WorkerOut


router = APIRouter(tags=["workers"])

router.add_api_route(
    "/workers",
    crud.list_workers,
    methods=["GET"],
    response_model=list[WorkerOut],
    dependencies=[Depends(require_permissions("workers:manage"))],
)
router.add_api_route(
    "/workers",
    crud.create_worker,
    methods=["POST"],
    response_model=WorkerOut,
    dependencies=[Depends(require_permissions("workers:manage"))],
)
