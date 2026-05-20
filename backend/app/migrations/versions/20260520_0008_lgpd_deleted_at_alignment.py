"""align LGPD timestamp mixins with deleted_at

Revision ID: 20260520_0008
Revises: 20260520_0007
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa

revision = "20260520_0008"
down_revision = "20260520_0007"
branch_labels = None
depends_on = None

TABLES = [
    "lgpd_terms_versions",
    "lgpd_data_subject_requests",
    "lgpd_retention_policies",
    "lgpd_incidents",
    "lgpd_processing_activities",
]


def upgrade() -> None:
    for table_name in TABLES:
        op.add_column(table_name, sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for table_name in reversed(TABLES):
        op.drop_column(table_name, "deleted_at")
