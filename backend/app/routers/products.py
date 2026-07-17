from datetime import datetime, timezone
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import (
    Product,
    ProductLike,
    ProductMedia,
    ProductRating,
    User,
)
from app.schemas import (
    CategoryResponse,
    LikeStatus,
    PaginatedProductsResponse,
    PaginatedRatingsResponse,
    ProductResponse,
    RatingCreate,
    RatingResponse,
    RatingSummary,
)

router = APIRouter(prefix="/api/products", tags=["products"])


# ──────────────────────────────────────────────────────────────────────────────
# Aggregation helpers (rating + like)
# ──────────────────────────────────────────────────────────────────────────────


def _attach_media(products: list[Product], db: Session) -> None:
    """Hydrate Product.media in one batched query (replaces a per-row
    `SELECT … FROM product_media WHERE product_id = ?` N+1).
    Skipped silently on an empty list.
    """
    if not products:
        return
    product_ids = [p.id for p in products]
    media_rows = (
        db.query(ProductMedia)
        .filter(ProductMedia.product_id.in_(product_ids))
        .order_by(ProductMedia.position.asc(), ProductMedia.id.asc())
        .all()
    )
    by_product: dict[int, list[ProductMedia]] = {}
    for m in media_rows:
        by_product.setdefault(m.product_id, []).append(m)
    for p in products:
        p.media = by_product.get(p.id, [])  # type: ignore[attr-defined]


def _attach_rating_like(
    products: Iterable[Product],
    db: Session,
    viewer_id: int | None = None,
) -> None:
    """Hydrate ``avg_rating``, ``rating_count``, ``like_count`` and (when a
    ``viewer_id`` is supplied) the per-viewer ``my_rating`` / ``liked``.

    Uses a single aggregate query for ratings and a single aggregate query
    for likes, regardless of the size of ``products`` — avoids N+1.
    """
    products = list(products)
    if not products:
        return

    product_ids = [p.id for p in products]

    rating_rows = (
        db.query(
            ProductRating.product_id,
            func.coalesce(func.avg(ProductRating.stars), 0.0).label("avg"),
            func.count(ProductRating.id).label("cnt"),
        )
        .filter(ProductRating.product_id.in_(product_ids))
        .group_by(ProductRating.product_id)
        .all()
    )
    rating_by_id: dict[int, tuple[float, int]] = {
        r.product_id: (float(r.avg or 0.0), int(r.cnt or 0)) for r in rating_rows
    }

    like_rows = (
        db.query(
            ProductLike.product_id,
            func.count(ProductLike.id).label("cnt"),
        )
        .filter(ProductLike.product_id.in_(product_ids))
        .group_by(ProductLike.product_id)
        .all()
    )
    like_by_id: dict[int, int] = {l.product_id: int(l.cnt or 0) for l in like_rows}

    my_rating_by_id: dict[int, int] = {}
    liked_by_id: dict[int, bool] = {}
    if viewer_id is not None:
        my_rating_rows = (
            db.query(ProductRating.product_id, ProductRating.stars)
            .filter(
                ProductRating.user_id == viewer_id,
                ProductRating.product_id.in_(product_ids),
            )
            .all()
        )
        my_rating_by_id = {r.product_id: int(r.stars) for r in my_rating_rows}

        liked_rows = (
            db.query(ProductLike.product_id)
            .filter(
                ProductLike.user_id == viewer_id,
                ProductLike.product_id.in_(product_ids),
            )
            .all()
        )
        liked_by_id = {r.product_id: True for r in liked_rows}

    for p in products:
        avg, cnt = rating_by_id.get(p.id, (0.0, 0))
        p.avg_rating = round(float(avg), 2)  # type: ignore[attr-defined]
        p.rating_count = int(cnt)            # type: ignore[attr-defined]
        p.like_count = like_by_id.get(p.id, 0)  # type: ignore[attr-defined]
        if viewer_id is not None:
            p.my_rating = my_rating_by_id.get(p.id)  # type: ignore[attr-defined]
            p.liked = liked_by_id.get(p.id, False)   # type: ignore[attr-defined]


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────


@router.get("", response_model=list[ProductResponse])
def list_products(
    tag: str | None = Query(default=None),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    """Returns all ACTIVE products, optionally filtered by tag. Backward-compatible."""
    query = db.query(Product).filter(Product.is_active.is_(True))
    if tag:
        query = query.filter(Product.tags.ilike(f"%{tag}%"))
    rows = query.order_by(Product.id.desc()).all()
    _attach_media(rows, db)
    _attach_rating_like(rows, db, viewer.id if viewer else None)
    return rows


@router.get("/search", response_model=PaginatedProductsResponse)
def search_products(
    tag: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    """New paginated/filtered search endpoint for Products and Accessories pages."""
    query = db.query(Product).filter(Product.is_active.is_(True))
    if tag:
        query = query.filter(Product.tags.ilike(f"%{tag}%"))
    if brand:
        query = query.filter(Product.tags.ilike(f"%{brand}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    total = query.with_entities(Product.id).count()

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id.desc())

    page_rows = query.offset((page - 1) * limit).limit(limit).all()
    _attach_media(page_rows, db)
    _attach_rating_like(page_rows, db, viewer.id if viewer else None)
    return PaginatedProductsResponse(
        products=page_rows,
        total=total,
        page=page,
        limit=limit,
        category=tag or "",
        brand=brand or "",
    )


# NOTE: "/related" must come BEFORE "/{product_id}" so FastAPI matches it first
@router.get("/{product_id}/related", response_model=list[ProductResponse])
def get_related_products(
    product_id: int,
    limit: int = Query(default=4, ge=1, le=20),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    related = (
        db.query(Product)
        .filter(
            Product.id != product_id,
            Product.is_active.is_(True),
            Product.tags.ilike(f"%{product.tags.split(',')[0].strip()}%"),
        )
        .order_by(Product.id.desc())
        .limit(limit)
        .all()
    )
    _attach_media(related, db)
    _attach_rating_like(related, db, viewer.id if viewer else None)
    return related


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    _attach_media([product], db)
    _attach_rating_like([product], db, viewer.id if viewer else None)
    return product


# ──────────────────────────────────────────────────────────────────────────────
# Ratings + Likes
# ──────────────────────────────────────────────────────────────────────────────


def _rating_summary(db: Session, product_id: int, viewer_id: int | None) -> RatingSummary:
    avg = (
        db.query(func.coalesce(func.avg(ProductRating.stars), 0.0))
        .filter(ProductRating.product_id == product_id)
        .scalar()
    )
    count = (
        db.query(func.count(ProductRating.id))
        .filter(ProductRating.product_id == product_id)
        .scalar()
    )
    my_rating = None
    if viewer_id is not None:
        row = (
            db.query(ProductRating.stars)
            .filter(
                ProductRating.product_id == product_id,
                ProductRating.user_id == viewer_id,
            )
            .first()
        )
        if row:
            my_rating = int(row[0])
    return RatingSummary(avg=round(float(avg or 0.0), 2), count=int(count or 0), my_rating=my_rating)


def _like_status(db: Session, product_id: int, viewer_id: int | None) -> LikeStatus:
    count = (
        db.query(func.count(ProductLike.id))
        .filter(ProductLike.product_id == product_id)
        .scalar()
    )
    liked = False
    if viewer_id is not None:
        liked = (
            db.query(ProductLike.id)
            .filter(
                ProductLike.product_id == product_id,
                ProductLike.user_id == viewer_id,
            )
            .first()
            is not None
        )
    return LikeStatus(liked=liked, count=int(count or 0))


@router.get("/{product_id}/ratings", response_model=RatingSummary)
def get_ratings(
    product_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return _rating_summary(db, product_id, viewer.id if viewer else None)


@router.post("/{product_id}/ratings", response_model=RatingSummary)
def upsert_rating(
    product_id: int,
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = (
        db.query(ProductRating)
        .filter(
            ProductRating.product_id == product_id,
            ProductRating.user_id == current_user.id,
        )
        .first()
    )
    now = datetime.now(timezone.utc)
    if existing is None:
        row = ProductRating(
            product_id=product_id,
            user_id=current_user.id,
            stars=payload.stars,
            review=payload.review or "",
            created_at=now,
        )
        db.add(row)
    else:
        existing.stars = payload.stars
        existing.review = payload.review or ""
        existing.created_at = now
    db.commit()
    return _rating_summary(db, product_id, current_user.id)


@router.get("/{product_id}/like", response_model=LikeStatus)
def get_like(
    product_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return _like_status(db, product_id, viewer.id if viewer else None)


@router.post("/{product_id}/like", response_model=LikeStatus)
def toggle_like(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = (
        db.query(ProductLike)
        .filter(
            ProductLike.product_id == product_id,
            ProductLike.user_id == current_user.id,
        )
        .first()
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
    else:
        row = ProductLike(
            product_id=product_id,
            user_id=current_user.id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(row)
        db.commit()
    return _like_status(db, product_id, current_user.id)


# ──────────────────────────────────────────────────────────────────────────────
# Admin: raw ratings listing
# ──────────────────────────────────────────────────────────────────────────────


@router.get("/{product_id}/ratings/list", response_model=PaginatedRatingsResponse)
def list_ratings(
    product_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    base = db.query(ProductRating, User.name).join(User, User.id == ProductRating.user_id).filter(
        ProductRating.product_id == product_id
    )
    total = base.count()
    rows = base.order_by(ProductRating.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    items = [
        RatingResponse(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_name=u_name,
            stars=int(r.stars),
            review=r.review or "",
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r, u_name in rows
    ]
    return PaginatedRatingsResponse(items=items, total=total, page=page, limit=limit)