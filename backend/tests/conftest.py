from datetime import date
import os
import tempfile
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

os.environ["APP_ENV"] = "test"
os.environ["LOG_DIR"] = tempfile.mkdtemp(prefix="saas-sine-test-logs-")

from app.core.database import engine, get_db
from app.core.security import hash_password
from app.main import app
from app.models import (
    AuditLog,
    Company,
    CompanyUser,
    DataAccessLog,
    Job,
    LGPDConsent,
    Referral,
    Resume,
    Role,
    Tenant,
    User,
    Worker,
)


PASSWORD = "SenhaForte123!"


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    from sqlalchemy.orm import Session

    session = Session(bind=connection, future=True)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def ensure_role(db, name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == name))
    if role:
        return role
    role = Role(name=name, description=name)
    db.add(role)
    db.flush()
    return role


def make_user(db, tenant_id, role_name: str, email_prefix: str) -> User:
    role = ensure_role(db, role_name)
    user = User(
        tenant_id=tenant_id,
        email=f"{email_prefix}-{uuid4().hex[:8]}@example.com",
        full_name=f"{role_name} Teste",
        password_hash=hash_password(PASSWORD),
        is_active=True,
    )
    user.roles.append(role)
    db.add(user)
    db.flush()
    return user


@pytest.fixture()
def seed_data(db_session):
    tenant = Tenant(
        name="SINE Teste",
        slug=f"tenant-{uuid4().hex[:8]}",
        city="Jacarezinho",
        state="PR",
        domain=f"tenant-{uuid4().hex[:8]}.tests.local",
        primary_color="#14532d",
        secondary_color="#0f766e",
        accent_color="#f59e0b",
        footer_text="Prefeitura Municipal de Jacarezinho",
        is_active=True,
    )
    db_session.add(tenant)
    db_session.flush()

    users = {
        role: make_user(db_session, tenant.id, role, role)
        for role in [
            "super_admin",
            "tenant_admin",
            "sine_manager",
            "sine_staff",
            "company_user",
            "worker",
        ]
    }

    company = Company(
        tenant_id=tenant.id,
        cnpj=f"{uuid4().int % 10**14:014d}",
        legal_name="Empresa Teste LTDA",
        trade_name="Empresa Teste",
        email=users["company_user"].email,
        city="Jacarezinho",
        state="PR",
        lgpd_accepted=True,
    )
    db_session.add(company)
    db_session.flush()
    db_session.add(
        CompanyUser(
            tenant_id=tenant.id,
            company_id=company.id,
            user_id=users["company_user"].id,
            position="RH",
        )
    )

    worker = Worker(
        tenant_id=tenant.id,
        cpf=f"{uuid4().int % 10**11:011d}",
        full_name="Trabalhador Teste",
        birth_date=date(1995, 1, 1),
        phone="43999990000",
        whatsapp="43999990000",
        email=users["worker"].email,
        city="Jacarezinho",
        state="PR",
        education_level="Ensino medio",
        desired_role="Atendente",
        lgpd_accepted=True,
    )
    db_session.add(worker)
    db_session.flush()
    db_session.add(
        LGPDConsent(
            tenant_id=tenant.id,
            worker_id=worker.id,
            consent_type="teste",
            consent_text="Aceite LGPD de teste",
            version="test",
        )
    )

    job = Job(
        tenant_id=tenant.id,
        company_id=company.id,
        title="Atendente",
        description="Atendimento ao publico",
        vacancies=1,
        modality="presencial",
        status="publicada",
    )
    db_session.add(job)
    db_session.flush()

    resume = Resume(
        tenant_id=tenant.id,
        worker_id=worker.id,
        original_filename="curriculo.pdf",
        stored_filename="curriculo.pdf",
        file_path="/tmp/curriculo.pdf",
        mime_type="application/pdf",
        size_bytes=100,
        extracted_text="Atendimento ao publico",
        status="analisado",
    )
    db_session.add(resume)
    db_session.flush()
    db_session.commit()

    return {
        "tenant": tenant,
        "users": users,
        "company": company,
        "worker": worker,
        "job": job,
        "resume": resume,
    }


@pytest.fixture()
def auth_headers(client, seed_data):
    def _headers(role: str):
        user = seed_data["users"][role]
        response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": PASSWORD},
        )
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _headers


def add_referral(db, seed_data, status="candidatura_trabalhador"):
    referral = Referral(
        tenant_id=seed_data["tenant"].id,
        job_id=seed_data["job"].id,
        worker_id=seed_data["worker"].id,
        resume_id=seed_data["resume"].id,
        referred_by_user_id=seed_data["users"]["sine_staff"].id,
        status=status,
    )
    db.add(referral)
    db.flush()
    return referral


def count_model(db, model, **filters):
    query = select(model)
    for key, value in filters.items():
        query = query.where(getattr(model, key) == value)
    return len(db.scalars(query).all())
