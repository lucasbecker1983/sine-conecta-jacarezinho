from conftest import add_referral


def test_company_with_pending_feedback_cannot_open_job(client, db_session, seed_data, auth_headers):
    add_referral(db_session, seed_data, status="encaminhado")
    db_session.commit()
    response = client.post(
        "/api/company-portal/jobs",
        json={"title": "Auxiliar", "description": "Apoio operacional", "vacancies": 1},
        headers=auth_headers("company_user"),
    )
    assert response.status_code == 409


def test_company_without_pending_feedback_can_open_job(client, auth_headers):
    response = client.post(
        "/api/company-portal/jobs",
        json={"title": "Auxiliar", "description": "Apoio operacional", "vacancies": 1},
        headers=auth_headers("company_user"),
    )
    assert response.status_code == 200


def test_final_feedback_releases_flow(client, db_session, seed_data, auth_headers):
    referral = add_referral(db_session, seed_data, status="encaminhado")
    db_session.commit()
    feedback = client.post(
        f"/api/company-portal/referrals/{referral.id}/feedback",
        json={"status": "contratado", "comments": "Contratado"},
        headers=auth_headers("company_user"),
    )
    assert feedback.status_code == 200
    created = client.post(
        "/api/company-portal/jobs",
        json={"title": "Repositor", "description": "Reposicao", "vacancies": 1},
        headers=auth_headers("company_user"),
    )
    assert created.status_code == 200
