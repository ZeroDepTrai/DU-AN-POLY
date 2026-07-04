from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.deps import hash_password
from app.models import User, UserRole
from app.routers import admin, auth, blog, categories, coupons, driver, media, orders, products, spin
from app.websocket import manager


def seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.admin_email).first()
    if existing:
        return
    admin_user = User(
        email=settings.admin_email,
        name="Admin",
        password_hash=hash_password(settings.admin_password),
        role=UserRole.admin,
    )
    db.add(admin_user)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    import logging
    logger = logging.getLogger("uvicorn.error")
    from sqlalchemy.exc import SQLAlchemyError

    def _has_column(conn, table: str, column: str) -> bool:
        try:
            row = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.columns "
                    "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
                ),
                {"t": table, "c": column},
            ).first()
            return row is not None
        except SQLAlchemyError as e:
            logger.warning(f"[MIGRATION] inspection error on {table}.{column}: {e}")
            return False

    def _force_add(conn, table: str, column: str, ddl: str) -> None:
        """Add a column via a fresh connection in AUTOCOMMIT so the change is visible immediately.

        We open a *new* connection scoped to this ALTER — re-using `conn` is
        unreliable because once any prior SELECT has run on it, SQLAlchemy
        autobegins a transaction that prevents flipping isolation_level.
        """
        if _has_column(conn, table, column):
            logger.warning(f"[MIGRATION] {table}.{column} already exists, skipping")
            return
        try:
            alt = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
            try:
                alt.execute(text(ddl))
                logger.warning(f"[MIGRATION] Added {table}.{column}")
            finally:
                alt.close()
        except SQLAlchemyError as e:
            logger.warning(f"[MIGRATION] Could not add {table}.{column}: {e}")

    # Use a connection from the SAME engine SQLAlchemy uses for queries,
    # so the column is visible to every subsequent ORM operation.
    with engine.connect() as conn:
        try:
            # Rename products.tag -> products.tags if old single-column schema exists
            if _has_column(conn, "products", "tag") and not _has_column(conn, "products", "tags"):
                try:
                    alt = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
                    try:
                        alt.execute(text("ALTER TABLE products RENAME COLUMN tag TO tags"))
                        logger.warning("[MIGRATION] Renamed products.tag -> products.tags")
                    finally:
                        alt.close()
                except SQLAlchemyError as e:
                    logger.warning(f"[MIGRATION] Rename failed: {e}")

            # Ensure all expected columns exist
            _force_add(conn, "products", "specifications",
                       "ALTER TABLE products ADD COLUMN specifications TEXT NOT NULL DEFAULT ''")
            _force_add(conn, "products", "description",
                       "ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT ''")
            _force_add(conn, "blog_posts", "tags",
                       "ALTER TABLE blog_posts ADD COLUMN tags VARCHAR(500) NOT NULL DEFAULT ''")
            _force_add(conn, "blog_posts", "image_url",
                       "ALTER TABLE blog_posts ADD COLUMN image_url VARCHAR(500) NOT NULL DEFAULT ''")
            _force_add(conn, "blog_posts", "author_id",
                       "ALTER TABLE blog_posts ADD COLUMN author_id INTEGER NOT NULL DEFAULT 1")
            _force_add(conn, "blog_posts", "slug",
                       "ALTER TABLE blog_posts ADD COLUMN slug VARCHAR(300) NOT NULL DEFAULT ''")
            _force_add(conn, "blog_posts", "title",
                       "ALTER TABLE blog_posts ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT ''")
            _force_add(conn, "blog_posts", "content",
                       "ALTER TABLE blog_posts ADD COLUMN content TEXT NOT NULL DEFAULT ''")
            _force_add(conn, "orders", "coupon_id",
                       "ALTER TABLE orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id)")
        except SQLAlchemyError as e:
            logger.warning(f"[MIGRATION] Outer migration error: {e}")

    # Seed admin user
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()

    # Dispose the engine pool so any cached schema metadata is dropped —
    # this guarantees ORM queries after this point see the latest columns.
    engine.dispose()

    yield


app = FastAPI(title="Phone Store API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(blog.router)
app.include_router(driver.router)
app.include_router(media.router)
app.include_router(coupons.router)
app.include_router(spin.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "store_name": settings.store_name}


@app.websocket("/ws/orders/{tracking_code}")
async def order_tracking_ws(tracking_code: str, websocket: WebSocket):
    await manager.connect(tracking_code, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(tracking_code, websocket)
