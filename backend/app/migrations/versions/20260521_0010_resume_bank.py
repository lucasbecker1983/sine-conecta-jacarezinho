"""create resume bank tables

Revision ID: 20260521_0010
Revises: 20260521_0009
Create Date: 2026-05-21 14:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260521_0010"
down_revision = "20260521_0009"
branch_labels = None
depends_on = None


def _base_columns() -> list[sa.Column]:
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    ]


def upgrade() -> None:
    op.create_table(
        "resume_bank_entries",
        *_base_columns(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id")),
        sa.Column("source_job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id")),
        sa.Column("source_application_id", postgresql.UUID(as_uuid=True)),
        sa.Column("source_referral_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("referrals.id")),
        sa.Column("status", sa.String(60), server_default="ativo", nullable=False),
        sa.Column("entry_reason", sa.String(100), server_default="atualizacao_manual_sine", nullable=False),
        sa.Column("tags", postgresql.JSONB()),
        sa.Column("desired_roles", postgresql.JSONB()),
        sa.Column("desired_sectors", postgresql.JSONB()),
        sa.Column("availability", sa.String(160)),
        sa.Column("city", sa.String(100)),
        sa.Column("education_level", sa.String(120)),
        sa.Column("experience_summary", sa.Text()),
        sa.Column("internal_notes", sa.Text()),
        sa.Column("ai_summary", sa.Text()),
        sa.Column("ai_keywords", postgresql.JSONB()),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("updated_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
    )
    for column in ["worker_id", "resume_id", "status", "city", "created_at", "source_job_id", "source_referral_id"]:
        op.create_index(f"ix_resume_bank_entries_{column}", "resume_bank_entries", [column])

    op.create_table(
        "resume_bank_ai_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("resume_bank_entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resume_bank_entries.id"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id")),
        sa.Column("compatibility_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("compatibility_level", sa.String(40), server_default="baixa", nullable=False),
        sa.Column("matched_requirements", postgresql.JSONB()),
        sa.Column("missing_requirements", postgresql.JSONB()),
        sa.Column("ai_explanation", sa.Text()),
        sa.Column("status", sa.String(60), server_default="pendente_revisao", nullable=False),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("forwarded_at", sa.DateTime(timezone=True)),
    )
    for column in ["job_id", "resume_bank_entry_id", "worker_id", "resume_id", "status", "created_at"]:
        op.create_index(f"ix_resume_bank_ai_suggestions_{column}", "resume_bank_ai_suggestions", [column])


def downgrade() -> None:
    op.drop_table("resume_bank_ai_suggestions")
    op.drop_table("resume_bank_entries")
