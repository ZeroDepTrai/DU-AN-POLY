from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


# Brand-ish tokens we use to bucket products into phones vs accessories.
_PHONE_TOKENS = ["iphone", "samsung", "xiaomi", "oppo", "android", "flagship", "realme", "vivo"]


def _split_tags(p) -> tuple[str, ...]:
    """Return the comma-separated `tags` for a Product as a tuple of trimmed tokens."""
    raw = getattr(p, "tags", "") or ""
    parts: list[str] = []
    for tok in raw.split(","):
        tok = tok.strip()
        if tok:
            parts.append(tok)
    return tuple(parts)


@router.get("", response_model=CategoryResponse)
def get_categories(db: Session = Depends(get_db)) -> None:  # type: ignore[override]
    """Return the unique product buckets.

    Phones are products whose tags include any of the brand tokens.
    Accessories are everything else. We split *tags* (comma-separated) per
    product rather than grouping by the full tag string so that a product with
    "iphone,featured" ends up under `iphone` instead of being silently
    dropped.
    """
    products = db.query(Product).all()

    phone_tokens: set[str] = set()
    accessory_tokens: set[str] = set()
    for p in products:
        for tok in _split_tags(p):
            if any(t in tok.lower() for t in _PHONE_TOKENS):
                phone_tokens.add(tok)
            else:
                accessory_tokens.add(tok)

    return CategoryResponse(
        phone=sorted(phone_tokens),
        accessory=sorted(accessory_tokens),
    )

