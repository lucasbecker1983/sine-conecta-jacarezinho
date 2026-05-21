from sqlalchemy import select

from app.models import AuditLog, Referral, ResumeBankAISuggestion, ResumeBankEntry


def _create_entry(client, seed_data, auth_headers, **extra):
    payload = {
        "worker_id": str(seed_data["worker"].id),
        "resume_id": str(seed_data["resume"].id),
        "desired_roles": ["Atendente"],
        "desired_sectors": ["Comercio"],
        "availability": "Imediata",
        "city": "Jacarezinho",
        "education_level": "Ensino medio",
        "experience_summary": "Experiencia com atendimento ao publico",
        **extra,
    }
    return client.post("/api/resume-bank", json=payload, headers=auth_headers("sine_staff"))


def test_sine_creates_resume_bank_entry_and_audits(
    client, db_session, seed_data, auth_headers
):
    response = _create_entry(client, seed_data, auth_headers)

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["worker_name"] == seed_data["worker"].full_name
    assert data["status"] == "ativo"

    audit = db_session.scalar(
        select(AuditLog).where(AuditLog.action == "resume_bank_created")
    )
    assert audit is not None


def test_resume_bank_role_boundaries(client, seed_data, auth_headers):
    created = _create_entry(client, seed_data, auth_headers)
    entry_id = created.json()["id"]

    assert client.get("/api/resume-bank", headers=auth_headers("tenant_admin")).status_code == 200
    assert client.get("/api/resume-bank", headers=auth_headers("company_user")).status_code == 403
    assert client.get(f"/api/resume-bank/{entry_id}", headers=auth_headers("worker")).status_code == 403


def test_worker_sees_only_own_resume_bank_status(
    client, seed_data, auth_headers
):
    _create_entry(
        client,
        seed_data,
        auth_headers,
        internal_notes="Observacao interna do SINE",
        ai_summary="Analise interna da IA",
    )

    response = client.get(
        "/api/worker-portal/resume-bank/me", headers=auth_headers("worker")
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "ativo"
    assert "futuras oportunidades" in data["message"]
    assert "internal_notes" not in data
    assert "compatibility_score" not in data
    assert "ai_summary" not in data


def test_resume_bank_status_and_archive(client, db_session, seed_data, auth_headers):
    created = _create_entry(client, seed_data, auth_headers)
    entry_id = created.json()["id"]

    status_response = client.post(
        f"/api/resume-bank/{entry_id}/status",
        json={"status": "em_analise", "note": "Revisao operacional"},
        headers=auth_headers("sine_staff"),
    )
    assert status_response.status_code == 200, status_response.text
    assert status_response.json()["status"] == "em_analise"

    archive_response = client.patch(
        f"/api/resume-bank/{entry_id}/archive", headers=auth_headers("sine_staff")
    )
    assert archive_response.status_code == 200, archive_response.text
    assert archive_response.json()["status"] == "arquivado"

    entry = db_session.get(ResumeBankEntry, entry_id)
    assert entry.archived_at is not None


def test_match_job_generates_pending_suggestions_without_forwarding(
    client, db_session, seed_data, auth_headers
):
    _create_entry(client, seed_data, auth_headers)
    referrals_before = len(db_session.scalars(select(Referral)).all())

    response = client.post(
        f"/api/resume-bank/match-job/{seed_data['job'].id}",
        json={"limit": 10},
        headers=auth_headers("sine_staff"),
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_suggestions"] >= 1
    suggestion = data["suggestions"][0]
    assert suggestion["worker_name"] == seed_data["worker"].full_name
    assert suggestion["status"] == "pendente_revisao"

    assert db_session.scalar(select(ResumeBankAISuggestion)) is not None
    assert len(db_session.scalars(select(Referral)).all()) == referrals_before


def test_sine_reviews_and_forwards_suggestion_explicitly(
    client, db_session, seed_data, auth_headers
):
    _create_entry(client, seed_data, auth_headers)
    matched = client.post(
        f"/api/resume-bank/match-job/{seed_data['job'].id}",
        json={"limit": 10},
        headers=auth_headers("sine_staff"),
    )
    suggestion_id = matched.json()["suggestions"][0]["id"]

    approved = client.patch(
        f"/api/resume-bank/suggestions/{suggestion_id}/review",
        json={"status": "aprovado_pelo_sine", "note": "Perfil compativel"},
        headers=auth_headers("sine_staff"),
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "aprovado_pelo_sine"

    forwarded = client.post(
        f"/api/resume-bank/suggestions/{suggestion_id}/forward",
        headers=auth_headers("sine_staff"),
    )
    assert forwarded.status_code == 200, forwarded.text
    assert forwarded.json()["status"] == "encaminhado"

    company_referrals = client.get(
        "/api/company-portal/referrals", headers=auth_headers("company_user")
    )
    assert company_referrals.status_code == 200, company_referrals.text
    assert any(
        item["worker_name"] == seed_data["worker"].full_name
        for item in company_referrals.json()
    )
