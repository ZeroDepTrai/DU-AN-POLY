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
_LEGACY_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png"}


def _optimize_url(
    url: str,
    upload_dir: Path,
    cache: dict[str, str],
    originals_to_delete: set[Path],
) -> str:
    """Resolve a legacy upload to WebP and queue its original for deletion."""
    if not url or not url.startswith("/uploads/") or _OPTIMIZED_URL_RE.match(url):
        return url
    if url in cache:
        return cache[url]

    source = upload_dir / Path(url).name
    if source.suffix.lower() not in _LEGACY_IMAGE_SUFFIXES:
        return url

    # Older deployments sometimes created ``photo.webp`` but left the DB
    # pointing at ``photo.jpg``/``photo.png``. Reuse it instead of generating
    # another optimized image with a random name.
    existing_webp = source.with_suffix(".webp")
    if existing_webp.is_file():
        optimized = f"/uploads/{existing_webp.name}"
        cache[url] = optimized
        if source.is_file():
            originals_to_delete.add(source)
        log.info(
            "legacy_image_migration: found existing WebP %r -> %r", url, optimized,
        )
        return optimized

    if not source.is_file():
        log.warning(
            "legacy_image_migration: skipping %r — neither %s nor source file exists in %s",
            url,
            existing_webp.name,
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
    originals_to_delete.add(source)
    log.info(
        "legacy_image_migration: optimized %r -> %r", url, optimized,
    )
    return optimized


def _delete_migrated_originals(originals: set[Path]) -> int:
    """Delete legacy files after their replacement URLs are safely committed."""
    deleted = 0
    for source in originals:
        try:
            source.unlink(missing_ok=True)
            deleted += 1
            log.info("legacy_image_migration: deleted original %s", source)
        except OSError as exc:
            log.warning(
                "legacy_image_migration: could not delete original %s (%s: %s)",
                source,
                type(exc).__name__,
                exc,
            )
    return deleted


def optimize_legacy_images() -> None:
    """Migrate DB image URLs to WebP, then delete committed legacy originals."""
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    converted_urls: dict[str, str] = {}
    originals_to_delete: set[Path] = set()
    try:
        products = db.query(Product).all()
        for product in products:
            product.image_url = _optimize_url(
                product.image_url, upload_dir, converted_urls, originals_to_delete
            )
            product.description = persist_inline_data_images(product.description or "", upload_dir)
            product.specifications = persist_inline_data_images(product.specifications or "", upload_dir)
        for media in db.query(ProductMedia).filter(ProductMedia.media_type == "image").all():
            media.url = _optimize_url(
                media.url, upload_dir, converted_urls, originals_to_delete
            )

        for post in db.query(BlogPost).all():
            post.image_url = _optimize_url(
                post.image_url, upload_dir, converted_urls, originals_to_delete
            )
            post.content = persist_inline_data_images(post.content or "", upload_dir)

        db.commit()
        originals_deleted = _delete_migrated_originals(originals_to_delete)
        log.warning(
            "[IMAGE MIGRATION] migrated %d legacy URLs; deleted %d originals; "
            "scanned %d products",
            len(converted_urls),
            originals_deleted,
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


def maintain_image_urls_async() -> None:
    """Run WebP migration, then broken-link cleanup, on one daemon thread.

    Ordering matters: legacy JPEG/PNG URLs are first repointed to an existing
    or newly generated WebP file. Only after that transaction finishes do we
    clear URLs whose files truly do not exist.
    """
    import threading

    def _run() -> None:
        try:
            optimize_legacy_images()
            scrub_broken_image_urls()
        except Exception as exc:  # pragma: no cover - belt and braces
            log.warning(
                "[IMAGE MAINTENANCE] async runner crashed (%s: %s)",
                type(exc).__name__,
                exc,
            )

    threading.Thread(
        target=_run,
        name="image-maintenance",
        daemon=True,
    ).start()


if __name__ == "__main__":
    # Run explicitly with: python -m app.services.legacy_image_migration
    # This intentionally stays outside the web-service startup path so a large
    # upload volume cannot prevent the API from binding its port.
    optimize_legacy_images()
