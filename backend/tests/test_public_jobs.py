def test_public_jobs_accessible(client, seed_data):
    headers = {"host": seed_data["tenant"].domain}
    response = client.get("/api/public/jobs", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    detail = client.get(f"/api/public/jobs/{seed_data['job'].id}", headers=headers)
    assert detail.status_code == 200


def test_public_cannot_access_internal_routes(client):
    response = client.get("/api/reports/overview")
    assert response.status_code == 401
