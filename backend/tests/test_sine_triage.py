from conftest import add_referral


def test_sine_lists_candidates_and_runs_ai(client, db_session, seed_data, auth_headers):
    add_referral(db_session, seed_data)
    db_session.commit()
    candidates = client.get(f"/api/jobs/{seed_data['job'].id}/candidates", headers=auth_headers("sine_staff"))
    assert candidates.status_code == 200
    assert len(candidates.json()) == 1

    analysis = client.post(f"/api/ai/jobs/{seed_data['job'].id}/analyze-candidates", headers=auth_headers("sine_staff"))
    assert analysis.status_code == 200
    assert analysis.json()["candidates"]


def test_company_and_worker_do_not_access_ai(client, seed_data, auth_headers):
    assert client.post(f"/api/ai/jobs/{seed_data['job'].id}/analyze-candidates", headers=auth_headers("company_user")).status_code == 403
    assert client.post(f"/api/ai/jobs/{seed_data['job'].id}/analyze-candidates", headers=auth_headers("worker")).status_code == 403


def test_sine_refers_candidate_and_company_sees_only_referred(client, db_session, seed_data, auth_headers):
    add_referral(db_session, seed_data)
    db_session.commit()
    response = client.post(
        f"/api/jobs/{seed_data['job'].id}/refer-candidates",
        json={
            "message_to_company": "Encaminhamento oficial",
            "candidates": [
                {
                    "worker_id": str(seed_data["worker"].id),
                    "resume_id": str(seed_data["resume"].id),
                    "match_score": 80,
                    "match_explanation": "Compatível",
                }
            ],
        },
        headers=auth_headers("sine_staff"),
    )
    assert response.status_code == 200
    company_view = client.get("/api/company-portal/referrals", headers=auth_headers("company_user"))
    assert company_view.status_code == 200
    assert len(company_view.json()) == 1
