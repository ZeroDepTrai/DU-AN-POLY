import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useState, useEffect } from "react";
import { productsApi, ordersApi, getApiBase } from "./api/client";

import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProductsTab from "./components/ProductsTab";
import OrdersTab from "./components/OrdersTab";
import BlogTab from "./components/BlogTab";
import MediaTab from "./components/MediaTab";
import CouponsTab from "./components/CouponsTab";
import SpinTab from "./components/SpinTab";
import RatingsTab from "./components/RatingsTab";
import ChatTab from "./components/ChatTab";
import UsersTab from "./components/UsersTab";
import SettingsTab from "./components/SettingsTab";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

type Tab = "dashboard" | "products" | "orders" | "blog" | "media" | "coupons" | "spin" | "ratings" | "chat" | "users" | "settings";

function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<{ id: number; name: string; stock: number; image_url: string }[]>([]);
  const [orders, setOrders] = useState<{ id: number; tracking_code: string; status: string; delivery_address: string; items: { quantity: number; unit_price: number }[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Warm up the TLS connection to Railway before the heavy parallel requests.
      // Without this, the first fetch pays ~400ms for TLS alone on top of the
      // data round-trip, making the dashboard feel sluggish on cold starts.
      await fetch(`${getApiBase().replace(/\/api$/, "")}/api/health`).catch(() => {});

      const [prods, ords] = await Promise.all([
        productsApi.list().catch(() => []),
        ordersApi.list().catch(() => []),
      ]);
      setProducts(prods);
      setOrders(ords);
    } catch {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const renderTab = () => {
    if (loading && activeTab === "dashboard") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#8b8b9a]">Đang tải...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard products={products} orders={orders} />;
      case "products":
        return <ProductsTab />;
      case "orders":
        return <OrdersTab />;
      case "blog":
        return <BlogTab />;
      case "media":
        return <MediaTab />;
      case "coupons":
        return <CouponsTab />;
      case "spin":
        return <SpinTab />;
      case "ratings":
        return <RatingsTab />;
      case "chat":
        return <ChatTab />;
      case "users":
        return <UsersTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <Dashboard products={products} orders={orders} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
