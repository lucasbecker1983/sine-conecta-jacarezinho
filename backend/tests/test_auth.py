from conftest import PASSWORD


def test_login_valid_returns_token(client, seed_data):
    user = seed_data["users"]["sine_staff"]
    response = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_invalid_returns_401(client, seed_data):
    user = seed_data["users"]["sine_staff"]
    response = client.post("/api/auth/login", json={"email": user.email, "password": "errada123"})
    assert response.status_code == 401


def test_invalid_token_blocks_protected_route(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer token-invalido"})
    assert response.status_code == 401
