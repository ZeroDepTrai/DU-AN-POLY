import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "../types";

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
        try {
          const response = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();

          // Fetch user info
          const userResponse = await fetch("http://localhost:8000/api/auth/me", {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });

          if (!userResponse.ok) {
            return false;
          }

          const user = await userResponse.json();

          set({
            user,
            token: data.access_token,
            isAuthenticated: true,
          });
          return true;
        } catch {
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
