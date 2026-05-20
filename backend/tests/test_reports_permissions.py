def test_reports_require_token(client):
    assert client.get("/api/reports/overview").status_code == 401


def test_reports_role_matrix(client, auth_headers):
    assert client.get("/api/reports/overview", headers=auth_headers("company_user")).status_code == 403
    assert client.get("/api/reports/overview", headers=auth_headers("worker")).status_code == 403
    assert client.get("/api/reports/overview", headers=auth_headers("sine_staff")).status_code == 200
    assert client.get("/api/reports/export.csv", headers=auth_headers("sine_staff")).status_code == 403
    assert client.get("/api/reports/export.csv", headers=auth_headers("sine_manager")).status_code == 200
    assert client.get("/api/reports/export.csv", headers=auth_headers("tenant_admin")).status_code == 200
