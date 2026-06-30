import secrets
import string

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models import Order, OrderItem, OrderStatus, Product, User
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
    return loaded or order


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
