import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "../types";
import { getApiBase } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
  hasPermission: (action: PermissionAction) => boolean;
}

type PermissionAction =
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "orders:manage"
  | "orders:view"
  | "blog:create"
  | "blog:edit"
  | "blog:delete"
  | "coupons:create"
  | "coupons:edit"
  | "coupons:delete"
  | "media:upload"
  | "media:delete"
  | "spin:configure"
  | "ratings:manage"
  | "users:manage"
  | "settings:edit";

const rolePermissions: Record<UserRole, PermissionAction[]> = {
  admin: [
    "products:create",
    "products:edit",
    "products:delete",
    "orders:manage",
    "orders:view",
    "blog:create",
    "blog:edit",
    "blog:delete",
    "coupons:create",
    "coupons:edit",
    "coupons:delete",
    "media:upload",
    "media:delete",
    "spin:configure",
    "ratings:manage",
    "users:manage",
    "settings:edit",
  ],
  customer_support: [
    "orders:view",
    "ratings:manage",
  ],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const apiUrl = `${getApiBase()}/auth/login`;
        console.log("[Auth] Login URL:", apiUrl);
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          console.log("[Auth] Response status:", response.status);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.log("[Auth] Login failed:", response.status, errData);
            return false;
          }

          const data = await response.json();
          console.log("[Auth] Login success! Token:", data.access_token ? "received" : "missing");

          // Fetch user info
          const meUrl = `${getApiBase()}/auth/me`;
          console.log("[Auth] Fetching user from:", meUrl);
          const userResponse = await fetch(meUrl, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });

          console.log("[Auth] User response status:", userResponse.status);

          if (!userResponse.ok) {
            const meErr = await userResponse.text();
            console.log("[Auth] /me failed:", meErr);
            return false;
          }

          const user = await userResponse.json();
          console.log("[Auth] User data:", user);

          set({
            user,
            token: data.access_token,
            isAuthenticated: true,
          });
          return true;
        } catch (err) {
          console.error("[Auth] Exception:", err);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      hasPermission: (action: PermissionAction) => {
        const { user } = get();
        if (!user) return false;
        return rolePermissions[user.role].includes(action);
      },
    }),
    {
      name: "cellzone-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
