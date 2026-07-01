import axios from "axios";
import type { BlogPost, BlogPostListItem, Order, Product, User } from "../types";

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
  get: (id: number) => api.get<Product>(`/api/products/${id}`),
};

export const ordersApi = {
  create: (data: {
    delivery_address: string;
    delivery_phone: string;
    items: { product_id: number; quantity: number }[];
  }) => api.post<Order>("/api/orders", data),
  track: (trackingCode: string) => api.get<Order>(`/api/orders/track/${trackingCode}`),
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
  deleteProduct: (id: number) => api.delete(`/api/admin/products/${id}`),
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

export const blogApi = {
  list: () => api.get<BlogPostListItem[]>("/api/blog"),
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
