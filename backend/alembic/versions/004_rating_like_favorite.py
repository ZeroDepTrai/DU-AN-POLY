"""add product_ratings and product_likes (favorites)

Revision ID: 004
Revises: 003
Create Date: 2026-07-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_ratings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("stars", sa.Integer(), nullable=False),
        sa.Column("review", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("product_id", "user_id", name="uq_rating_product_user"),
    )
    op.create_index(
        "ix_product_ratings_product_id", "product_ratings", ["product_id"]
    )
    op.create_index(
        "ix_product_ratings_user_id", "product_ratings", ["user_id"]
    )

    op.create_table(
        "product_likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("product_id", "user_id", name="uq_like_product_user"),
    )
    op.create_index(
        "ix_product_likes_product_id", "product_likes", ["product_id"]
    )
    op.create_index(
        "ix_product_likes_user_id", "product_likes", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_product_likes_user_id", table_name="product_likes")
    op.drop_index("ix_product_likes_product_id", table_name="product_likes")
    op.drop_table("product_likes")

    op.drop_index("ix_product_ratings_user_id", table_name="product_ratings")
    op.drop_index("ix_product_ratings_product_id", table_name="product_ratings")
    op.drop_table("product_ratings")