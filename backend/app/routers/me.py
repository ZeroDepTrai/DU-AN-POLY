from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Product, ProductLike, ProductMedia, User
from app.routers.products import _attach_media, _attach_rating_like
from app.schemas import ProductResponse

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