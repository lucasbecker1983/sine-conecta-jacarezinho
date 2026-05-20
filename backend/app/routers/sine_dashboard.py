from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import DataAccessLogOut, NotificationOut


router = APIRouter(tags=["sine-dashboard"])

router.add_api_route("/reports/summary", crud.reports_summary, methods=["GET"], dependencies=[Depends(require_permissions("reports:view"))])
router.add_api_route("/reports/overview", crud.reports_summary, methods=["GET"], dependencies=[Depends(require_permissions("reports:view"))])
router.add_api_route("/audit/data-access", crud.data_access_logs, methods=["GET"], response_model=list[DataAccessLogOut], dependencies=[Depends(require_permissions("reports:view"))])
router.add_api_route("/notifications", crud.list_notifications, methods=["GET"], response_model=list[NotificationOut])
router.add_api_route("/notifications/summary", crud.notifications_summary, methods=["GET"])
router.add_api_route("/notifications/read-all", crud.read_all_notifications, methods=["POST"])
