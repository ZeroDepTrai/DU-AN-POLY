"""ProductMedia gallery router.

The existing admin router already exposes `/upload/media` and the `/uploads/*`
StaticFiles mount; this module adds the per-product CRUD endpoints.
"""
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import require_admin
from app.models import Product, ProductMedia, User

from app.routers.admin import save_image, save_video

router = APIRouter(prefix="/api", tags=["product-media"])


def _media_to_dict(m: ProductMedia) -> dict:
    return {
        "id": m.id,
        "url": m.url,
        "media_type": m.media_type,
        "position": m.position,
        "is_cover": m.is_cover,
    }


@router.get("/products/{product_id}/media")
def list_product_media(product_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ProductMedia)
        .filter(ProductMedia.product_id == product_id)
        .order_by(ProductMedia.position.asc(), ProductMedia.id.asc())
        .all()
    )
    return [_media_to_dict(m) for m in rows]


@router.post("/admin/products/{product_id}/media")
async def admin_upload_product_media(
    product_id: int,
    file: UploadFile = File(...),
    is_cover: str = Form(default="false"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Upload a new media item for the product. Auto-detects image vs video by
    extension. If `is_cover=true`, it becomes the new product thumbnail (and we
    also set `products.image_url` accordingly)."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    suffix = Path(file.filename or "").suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        url = save_image(file)
        media_type = "image"
    elif suffix in {".mp4", ".webm", ".mov", ".avi"}:
        url = save_video(file)
        media_type = "video"
    else:
        raise HTTPException(status_code=400, detail="Loại file không được hỗ trợ")

    # Auto-position: append at end.
    pos = (
        db.query(ProductMedia)
        .filter(ProductMedia.product_id == product_id)
        .count()
    )

    if is_cover.lower() in {"1", "true", "yes", "on"}:
        # Clear previous covers
        db.query(ProductMedia).filter(ProductMedia.product_id == product_id).update({ProductMedia.is_cover: False})
        product.image_url = url

    media = ProductMedia(
        product_id=product_id,
        url=url,
        media_type=media_type,
        position=pos,
        is_cover=(is_cover.lower() in {"1", "true", "yes", "on"}),
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return _media_to_dict(media)


@router.put("/admin/media/{media_id}")
def admin_update_media(
    media_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    media = db.get(ProductMedia, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Media not found")

    if "is_cover" in payload and payload["is_cover"]:
        db.query(ProductMedia).filter(ProductMedia.product_id == media.product_id).update({ProductMedia.is_cover: False})
        # Mirror the cover change to product.image_url
        product = db.get(Product, media.product_id)
        if product is not None and media.media_type == "image":
            product.image_url = media.url

    if "is_cover" in payload:
        media.is_cover = bool(payload["is_cover"])
    if "position" in payload:
        try:
            media.position = int(payload["position"])
        except (TypeError, ValueError):
            pass

    db.commit()
    db.refresh(media)
    return _media_to_dict(media)


@router.delete("/admin/media/{media_id}")
def admin_delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    media = db.get(ProductMedia, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Media not found")

    # If this was the cover, revert image_url back to the next-most-recent image.
    product = db.get(Product, media.product_id)
    db.delete(media)
    db.flush()
    if product is not None and media.is_cover:
        replacement = (
            db.query(ProductMedia)
            .filter(ProductMedia.product_id == product.id, ProductMedia.media_type == "image")
            .order_by(ProductMedia.position.asc(), ProductMedia.id.asc())
            .first()
        )
        if replacement is not None:
            replacement.is_cover = True
            product.image_url = replacement.url
        else:
            product.image_url = ""

    db.commit()
    return {"ok": True}
