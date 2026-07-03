import os
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from app.config import settings


def _col_exists(conn, table: str, column: str) -> bool:
    row = conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name=:t AND column_name=:c"
        ),
        {"t": table, "c": column},
    ).first()
    return row is not None


def apply_schema_changes():
    db = create_engine(settings.database_url_final)
    conn = db.connect()

    def safe_alter(sql: str, label: str):
        with conn.begin():
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"[MIGRATION] {label}: applied")
            except Exception as e:
                conn.commit()
                print(f"[MIGRATION] {label}: SKIPPED ({type(e).__name__}: {e})")

    # --- userrole enum: add 'driver' if missing ---
    with conn.begin():
        try:
            conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'driver'"))
            conn.commit()
        except Exception:
            conn.commit()

    # --- drivers table ---
    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS drivers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true
        )
        """,
        "drivers table",
    )

    # --- orders.driver_id ---
    safe_alter(
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id)",
        "orders.driver_id",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_orders_driver_id ON orders (driver_id)",
        "ix_orders_driver_id",
    )

    # --- products columns ---
    if not _col_exists(conn, "products", "specifications"):
        safe_alter(
            "ALTER TABLE products ADD COLUMN specifications TEXT NOT NULL DEFAULT ''",
            "products.specifications (ADDED)",
        )
    else:
        print("[MIGRATION] products.specifications: already exists, skipping")

    if not _col_exists(conn, "products", "description"):
        safe_alter(
            "ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT ''",
            "products.description (ADDED)",
        )
    else:
        print("[MIGRATION] products.description: already exists, skipping")

    # --- blog_posts.tags ---
    if not _col_exists(conn, "blog_posts", "tags"):
        safe_alter(
            "ALTER TABLE blog_posts ADD COLUMN tags VARCHAR(500) NOT NULL DEFAULT ''",
            "blog_posts.tags (ADDED)",
        )
    else:
        print("[MIGRATION] blog_posts.tags: already exists, skipping")

    conn.close()
    print("Schema changes applied.")


def run_migrations():
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    print("Migrations complete.")


if __name__ == "__main__":
    apply_schema_changes()
    run_migrations()

    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
