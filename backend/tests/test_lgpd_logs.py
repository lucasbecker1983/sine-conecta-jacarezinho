from sqlalchemy import select

from app.models import AuditLog, DataAccessLog, LGPDConsent, Referral
from conftest import add_referral


def test_worker_lgpd_consent_registered(db_session, seed_data):
    consent = db_session.scalar(select(LGPDConsent).where(LGPDConsent.worker_id == seed_data["worker"].id))
    assert consent is not None


def test_resume_view_by_sine_generates_data_access_log(client, db_session, seed_data, auth_headers):
    response = client.get(f"/api/resumes/{seed_data['resume'].id}", headers=auth_headers("sine_staff"))
    assert response.status_code == 200
    log = db_session.scalar(select(DataAccessLog).where(DataAccessLog.resume_id == seed_data["resume"].id))
    assert log is not None


def test_csv_export_generates_audit_log(client, db_session, auth_headers):
    response = client.get("/api/reports/export.csv", headers=auth_headers("sine_manager"))
    assert response.status_code == 200
    audit = db_session.scalar(select(AuditLog).where(AuditLog.action == "reports.export.csv"))
    assert audit is not None
