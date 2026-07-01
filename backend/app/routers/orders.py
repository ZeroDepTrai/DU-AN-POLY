from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Order, OrderItem, User
from app.schemas import OrderCreate, OrderResponse, ShippingUpdate
from app.services.orders import create_order, order_to_response

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderResponse)
async def place_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = await create_order(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return order_to_response(order)


@router.get("/track/{tracking_code}", response_model=OrderResponse)
def get_order_by_tracking(tracking_code: str, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.tracking_code == tracking_code)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)


@router.patch("/{order_id}/shipping", response_model=OrderResponse)
def update_order_shipping(
    order_id: int,
    payload: ShippingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if payload.delivery_address is not None:
        order.delivery_address = payload.delivery_address
    if payload.delivery_phone is not None:
        order.delivery_phone = payload.delivery_phone
    db.commit()
    db.refresh(order)
    return order_to_response(order)
