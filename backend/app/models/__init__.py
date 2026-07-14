import enum
from datetime import datetime, timedelta, timezone

from typing import Optional

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    driver = "driver"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    in_transit = "in_transit"
    delivered = "delivered"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.customer, nullable=False)

    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    spins: Mapped[list["Spin"]] = relationship(back_populates="user")


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates=None)
    orders: Mapped[list["Order"]] = relationship(back_populates="driver")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    tags: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    specifications: Mapped[str] = mapped_column(Text, default="", nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"), nullable=True, index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    delivery_lat: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_lng: Mapped[float] = mapped_column(Float, nullable=False)
    current_lat: Mapped[float] = mapped_column(Float, nullable=False)
    current_lng: Mapped[float] = mapped_column(Float, nullable=False)
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="orders")
    driver: Mapped["Driver"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    coupon_id: Mapped[int | None] = mapped_column(ForeignKey("coupons.id"), nullable=True, index=True)
    coupon: Mapped[Optional["Coupon"]] = relationship()


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used: Mapped[bool] = mapped_column(default=False, nullable=False)


class AdminEmail(Base):
    __tablename__ = "admin_emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), nullable=False)
    tags: Mapped[str] = mapped_column(String(500), default="", nullable=False)

    author: Mapped["User"] = relationship(back_populates=None)


# ────────────────────────────────────────────────────────────────────────────
# New modules: ProductMedia (gallery), Coupon, Spin / WheelConfig
# ────────────────────────────────────────────────────────────────────────────

class ProductMedia(Base):
    """Gallery item (image or video) attached to a Product.

    One row per uploaded asset. Sort order is controlled by `position`.
    `is_cover=True` means use this as the product thumbnail.
    """

    __tablename__ = "product_media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    media_type: Mapped[str] = mapped_column(String(16), default="image", nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    product: Mapped["Product"] = relationship()


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    # discount_type: "percent" (1..100) or "fixed" (VND)
    discount_type: Mapped[str] = mapped_column(String(16), default="percent", nullable=False)
    discount_value: Mapped[float] = mapped_column(Float, nullable=False)
    min_order_total: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    max_discount: Mapped[float | None] = mapped_column(Float, nullable=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    starts_at: Mapped[str] = mapped_column(String(30), default="", nullable=False)
    expires_at: Mapped[str] = mapped_column(String(30), default="", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Spin(Base):
    """Audit row for each wheel spin.

    After a successful spin the row also records the resolved prize:
      * if it was a coupon, ``coupon_code`` holds the *unique* code the user
        keeps (we mint a fresh Coupon row per spin).
      * if it was a free product, ``product_id`` points at the prize product
        (an Order + OrderItem are created with unit_price=0 and status=delivered).
    """

    __tablename__ = "spins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    prize_label: Mapped[str] = mapped_column(String(120), nullable=False)
    prize_kind: Mapped[str] = mapped_column(String(32), default="consolation", nullable=False)
    coupon_id: Mapped[int | None] = mapped_column(ForeignKey("coupons.id"), nullable=True, index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    coupon_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="spins")


class WheelConfig(Base):
    """Single-row wheel configuration. id=1 is the active row.

    The frontend reads ``prizes_json`` (a JSON array) and applies the weights
    from it. ``spend_per_spin_vnd`` controls how many VND of delivered orders
    grant 1 credit (default 3,000,000).
    """

    __tablename__ = "wheel_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), default="CellZone · Spin & Win", nullable=False)
    background_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    prizes_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    spend_per_spin_vnd: Mapped[int] = mapped_column(Integer, default=3_000_000, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))


class SpinCredit(Base):
    """Per-user ledger of unused spins.

    We grant one credit per ``spend_per_spin_vnd`` VND of cumulative delivered
    order history (default 3,000,000 VND). Lifecycle is driven by the
    admin/driver order-delivery action; each spin consumes one credit.
    """

    __tablename__ = "spin_credits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reason: Mapped[str] = mapped_column(String(120), default="delivered_order", nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now(timezone.utc))
