import secrets
import string
import threading

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.email import send_order_notification_to_admins
from app.models import AdminEmail, Order, OrderItem, OrderStatus, Product, User
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse
from app.services.geocoding import geocode_address


def generate_tracking_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "PHN-" + "".join(secrets.choice(alphabet) for _ in range(6))
        exists = db.query(Order).filter(Order.tracking_code == code).first()
        if not exists:
            return code


async def create_order(db: Session, user: User, payload: OrderCreate) -> Order:
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
    )
