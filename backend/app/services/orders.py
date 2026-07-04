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
    SpinCredit,
    User,
    WheelConfig,
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


def _grant_spin_credits(db: Session, order: Order) -> int:
    """When an order transitions to 'delivered', give the buyer 1 spin per
    `spend_per_spin_vnd` VND of *delivered* order history (so each delivery adds
    a credit; the total then accumulates across orders).
    """
    # Only reward on FIRST time an order becomes 'delivered'.
    delivered_total = (
        db.query(Order)
        .filter(Order.user_id == order.user_id, Order.status == OrderStatus.delivered)
        .with_entities(Order)
        .all()
    )
    lifetime_spend = 0.0
    for o in delivered_total:
        lifetime_spend += _order_subtotal(o)
    # Lifetime spend including the one we just transitioned — even though the
    # status might not have flushed yet. Use the freshly delivered order once.
    if order not in delivered_total:
        lifetime_spend += _order_subtotal(order)

    cfg = db.get(WheelConfig, 1) or db.query(WheelConfig).first()
    threshold = cfg.spend_per_spin_vnd if cfg else 3_000_000
    if threshold <= 0:
        threshold = 3_000_000

    existing_credits = (
        db.query(SpinCredit)
        .filter(SpinCredit.user_id == order.user_id)
        .all()
    )
    already_granted_total = sum(c.amount for c in existing_credits if c.reason == "delivered_order")

    new_total_credits = int(lifetime_spend // threshold)
    diff = new_total_credits - already_granted_total
    if diff > 0:
        db.add(
            SpinCredit(
                user_id=order.user_id,
                order_id=order.id,
                amount=diff,
                reason="delivered_order",
            )
        )
    return diff


# ── Order creation ───────────────────────────────────────────────────────

async def create_order(db: Session, user: User, payload: OrderCreate) -> Order:
    from app.services.geocoding import geocode_address

    delivery_lat, delivery_lng = await geocode_address(payload.delivery_address)

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
        store_lat=settings.store_lat,
        store_lng=settings.store_lng,
        store_name=settings.store_name,
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
