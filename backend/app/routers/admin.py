import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import require_admin
from app.models import AdminEmail, Order, OrderItem, Product, User
from app.schemas import (
    AdminEmailCreate,
    AdminEmailResponse,
    LocationUpdate,
    MessageResponse,
    OrderResponse,
    OrderUpdate,
    ProductResponse,
)
from app.services.orders import order_to_response
from app.websocket import manager

router = APIRouter(prefix="/api/admin", tags=["admin"])

UPLOAD_DIR = Path(settings.upload_dir)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def save_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type. Use jpg, png, or webp.")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    filename = f"{uuid.uuid4().hex}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    target = UPLOAD_DIR / filename
    target.write_bytes(content)
    return f"/uploads/{filename}"


@router.post("/products/quick", response_model=ProductResponse)
def quick_add_product(
    name: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    image_url = save_upload(image)
    product = Product(
        name=name,
        price=price,
        tags=tags,
        description="",
        stock=10,
        image_url=image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products", response_model=list[ProductResponse])
def admin_list_products(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Product).order_by(Product.id.desc()).all()


@router.post("/products", response_model=ProductResponse)
def create_product(
    name: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    description: str = Form(""),
    stock: int = Form(0),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    image_url = save_upload(image)
    product = Product(
        name=name,
        price=price,
        tags=tags,
        description=description,
        stock=stock,
        image_url=image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    name: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    description: str = Form(""),
    stock: int = Form(0),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = name
    product.price = price
    product.tags = tags
    product.description = description
    product.stock = stock
    if image is not None and image.filename:
        product.image_url = save_upload(image)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}


@router.get("/orders", response_model=list[OrderResponse])
def admin_list_orders(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.id.desc())
        .all()
    )
    return [order_to_response(order) for order in orders]


@router.patch("/orders/{order_id}/location", response_model=OrderResponse)
async def update_order_location(
    order_id: int,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    order.current_lat = payload.current_lat
    order.current_lng = payload.current_lng
    if payload.status is not None:
        order.status = payload.status

    db.commit()
    db.refresh(order)

    await manager.broadcast(
        order.tracking_code,
        {
            "current_lat": order.current_lat,
            "current_lng": order.current_lng,
            "status": order.status.value,
            "store_lat": settings.store_lat,
            "store_lng": settings.store_lng,
            "store_name": settings.store_name,
        },
    )

    return order_to_response(order)


@router.get("/admin-emails", response_model=list[AdminEmailResponse])
def list_admin_emails(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    emails = db.query(AdminEmail).order_by(AdminEmail.id.desc()).all()
    return [AdminEmailResponse(id=e.id, email=e.email, created_at=e.created_at.isoformat()) for e in emails]


@router.post("/admin-emails", response_model=AdminEmailResponse)
def add_admin_email(payload: AdminEmailCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(AdminEmail).filter(AdminEmail.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in admin list")

    admin_email = AdminEmail(email=payload.email)
    db.add(admin_email)
    db.commit()
    db.refresh(admin_email)
    return AdminEmailResponse(id=admin_email.id, email=admin_email.email, created_at=admin_email.created_at.isoformat())


@router.delete("/admin-emails/{email_id}")
def delete_admin_email(email_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    admin_email = db.get(AdminEmail, email_id)
    if admin_email is None:
        raise HTTPException(status_code=404, detail="Admin email not found")
    db.delete(admin_email)
    db.commit()
    return {"ok": True}


@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if payload.delivery_address is not None:
        order.delivery_address = payload.delivery_address
    if payload.delivery_phone is not None:
        order.delivery_phone = payload.delivery_phone
    if payload.status is not None:
        order.status = payload.status

    db.commit()
    db.refresh(order)

    await manager.broadcast(
        order.tracking_code,
        {
            "current_lat": order.current_lat,
            "current_lng": order.current_lng,
            "status": order.status.value,
            "store_lat": settings.store_lat,
            "store_lng": settings.store_lng,
            "store_name": settings.store_name,
        },
    )

    return order_to_response(order)


@router.get("/admin-emails", response_model=list[AdminEmailResponse])
def list_admin_emails(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    emails = db.query(AdminEmail).order_by(AdminEmail.id.desc()).all()
    return [AdminEmailResponse(id=e.id, email=e.email, created_at=e.created_at.isoformat()) for e in emails]


@router.post("/admin-emails", response_model=AdminEmailResponse)
def add_admin_email(payload: AdminEmailCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(AdminEmail).filter(AdminEmail.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in admin list")

    admin_email = AdminEmail(email=payload.email)
    db.add(admin_email)
    db.commit()
    db.refresh(admin_email)
    return AdminEmailResponse(id=admin_email.id, email=admin_email.email, created_at=admin_email.created_at.isoformat())


@router.delete("/admin-emails/{email_id}")
def delete_admin_email(email_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    admin_email = db.get(AdminEmail, email_id)
    if admin_email is None:
        raise HTTPException(status_code=404, detail="Admin email not found")
    db.delete(admin_email)
    db.commit()
    return {"ok": True}
