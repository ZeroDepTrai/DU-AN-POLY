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
from app.routers import admin, auth, blog, categories, driver, orders, products
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
    db = SessionLocal()
    try:
        import logging
        logger = logging.getLogger("uvicorn.error")
        try:
            # Rename products.tag -> products.tags if it exists
            result = db.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema='public' AND table_name='products' AND column_name='tag'"
                )
            ).fetchone()
            if result:
                db.execute(text("ALTER TABLE products RENAME COLUMN tag TO tags"))
                db.commit()
                logger.warning("[MIGRATION] Renamed products.tag -> products.tags")
            else:
                result2 = db.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema='public' AND table_name='products' AND column_name='tags'"
                    )
                ).fetchone()
                if result2:
                    logger.warning("[MIGRATION] products.tags already exists, skipping")
                else:
                    logger.warning("[MIGRATION] Neither products.tag nor products.tags found in products table")

            # Ensure blog_posts has tags column
            blog_tags_exists = db.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema='public' AND table_name='blog_posts' AND column_name='tags'"
                )
            ).fetchone()
            if not blog_tags_exists:
                # Check if old category column exists to copy data from
                old_cat = db.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema='public' AND table_name='blog_posts' AND column_name='category'"
                    )
                ).fetchone()
                if old_cat:
                    db.execute(text("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''"))
                    db.execute(text("UPDATE blog_posts SET tags = category WHERE tags = '' OR tags IS NULL"))
                    db.commit()
                    logger.warning("[MIGRATION] Added tags column to blog_posts and migrated from category")
                else:
                    # No tags, no category — just add empty tags column
                    db.execute(text("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''"))
                    db.commit()
                    logger.warning("[MIGRATION] Added empty tags column to blog_posts")
            else:
                logger.warning("[MIGRATION] blog_posts.tags already exists, skipping")
        except Exception as e:
            logger.warning(f"[MIGRATION] Error during column rename: {e}")

        seed_admin(db)
    finally:
        db.close()
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
