"""initial schema

Revision ID: 20260518_0001
Revises:
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260518_0001"
down_revision = None
branch_labels = None
depends_on = None


def tenant_fk(nullable=False):
    return sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=nullable, index=True)


def base_columns(with_tenant=True, tenant_nullable=False, soft_delete=True):
    cols = [sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),]
    if with_tenant:
        cols.append(tenant_fk(tenant_nullable))
    cols.extend([
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ])
    if soft_delete:
        cols.append(sa.Column("deleted_at", sa.DateTime(timezone=True)))
    return cols


def upgrade() -> None:
    op.create_table("tenants", *base_columns(False), sa.Column("name", sa.String(160), nullable=False), sa.Column("slug", sa.String(80), nullable=False), sa.Column("city", sa.String(100), nullable=False), sa.Column("state", sa.String(2), nullable=False), sa.Column("domain", sa.String(255), nullable=False), sa.Column("logo_url", sa.String(500)), sa.Column("primary_color", sa.String(20), nullable=False), sa.Column("secondary_color", sa.String(20), nullable=False), sa.Column("accent_color", sa.String(20), nullable=False), sa.Column("footer_text", sa.String(255), nullable=False), sa.Column("is_active", sa.Boolean(), nullable=False), sa.UniqueConstraint("slug"), sa.UniqueConstraint("domain"))
    op.create_table("roles", *base_columns(False), sa.Column("name", sa.String(60), nullable=False), sa.Column("description", sa.String(255)), sa.UniqueConstraint("name"))
    op.create_table("permissions", *base_columns(False), sa.Column("code", sa.String(80), nullable=False), sa.Column("description", sa.String(255)), sa.UniqueConstraint("code"))
    op.create_table("role_permissions", sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True), sa.Column("permission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True))
    op.create_table("users", *base_columns(True, True), sa.Column("email", sa.String(255), nullable=False), sa.Column("full_name", sa.String(160), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("is_active", sa.Boolean(), nullable=False), sa.Column("last_login_at", sa.DateTime(timezone=True)), sa.UniqueConstraint("email"))
    op.create_table("user_roles", sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True), sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True))
    op.create_table("companies", *base_columns(), sa.Column("cnpj", sa.String(18), nullable=False), sa.Column("legal_name", sa.String(180), nullable=False), sa.Column("trade_name", sa.String(180)), sa.Column("phone", sa.String(30)), sa.Column("whatsapp", sa.String(30)), sa.Column("email", sa.String(255)), sa.Column("address", sa.String(255)), sa.Column("district", sa.String(100)), sa.Column("city", sa.String(100)), sa.Column("state", sa.String(2)), sa.Column("responsible_name", sa.String(160)), sa.Column("segment", sa.String(120)), sa.Column("notes", sa.Text()), sa.UniqueConstraint("tenant_id", "cnpj", name="uq_company_tenant_cnpj"))
    op.create_table("company_users", *base_columns(), sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False), sa.Column("position", sa.String(100)))
    op.create_table("workers", *base_columns(), sa.Column("cpf", sa.String(14), nullable=False), sa.Column("full_name", sa.String(180), nullable=False), sa.Column("birth_date", sa.Date()), sa.Column("phone", sa.String(30)), sa.Column("whatsapp", sa.String(30)), sa.Column("email", sa.String(255)), sa.Column("address", sa.String(255)), sa.Column("district", sa.String(100)), sa.Column("city", sa.String(100)), sa.Column("state", sa.String(2)), sa.Column("education_level", sa.String(120)), sa.Column("desired_role", sa.String(160)), sa.Column("desired_salary", sa.String(80)), sa.Column("availability", sa.String(160)), sa.Column("cnh", sa.String(20)), sa.Column("has_disability", sa.Boolean()), sa.Column("disability_notes", sa.Text()), sa.Column("notes", sa.Text()), sa.Column("lgpd_accepted", sa.Boolean(), nullable=False), sa.Column("lgpd_accepted_at", sa.DateTime(timezone=True)), sa.UniqueConstraint("tenant_id", "cpf", name="uq_worker_tenant_cpf"))
    op.create_table("worker_experiences", *base_columns(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("company_name", sa.String(160)), sa.Column("role", sa.String(160), nullable=False), sa.Column("start_date", sa.Date()), sa.Column("end_date", sa.Date()), sa.Column("description", sa.Text()))
    op.create_table("worker_educations", *base_columns(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("level", sa.String(120), nullable=False), sa.Column("institution", sa.String(180)), sa.Column("completed", sa.Boolean()))
    op.create_table("worker_courses", *base_columns(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("name", sa.String(180), nullable=False), sa.Column("institution", sa.String(180)), sa.Column("hours", sa.Integer()))
    op.create_table("worker_skills", *base_columns(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("name", sa.String(100), nullable=False))
    op.create_table("resumes", *base_columns(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("original_filename", sa.String(255), nullable=False), sa.Column("stored_filename", sa.String(255), nullable=False), sa.Column("file_path", sa.String(500), nullable=False), sa.Column("mime_type", sa.String(120), nullable=False), sa.Column("size_bytes", sa.Integer(), nullable=False), sa.Column("extracted_text", sa.Text()), sa.Column("analysis", postgresql.JSONB()), sa.Column("status", sa.String(40), nullable=False))
    op.create_table("jobs", *base_columns(), sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False), sa.Column("title", sa.String(180), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("vacancies", sa.Integer(), nullable=False), sa.Column("salary_range", sa.String(120)), sa.Column("benefits", sa.Text()), sa.Column("workday", sa.String(120)), sa.Column("schedule", sa.String(120)), sa.Column("workplace", sa.String(180)), sa.Column("modality", sa.String(30), nullable=False), sa.Column("minimum_education", sa.String(120)), sa.Column("required_experience", sa.Text()), sa.Column("desired_courses", sa.Text()), sa.Column("cnh_required", sa.String(20)), sa.Column("travel_required", sa.Boolean()), sa.Column("contract_type", sa.String(80)), sa.Column("notes", sa.Text()), sa.Column("closing_deadline", sa.Date()), sa.Column("status", sa.String(50), nullable=False))
    op.create_table("job_requirements", *base_columns(), sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=False), sa.Column("requirement_type", sa.String(80), nullable=False), sa.Column("value", sa.String(180), nullable=False), sa.Column("weight", sa.Integer(), nullable=False))
    op.create_table("referrals", *base_columns(), sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=False), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id")), sa.Column("referred_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False), sa.Column("status", sa.String(60), nullable=False), sa.Column("match_score", sa.Integer()), sa.Column("notes", sa.Text()))
    op.create_table("interviews", *base_columns(), sa.Column("referral_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("referrals.id"), nullable=False), sa.Column("scheduled_at", sa.DateTime(timezone=True)), sa.Column("status", sa.String(60)), sa.Column("notes", sa.Text()))
    op.create_table("company_feedback", *base_columns(), sa.Column("referral_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("referrals.id"), nullable=False), sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False), sa.Column("status", sa.String(80), nullable=False), sa.Column("comments", sa.Text()))
    op.create_table("lgpd_consents", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), tenant_fk(), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False), sa.Column("consent_type", sa.String(80), nullable=False), sa.Column("consent_text", sa.Text(), nullable=False), sa.Column("accepted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column("ip_address", sa.String(80)), sa.Column("user_agent", sa.String(255)), sa.Column("version", sa.String(40), nullable=False))
    op.create_table("audit_logs", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), tenant_fk(True), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")), sa.Column("action", sa.String(120), nullable=False), sa.Column("entity_type", sa.String(120)), sa.Column("entity_id", postgresql.UUID(as_uuid=True)), sa.Column("details", postgresql.JSONB()), sa.Column("ip_address", sa.String(80)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_table("data_access_logs", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), tenant_fk(), sa.Column("accessed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")), sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id")), sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id")), sa.Column("action", sa.String(80), nullable=False), sa.Column("reason", sa.String(255)), sa.Column("ip_address", sa.String(80)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_table("notifications", *base_columns(), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")), sa.Column("title", sa.String(160), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("read_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    for table in ["notifications", "data_access_logs", "audit_logs", "lgpd_consents", "company_feedback", "interviews", "referrals", "job_requirements", "jobs", "resumes", "worker_skills", "worker_courses", "worker_educations", "worker_experiences", "workers", "company_users", "companies", "user_roles", "users", "role_permissions", "permissions", "roles", "tenants"]:
        op.drop_table(table)
