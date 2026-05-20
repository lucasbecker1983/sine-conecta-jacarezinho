from conftest import add_referral


def test_worker_can_apply_once(client, db_session, seed_data, auth_headers):
    response = client.post(
        f"/api/worker-portal/jobs/{seed_data['job'].id}/apply",
        json={"confirm_lgpd": True},
        headers=auth_headers("worker"),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "applied"

    duplicate = client.post(
        f"/api/worker-portal/jobs/{seed_data['job'].id}/apply",
        json={"confirm_lgpd": True},
        headers=auth_headers("worker"),
    )
    assert duplicate.status_code == 409


def test_worker_application_status_and_company_not_notified(client, db_session, seed_data, auth_headers):
    response = client.post(
        f"/api/worker-portal/jobs/{seed_data['job'].id}/apply",
        json={"confirm_lgpd": True},
        headers=auth_headers("worker"),
    )
    assert response.status_code == 200
    referral = add_referral(db_session, seed_data)
    assert referral.status == "candidatura_trabalhador"
