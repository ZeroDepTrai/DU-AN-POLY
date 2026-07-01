from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import CategoryResponse, PaginatedProductsResponse, ProductResponse

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(tag: str | None = Query(default=None), db: Session = Depends(get_db)):
    """Returns all products, optionally filtered by tag. Backward-compatible."""
    query = db.query(Product)
    if tag:
        query = query.filter(Product.tags.ilike(f"%{tag}%"))
    return query.order_by(Product.id.desc()).all()


@router.get("/search", response_model=PaginatedProductsResponse)
def search_products(
    tag: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """New paginated/filtered search endpoint for Products and Accessories pages."""
    query = db.query(Product)
    if tag:
        query = query.filter(Product.tags.ilike(f"%{tag}%"))
    if brand:
        query = query.filter(Product.tags.ilike(f"%{brand}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    total = query.count()

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id.desc())

    products = query.offset((page - 1) * limit).limit(limit).all()
    return PaginatedProductsResponse(
        products=products,
        total=total,
        page=page,
        limit=limit,
        category=tag or "",
        brand=brand or "",
    )


# NOTE: "/related" must come BEFORE "/{product_id}" so FastAPI matches it first
@router.get("/{product_id}/related", response_model=list[ProductResponse])
def get_related_products(product_id: int, limit: int = Query(default=4, ge=1, le=20), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    related = (
        db.query(Product)
        .filter(Product.id != product_id, Product.tags.ilike(f"%{product.tags.split(',')[0].strip()}%"))
        .order_by(Product.id.desc())
        .limit(limit)
        .all()
    )
    return related


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
