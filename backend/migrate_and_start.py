import os
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from app.config import settings


def apply_schema_changes():
    db = create_engine(settings.database_url_final)
    conn = db.connect()

    with conn.begin():
        try:
            conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'driver'"))
            conn.commit()
        except Exception:
            conn.commit()

    with conn.begin():
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS drivers (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT true
                )
            """))
            conn.commit()
        except Exception:
            conn.commit()

    with conn.begin():
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id)"))
            conn.commit()
        except Exception:
            conn.commit()

    with conn.begin():
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_driver_id ON orders (driver_id)"))
            conn.commit()
        except Exception:
            conn.commit()

    conn.close()
    print("Schema changes applied.")


def run_migrations():
    cfg = Config("alembic.ini")
    command.stamp(cfg, "001")
    print("Stamped at 001.")
    command.upgrade(cfg, "head")
    print("Migrations complete.")


if __name__ == "__main__":
    apply_schema_changes()
    run_migrations()

    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
