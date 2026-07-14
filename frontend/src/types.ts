export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "in_transit"
  | "delivered";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  tags: string;
  image_url: string;
  description: string;
  specifications: string;
  stock: number;
  is_active?: boolean;
  media?: ProductMediaItem[];
}

export interface ProductMediaItem {
  id: number;
  url: string;
  media_type: "image" | "video";
  position: number;
  is_cover: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemResponse {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  tracking_code: string;
  status: OrderStatus;
  delivery_address: string;
  delivery_phone: string;
  delivery_lat: number;
  delivery_lng: number;
  current_lat: number;
  current_lng: number;
  store_lat: number;
  store_lng: number;
  store_name: string;
  items: OrderItemResponse[];
  coupon_code?: string | null;
  discount?: number;
}

export interface TrackingUpdate {
  current_lat: number;
  current_lng: number;
  status: OrderStatus;
  store_lat: number;
  store_lng: number;
  store_name: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  author_name: string;
  created_at: string;
  tags: string;
}

export interface BlogPostListItem {
  id: number;
  title: string;
  slug: string;
  image_url: string;
  created_at: string;
  tags: string;
}
