import io
import re
import uuid
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from lxml import etree
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import require_admin
from app.models import AdminEmail, Order, OrderItem, Product, User
from app.schemas import (
    AdminEmailCreate,
    AdminEmailResponse,
    LocationUpdate,
    OrderResponse,
    OrderUpdate,
    ProductResponse,
)
from app.services.orders import order_to_response
from app.websocket import manager

router = APIRouter(prefix="/api/admin", tags=["admin"])

UPLOAD_DIR = Path(settings.upload_dir)
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
IMAGE_MAX_SIZE = 5 * 1024 * 1024
VIDEO_MAX_SIZE = 100 * 1024 * 1024


def save_upload(file: UploadFile, allowed_exts: set, max_size: int) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(allowed_exts))}",
        )
    content = file.file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File must be under {max_size // (1024*1024)} MB.",
        )
    filename = f"{uuid.uuid4().hex}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    target = UPLOAD_DIR / filename
    target.write_bytes(content)
    return f"/uploads/{filename}"


def save_image(file: UploadFile) -> str:
    return save_upload(file, ALLOWED_IMAGE_EXTENSIONS, IMAGE_MAX_SIZE)


def save_video(file: UploadFile) -> str:
    return save_upload(file, ALLOWED_VIDEO_EXTENSIONS, VIDEO_MAX_SIZE)


@router.post("/products/quick", response_model=ProductResponse)
def quick_add_product(
    name: str = Form(...),
    price: float = Form(...),
    tags: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    image_url = save_image(image)
    product = Product(
        name=name,
        price=price,
        tags=tags,
        description="",
        specifications="",
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
    specifications: str = Form(""),
    stock: int = Form(0),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    image_url = save_image(image)
    product = Product(
        name=name,
        price=price,
        tags=tags,
        description=description,
        specifications=specifications,
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
    specifications: str = Form(""),
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
    product.specifications = specifications
    product.stock = stock
    if image is not None and image.filename:
        product.image_url = save_image(image)

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
        _maybe_grant_spin_credits(db, order, payload.status)
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


def _maybe_grant_spin_credits(db: Session, order: Order, new_status) -> None:
    """When an order is marked 'delivered', credit the buyer with one spin per
    `spend_per_spin_vnd` VND of cumulative delivered spend."""
    from app.models import OrderStatus as OS
    if new_status != OS.delivered:
        return
    try:
        from app.services.spin import grant_credits_for_delivered_order
        grant_credits_for_delivered_order(db, order)
    except Exception:
        # Spin credits are non-critical; log but don't break the PATCH.
        import logging
        logging.getLogger("uvicorn.error").warning("Spin credit grant failed", exc_info=True)


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
        _maybe_grant_spin_credits(db, order, payload.status)
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


# ── Product DOCX import ──────────────────────────────────────────────────────

def _extract_product_docx_images(docx_bytes: bytes) -> dict[str, str]:
    """Extract images from a docx zip and save them to disk."""
    image_map: dict[str, str] = {}
    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
            rel_map: dict[str, str] = {}
            try:
                rel_xml = zf.read("word/_rels/document.xml.rels")
                rel_root = etree.fromstring(rel_xml)
                for rel in rel_root:
                    rid = rel.get("Id")
                    target = rel.get("Target", "")
                    if rid and target:
                        rel_map[rid] = target.split("/")[-1]
            except Exception:
                pass

            for name in zf.namelist():
                if name.startswith("word/media/"):
                    img_data = zf.read(name)
                    ext = Path(name).suffix.lower()
                    if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
                        ext = ".png"
                    filename = f"{uuid.uuid4().hex}{ext}"
                    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                    (UPLOAD_DIR / filename).write_bytes(img_data)
                    url = f"/uploads/{filename}"
                    media_basename = name.split("/")[-1]
                    image_map[f"embed:{media_basename}"] = url
                    for rid, media_name in rel_map.items():
                        if media_name == media_basename:
                            image_map[f"embed:{rid}"] = url
    except Exception:
        pass
    return image_map


def _xml_para_to_html_product(elem, ns: str, image_map: dict[str, str]) -> str:
    texts: list[str] = []
    images_in_para: list[str] = []

    for child in elem.iter():
        child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if child_tag == "t" and child.text:
            texts.append(child.text)
        if child_tag in ("drawing", "pic"):
            blip_el = child.find(
                ".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"
            )
            if blip_el is not None:
                embed = blip_el.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
                )
                if embed:
                    images_in_para.append(f"embed:{embed}")

    p_style = elem.get(f"{{{ns}}}pStyle")
    combined_text = "".join(texts).strip()
    if not combined_text and not images_in_para:
        return ""

    img_tags = "".join(
        f'<img src="{image_map.get(uri, uri)}" alt="docx-image" style="max-width:100%;border-radius:8px;margin:1em 0;display:block;" />'
        for uri in images_in_para
    )

    if p_style and p_style.startswith("Heading"):
        level = min(int(p_style.split()[-1]) if p_style.split()[-1].isdigit() else 2, 3)
        return f"<h{level}>{combined_text}</h{level}>{img_tags}"

    if combined_text.startswith(("- ", "* ", "+ ")):
        return f"<ul><li>{combined_text[2:]}</li></ul>{img_tags}"
    if re.match(r"^\d+[\.\)]\s", combined_text):
        return f"<p>{combined_text}</p>{img_tags}"
    if combined_text:
        return f"<p>{combined_text}</p>{img_tags}"
    if images_in_para:
        return img_tags
    return ""


def _docx_to_html_product(docx_bytes: bytes) -> tuple[str, str]:
    """Convert docx bytes to HTML. Returns (html, first_image_url)."""
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    image_map = _extract_product_docx_images(docx_bytes)

    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
            xml_bytes = zf.read("word/document.xml")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc nội dung DOCX: {e}")

    root = etree.fromstring(xml_bytes)
    body = root.find(f"{{{ns}}}body")
    if body is None:
        raise HTTPException(status_code=400, detail="File DOCX không hợp lệ")

    html_parts = []
    first_img = ""

    for elem in body:
        tag = elem.tag.split("}")[-1]
        if tag == "p":
            para_html = _xml_para_to_html_product(elem, ns, image_map)
            if para_html:
                html_parts.append(para_html)
                imgs_in_para = re.findall(r'<img[^>]+src="([^"]+)"', para_html)
                if imgs_in_para and not first_img:
                    first_img = imgs_in_para[0]
        elif tag == "tbl":
            rows = elem.findall(f"{{{ns}}}tr")
            if rows:
                html = "<table style='width:100%;border-collapse:collapse;margin:1em 0;'>"
                for row in rows:
                    html += "<tr>"
                    for cell in row.findall(f"{{{ns}}}tc"):
                        cell_paras = cell.findall(f".//{{{ns}}}p")
                        cell_content = "".join(
                            _xml_para_to_html_product(p, ns, image_map) for p in cell_paras
                        )
                        html += f"<td style='border:1px solid #444;padding:8px;vertical-align:top;'>{cell_content}</td>"
                    html += "</tr>"
                html += "</table>"
                html_parts.append(html)

    html = "<div class='docx-content'>" + "".join(html_parts) + "</div>"
    return html, first_img


@router.post("/products/import")
async def import_product_docx(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
):
    """Parse a .docx file and return HTML content + cover image for product description."""
    if not (file.filename or "").lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a .docx document")

    docx_bytes = await file.read()
    if len(docx_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 20 MB")

    html, first_img = _docx_to_html_product(docx_bytes)
    return {"html": html, "cover_image_url": first_img}


# ── Media uploads ─────────────────────────────────────────────────────────────────

@router.post("/upload/media")
async def upload_media(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
):
    """Upload any media file (image or video) and return its URL."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix in ALLOWED_IMAGE_EXTENSIONS:
        url = save_image(file)
    elif suffix in ALLOWED_VIDEO_EXTENSIONS:
        url = save_video(file)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: images ({', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}) or videos ({', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))})",
        )
    return {"url": url}
