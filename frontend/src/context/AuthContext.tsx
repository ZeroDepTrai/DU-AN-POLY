import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, default as api } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerWithCode: (name: string, email: string, password: string, code: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Auth] No token found");
      setLoading(false);
      return;
    }
    try {
      console.log("[Auth] Fetching user data...");
      const { data } = await authApi.me();
      console.log("[Auth] User loaded:", data);
      setUser(data);
    } catch (err) {
      console.error("[Auth] Failed to load user:", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    console.log("[Auth] Attempting login to:", api.defaults.baseURL);
    try {
      const { data } = await authApi.login({ email, password });
      console.log("[Auth] Login successful, token:", data.access_token?.substring(0, 20) + "...");
      localStorage.setItem("token", data.access_token);
      await loadUser();
    } catch (err) {
      console.error("[Auth] Login failed:", err);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authApi.register({ name, email, password });
    localStorage.setItem("token", data.access_token);
    await loadUser();
  };

  const registerWithCode = async (name: string, email: string, password: string, code: string) => {
    const { data } = await authApi.verifyCode({ name, email, password, code });
    localStorage.setItem("token", data.access_token);
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      registerWithCode,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
