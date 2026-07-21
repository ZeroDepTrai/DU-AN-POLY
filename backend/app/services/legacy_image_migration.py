"""Idempotent migration for images created before local optimization existed."""

import re
from pathlib import Path

from app.config import settings
from app.database import SessionLocal
from app.models import BlogPost, Product, ProductMedia
from app.services.images import InvalidImageError, persist_inline_data_images, save_optimized_image


_OPTIMIZED_URL_RE = re.compile(r"^/uploads/[0-9a-f]{32}\.webp$")


def _optimize_url(url: str, upload_dir: Path, cache: dict[str, str]) -> str:
    if not url or not url.startswith("/uploads/") or _OPTIMIZED_URL_RE.match(url):
        return url
    if url in cache:
        return cache[url]
    source = upload_dir / Path(url).name
    if not source.is_file():
        return url
    try:
        optimized = save_optimized_image(source.read_bytes(), upload_dir)
    except (InvalidImageError, OSError):
        return url
    cache[url] = optimized
    return optimized


def optimize_legacy_images() -> None:
    """Move legacy DB-backed images to optimized files without deleting originals."""
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    converted_urls: dict[str, str] = {}
    try:
        products = db.query(Product).all()
        for product in products:
            product.image_url = _optimize_url(product.image_url, upload_dir, converted_urls)
            product.description = persist_inline_data_images(product.description or "", upload_dir)
            product.specifications = persist_inline_data_images(product.specifications or "", upload_dir)
        for media in db.query(ProductMedia).filter(ProductMedia.media_type == "image").all():
            media.url = _optimize_url(media.url, upload_dir, converted_urls)

        for post in db.query(BlogPost).all():
            post.image_url = _optimize_url(post.image_url, upload_dir, converted_urls)
            post.content = persist_inline_data_images(post.content or "", upload_dir)

        db.commit()
        print(
            f"[IMAGE MIGRATION] optimized {len(converted_urls)} legacy files; "
            f"scanned {len(products)} products"
        )
    except Exception as exc:
        db.rollback()
        print(f"[IMAGE MIGRATION] skipped ({type(exc).__name__}: {exc})")
    finally:
        db.close()
