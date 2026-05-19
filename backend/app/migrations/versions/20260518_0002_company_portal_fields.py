"""company portal fields and job start date

Revision ID: 20260518_0002
Revises: 20260518_0001
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa

revision = "20260518_0002"
down_revision = "20260518_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("state_registration", sa.String(40)))
    op.add_column("companies", sa.Column("federal_registration", sa.String(40)))
    op.add_column("companies", sa.Column("cep", sa.String(10)))
    op.add_column("companies", sa.Column("hr_responsible_name", sa.String(160)))
    op.add_column("companies", sa.Column("lgpd_accepted", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("companies", sa.Column("lgpd_accepted_at", sa.DateTime(timezone=True)))
    op.add_column("jobs", sa.Column("start_date", sa.Date()))
    op.alter_column("companies", "lgpd_accepted", server_default=None)


def downgrade() -> None:
    op.drop_column("jobs", "start_date")
    op.drop_column("companies", "lgpd_accepted_at")
    op.drop_column("companies", "lgpd_accepted")
    op.drop_column("companies", "hr_responsible_name")
    op.drop_column("companies", "cep")
    op.drop_column("companies", "federal_registration")
    op.drop_column("companies", "state_registration")
