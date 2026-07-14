import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Eager: tiny pages used above the fold on landing
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy: anything below-the-fold on Home. Each becomes its own JS chunk so
// Home's first paint no longer ships the Tiptap editor, Leaflet map,
// admin dashboard, or the spin wheel.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Accessories = lazy(() => import("./pages/Accessories"));
const CartPage = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Profile = lazy(() => import("./pages/Profile"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Spin = lazy(() => import("./pages/Spin"));
const SpinHistory = lazy(() => import("./pages/SpinHistory"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

function PageFallback() {
  return <LoadingSpinner label="Đang tải..." />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/accessories" element={<Accessories />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spin"
                  element={
                    <ProtectedRoute>
                      <Spin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spin/history"
                  element={
                    <ProtectedRoute>
                      <SpinHistory />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="/orders/:trackingCode" element={<OrderConfirmation />} />
              <Route path="/track/:trackingCode" element={<TrackOrder />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
