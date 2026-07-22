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

// Configurable API base URL
const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api";

export function getApiBase(): string {
  return API_BASE;
}

export function getWsBase(): string {
  return API_BASE.replace(/^http/, "ws").replace("/api", "");
}

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("cellzone-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
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

  delete: (id: number) =>
    request<{ ok: boolean }>(`/admin/products/${id}`, { method: "DELETE" }),
};

// Orders API
export const ordersApi = {
  list: () => request<Order[]>("/orders"),

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
  list: () => request<Coupon[]>("/coupons"),

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
export const spinApi = {
  listPrizes: () => request<SpinPrize[]>("/spin/prizes"),

  configure: (prizes: Partial<SpinPrize>[]) =>
    request<SpinPrize[]>("/admin/spin/configure", {
      method: "POST",
      body: JSON.stringify({ prizes }),
    }),

  listResults: () => request<SpinResult[]>("/spin/results"),
};

// Ratings API
export const ratingsApi = {
  list: () => request<Rating[]>("/ratings"),

  respond: (id: number, response: string) =>
    request<Rating>(`/admin/ratings/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
};

// Settings API
export const settingsApi = {
  listEmails: () => request<NotificationEmail[]>("/settings/emails"),

  addEmail: (email: string) =>
    request<NotificationEmail>("/settings/emails", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  deleteEmail: (id: number) =>
    request<{ ok: boolean }>(`/settings/emails/${id}`, { method: "DELETE" }),
};
