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
    from sqlalchemy import inspect

    db = create_engine(settings.database_url_final)
    insp = inspect(db)
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

    def table_exists(name: str) -> bool:
        try:
            return insp.has_table(name)
        except Exception:
            return False

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

    # --- orders.coupon_id (added later for the coupon module) ---
    if not _col_exists(conn, "orders", "coupon_id"):
        safe_alter(
            "ALTER TABLE orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id)",
            "orders.coupon_id (ADDED)",
        )
    else:
        print("[MIGRATION] orders.coupon_id: already exists, skipping")
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_orders_coupon_id ON orders (coupon_id)",
        "ix_orders_coupon_id",
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

    # --- new tables for products media, coupons, wheel/spin ---
    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS product_media (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            url VARCHAR(500) NOT NULL,
            media_type VARCHAR(16) NOT NULL DEFAULT 'image',
            position INTEGER NOT NULL DEFAULT 0,
            is_cover BOOLEAN NOT NULL DEFAULT false
        )
        """,
        "product_media table",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_product_media_product_id ON product_media (product_id)",
        "ix_product_media_product_id",
    )

    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS coupons (
            id SERIAL PRIMARY KEY,
            code VARCHAR(64) NOT NULL UNIQUE,
            description VARCHAR(255) NOT NULL DEFAULT '',
            discount_type VARCHAR(16) NOT NULL DEFAULT 'percent',
            discount_value DOUBLE PRECISION NOT NULL,
            min_order_total DOUBLE PRECISION NOT NULL DEFAULT 0,
            max_discount DOUBLE PRECISION,
            usage_limit INTEGER,
            usage_count INTEGER NOT NULL DEFAULT 0,
            starts_at VARCHAR(30) NOT NULL DEFAULT '',
            expires_at VARCHAR(30) NOT NULL DEFAULT '',
            active BOOLEAN NOT NULL DEFAULT true
        )
        """,
        "coupons table",
    )

    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS wheel_config (
            id SERIAL PRIMARY KEY,
            title VARCHAR(120) NOT NULL DEFAULT 'CellZone · Spin & Win',
            background_url VARCHAR(500) NOT NULL DEFAULT '',
            prizes_json TEXT NOT NULL DEFAULT '[]',
            spend_per_spin_vnd INTEGER NOT NULL DEFAULT 3000000,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """,
        "wheel_config table",
    )

    # Seed a default wheel row the first time the schema is set up.
    if table_exists("wheel_config"):
        try:
            with conn.begin():
                res = conn.execute(text("SELECT COUNT(*) FROM wheel_config")).scalar()
                if not res:
                    default_prizes = (
                        '['
                        '{"name":"Mã giảm giá 2%","image":"/uploads/case.png","weight":35,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Cường Lực","image":"/uploads/screen.png","weight":25,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Ốp Iphone","image":"/uploads/cable.png","weight":20,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Dây sạc","image":"/uploads/charger.png","weight":14,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Mã giảm giá 5%","image":"/uploads/airpod.png","weight":5,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Chúc bạn may mắn lần sau","image":"/uploads/smartwatch.png","weight":0.5,"jackpot":false,"coupon_id":null,"icon":""},'
                        '{"name":"Apple Watch","image":"/uploads/watch.png","weight":0.4,"jackpot":true,"coupon_id":null,"icon":""},'
                        '{"name":"IPhone 17 Pro Max","image":"/uploads/iphone.png","weight":0.1,"jackpot":true,"coupon_id":null,"icon":""}'
                        ']'
                    )
                    conn.execute(
                        text(
                            "INSERT INTO wheel_config (id, title, background_url, prizes_json, spend_per_spin_vnd) "
                            "VALUES (1, :t, '', :p, 3000000)"
                        ),
                        {"t": "CellZone · Spin & Win", "p": default_prizes},
                    )
                    conn.commit()
                    print("[MIGRATION] wheel_config seeded with default prizes")
        except Exception as e:
            print(f"[MIGRATION] wheel_config seed: skipped ({type(e).__name__}: {e})")

    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS spins (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            prize_label VARCHAR(120) NOT NULL,
            prize_kind VARCHAR(32) NOT NULL DEFAULT 'consolation',
            coupon_id INTEGER REFERENCES coupons(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """,
        "spins table",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_spins_user_id ON spins (user_id)",
        "ix_spins_user_id",
    )

    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS spin_credits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            order_id INTEGER REFERENCES orders(id),
            amount INTEGER NOT NULL DEFAULT 0,
            reason VARCHAR(120) NOT NULL DEFAULT 'delivered_order',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """,
        "spin_credits table",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_spin_credits_user_id ON spin_credits (user_id)",
        "ix_spin_credits_user_id",
    )

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
