from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import create_access_token, get_current_user, hash_password, require_driver, verify_password
from app.models import Driver, Order, OrderItem, OrderStatus, User, UserRole
from app.schemas import (
    DriverLogin,
    DriverRegister,
    DriverResponse,
    LocationUpdate,
    MessageResponse,
    OrderResponse,
    TokenResponse,
)
from app.services.orders import order_to_response
from app.websocket import manager

router = APIRouter(prefix="/api/driver", tags=["driver"])


def _get_driver(db: Session, user: User) -> Driver:
    driver = db.query(Driver).filter(Driver.user_id == user.id).first()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
    return driver


# POST /api/driver/register
@router.post("/register", response_model=TokenResponse)
def register(payload: DriverRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=UserRole.driver,
    )
    db.add(user)
    db.flush()

    driver = Driver(user_id=user.id, name=payload.name, phone=payload.phone)
    db.add(driver)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token)


# POST /api/driver/login
@router.post("/login", response_model=TokenResponse)
def login(payload: DriverLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.role != UserRole.driver:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver access required")

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token)


# GET /api/driver/me
@router.get("/me", response_model=DriverResponse)
def get_me(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    return _get_driver(db, current_user)


# GET /api/driver/orders/pending  — list unclaimed orders
@router.get("/orders/pending", response_model=list[OrderResponse])
def list_pending_orders(db: Session = Depends(get_db), _: User = Depends(require_driver)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.driver_id.is_(None), Order.status != OrderStatus.delivered)
        .order_by(Order.id.desc())
        .all()
    )
    return [order_to_response(order) for order in orders]


# GET /api/driver/orders/active  — driver's current active order
@router.get("/orders/active", response_model=OrderResponse | None)
def get_active_order(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.driver_id == driver.id, Order.status != OrderStatus.delivered)
        .first()
    )
    if order is None:
        return None
    return order_to_response(order)


# POST /api/driver/orders/{order_id}/claim  — claim an unclaimed order
@router.post("/orders/{order_id}/claim", response_model=OrderResponse)
def claim_order(
    order_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)

    # Can't claim if already has an active order
    active = (
        db.query(Order)
        .filter(Order.driver_id == driver.id, Order.status != OrderStatus.delivered)
        .first()
    )
    if active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have an active order")

    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.driver_id.is_(None))
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or already claimed")

    order.driver_id = driver.id
    order.status = OrderStatus.in_transit
    db.commit()
    db.refresh(order)

    return order_to_response(order)


# POST /api/driver/orders/{order_id}/location  — update GPS + broadcast
async def _broadcast_location(order: Order) -> None:
    await manager.broadcast(
        order.tracking_code,
        {
            "current_lat": order.current_lat,
            "current_lng": order.current_lng,
            "status": order.status.value,
            "store_lat": settings.store_lat,
            "store_lng": settings.store_lng,
            "store_name": settings.store_name,
        },
    )


@router.post("/orders/{order_id}/location", response_model=OrderResponse)
async def update_location(
    order_id: int,
    payload: LocationUpdate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.driver_id == driver.id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.current_lat = payload.current_lat
    order.current_lng = payload.current_lng
    if payload.status is not None:
        order.status = payload.status

    db.commit()
    db.refresh(order)

    await _broadcast_location(order)
    return order_to_response(order)


# PATCH /api/driver/orders/{order_id}/delivered  — mark as delivered
@router.patch("/orders/{order_id}/delivered", response_model=OrderResponse)
async def mark_delivered(
    order_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.driver_id == driver.id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.delivered
    order.driver_id = None

    # Grant spin credits when an order is delivered (driver flow). This is
    # the path that real orders take in production — without it, the user
    # never earns spin credits even after the order is fully delivered.
    try:
        from app.services.spin import grant_credits_for_delivered_order
        grant_credits_for_delivered_order(db, order)
    except Exception as _e:
        import logging
        logging.getLogger(__name__).warning("grant_credits_for_delivered_order failed: %s", _e)

    db.commit()
    db.refresh(order)

    await _broadcast_location(order)
    return order_to_response(order)
