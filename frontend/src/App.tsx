import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Accessories from "./pages/Accessories";
import Register from "./pages/Register";
import TrackOrder from "./pages/TrackOrder";
import Spin from "./pages/Spin";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer pages — wrapped in Layout (Header + Footer) */}
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
                path="/spin"
                element={
                  <ProtectedRoute>
                    <Spin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Transactional pages — no Layout wrapper */}
            <Route path="/orders/:trackingCode" element={<OrderConfirmation />} />
            <Route path="/track/:trackingCode" element={<TrackOrder />} />

            {/* Admin — single consolidated page */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
