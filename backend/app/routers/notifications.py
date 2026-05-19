from fastapi import APIRouter

from app.routers import crud
from app.schemas.common import NotificationOut


router = APIRouter(tags=["notifications"])

router.add_api_route(
    "/notifications",
    crud.list_notifications,
    methods=["GET"],
    response_model=list[NotificationOut],
)
router.add_api_route(
    "/notifications/summary", crud.notifications_summary, methods=["GET"]
)
router.add_api_route(
    "/notifications/read-all", crud.read_all_notifications, methods=["POST"]
)
