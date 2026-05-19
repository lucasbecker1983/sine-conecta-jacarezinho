from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud


router = APIRouter(tags=["feedbacks"])

router.add_api_route(
    "/feedback",
    crud.create_feedback,
    methods=["POST"],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
