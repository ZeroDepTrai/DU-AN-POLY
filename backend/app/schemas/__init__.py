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
    description: str
    stock: int

    model_config = {"from_attributes": True}


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


# --- Driver schemas ---

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
