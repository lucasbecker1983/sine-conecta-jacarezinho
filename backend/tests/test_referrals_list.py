from conftest import add_referral


def test_sine_referrals_list_shows_forwarded_candidate(
    client, db_session, seed_data, auth_headers
):
    referral = add_referral(db_session, seed_data, status="encaminhado")
    db_session.commit()

    response = client.get("/api/referrals", headers=auth_headers("sine_staff"))

    assert response.status_code == 200
    data = response.json()
    assert any(item["id"] == str(referral.id) for item in data)
    item = next(item for item in data if item["id"] == str(referral.id))
    assert item["worker_name"] == seed_data["worker"].full_name
    assert item["job_title"] == seed_data["job"].title
    assert item["company_name"] == seed_data["company"].trade_name
    assert item["status"] == "encaminhado"
