"""company communication threads

Revision ID: 20260518_0003
Revises: 20260518_0002
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260518_0003"
down_revision = "20260518_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "company_message_threads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id")),
        sa.Column("referral_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("referrals.id")),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("subject", sa.String(180), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="aberta"),
        sa.Column("priority", sa.String(30), nullable=False, server_default="normal"),
        sa.Column("last_message_at", sa.DateTime(timezone=True)),
        sa.Column("company_last_read_at", sa.DateTime(timezone=True)),
        sa.Column("sine_last_read_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_company_message_threads_tenant_id", "company_message_threads", ["tenant_id"])
    op.create_index("ix_company_message_threads_company_id", "company_message_threads", ["company_id"])
    op.create_index("ix_company_message_threads_job_id", "company_message_threads", ["job_id"])
    op.create_index("ix_company_message_threads_referral_id", "company_message_threads", ["referral_id"])
    op.create_index("ix_company_message_threads_status", "company_message_threads", ["status"])

    op.create_table(
        "company_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("thread_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("company_message_threads.id"), nullable=False),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("sender_role", sa.String(30), nullable=False),
        sa.Column("message_type", sa.String(40), nullable=False, server_default="message"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("details", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_company_messages_tenant_id", "company_messages", ["tenant_id"])
    op.create_index("ix_company_messages_thread_id", "company_messages", ["thread_id"])
    op.create_index("ix_company_messages_sender_user_id", "company_messages", ["sender_user_id"])


def downgrade() -> None:
    op.drop_table("company_messages")
    op.drop_table("company_message_threads")
