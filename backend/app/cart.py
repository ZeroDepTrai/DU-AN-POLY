from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import CartItem, Product, User

router = APIRouter(prefix="/api/cart", tags=["cart"])


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    source: str
    product_name: str
    product_price: float
    product_image_url: str
    product_tags: str

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int
    total_price: float


class AddItemRequest(BaseModel):
    product_id: int
    quantity: int = 1
    source: str = "paid"


class UpdateQuantityRequest(BaseModel):
    quantity: int


@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartResponse:
    rows = db.query(CartItem).filter(CartItem.user_id == user.id).all()

    items: list[CartItemResponse] = []
    total_price = 0.0

    for row in rows:
        p = row.product
        if p and p.is_active:
            unit = 0.0 if row.source == "free" else (p.price * row.quantity)
            items.append(
                CartItemResponse(
                    id=row.id,
                    product_id=p.id,
                    quantity=row.quantity,
                    source=row.source,
                    product_name=p.name,
                    product_price=p.price,
                    product_image_url=p.image_url,
                    product_tags=p.tags,
                )
            )
            total_price += unit

    return CartResponse(
        items=items,
        total_items=sum(r.quantity for r in rows if r.product and r.product.is_active),
        total_price=total_price,
    )


@router.post("/items")
def add_item(
    payload: AddItemRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartItemResponse:
    product = db.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Số lượng phải lớn hơn 0")

    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.product_id == payload.product_id)
        .first()
    )

    if existing:
        if payload.source == "free":
            if existing.source == "paid":
                raise HTTPException(
                    status_code=409,
                    detail="Sản phẩm đã có trong giỏ — không thể thay đổi sang quà tặng",
                )
            existing.quantity += payload.quantity
        else:
            if existing.source == "free":
                raise HTTPException(
                    status_code=409,
                    detail="Sản phẩm là quà tặng từ vòng quay — không thể thêm với giá thường",
                )
            existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        row = existing
    else:
        row = CartItem(
            user_id=user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            source=payload.source,
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    return CartItemResponse(
        id=row.id,
        product_id=row.product_id,
        quantity=row.quantity,
        source=row.source,
        product_name=product.name,
        product_price=product.price,
        product_image_url=product.image_url,
        product_tags=product.tags,
    )


@router.post("/items/free")
def add_free_item(
    payload: AddItemRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartItemResponse:
    """Add a spin-wheel free product to cart. Only one free entry per product is allowed."""
    payload.source = "free"
    return add_item(payload, db, user)


@router.patch("/items/{item_id}/quantity")
def update_quantity(
    item_id: int,
    payload: UpdateQuantityRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartItemResponse:
    row = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Mục không tồn tại trong giỏ hàng")

    if payload.quantity <= 0:
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=204, detail="Đã xóa sản phẩm khỏi giỏ hàng")

    row.quantity = payload.quantity
    db.commit()
    db.refresh(row)

    p = row.product
    return CartItemResponse(
        id=row.id,
        product_id=row.product_id,
        quantity=row.quantity,
        source=row.source,
        product_name=p.name if p else "",
        product_price=p.price if p else 0.0,
        product_image_url=p.image_url if p else "",
        product_tags=p.tags if p else "",
    )


@router.delete("/items/{item_id}")
def remove_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    row = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Mục không tồn tại trong giỏ hàng")

    db.delete(row)
    db.commit()
    return {"message": "Đã xóa sản phẩm"}


@router.delete("")
def clear_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return {"message": "Đã xóa toàn bộ giỏ hàng"}
