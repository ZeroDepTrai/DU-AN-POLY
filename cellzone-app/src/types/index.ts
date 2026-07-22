// User types
export type UserRole = "admin" | "customer_support";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product types
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  tags?: string;
  description?: string;
  specifications?: string;
  image_url: string;
  created_at?: string;
}

// Order types
export type OrderStatus = "pending" | "processing" | "shipped" | "in_transit" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  tracking_code: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  delivery_address: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  current_lat?: number;
  current_lng?: number;
  created_at?: string;
}

// Blog types
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  tags?: string;
  image_url?: string;
  author_name?: string;
  created_at?: string;
}

// Coupon types
export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_total: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at?: string;
}

// Media types
export interface ProductMediaItem {
  id: number;
  product_id: number;
  url: string;
  media_type: "image" | "video";
  is_cover: boolean;
  created_at?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_type: "customer" | "agent";
  sender_name: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  customer_name: string;
  customer_email: string;
  status: "waiting" | "active" | "closed";
  assigned_to?: number;
  assigned_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

// Analytics types
export interface AnalyticsStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  active_users: number;
  conversion_rate: number;
  avg_order_value: number;
  chat_response_time: number;
  customer_satisfaction: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Spin wheel types
export interface SpinPrize {
  id: number;
  name: string;
  probability: number;
  active: boolean;
}

export interface SpinResult {
  id: number;
  customer_name: string;
  prize_name: string;
  won_at: string;
}

// Rating types
export interface Rating {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  customer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// Settings types
export interface NotificationEmail {
  id: number;
  email: string;
  created_at: string;
}
