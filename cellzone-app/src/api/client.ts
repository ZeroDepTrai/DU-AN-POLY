import type {
  User,
  Product,
  Order,
  BlogPost,
  Coupon,
  ProductMediaItem,
  Conversation,
  ChatMessage,
  AnalyticsStats,
  SpinPrize,
  SpinResult,
  Rating,
  NotificationEmail,
} from "../types";

// In a normal browser development session, talk directly to the local backend.
// Inside Tauri, always use the Rust proxy: it avoids WebView2 networking issues
// and keeps HTTP, assets, and WebSocket traffic on stable local origins.
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const DEFAULT_HTTP_ORIGIN = isTauri
  ? "http://127.0.0.1:9876"
  : "http://localhost:8000";
const DEFAULT_WS_ORIGIN = isTauri
  ? "ws://127.0.0.1:9877"
  : DEFAULT_HTTP_ORIGIN.replace(/^http/, "ws");

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || `${DEFAULT_HTTP_ORIGIN}/api`;
const ASSET_BASE =
  (import.meta.env.VITE_ASSET_URL as string) ||
  (isTauri ? DEFAULT_HTTP_ORIGIN : API_BASE.replace(/\/api$/, ""));
const WS_BASE = (import.meta.env.VITE_WS_URL as string) || DEFAULT_WS_ORIGIN;

export function getApiBase(): string {
  return API_BASE;
}

export function getWsBase(): string {
  return WS_BASE.replace(/^http/, "ws");
}

export function getAssetBase(): string {
  return ASSET_BASE;
}

/**
 * Normalize an image URL so it always goes through the local asset origin.
 * - If the URL is already absolute (starts with http/https), leave it.
 * - If it's a relative path like "/uploads/abc.jpg", prepend the asset base.
 * - If it's a bare filename or relative path without leading "/", also prepend.
 */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `http:${trimmed}`;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${ASSET_BASE}${path}`;
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("cellzone-auth");
    if (!raw) return null;
    // Zustand persist wraps state in { state: { user, token, ... }, version, name }.
    // Support both raw token string (fallback) and persisted store shape.
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return (parsed.state?.token as string | null) ?? (parsed.token as string | null) ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Yêu cầu hết thời gian chờ (10 giây). Vui lòng kiểm tra kết nối mạng.");
    }
    throw err;
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),
};

// Products API
export const productsApi = {
  list: () => request<Product[]>("/products"),

  get: (id: number) => request<Product>(`/products/${id}`),

  // Admin endpoints
  listAdmin: () => request<Product[]>("/admin/products"),

  quickAdd: (formData: FormData) =>
    fetch(`${getApiBase()}/admin/products/quick`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json()),

  create: (formData: FormData) =>
    fetch(`${getApiBase()}/admin/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json()),

  update: (id: number, formData: FormData) =>
    fetch(`${getApiBase()}/admin/products/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json()),

  softDelete: (id: number) =>
    request<{ ok: boolean }>(`/admin/products/${id}/soft-delete`, { method: "POST" }),

  restore: (id: number) =>
    request<Product>(`/admin/products/${id}/restore`, { method: "POST" }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/admin/products/${id}`, { method: "DELETE" }),
};

// Orders API
export const ordersApi = {
  list: () => request<Order[]>("/admin/orders"),

  get: (id: number) => request<Order>(`/orders/${id}`),

  updateLocation: (id: number, data: {
    current_lat: number;
    current_lng: number;
    status: string;
  }) =>
    request<Order>(`/admin/orders/${id}/location`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Blog API
export const blogApi = {
  list: () => request<BlogPost[]>("/blog"),

  get: (id: number) => request<BlogPost>(`/blog/${id}`),

  // Admin endpoints
  listAdmin: () => request<BlogPost[]>("/admin/blog"),

  create: (formData: FormData) =>
    fetch(`${getApiBase()}/admin/blog`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json()),

  update: (id: number, formData: FormData) =>
    fetch(`${getApiBase()}/admin/blog/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json()),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/admin/blog/${id}`, { method: "DELETE" }),
};

// Coupons API
export const couponsApi = {
  list: () => request<Coupon[]>("/admin/coupons"),

  create: (data: Partial<Coupon>) =>
    request<Coupon>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Coupon>) =>
    request<Coupon>(`/admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/admin/coupons/${id}`, { method: "DELETE" }),
};

// Media API
export const mediaApi = {
  list: (productId: number) =>
    request<ProductMediaItem[]>(`/admin/products/${productId}/media`),

  upload: (productId: number, file: File, isCover = false) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_cover", String(isCover));
    return fetch(`${getApiBase()}/admin/products/${productId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    }).then((r) => r.json());
  },

  setCover: (mediaId: number) =>
    request<{ ok: boolean }>(`/admin/media/${mediaId}/cover`, { method: "PUT" }),

  delete: (mediaId: number) =>
    request<{ ok: boolean }>(`/admin/media/${mediaId}`, { method: "DELETE" }),
};

// Chat API
export const chatApi = {
  listConversations: () =>
    request<Conversation[]>("/chat/conversations"),

  getMessages: (id: string) =>
    request<ChatMessage[]>(`/chat/conversations/${id}`),

  sendMessage: (id: string, content: string) =>
    request<ChatMessage>(`/chat/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  assignConversation: (id: string, agentId: number) =>
    request<{ ok: boolean }>(`/chat/conversations/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId }),
    }),

  closeConversation: (id: string) =>
    request<{ ok: boolean }>(`/chat/conversations/${id}/close`, { method: "POST" }),

  markRead: (id: string) =>
    request<{ ok: boolean }>(`/chat/conversations/${id}/read`, { method: "POST" }),
};

// Users API (Admin only)
export const usersApi = {
  list: () => request<User[]>("/users"),

  createSupport: (email: string, password: string) =>
    request<User>("/users/support", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  delete: (id: number) =>
    request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
};

// Analytics API
export const analyticsApi = {
  overview: () => request<AnalyticsStats>("/analytics/overview"),

  revenue: (period: string) =>
    request<{ labels: string[]; values: number[] }>(
      `/analytics/revenue?period=${period}`
    ),

  ordersByStatus: () =>
    request<{ labels: string[]; values: number[] }>("/analytics/orders-by-status"),

  topProducts: (limit = 10) =>
    request<{ labels: string[]; values: number[] }>(
      `/analytics/top-products?limit=${limit}`
    ),
};

// Spin API
//
// The backend's `/api/admin/wheel` returns a `WheelConfigResponse` (with a
// nested `prizes` array). We unwrap it on the client side so callers can
// treat it as a plain `SpinPrize[]`.
interface WheelConfigResponse {
  id?: number;
  title?: string;
  background_url?: string;
  prizes: SpinPrize[];
  spend_per_spin_vnd?: number;
}

const wheelResponseToPrizes = (data: WheelConfigResponse): SpinPrize[] => {
  if (!data || !Array.isArray(data.prizes)) return [];
  return data.prizes.map((p, i) => ({
    id: (p as { id?: number }).id ?? i + 1,
    name: p.name,
    // Backend uses `weight` (a float); the UI speaks "probability %".
    probability: Math.round((p as { weight?: number }).weight ?? 0),
    active: true,
  }));
};

export const spinApi = {
  listPrizes: async () => {
    const data = await request<WheelConfigResponse>("/admin/wheel");
    return wheelResponseToPrizes(data);
  },

  configure: (prizes: Partial<SpinPrize>[]) =>
    request<WheelConfigResponse>("/admin/wheel", {
      method: "PUT",
      body: JSON.stringify({ prizes }),
    }),

  listResults: () => request<SpinResult[]>("/spin/history"),
};

// Ratings API
export const ratingsApi = {
  list: () => request<Rating[]>("/admin/ratings"),

  respond: (id: number, response: string) =>
    request<Rating>(`/admin/ratings/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
};

// Settings API — backed by /api/admin/admin-emails
export const settingsApi = {
  listEmails: () => request<NotificationEmail[]>("/admin/admin-emails"),

  addEmail: (email: string) =>
    request<NotificationEmail>("/admin/admin-emails", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  deleteEmail: (id: number) =>
    request<{ ok: boolean }>(`/admin/admin-emails/${id}`, { method: "DELETE" }),
};
