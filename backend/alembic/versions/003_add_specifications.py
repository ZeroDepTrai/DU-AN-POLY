"""add specifications column to products

Revision ID: 003
Revises: 002
Create Date: 2026-07-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.execute(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications TEXT NOT NULL DEFAULT ''"
        )
    except Exception:
        pass


def downgrade() -> None:
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS specifications")
