"""add driver role and drivers table

Revision ID: 002
Revises: 001
Create Date: 2026-07-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add 'driver' to the userrole enum (idempotent via IF NOT EXISTS)
    try:
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'driver'")
    except Exception:
        pass  # already exists

    # 2. Create drivers table (idempotent — use raw SQL)
    try:
        op.execute("""
            CREATE TABLE IF NOT EXISTS drivers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true
            )
        """)
    except Exception:
        pass  # already exists

    # 3. Add driver_id to orders (idempotent — handled by IF NOT EXISTS)
    try:
        op.execute(
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id)"
        )
    except Exception:
        pass

    # 4. Add index on driver_id
    try:
        op.execute("CREATE INDEX IF NOT EXISTS ix_orders_driver_id ON orders (driver_id)")
    except Exception:
        pass


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_orders_driver_id")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS driver_id")
    op.execute("DROP TABLE IF EXISTS drivers")
