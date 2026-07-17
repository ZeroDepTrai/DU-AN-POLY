from pydantic import BaseModel, EmailStr, Field

from app.models import OrderStatus, UserRole


class SendCodeRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    code: str = Field(min_length=6, max_length=6)


class UserRegister(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: UserRole

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    tags: str
    image_url: str
    description: str = ""
    specifications: str = ""
    stock: int
    is_active: bool = True
    media: list["ProductMediaItem"] = []
    avg_rating: float = 0
    rating_count: int = 0
    like_count: int = 0
    my_rating: int | None = None
    liked: bool = False

    model_config = {"from_attributes": True}


class ProductAdminSummary(BaseModel):
    """Lightweight Product shape used by admin tables (lists).

    Omits `description` and `specifications` (large TEXT columns the
    admin table doesn't display), which dramatically shrinks the
    response payload and lets the admin list endpoint finish in one
    fast SELECT instead of streaming megabytes per product.
    """

    id: int
    name: str
    price: float
    tags: str
    image_url: str
    stock: int
    is_active: bool = True
    media: list["ProductMediaItem"] = []
    avg_rating: float = 0
    rating_count: int = 0
    like_count: int = 0

    model_config = {"from_attributes": True}


class ProductMediaItem(BaseModel):
    id: int
    url: str
    media_type: str
    position: int
    is_cover: bool

    model_config = {"from_attributes": True}


class ProductMediaCreate(BaseModel):
    url: str
    media_type: str = "image"
    is_cover: bool = False
    position: int = 0


class ProductMediaUpdate(BaseModel):
    is_cover: bool | None = None
    position: int | None = None


# Coupons


class CouponCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    description: str = ""
    discount_type: str = Field(default="percent", pattern="^(percent|fixed)$")
    discount_value: float = Field(gt=0)
    min_order_total: float = 0
    max_discount: float | None = None
    usage_limit: int | None = None
    starts_at: str = ""
    expires_at: str = ""


class CouponUpdate(BaseModel):
    description: str | None = None
    discount_type: str | None = None
    discount_value: float | None = None
    min_order_total: float | None = None
    max_discount: float | None = None
    usage_limit: int | None = None
    starts_at: str | None = None
    expires_at: str | None = None
    active: bool | None = None


class CouponResponse(BaseModel):
    id: int
    code: str
    description: str
    discount_type: str
    discount_value: float
    min_order_total: float
    max_discount: float | None
    usage_limit: int | None
    usage_count: int
    starts_at: str
    expires_at: str
    active: bool

    model_config = {"from_attributes": True}


class CouponValidateRequest(BaseModel):
    code: str
    order_total: float = 0


class CouponValidateResponse(BaseModel):
    coupon: CouponResponse
    discount: float
    new_total: float


class WheelPrize(BaseModel):
    """One slot on the wheel.

    ``reward_type`` is inferred when omitted:
      - "free_product" if ``product_id`` is set
      - "coupon"      if ``coupon_discount_type`` or ``coupon_id`` is set
      - "consolation" otherwise

    For one-off coupons, set ``coupon_discount_type`` + ``coupon_discount_value``
    so the backend can mint a *unique* code on every spin.
    """

    name: str
    image: str = ""
    weight: float = 0
    jackpot: bool = False
    coupon_id: int | None = None
    product_id: int | None = None
    icon: str = ""
    reward_type: str | None = None
    coupon_discount_type: str | None = None  # "percent" | "fixed"
    coupon_discount_value: float | None = None
    product_name: str | None = None
    product_image_url: str | None = None


class WheelConfigResponse(BaseModel):
    id: int
    title: str
    background_url: str
    prizes: list[WheelPrize]
    spend_per_spin_vnd: int
    user_credits: int
    lifetime_spend_vnd: int

    model_config = {"from_attributes": True}


class WheelConfigUpdate(BaseModel):
    title: str | None = None
    background_url: str | None = None
    prizes: list[WheelPrize] | None = None
    spend_per_spin_vnd: int | None = None


class SpinHistoryItem(BaseModel):
    id: int
    prize_label: str
    prize_kind: str
    coupon_code: str | None = None
    coupon_discount_type: str | None = None
    coupon_discount_value: float | None = None
    product_id: int | None = None
    product_name: str | None = None
    product_image_url: str | None = None
    image: str | None = None
    reward_type: str | None = None
    discount_value: float | None = None
    created_at: str

    model_config = {"from_attributes": True}


# Categories / Brands / Products


class PaginatedProductsResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int
    limit: int
    category: str
    brand: str


class CategoryBrandItem(BaseModel):
    name: str
    count: int


class CategoryResponse(BaseModel):
    phone: list[str]
    accessory: list[str]


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    delivery_address: str = Field(min_length=5)
    delivery_phone: str = Field(min_length=5, max_length=50)
    items: list[OrderItemCreate] = Field(min_length=1)
    payment_method: str | None = Field(default="cod", pattern="^(cod|transfer|card)$")
    coupon_code: str | None = None


class ShippingUpdate(BaseModel):
    delivery_address: str | None = Field(default=None, min_length=5)
    delivery_phone: str | None = Field(default=None, min_length=5, max_length=50)


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float


class OrderResponse(BaseModel):
    id: int
    tracking_code: str
    status: OrderStatus
    delivery_address: str
    delivery_phone: str
    delivery_lat: float
    delivery_lng: float
    current_lat: float
    current_lng: float
    store_lat: float
    store_lng: float
    store_name: str
    items: list[OrderItemResponse]
    coupon_code: str | None = None
    discount: float = 0


class OrderSummary(BaseModel):
    id: int
    tracking_code: str
    status: OrderStatus
    delivery_address: str
    created_at: str | None = None


class LocationUpdate(BaseModel):
    current_lat: float
    current_lng: float
    status: OrderStatus | None = None


class OrderUpdate(BaseModel):
    delivery_address: str | None = None
    delivery_phone: str | None = None
    status: OrderStatus | None = None


class BlogPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    image: str | None = None


class BlogPostResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    image_url: str
    author_name: str
    created_at: str
    tags: str = ""

    model_config = {"from_attributes": True}


class BlogPostListResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str = ""
    image_url: str
    created_at: str
    tags: str = ""

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str


class AdminEmailResponse(BaseModel):
    id: int
    email: str
    created_at: str

    model_config = {"from_attributes": True}


class AdminEmailCreate(BaseModel):
    email: EmailStr


# Driver schemas


class DriverLogin(BaseModel):
    email: EmailStr
    password: str


class DriverRegister(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=6, max_length=128)


class DriverResponse(BaseModel):
    id: int
    name: str
    phone: str
    is_active: bool

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────────────────────────────────────
# Aurora: rating + like (favorites)
# ──────────────────────────────────────────────────────────────────────────────


class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    review: str = Field(default="", max_length=2000)


class RatingResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str
    stars: int
    review: str
    created_at: str

    model_config = {"from_attributes": True}


class RatingSummary(BaseModel):
    avg: float
    count: int
    my_rating: int | None = None


class LikeStatus(BaseModel):
    liked: bool
    count: int


class PaginatedRatingsResponse(BaseModel):
    items: list[RatingResponse]
    total: int
    page: int
    limit: int
