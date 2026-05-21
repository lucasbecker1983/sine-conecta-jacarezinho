def test_company_creates_confidential_job(client, auth_headers):
    response = client.post(
        "/api/company-portal/jobs",
        json={
            "title": "Auxiliar administrativo",
            "description": "Atendimento e rotinas administrativas",
            "vacancies": 1,
            "is_confidential": True,
        },
        headers=auth_headers("company_user"),
    )

    assert response.status_code == 200
    assert response.json()["is_confidential"] is True


def test_company_creates_public_job(client, auth_headers):
    response = client.post(
        "/api/company-portal/jobs",
        json={
            "title": "Repositor",
            "description": "Reposicao de mercadorias",
            "vacancies": 1,
            "is_confidential": False,
        },
        headers=auth_headers("company_user"),
    )

    assert response.status_code == 200
    assert response.json()["is_confidential"] is False


def test_sine_lists_jobs_with_real_company_when_confidential(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = True
    db_session.commit()

    response = client.get("/api/jobs", headers=auth_headers("sine_staff"))

    assert response.status_code == 200
    item = next(item for item in response.json() if item["id"] == str(seed_data["job"].id))
    assert item["is_confidential"] is True
    assert item["company_name"] == seed_data["company"].trade_name
    assert item["company_cnpj"] == seed_data["company"].cnpj


def test_worker_sees_masked_company_for_confidential_job(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = True
    db_session.commit()

    response = client.get(
        "/api/worker-portal/open-jobs", headers=auth_headers("worker")
    )

    assert response.status_code == 200
    item = next(item for item in response.json() if item["id"] == str(seed_data["job"].id))
    assert item["company_name"] == "Empresa confidencial"
    assert seed_data["company"].trade_name not in str(item)
    assert seed_data["company"].cnpj not in str(item)
    assert "company_id" not in item


def test_worker_sees_company_name_for_public_job(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = False
    db_session.commit()

    response = client.get(
        "/api/worker-portal/open-jobs", headers=auth_headers("worker")
    )

    assert response.status_code == 200
    item = next(item for item in response.json() if item["id"] == str(seed_data["job"].id))
    assert item["company_name"] == seed_data["company"].trade_name


def test_public_jobs_mask_confidential_company(client, db_session, seed_data):
    seed_data["job"].is_confidential = True
    db_session.commit()

    response = client.get(
        "/api/public/jobs", headers={"host": seed_data["tenant"].domain}
    )

    assert response.status_code == 200
    item = next(item for item in response.json() if item["id"] == str(seed_data["job"].id))
    assert item["company_name"] == "Empresa confidencial"
    assert item["is_confidential"] is True
    assert seed_data["company"].trade_name not in str(item)
    assert seed_data["company"].cnpj not in str(item)


def test_company_sees_own_confidential_job_with_full_company_context(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = True
    db_session.commit()

    jobs = client.get("/api/company-portal/jobs", headers=auth_headers("company_user"))
    profile = client.get("/api/company-portal/profile", headers=auth_headers("company_user"))

    assert jobs.status_code == 200
    item = next(item for item in jobs.json() if item["id"] == str(seed_data["job"].id))
    assert item["company_id"] == str(seed_data["company"].id)
    assert item["is_confidential"] is True
    assert profile.status_code == 200
    assert profile.json()["cnpj"] == seed_data["company"].cnpj


def test_company_updates_job_confidentiality(client, seed_data, auth_headers):
    response = client.patch(
        f"/api/company-portal/jobs/{seed_data['job'].id}",
        json={
            "title": seed_data["job"].title,
            "description": seed_data["job"].description,
            "vacancies": seed_data["job"].vacancies,
            "modality": seed_data["job"].modality,
            "is_confidential": True,
        },
        headers=auth_headers("company_user"),
    )

    assert response.status_code == 200
    assert response.json()["is_confidential"] is True


def test_worker_lgpd_sharing_masks_confidential_company(
    client, db_session, seed_data, auth_headers
):
    seed_data["job"].is_confidential = True
    db_session.commit()
    refer = client.post(
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
    assert refer.status_code == 200

    response = client.get(
        "/api/lgpd/me/data-sharing", headers=auth_headers("worker")
    )

    assert response.status_code == 200
    item = response.json()[0]
    assert item["company_name"] == "Empresa confidencial"
    assert item["company_id"] is None
    assert seed_data["company"].trade_name not in str(item)
    assert seed_data["company"].cnpj not in str(item)
