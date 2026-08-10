from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Product, ProductLike, ProductRating, User
from app.routers.products import _attach_media, _attach_rating_like
from app.schemas import ProductResponse, RatingResponse

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("/favorites", response_model=list[ProductResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the products the current user has liked (favorited).

    Returns active products only, newest like first. Each item is hydrated
    with media + rating/like aggregates (so the Profile page can render
    using the same `ProductCard` component as the catalog).
    """
    rows = (
        db.query(Product)
        .join(ProductLike, ProductLike.product_id == Product.id)
        .filter(ProductLike.user_id == current_user.id)
        .filter(Product.is_active.is_(True))
        .order_by(ProductLike.created_at.desc())
        .all()
    )
    _attach_media(rows, db)
    _attach_rating_like(rows, db, current_user.id)
    return rows


@router.get("/reviews", response_model=list[RatingResponse])
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the ratings/reviews the current user has submitted.

    Returns the user's own ratings newest-first, joined with the product
    name so the Profile page can render a self-contained review list
    without needing to refetch each product.
    """
    rows = (
        db.query(ProductRating, Product.name)
        .join(Product, Product.id == ProductRating.product_id)
        .filter(ProductRating.user_id == current_user.id)
        .order_by(ProductRating.created_at.desc())
        .all()
    )
    return [
        RatingResponse(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_name=current_user.name,
            stars=r.stars,
            review=r.review or "",
            created_at=r.created_at.isoformat() if r.created_at else "",
            product_name=product_name,
        )
        for r, product_name in rows
    ]
