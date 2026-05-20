import csv
import io

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import RoleName, get_current_user, require_permissions, require_roles
from app.models import User
from app.routers import crud
from app.schemas.common import DataAccessLogOut
from app.services.audit import audit


router = APIRouter(tags=["reports"])

router.add_api_route(
    "/reports/summary",
    crud.reports_summary,
    methods=["GET"],
    dependencies=[Depends(require_permissions("reports:view"))],
)
router.add_api_route(
    "/reports/overview",
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


@router.get(
    "/reports/export.csv",
    dependencies=[
        Depends(require_roles(RoleName.super_admin, RoleName.tenant_admin, RoleName.sine_manager)),
    ],
)
def export_reports_csv(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tenant_id = crud.tenant_scope(user, db)
    summary = crud.reports_summary(db, user)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["indicador", "valor"])
    for key, value in summary.items():
        writer.writerow([key, value])
    audit(
        db,
        tenant_id,
        user.id,
        "reports.export.csv",
        "Report",
        None,
        {"fields": list(summary.keys())},
        request.client.host if request.client else None,
    )
    db.commit()
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sine-relatorios.csv"},
    )
