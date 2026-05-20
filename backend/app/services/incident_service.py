from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import LGPDIncident, User
from app.services.audit import audit


def get_incident_or_404(db: Session, tenant_id: UUID, incident_id: UUID) -> LGPDIncident:
    incident = db.get(LGPDIncident, incident_id)
    if not incident or incident.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Incidente LGPD nao encontrado")
    return incident


def close_incident(db: Session, incident: LGPDIncident, actor: User, justification: str) -> LGPDIncident:
    incident.status = "encerrado"
    incident.closed_by_user_id = actor.id
    incident.closed_at = datetime.now(timezone.utc)
    if justification:
        incident.containment_actions = (
            (incident.containment_actions + "\n\n" if incident.containment_actions else "")
            + f"Encerramento: {justification}"
        )
    audit(
        db,
        incident.tenant_id,
        actor.id,
        "lgpd.incident.closed",
        "LGPDIncident",
        incident.id,
        {"justification": justification},
    )
    return incident
