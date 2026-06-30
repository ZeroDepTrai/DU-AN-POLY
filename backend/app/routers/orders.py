from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Order, OrderItem, User
from app.schemas import OrderCreate, OrderResponse
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
