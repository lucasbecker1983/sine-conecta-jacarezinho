from conftest import add_referral
from sqlalchemy import select

from app.models import AuditLog, CompanyFeedback


def test_sine_lists_and_opens_complete_company_detail(
    client, db_session, seed_data, auth_headers
):
    referral = add_referral(db_session, seed_data, status="encaminhado")
    db_session.commit()

    listed = client.get("/api/companies", headers=auth_headers("sine_staff"))
    assert listed.status_code == 200, listed.text
    item = next(company for company in listed.json() if company["id"] == str(seed_data["company"].id))
    assert item["legal_name"] == seed_data["company"].legal_name
    assert item["pending_feedbacks"] >= 1

    detail = client.get(
        f"/api/companies/{seed_data['company'].id}",
        headers=auth_headers("sine_staff"),
    )
    assert detail.status_code == 200, detail.text
    data = detail.json()
    assert data["cnpj"] == seed_data["company"].cnpj
    assert data["legal_name"] == seed_data["company"].legal_name
    assert data["email"] == seed_data["company"].email
    assert data["city"] == "Jacarezinho"
    assert data["summary"]["pending_feedbacks"] >= 1
    assert any(job["id"] == str(seed_data["job"].id) for job in data["jobs"])
    assert any(row["id"] == str(referral.id) for row in data["referrals"])
    assert any(row["pending"] is True for row in data["feedbacks"])

    audit = db_session.scalar(
        select(AuditLog).where(AuditLog.action == "company_viewed_by_sine")
    )
    assert audit is not None


def test_sine_adds_internal_note_and_changes_status(
    client, db_session, seed_data, auth_headers
):
    note = client.post(
        f"/api/companies/{seed_data['company'].id}/notes",
        json={"note": "Contato realizado com o RH."},
        headers=auth_headers("sine_staff"),
    )
    assert note.status_code == 200, note.text
    assert "Contato realizado" in note.json()["internal_notes"]

    status = client.patch(
        f"/api/companies/{seed_data['company'].id}/status",
        json={"status": "bloqueada", "reason": "Pendência documental"},
        headers=auth_headers("sine_staff"),
    )
    assert status.status_code == 200, status.text
    assert status.json()["status"] == "bloqueada"
    assert status.json()["blocking_reason"] == "Pendência documental"

    actions = {
        row.action
        for row in db_session.scalars(
            select(AuditLog).where(AuditLog.entity_id == seed_data["company"].id)
        ).all()
    }
    assert "company_note_created" in actions
    assert "company_status_changed" in actions
    assert "company_blocked" in actions


def test_company_admin_access_is_blocked_for_company_worker_and_anonymous(
    client, seed_data, auth_headers
):
    url = f"/api/companies/{seed_data['company'].id}"
    assert client.get(url, headers=auth_headers("company_user")).status_code == 403
    assert client.get(url, headers=auth_headers("worker")).status_code == 403
    assert client.get(url).status_code in {401, 403}


def test_company_detail_shows_given_feedback_and_confidential_jobs_stay_masked_for_worker(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = True
    referral = add_referral(db_session, seed_data, status="contratado")
    feedback = CompanyFeedback(
        tenant_id=seed_data["tenant"].id,
        referral_id=referral.id,
        company_id=seed_data["company"].id,
        status="contratado",
        comments="Contratado",
    )
    referral.feedback_status = "contratado"
    db_session.add(feedback)
    db_session.commit()

    detail = client.get(
        f"/api/companies/{seed_data['company'].id}",
        headers=auth_headers("sine_staff"),
    )
    assert detail.status_code == 200, detail.text
    assert any(row["status"] == "contratado" for row in detail.json()["feedbacks"])
    assert any(job["is_confidential"] is True for job in detail.json()["jobs"])

    worker_jobs = client.get(
        "/api/worker-portal/open-jobs", headers=auth_headers("worker")
    )
    assert worker_jobs.status_code == 200, worker_jobs.text
    worker_job = next(item for item in worker_jobs.json() if item["id"] == str(seed_data["job"].id))
    assert worker_job["company_name"] == "Empresa confidencial"
    assert "company_cnpj" not in worker_job
