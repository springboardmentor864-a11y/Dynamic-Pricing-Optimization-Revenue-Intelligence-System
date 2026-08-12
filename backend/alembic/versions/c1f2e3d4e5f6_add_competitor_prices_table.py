"""add competitor prices table

Revision ID: c1f2e3d4e5f6
Revises: 145d49c0dc08
Create Date: 2026-08-12
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c1f2e3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "145d49c0dc08"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Use check_first / safe table creation so existing tables do not throw DuplicateTable
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "competitor_prices" not in tables:
        op.create_table(
            "competitor_prices",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("product_id", sa.String(length=50), nullable=False, index=True),
            sa.Column("product_name", sa.String(length=150), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=False, default="General"),
            sa.Column("brand", sa.String(length=100), nullable=False, default="Generic"),
            sa.Column("our_price", sa.Float(), nullable=False),
            sa.Column("competitor_name", sa.String(length=100), nullable=False, index=True),
            sa.Column("competitor_product_name", sa.String(length=150), nullable=True),
            sa.Column("competitor_price", sa.Float(), nullable=False),
            sa.Column("price_difference", sa.Float(), nullable=False, default=0.0),
            sa.Column("price_difference_percentage", sa.Float(), nullable=False, default=0.0),
            sa.Column("competitor_rating", sa.Float(), default=4.5),
            sa.Column("competitor_stock", sa.Integer(), default=50),
            sa.Column("marketplace", sa.String(length=100), nullable=False, default="Online Market"),
            sa.Column("currency", sa.String(length=10), nullable=False, default="INR"),
            sa.Column("source", sa.String(length=100), nullable=False, default="Manual"),
            sa.Column("captured_at", sa.String(length=50), nullable=False, index=True),
            sa.Column("recorded_at", sa.String(length=50), nullable=True, index=True),
            sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
        )

    if "competitor_analysis" not in tables:
        op.create_table(
            "competitor_analysis",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("product_id", sa.String(length=50), nullable=False, index=True),
            sa.Column("our_price", sa.Float(), nullable=False),
            sa.Column("lowest_competitor_price", sa.Float(), nullable=False),
            sa.Column("highest_competitor_price", sa.Float(), nullable=False),
            sa.Column("average_competitor_price", sa.Float(), nullable=False),
            sa.Column("price_difference", sa.Float(), nullable=False),
            sa.Column("price_difference_percentage", sa.Float(), nullable=False),
            sa.Column("recommended_price", sa.Float(), nullable=False),
            sa.Column("competitive_status", sa.String(length=30), nullable=False, index=True),
            sa.Column("analyzed_at", sa.DateTime(), default=sa.func.now())
        )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "competitor_analysis" in tables:
        op.drop_table("competitor_analysis")
    if "competitor_prices" in tables:
        op.drop_table("competitor_prices")
