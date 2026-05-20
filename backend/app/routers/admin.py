import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.permissions import RoleName, require_roles


router = APIRouter(prefix="/admin/system", tags=["admin-system"])
STARTED_AT = time.monotonic()
VERSION = "0.1.0"


@router.get(
    "/status",
    dependencies=[
        Depends(require_roles(RoleName.super_admin, RoleName.tenant_admin)),
    ],
)
def system_status(db: Session = Depends(get_db)):
    settings = get_settings()
    db.execute(text("select 1"))
    uploads_ok = settings.upload_dir.exists() and settings.upload_dir.is_dir()
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "database": "ok",
        "uploads_dir": "ok" if uploads_ok else "missing",
        "version": VERSION,
        "uptime": f"{int(time.monotonic() - STARTED_AT)}s",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
