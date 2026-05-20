def test_portal_roles_do_not_access_candidates(client, seed_data, auth_headers):
    job_id = seed_data["job"].id
    assert client.get(f"/api/jobs/{job_id}/candidates", headers=auth_headers("company_user")).status_code == 403
    assert client.get(f"/api/jobs/{job_id}/candidates", headers=auth_headers("worker")).status_code == 403


def test_sine_staff_accesses_candidates(client, seed_data, auth_headers):
    response = client.get(f"/api/jobs/{seed_data['job'].id}/candidates", headers=auth_headers("sine_staff"))
    assert response.status_code == 200


def test_reports_permissions(client, auth_headers):
    assert client.get("/api/reports/overview", headers=auth_headers("sine_manager")).status_code == 200
    assert client.get("/api/reports/overview", headers=auth_headers("company_user")).status_code == 403
    assert client.get("/api/reports/overview", headers=auth_headers("worker")).status_code == 403
