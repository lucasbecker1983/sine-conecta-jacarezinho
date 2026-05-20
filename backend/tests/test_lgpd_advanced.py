from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select

from app.models import (
    AuditLog,
    Company,
    LGPDConsentHistory,
    LGPDDataSharingRecord,
    LGPDTermsVersion,
    Worker,
)


def _term(db, tenant_id, term_type="worker_privacy_notice"):
    term = LGPDTermsVersion(
        tenant_id=tenant_id,
        term_type=term_type,
        version="1.0",
        title="Aviso LGPD",
        content="Texto publico de privacidade para testes.",
        summary="Resumo publico",
        is_active=True,
        published_at=datetime.now(timezone.utc),
    )
    db.add(term)
    db.flush()
    return term


def test_public_creates_lgpd_request(client, seed_data):
    response = client.post(
        "/api/lgpd/public/requests",
        json={
            "requester_name": "Maria Titular",
            "requester_email": "maria.titular@example.com",
            "requester_type": "worker",
            "request_type": "access_data",
            "description": "Desejo acessar os dados tratados pelo SINE.",
            "confirmation": True,
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["status"] == "aberta"
    assert response.json()["due_date"] is not None


def test_public_consults_active_terms(client, db_session, seed_data):
    _term(db_session, seed_data["tenant"].id)
    db_session.commit()

    response = client.get("/api/lgpd/public/terms?active_only=true")

    assert response.status_code == 200
    assert any(item["term_type"] == "worker_privacy_notice" for item in response.json())


def test_worker_sees_only_own_consents(client, db_session, seed_data, auth_headers):
    term = _term(db_session, seed_data["tenant"].id)
    other_worker = Worker(
        tenant_id=seed_data["tenant"].id,
        cpf=f"{uuid4().int % 10**11:011d}",
        full_name="Outro Trabalhador",
        email="outro.worker@example.com",
        city="Jacarezinho",
        state="PR",
        lgpd_accepted=True,
    )
    db_session.add(other_worker)
    db_session.flush()
    db_session.add_all(
        [
            LGPDConsentHistory(
                tenant_id=seed_data["tenant"].id,
                worker_id=seed_data["worker"].id,
                user_id=seed_data["users"]["worker"].id,
                term_version_id=term.id,
                consent_type="worker_privacy_notice",
                consent_status="accepted",
                accepted_at=datetime.now(timezone.utc),
                legal_basis="consentimento",
                purpose="Cadastro e candidatura",
            ),
            LGPDConsentHistory(
                tenant_id=seed_data["tenant"].id,
                worker_id=other_worker.id,
                term_version_id=term.id,
                consent_type="resume_processing_notice",
                consent_status="accepted",
                accepted_at=datetime.now(timezone.utc),
                legal_basis="consentimento",
                purpose="Outro titular",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/lgpd/me/consents", headers=auth_headers("worker"))

    assert response.status_code == 200
    consent_types = {item["consent_type"] for item in response.json()}
    assert "worker_privacy_notice" in consent_types
    assert "resume_processing_notice" not in consent_types


def test_company_sees_only_own_data_sharing(client, db_session, seed_data, auth_headers):
    other_company = Company(
        tenant_id=seed_data["tenant"].id,
        cnpj=f"{uuid4().int % 10**14:014d}",
        legal_name="Outra Empresa LTDA",
        email="outra.empresa@example.com",
        city="Jacarezinho",
        state="PR",
        lgpd_accepted=True,
    )
    db_session.add(other_company)
    db_session.flush()
    db_session.add_all(
        [
            LGPDDataSharingRecord(
                tenant_id=seed_data["tenant"].id,
                worker_id=seed_data["worker"].id,
                company_id=seed_data["company"].id,
                job_id=seed_data["job"].id,
                shared_by_user_id=seed_data["users"]["sine_staff"].id,
                data_categories=["nome", "curriculo"],
                purpose="Encaminhamento oficial",
                legal_basis="execucao_politica_publica",
            ),
            LGPDDataSharingRecord(
                tenant_id=seed_data["tenant"].id,
                worker_id=seed_data["worker"].id,
                company_id=other_company.id,
                job_id=seed_data["job"].id,
                shared_by_user_id=seed_data["users"]["sine_staff"].id,
                data_categories=["nome"],
                purpose="Outro compartilhamento",
                legal_basis="execucao_politica_publica",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/lgpd/company/data-sharing", headers=auth_headers("company_user"))

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["company_id"] == str(seed_data["company"].id)


def test_lgpd_admin_permissions(client, auth_headers):
    assert client.get("/api/lgpd/requests", headers=auth_headers("sine_manager")).status_code == 200
    assert client.get("/api/lgpd/requests", headers=auth_headers("worker")).status_code == 403
    assert client.get("/api/lgpd/requests", headers=auth_headers("company_user")).status_code == 403


def test_tenant_admin_changes_status_and_sine_staff_cannot_anonymize(client, db_session, seed_data, auth_headers):
    created = client.post(
        "/api/lgpd/me/requests",
        json={"request_type": "anonymize_data", "description": "Solicito anonimizar meus dados cadastrais."},
        headers=auth_headers("worker"),
    )
    request_id = created.json()["id"]

    status_response = client.post(
        f"/api/lgpd/requests/{request_id}/status",
        json={"status": "em_analise", "message": "Em analise pelo encarregado."},
        headers=auth_headers("tenant_admin"),
    )
    denied = client.post(
        f"/api/lgpd/requests/{request_id}/anonymize",
        json={"justification": "Teste"},
        headers=auth_headers("sine_staff"),
    )
    approved = client.post(
        f"/api/lgpd/requests/{request_id}/anonymize",
        json={"justification": "Anonimizacao deferida pelo encarregado."},
        headers=auth_headers("tenant_admin"),
    )

    assert status_response.status_code == 200
    assert denied.status_code == 403
    assert approved.status_code == 200
    db_session.refresh(seed_data["worker"])
    assert seed_data["worker"].is_anonymized is True


def test_export_generates_audit_log(client, db_session, seed_data, auth_headers):
    created = client.post(
        "/api/lgpd/me/requests",
        json={"request_type": "access_data", "description": "Quero receber meus dados pessoais tratados."},
        headers=auth_headers("worker"),
    )
    request_id = created.json()["id"]

    response = client.post(
        f"/api/lgpd/requests/{request_id}/export-subject-data",
        headers=auth_headers("sine_manager"),
    )

    assert response.status_code == 200, response.text
    assert response.json()["subject_type"] == "worker"
    audit_log = db_session.scalar(
        select(AuditLog).where(AuditLog.action == "lgpd.subject_data.exported")
    )
    assert audit_log is not None


def test_referral_creates_data_sharing_record(client, db_session, seed_data, auth_headers):
    response = client.post(
        f"/api/jobs/{seed_data['job'].id}/refer-candidates",
        json={
            "candidates": [
                {
                    "worker_id": str(seed_data["worker"].id),
                    "resume_id": str(seed_data["resume"].id),
                    "match_score": 88,
                    "match_explanation": "Perfil aderente",
                }
            ],
            "message_to_company": "Encaminhamento oficial do candidato.",
        },
        headers=auth_headers("sine_staff"),
    )

    assert response.status_code == 200, response.text
    record = db_session.scalar(
        select(LGPDDataSharingRecord).where(
            LGPDDataSharingRecord.tenant_id == seed_data["tenant"].id,
            LGPDDataSharingRecord.worker_id == seed_data["worker"].id,
            LGPDDataSharingRecord.company_id == seed_data["company"].id,
        )
    )
    assert record is not None


def test_incident_can_be_created_by_tenant_admin(client, auth_headers):
    response = client.post(
        "/api/lgpd/incidents",
        json={
            "title": "Teste de incidente",
            "description": "Registro controlado para validar governanca LGPD.",
            "severity": "media",
            "affected_data_categories": ["email"],
            "notification_required": False,
        },
        headers=auth_headers("tenant_admin"),
    )

    assert response.status_code == 201, response.text
    assert response.json()["status"] == "registrado"
