import os
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from app.config import settings


def _col_exists(conn, table: str, column: str) -> bool:
    try:
        row = conn.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name=:t AND column_name=:c"
            ),
            {"t": table, "c": column},
        ).first()
        return row is not None
    except Exception:
        # If the table doesn't exist yet (no rows for it in information_schema),
        # treat the column as missing so the caller can add it.
        return False


def apply_schema_changes():
    from sqlalchemy.engine import Connection

    db = create_engine(settings.database_url_final, isolation_level="AUTOCOMMIT")
    # Use a long-lived AUTOCOMMIT connection: every SQL run in its own txn.
    conn: Connection = db.connect()

    def safe_alter(sql: str, label: str):
        try:
            conn.execute(text(sql))
            print(f"[MIGRATION] {label}: applied")
        except Exception as e:
            print(f"[MIGRATION] {label}: SKIPPED ({type(e).__name__}: {e})")

    # --- userrole enum: add 'driver' if missing ---
    safe_alter("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'driver'", "userrole.driver enum")

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

    if not _col_exists(conn, "products", "is_active"):
        safe_alter(
            "ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true",
            "products.is_active (ADDED)",
        )
    else:
        print("[MIGRATION] products.is_active: already exists, skipping")

    # Composite indexes that back the public storefront queries:
    # WHERE is_active=TRUE ORDER BY id DESC   (Home, list_products)
    # WHERE is_active=TRUE ORDER BY price …  (sort: price_asc / price_desc)
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_products_active_id ON products (is_active, id)",
        "ix_products_active_id",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_products_active_price ON products (is_active, price)",
        "ix_products_active_price",
    )

    # --- blog_posts columns ---
    if not _col_exists(conn, "blog_posts", "tags"):
        safe_alter(
            "ALTER TABLE blog_posts ADD COLUMN tags VARCHAR(500) NOT NULL DEFAULT ''",
            "blog_posts.tags (ADDED)",
        )
    else:
        print("[MIGRATION] blog_posts.tags: already exists, skipping")

    # --- new tables for products media, coupons, wheel/spin ---
    # IMPORTANT: create `coupons` BEFORE adding `orders.coupon_id` (FK reference).
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

    # --- orders.coupon_id (referencing the now-existing coupons table) ---
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
        "CREATE INDEX IF NOT EXISTS ix_product_media_id ON product_media (id)",
        "ix_product_media_id",
    )

    # --- wheel_config (single row id=1) ---
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

    # Seed default prizes the first time wheel_config is created.
    safe_alter(
        """
        INSERT INTO wheel_config (id, title, background_url, prizes_json, spend_per_spin_vnd)
        VALUES (1, 'CellZone · Spin & Win', '', '[]', 3000000)
        ON CONFLICT (id) DO NOTHING
        """,
        "wheel_config seed (id=1)",
    )
    safe_alter(
        """
        UPDATE wheel_config
        SET prizes_json = '[' ||
            '{"name":"Mã giảm giá 2%","image":"/uploads/case.png","weight":35,"jackpot":false,"icon":"🎟️","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":2},' ||
            '{"name":"Cường Lực miễn phí","image":"/uploads/screen.png","weight":25,"jackpot":false,"icon":"🛡️","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":10},' ||
            '{"name":"Ốp Iphone miễn phí","image":"/uploads/cable.png","weight":20,"jackpot":false,"icon":"📱","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},' ||
            '{"name":"Dây sạc miễn phí","image":"/uploads/charger.png","weight":14,"jackpot":false,"icon":"🔌","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},' ||
            '{"name":"Mã giảm giá 5%","image":"/uploads/airpod.png","weight":5,"jackpot":false,"icon":"🎁","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},' ||
            '{"name":"Chúc bạn may mắn lần sau","image":"/uploads/smartwatch.png","weight":0.5,"jackpot":false,"icon":"🍀","coupon_id":null,"product_id":null},' ||
            '{"name":"Apple Watch","image":"/uploads/watch.png","weight":0.4,"jackpot":true,"icon":"⌚","coupon_id":null,"product_id":null},' ||
            '{"name":"IPhone 17 Pro Max","image":"/uploads/iphone.png","weight":0.1,"jackpot":true,"icon":"📱","coupon_id":null,"product_id":null}' ||
            ']'
        WHERE id = 1
        """,
        "wheel_config default prizes",
    )

    # --- spins (audit) ---
    safe_alter(
        """
        CREATE TABLE IF NOT EXISTS spins (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            prize_label VARCHAR(120) NOT NULL,
            prize_kind VARCHAR(32) NOT NULL DEFAULT 'consolation',
            coupon_id INTEGER REFERENCES coupons(id),
            product_id INTEGER REFERENCES products(id),
            coupon_code VARCHAR(32),
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
        "CREATE INDEX IF NOT EXISTS ix_spins_coupon_code ON spins (coupon_code)",
        "ix_spins_coupon_code",
    )
    safe_alter(
        "CREATE INDEX IF NOT EXISTS ix_spins_product_id ON spins (product_id)",
        "ix_spins_product_id",
    )

    # --- spin_credits (wallet) ---
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
