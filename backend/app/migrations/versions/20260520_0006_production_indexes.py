"""production hardening indexes

Revision ID: 20260520_0006
Revises: 20260519_0005
Create Date: 2026-05-20
"""

from alembic import op

revision = "20260520_0006"
down_revision = "20260519_0005"
branch_labels = None
depends_on = None


INDEXES = [
    ("ix_jobs_tenant_id", "jobs", "tenant_id"),
    ("ix_jobs_status", "jobs", "status"),
    ("ix_jobs_company_id", "jobs", "company_id"),
    ("ix_referrals_tenant_id", "referrals", "tenant_id"),
    ("ix_referrals_status", "referrals", "status"),
    ("ix_referrals_job_id", "referrals", "job_id"),
    ("ix_referrals_worker_id", "referrals", "worker_id"),
    ("ix_workers_tenant_id", "workers", "tenant_id"),
    ("ix_workers_email", "workers", "email"),
    ("ix_companies_tenant_id", "companies", "tenant_id"),
    ("ix_companies_cnpj", "companies", "cnpj"),
    ("ix_resumes_tenant_id", "resumes", "tenant_id"),
    ("ix_resumes_worker_id", "resumes", "worker_id"),
    ("ix_audit_logs_tenant_id", "audit_logs", "tenant_id"),
    ("ix_data_access_logs_tenant_id", "data_access_logs", "tenant_id"),
]


def upgrade() -> None:
    for index_name, table_name, column_name in INDEXES:
        op.execute(
            f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_name})"
        )


def downgrade() -> None:
    for index_name, _table_name, _column_name in reversed(INDEXES):
        op.execute(f"DROP INDEX IF EXISTS {index_name}")
