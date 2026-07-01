from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

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
        # Rename columns idempotently (ignore errors if already renamed or doesn't exist)
        def try_rename(sql: str) -> None:
            try:
                db.execute(db.text(sql))
                db.commit()
            except Exception:
                db.rollback()

        # products.tag -> products.tags
        try_rename("ALTER TABLE products RENAME COLUMN tag TO tags")
        # blog_posts.category -> blog_posts.tags
        try_rename("ALTER TABLE blog_posts RENAME COLUMN category TO tags")

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
