import axios from "axios";
import type { BlogPost, BlogPostListItem, Order, Product, User } from "../types";

export interface ProductMediaItem {
  id: number;
  url: string;
  media_type: "image" | "video";
  position: number;
  is_cover: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_total: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string;
  expires_at: string;
  active: boolean;
}

export interface CouponValidateResult {
  coupon: Coupon;
  discount: number;
  new_total: number;
}

export interface WheelPrize {
  name: string;
  image?: string;
  weight: number;
  jackpot?: boolean;
  coupon_id?: number | null;
  product_id?: number | null;
  icon?: string;
  reward_type?: string | null;
  coupon_discount_type?: string | null;
  coupon_discount_value?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
}

export interface WheelConfig {
  id: number;
  title: string;
  background_url: string;
  prizes: WheelPrize[];
  spend_per_spin_vnd: number;
  user_credits: number;
  lifetime_spend_vnd: number;
}

export interface SpinHistoryItem {
  id: number;
  prize_label: string;
  prize_kind: string;
  coupon_code: string | null;
  coupon_discount_type?: string | null;
  coupon_discount_value?: number | null;
  product_id?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
  image?: string | null;
  reward_type?: string | null;
  discount_value?: number | null;
  created_at: string;
}

export interface PlaySpinResult {
  prize: WheelPrize & { coupon_code?: string | null; free_order_id?: number };
  spin_id: number;
  remaining_credits: number;
  coupon_code: string | null;
  discount_value: number | null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendVerificationCode: (data: { email: string; name: string; password: string }) =>
    api.post<{ message: string }>("/api/auth/register/send-code", data),
  verifyCode: (data: { email: string; name: string; password: string; code: string }) =>
    api.post<{ access_token: string }>("/api/auth/register/verify", data),
  register: (data: { email: string; name: string; password: string }) =>
    api.post<{ access_token: string }>("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>("/api/auth/login", data),
  me: () => api.get<User>("/api/auth/me"),
};

export const productsApi = {
  list: (tag?: string) =>
    api.get<Product[]>("/api/products", { params: tag ? { tag } : undefined }),
  search: (params?: { tag?: string; brand?: string; sort?: string; page?: number; limit?: number; search?: string }) =>
    api.get<{ products: Product[]; total: number; page: number; limit: number; category: string; brand: string }>(
      "/api/products/search", { params }
    ),
  get: (id: number) => api.get<Product>(`/api/products/${id}`),
  getRelated: (id: number, limit = 4) =>
    api.get<Product[]>(`/api/products/${id}/related`, { params: { limit } }),
  listMedia: (id: number) =>
    api.get<ProductMediaItem[]>(`/api/products/${id}/media`),
};

export const categoriesApi = {
  get: () => api.get<{ phone: string[]; accessory: string[] }>("/api/categories"),
};

export const ordersApi = {
  create: (data: {
    delivery_address: string;
    delivery_phone: string;
    items: { product_id: number; quantity: number }[];
    payment_method?: string;
    coupon_code?: string | null;
  }) => api.post<Order>("/api/orders", data),
  track: (trackingCode: string) => api.get<Order>(`/api/orders/track/${trackingCode}`),
  updateShipping: (
    orderId: number,
    data: { delivery_address?: string; delivery_phone?: string }
  ) => api.patch<Order>(`/api/orders/${orderId}/shipping`, data),
  list: () => api.get<Order[]>("/api/orders"),
};

export const adminApi = {
  listProducts: () => api.get<Product[]>("/api/admin/products"),
  createProduct: (formData: FormData) =>
    api.post<Product>("/api/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  quickAddProduct: (formData: FormData) =>
    api.post<Product>("/api/admin/products/quick", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id: number, formData: FormData) =>
    api.put<Product>(`/api/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id: number) =>
    api.delete<{ ok: boolean; soft_deleted: boolean; order_items: number; message?: string }>(
      `/api/admin/products/${id}`,
    ),
  softDeleteProduct: (id: number) =>
    api.post<{ ok: boolean; already_hidden: boolean; order_items: number }>(
      `/api/admin/products/${id}/soft-delete`,
    ),
  restoreProduct: (id: number) =>
    api.post<Product>(`/api/admin/products/${id}/restore`),
  importDocx: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ html: string; cover_image_url: string }>("/api/admin/products/import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadMedia: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ url: string }>("/api/admin/upload/media", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  // Product gallery (per-product media CRUD)
  listProductMedia: (productId: number) =>
    api.get<ProductMediaItem[]>(`/api/products/${productId}/media`),
  uploadProductMedia: (productId: number, file: File, isCover = false) => {
    const fd = new FormData();
    fd.append("file", file);
    if (isCover) fd.append("is_cover", "true");
    return api.post<ProductMediaItem>(
      `/api/admin/products/${productId}/media`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  updateMedia: (mediaId: number, payload: Partial<{ is_cover: boolean; position: number }>) =>
    api.put<ProductMediaItem>(`/api/admin/media/${mediaId}`, payload),
  deleteMedia: (mediaId: number) => api.delete(`/api/admin/media/${mediaId}`),

  listOrders: () => api.get<Order[]>("/api/admin/orders"),
  updateLocation: (
    id: number,
    data: { current_lat: number; current_lng: number; status?: string }
  ) => api.patch<Order>(`/api/admin/orders/${id}/location`, data),
  updateOrder: (
    id: number,
    data: { delivery_address: string; delivery_phone: string; status: string }
  ) => api.patch<Order>(`/api/admin/orders/${id}`, data),
  listAdminEmails: () => api.get<{ id: number; email: string; created_at: string }[]>("/api/admin/admin-emails"),
  addAdminEmail: (email: string) =>
    api.post<{ id: number; email: string; created_at: string }>("/api/admin/admin-emails", { email }),
  deleteAdminEmail: (id: number) => api.delete(`/api/admin/admin-emails/${id}`),
};

// Coupons

export const couponsApi = {
  validate: (code: string, order_total: number) =>
    api.post<CouponValidateResult>("/api/coupons/validate", { code, order_total }),
};

export const adminCouponsApi = {
  list: () => api.get<Coupon[]>("/api/admin/coupons"),
  create: (payload: {
    code: string;
    description?: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    min_order_total?: number;
    max_discount?: number | null;
    usage_limit?: number | null;
    starts_at?: string;
    expires_at?: string;
  }) => api.post<Coupon>("/api/admin/coupons", payload),
  update: (id: number, payload: Partial<{
    description: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    min_order_total: number;
    max_discount: number | null;
    usage_limit: number | null;
    starts_at: string;
    expires_at: string;
    active: boolean;
  }>) => api.put<Coupon>(`/api/admin/coupons/${id}`, payload),
  delete: (id: number) => api.delete(`/api/admin/coupons/${id}`),
};

// Spin / Wheel

export const spinApi = {
  config: () => api.get<WheelConfig>("/api/spin/config"),
  play: () => api.post<PlaySpinResult>("/api/spin/play"),
  history: () => api.get<SpinHistoryItem[]>("/api/spin/history"),
};

export const adminSpinApi = {
  get: () => api.get<WheelConfig>("/api/admin/wheel"),
  update: (payload: Partial<{
    title: string;
    background_url: string;
    prizes: WheelPrize[];
    spend_per_spin_vnd: number;
  }>) => api.put<WheelConfig>("/api/admin/wheel", payload),
};

export const blogApi = {
  list: (tags?: string) =>
    api.get<BlogPostListItem[]>("/api/blog", { params: tags ? { tag: tags } : undefined }),
  get: (slug: string) => api.get<BlogPost>(`/api/blog/${slug}`),
};

export const adminBlogApi = {
  list: () => api.get<BlogPost[]>("/api/blog"),
  create: (formData: FormData) =>
    api.post<BlogPost>("/api/admin/blog", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, formData: FormData) =>
    api.put<BlogPost>(`/api/admin/blog/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/api/admin/blog/${id}`),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post<{ url: string }>("/api/admin/blog/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  importDocx: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ html: string; cover_image_url: string; title: string }>("/api/admin/blog/import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
