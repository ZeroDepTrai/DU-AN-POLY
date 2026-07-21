"""Local image optimization helpers.

Images remain on the configured persistent upload volume.  Every accepted
image is normalized to WebP and gets card-sized variants that the frontend can
select with ``srcset``.
"""

import base64
import binascii
import io
import re
import uuid
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


MAX_IMAGE_PIXELS = 40_000_000
MAX_OUTPUT_WIDTH = 1600
RESPONSIVE_WIDTHS = (320, 640, 1200)
WEBP_QUALITY = 80

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

_DATA_IMAGE_RE = re.compile(
    r'(?P<prefix>src=["\'])data:image/(?P<format>png|jpe?g|webp);base64,'
    r'(?P<data>[A-Za-z0-9+/=\s]+)(?P<quote>["\'])',
    re.IGNORECASE,
)
_IMG_TAG_RE = re.compile(r"<img\b(?![^>]*\bloading=)(?P<attrs>[^>]*)>", re.IGNORECASE)


class InvalidImageError(ValueError):
    pass


def _resized(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image.copy()
    height = max(1, round(image.height * max_width / image.width))
    return image.resize((max_width, height), Image.Resampling.LANCZOS)


def save_optimized_image(content: bytes, upload_dir: Path) -> str:
    """Save one canonical WebP plus 320/640/1200px responsive variants."""
    try:
        with Image.open(io.BytesIO(content)) as source:
            source.load()
            image = ImageOps.exif_transpose(source)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("Invalid or unsupported image") from exc

    upload_dir.mkdir(parents=True, exist_ok=True)
    stem = uuid.uuid4().hex
    canonical = _resized(image, MAX_OUTPUT_WIDTH)
    canonical.save(
        upload_dir / f"{stem}.webp",
        "WEBP",
        quality=WEBP_QUALITY,
        method=6,
    )

    for width in RESPONSIVE_WIDTHS:
        variant = _resized(image, width)
        variant.save(
            upload_dir / f"{stem}-{width}.webp",
            "WEBP",
            quality=WEBP_QUALITY,
            method=6,
        )
        variant.close()

    canonical.close()
    image.close()
    return f"/uploads/{stem}.webp"


def persist_inline_data_images(html: str, upload_dir: Path) -> str:
    """Replace inline base64 image sources with optimized upload URLs."""
    if not html:
        return html

    def replace(match: re.Match[str]) -> str:
        try:
            raw = base64.b64decode(match.group("data"), validate=False)
            url = save_optimized_image(raw, upload_dir)
        except (binascii.Error, InvalidImageError):
            return match.group(0)
        return f'{match.group("prefix")}{url}{match.group("quote")}'

    optimized = _DATA_IMAGE_RE.sub(replace, html)
    return _IMG_TAG_RE.sub(
        lambda match: f'<img loading="lazy" decoding="async"{match.group("attrs")}>',
        optimized,
    )
