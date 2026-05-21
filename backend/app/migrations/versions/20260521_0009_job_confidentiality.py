"""add job confidentiality flag

Revision ID: 20260521_0009
Revises: 20260520_0008
Create Date: 2026-05-21 13:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260521_0009"
down_revision = "20260520_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "is_confidential",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.alter_column("jobs", "is_confidential", server_default=None)


def downgrade() -> None:
    op.drop_column("jobs", "is_confidential")
