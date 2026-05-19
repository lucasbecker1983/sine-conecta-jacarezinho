"""referral triage ai fields

Revision ID: 20260519_0005
Revises: 20260518_0004
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260519_0005"
down_revision = "20260518_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("referrals", sa.Column("match_explanation", sa.Text()))
    op.add_column("referrals", sa.Column("feedback_status", sa.String(80)))
    op.add_column("referrals", sa.Column("referred_at", sa.DateTime(timezone=True)))
    op.add_column("referrals", sa.Column("triage_notes", sa.Text()))
    op.add_column("referrals", sa.Column("ai_analysis_json", postgresql.JSONB()))
    op.add_column(
        "referrals", sa.Column("last_ai_analyzed_at", sa.DateTime(timezone=True))
    )


def downgrade() -> None:
    op.drop_column("referrals", "last_ai_analyzed_at")
    op.drop_column("referrals", "ai_analysis_json")
    op.drop_column("referrals", "triage_notes")
    op.drop_column("referrals", "referred_at")
    op.drop_column("referrals", "feedback_status")
    op.drop_column("referrals", "match_explanation")
