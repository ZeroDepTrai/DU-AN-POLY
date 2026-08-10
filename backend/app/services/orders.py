import secrets
import string
import threading

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.email import send_order_notification_to_admins
from app.models import (
    AdminEmail,
    Coupon,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    User,
)
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse


# ── Helpers ──────────────────────────────────────────────────────────────

def generate_tracking_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "PHN-" + "".join(secrets.choice(alphabet) for _ in range(6))
        exists = db.query(Order).filter(Order.tracking_code == code).first()
        if not exists:
            return code


def _order_subtotal(order: Order) -> float:
    """Sum line items (unit_price * qty)."""
    return float(sum(i.unit_price * i.quantity for i in order.items))


def _apply_coupon(db: Session, order: Order, code: str | None) -> tuple[Coupon | None, float]:
    """Validate and attach a coupon to an order. Returns (coupon, discount)."""
    if not code:
        return None, 0.0

    coupon = db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()
    if coupon is None or not coupon.active:
        return None, 0.0

    subtotal = _order_subtotal(order)
    if subtotal < coupon.min_order_total:
        return None, 0.0

    if coupon.discount_type == "percent":
        discount = subtotal * (coupon.discount_value / 100.0)
    else:
        discount = float(coupon.discount_value)

    if coupon.max_discount is not None:
        discount = min(discount, coupon.max_discount)
    discount = min(discount, subtotal)
    discount = max(discount, 0.0)

    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return None, 0.0

    coupon.usage_count += 1
    order.coupon_id = coupon.id
    return coupon, discount


# ── Order creation ───────────────────────────────────────────────────────

async def create_order(db: Session, user: User, payload: OrderCreate) -> Order:
    from app.services.geocoding import geocode_address

    delivery_lat, delivery_lng, _ = await geocode_address(
        payload.delivery_address,
        fallback_lat=settings.store_lat,
        fallback_lng=settings.store_lng,
    )

    order = Order(
        user_id=user.id,
        status=OrderStatus.processing,
        delivery_address=payload.delivery_address,
        delivery_phone=payload.delivery_phone,
        delivery_lat=delivery_lat,
        delivery_lng=delivery_lng,
        current_lat=settings.store_lat,
        current_lng=settings.store_lng,
        tracking_code=generate_tracking_code(db),
    )
    db.add(order)
    db.flush()

    for item in payload.items:
        product = db.get(Product, item.product_id)
        if product is None:
            raise ValueError(f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
            )
        )

    db.flush()  # make sure items are visible when computing subtotal

    coupon, _discount = _apply_coupon(db, order, payload.coupon_code)
    db.commit()

    loaded = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order.id)
        .first()
    )
    order = loaded or order

    _notify_admins(db, order, user.name)

    return order


def _notify_admins(db: Session, order: Order, customer_name: str) -> None:
    admin_emails = db.query(AdminEmail).all()
    if not admin_emails:
        return

    items_summary = "".join(
        f"<tr><td style='padding:8px 0; border-bottom:1px solid #e5e7eb;'>{item.product.name}</td>"
        f"<td style='padding:8px 0; border-bottom:1px solid #e5e7eb; text-align:center;'>{item.quantity}</td>"
        f"<td style='padding:8px 0; border-bottom:1px solid #e5e7eb; text-align:right;'>{item.unit_price:,.0f} VND</td></tr>"
        for item in order.items
    )
    items_html = f"<table style='width:100%; border-collapse:collapse;'><tr style='color:#6b7280; font-size:12px;'><th style='text-align:left; padding:4px 0;'>Sản phẩm</th><th style='text-align:center;'>SL</th><th style='text-align:right;'>Giá</th></tr>{items_summary}</table>"

    threading.Thread(
        target=send_order_notification_to_admins,
        args=(
            [e.email for e in admin_emails],
            order.id,
            order.tracking_code,
            customer_name,
            order.delivery_address,
            order.delivery_phone,
            items_html,
        ),
    ).start()


# Hardcoded correct store location — used instead of settings.store_lat/lng
# so that Railway env-var overrides cannot put the shop in the wrong city.
# 193 Đỗ Văn Thi, phường Trấn Biên, TP. Biên Hòa, Đồng Nai
CORRECT_STORE_LAT = 10.9421
CORRECT_STORE_LNG = 106.8625
CORRECT_STORE_NAME = "CellZone - 193 Đỗ Văn Thi"


def order_to_response(order: Order) -> OrderResponse:
    coupon_code = None
    discount = 0.0
    if getattr(order, "coupon_id", None) is not None:
        coupon = order.coupon or None
        # If relationship isn't loaded, fetch directly.
        from app.models import Coupon as CouponModel

        if coupon is None:
            coupon = order_coupon_lookup(order)
        if coupon is not None:
            coupon_code = coupon.code

    subtotal = _order_subtotal(order)
    if coupon_code:
        # recompute for display
        from app.models import Coupon as CouponModel

        coupon = order_coupon_lookup(order)
        if coupon is not None:
            if coupon.discount_type == "percent":
                discount = subtotal * (coupon.discount_value / 100.0)
            else:
                discount = float(coupon.discount_value)
            if coupon.max_discount is not None:
                discount = min(discount, coupon.max_discount)
            discount = max(0.0, min(discount, subtotal))

    return OrderResponse(
        id=order.id,
        tracking_code=order.tracking_code,
        status=order.status,
        delivery_address=order.delivery_address,
        delivery_phone=order.delivery_phone,
        delivery_lat=order.delivery_lat,
        delivery_lng=order.delivery_lng,
        current_lat=order.current_lat,
        current_lng=order.current_lng,
        store_lat=CORRECT_STORE_LAT,
        store_lng=CORRECT_STORE_LNG,
        store_name=CORRECT_STORE_NAME,
        items=[
            OrderItemResponse(
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in order.items
        ],
        coupon_code=coupon_code,
        discount=discount,
    )


def backfill_stale_store_coords(db: Session) -> int:
    """One-shot DB migration: rewrite any order whose current_lat/lng match
    the old wrong HCM City defaults over to the correct Biên Hòa store coords.
    Returns the number of rows updated."""
    # Old wrong coords (HCM City ghost location)
    WRONG_LAT = 10.762622
    WRONG_LNG = 106.660172

    rows = (
        db.query(Order)
        .filter(
            (Order.current_lat.between(WRONG_LAT - 0.001, WRONG_LAT + 0.001))
            & (Order.current_lng.between(WRONG_LNG - 0.001, WRONG_LNG + 0.001))
        )
        .all()
    )
    count = 0
    for o in rows:
        o.current_lat = CORRECT_STORE_LAT
        o.current_lng = CORRECT_STORE_LNG
        count += 1
    if count:
        db.commit()
    return count


def order_coupon_lookup(order: Order):
    from app.models import Coupon as CouponModel

    if getattr(order, "coupon_id", None) is None:
        return None
    from app.database import SessionLocal

    s = SessionLocal()
    try:
        return s.get(CouponModel, order.coupon_id)
    finally:
        s.close()
