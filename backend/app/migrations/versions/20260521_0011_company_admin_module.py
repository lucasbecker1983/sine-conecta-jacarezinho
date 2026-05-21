"""company admin module fields

Revision ID: 20260521_0011
Revises: 20260521_0010
Create Date: 2026-05-21 15:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260521_0011"
down_revision = "20260521_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("site", sa.String(255), nullable=True))
    op.add_column("companies", sa.Column("address_number", sa.String(30), nullable=True))
    op.add_column("companies", sa.Column("address_complement", sa.String(120), nullable=True))
    op.add_column("companies", sa.Column("responsible_position", sa.String(120), nullable=True))
    op.add_column("companies", sa.Column("responsible_email", sa.String(255), nullable=True))
    op.add_column("companies", sa.Column("responsible_phone", sa.String(30), nullable=True))
    op.add_column("companies", sa.Column("company_size", sa.String(80), nullable=True))
    op.add_column("companies", sa.Column("cnae", sa.String(40), nullable=True))
    op.add_column("companies", sa.Column("status", sa.String(60), server_default="ativa", nullable=False))
    op.add_column("companies", sa.Column("profile_complete", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("companies", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("companies", sa.Column("approved_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("companies", sa.Column("blocked_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("companies", sa.Column("blocked_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("companies", sa.Column("blocking_reason", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("internal_notes", sa.Text(), nullable=True))
    op.create_index("ix_companies_status", "companies", ["status"])
    op.create_index("ix_companies_city", "companies", ["city"])
    op.create_index("ix_companies_created_at", "companies", ["created_at"])
    op.create_index("ix_companies_approved_by_user_id", "companies", ["approved_by_user_id"])
    op.create_index("ix_companies_blocked_by_user_id", "companies", ["blocked_by_user_id"])
    op.execute(
        """
        UPDATE companies
        SET profile_complete = CASE
            WHEN legal_name IS NOT NULL
             AND cnpj IS NOT NULL
             AND (email IS NOT NULL OR phone IS NOT NULL OR whatsapp IS NOT NULL)
             AND city IS NOT NULL
            THEN true ELSE false END
        """
    )
    op.alter_column("companies", "status", server_default=None)
    op.alter_column("companies", "profile_complete", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_companies_blocked_by_user_id", table_name="companies")
    op.drop_index("ix_companies_approved_by_user_id", table_name="companies")
    op.drop_index("ix_companies_created_at", table_name="companies")
    op.drop_index("ix_companies_city", table_name="companies")
    op.drop_index("ix_companies_status", table_name="companies")
    op.drop_column("companies", "internal_notes")
    op.drop_column("companies", "blocking_reason")
    op.drop_column("companies", "blocked_by_user_id")
    op.drop_column("companies", "blocked_at")
    op.drop_column("companies", "approved_by_user_id")
    op.drop_column("companies", "approved_at")
    op.drop_column("companies", "profile_complete")
    op.drop_column("companies", "status")
    op.drop_column("companies", "cnae")
    op.drop_column("companies", "company_size")
    op.drop_column("companies", "responsible_phone")
    op.drop_column("companies", "responsible_email")
    op.drop_column("companies", "responsible_position")
    op.drop_column("companies", "address_complement")
    op.drop_column("companies", "address_number")
    op.drop_column("companies", "site")
