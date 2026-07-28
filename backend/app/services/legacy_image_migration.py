"""Idempotent migration for images created before local optimization existed."""

import json
import logging
import re
from pathlib import Path

from app.config import settings
from app.database import SessionLocal
from app.models import BlogPost, Product, ProductMedia, WheelConfig
from app.services.images import InvalidImageError, persist_inline_data_images, save_optimized_image


log = logging.getLogger(__name__)


_OPTIMIZED_URL_RE = re.compile(r"^/uploads/[0-9a-f]{32}\.webp$")


def _optimize_url(url: str, upload_dir: Path, cache: dict[str, str]) -> str:
    if not url or not url.startswith("/uploads/") or _OPTIMIZED_URL_RE.match(url):
        return url
    if url in cache:
        return cache[url]
    source = upload_dir / Path(url).name
    if not source.is_file():
        log.warning(
            "legacy_image_migration: skipping %r — file not found in %s. "
            "The DB row keeps the broken URL; the spin wheel will fall back "
            "to emoji placeholders until the file is restored or the row is "
            "edited.",
            url,
            upload_dir,
        )
        return url
    try:
        optimized = save_optimized_image(source.read_bytes(), upload_dir)
    except (InvalidImageError, OSError) as exc:
        log.warning(
            "legacy_image_migration: skipping %r — optimize failed (%s: %s)",
            url, type(exc).__name__, exc,
        )
        return url
    cache[url] = optimized
    log.info(
        "legacy_image_migration: optimized %r -> %r", url, optimized,
    )
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
        log.warning(
            "[IMAGE MIGRATION] optimized %d legacy files; scanned %d products",
            len(converted_urls),
            len(products),
        )
    except Exception as exc:
        db.rollback()
        log.warning("[IMAGE MIGRATION] skipped (%s: %s)", type(exc).__name__, exc)
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────
# Broken-image scrubber
# ─────────────────────────────────────────────────────────────────────────
#
# Why this exists: image URLs persisted in the DB can point at files that no
# longer exist on disk (e.g. a deploy whose persistent volume was wiped, or
# a placeholder path that was never a real file). When the frontend tries to
# load them, the browser logs a 404 and the user sees a broken-image icon.
#
# Behavior: any /uploads/* URL whose file is missing on disk is replaced with
# the empty string in the DB, so the frontend falls back to its emoji
# placeholder. External URLs (https://…) are left alone — we have no way to
# verify them from here.
#
# This is safe to call at startup and runs idempotently: each row's image URL
# is checked against disk; if the file is gone, it's blanked; otherwise it's
# left untouched. Never deletes files, never touches external URLs.
#


_SCRUBBED_FIELDS = (
    "image",
    "product_image_url",
    "background_url",
)


def _scrub_string_value(value: str | None, upload_dir: Path, label: str) -> tuple[str, bool]:
    """Return (new_value, changed). Empty / non-uploads URLs are returned as-is."""
    if not value or not isinstance(value, str):
        return value or "", False
    if not value.startswith("/uploads/"):
        return value, False
    target = upload_dir / Path(value).name
    if target.is_file():
        return value, False
    log.warning(
        "image_scrub: clearing %s — %r not found in %s",
        label, value, upload_dir,
    )
    return "", True


def _scrub_prize_dict(prize: dict, upload_dir: Path, slot_label: str) -> bool:
    changed = False
    for field in _SCRUBBED_FIELDS:
        if field not in prize:
            continue
        new_value, did_change = _scrub_string_value(
            prize.get(field), upload_dir, f"{slot_label}.{field}"
        )
        if did_change:
            prize[field] = new_value
            changed = True
    return changed


def scrub_broken_image_urls() -> int:
    """Scan the DB for image URLs whose file is missing on disk and clear them.

    Returns the number of rows modified. Safe to call repeatedly — rows with
    valid URLs are left untouched, and the only side-effect is blanking the
    URL string. Never deletes files.
    """
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    rows_changed = 0
    try:
        # 1) Wheel prizes — stored as a JSON blob in WheelConfig.prizes_json
        for cfg in db.query(WheelConfig).all():
            raw = getattr(cfg, "prizes_json", None) or "[]"
            try:
                prizes = json.loads(raw)
            except (ValueError, TypeError):
                log.warning(
                    "image_scrub: wheel_config id=%d prizes_json is not valid JSON; skipping",
                    cfg.id,
                )
                continue
            if not isinstance(prizes, list):
                continue
            cfg_changed = False
            for i, prize in enumerate(prizes):
                if not isinstance(prize, dict):
                    continue
                if _scrub_prize_dict(prize, upload_dir, f"wheel[{cfg.id}].prizes[{i}]"):
                    cfg_changed = True
            if cfg_changed:
                cfg.prizes_json = json.dumps(prizes, ensure_ascii=False)
                rows_changed += 1
                log.warning(
                    "image_scrub: rewrote wheel_config id=%d prizes_json (broken prize images cleared)",
                    cfg.id,
                )

        # 2) Products — image_url is a plain string column
        for product in db.query(Product).all():
            new_value, did_change = _scrub_string_value(
                product.image_url, upload_dir, f"product[{product.id}].image_url"
            )
            if did_change:
                product.image_url = new_value
                rows_changed += 1

        # 3) ProductMedia gallery — only scrub images, not videos
        for media in db.query(ProductMedia).filter(ProductMedia.media_type == "image").all():
            new_value, did_change = _scrub_string_value(
                media.url, upload_dir, f"product_media[{media.id}].url"
            )
            if did_change:
                media.url = new_value
                rows_changed += 1

        # 4) Blog posts
        for post in db.query(BlogPost).all():
            new_value, did_change = _scrub_string_value(
                post.image_url, upload_dir, f"blog_post[{post.id}].image_url"
            )
            if did_change:
                post.image_url = new_value
                rows_changed += 1

        db.commit()
        log.warning(
            "[IMAGE SCRUB] cleared broken image URLs in %d rows", rows_changed,
        )
    except Exception as exc:
        db.rollback()
        log.warning("[IMAGE SCRUB] skipped (%s: %s)", type(exc).__name__, exc)
    finally:
        db.close()
    return rows_changed


def scrub_broken_image_urls_async() -> None:
    """Background wrapper: run the scrub on a daemon thread so it never
    blocks the FastAPI lifespan from completing.

    The scrub touches the DB and reads disk. On a healthy volume both are
    fast, but we still don't want a slow IO to keep the API from binding
    its port. Errors are caught and logged inside ``scrub_broken_image_urls``.
    """
    import threading

    def _run() -> None:
        try:
            scrub_broken_image_urls()
        except Exception as exc:  # pragma: no cover - belt and braces
            log.warning("[IMAGE SCRUB] async runner crashed (%s: %s)", type(exc).__name__, exc)

    threading.Thread(target=_run, name="image-scrub", daemon=True).start()


if __name__ == "__main__":
    # Run explicitly with: python -m app.services.legacy_image_migration
    # This intentionally stays outside the web-service startup path so a large
    # upload volume cannot prevent the API from binding its port.
    optimize_legacy_images()
