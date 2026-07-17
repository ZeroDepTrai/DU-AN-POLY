from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.deps import hash_password
from app.models import User, UserRole
from app.routers import admin, auth, blog, categories, coupons, driver, me, media, orders, products, spin
from app import cart
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

    def _widen_varchar(conn, table: str, column: str, target_size: int) -> None:
        """Resize an existing VARCHAR column to at least ``target_size``.

        Older Railway deployments captured ``coupons.description`` at
        VARCHAR(30) before the model declared VARCHAR(255); the spin reward
        code now writes 34-char Vietnamese strings there, so we widen on
        startup. Same for ``coupons.starts_at`` / ``expires_at`` which catch
        32-char ``datetime.isoformat()`` values.
        """
        if not _has_column(conn, table, column):
            logger.warning(f"[MIGRATION] {table}.{column} missing, skipping widen")
            return
        try:
            current = conn.execute(
                text(
                    """
                    SELECT character_maximum_length
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = :t
                      AND column_name = :c
                    """
                ),
                {"t": table, "c": column},
            ).scalar()
        except SQLAlchemyError as e:
            logger.warning(f"[MIGRATION] Could not read {table}.{column} width: {e}")
            return
        if current is None or current >= target_size:
            logger.warning(
                f"[MIGRATION] {table}.{column} already VARCHAR({current}), target {target_size}, skipping"
            )
            return
        try:
            alt = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
            try:
                alt.execute(
                    text(
                        f"ALTER TABLE {table} ALTER COLUMN {column} "
                        f"TYPE VARCHAR({target_size})"
                    )
                )
                logger.warning(
                    f"[MIGRATION] Widened {table}.{column} VARCHAR({current}) -> VARCHAR({target_size})"
                )
            finally:
                alt.close()
        except SQLAlchemyError as e:
            logger.warning(f"[MIGRATION] Could not widen {table}.{column}: {e}")

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
            # Patches for older deployments: the `spins` table was created
            # without these columns. SQLAlchemy will 500 (UndefinedColumn)
            # anywhere the Spin model is loaded until they exist.
            _force_add(conn, "spins", "coupon_id",
                       "ALTER TABLE spins ADD COLUMN coupon_id INTEGER REFERENCES coupons(id)")
            _force_add(conn, "spins", "product_id",
                       "ALTER TABLE spins ADD COLUMN product_id INTEGER REFERENCES products(id)")
            _force_add(conn, "spins", "coupon_code",
                       "ALTER TABLE spins ADD COLUMN coupon_code VARCHAR(32)")
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

            # Existing columns whose declared length is too narrow for the
            # strings the runtime now produces (spin reward Vietnamese
            # description, full-precision isoformat() timestamps, etc.).
            _widen_varchar(conn, "coupons", "description", 255)
            _widen_varchar(conn, "coupons", "starts_at", 64)
            _widen_varchar(conn, "coupons", "expires_at", 64)
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


# Catch-all for unhandled exceptions. Without this, an Internal Server Error
# would propagate back without CORS headers and the browser would surface a
# misleading "CORS header missing" message — hiding the real 500 traceback.
# This handler logs the full exception to the server log AND echoes it in the
# response body (so it shows up in the browser console / network tab too).
@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    import logging
    import traceback

    logging.getLogger("uvicorn.error").error(
        "[UNHANDLED %s %s] %s\n%s",
        request.method,
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    origin = request.headers.get("origin")
    headers: dict[str, str] = {"Vary": "Origin"}
    if origin:
        # Echo the requesting origin so the browser is allowed to read the
        # response. We can't blindly use "*" because allow_credentials=True.
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
        headers=headers,
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)


# Static files (product / blog / wheel uploads) get an immutable, year-long
# Cache-Control header — uploads/* URIs are content-addressable UUIDs so the
# file body never changes. Without this, every ProductCard re-downloads the
# original JPEG on every page mount.
class _CachedStatic(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        return response


app.mount("/uploads", _CachedStatic(directory=str(uploads_path)), name="uploads")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(blog.router)
app.include_router(driver.router)
app.include_router(media.router)
app.include_router(coupons.router)
app.include_router(spin.router)
app.include_router(me.router)


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
