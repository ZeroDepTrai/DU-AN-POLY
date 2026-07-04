import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { spinApi } from "../api/client";

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: spinBalance } = useQuery({
    queryKey: ["spin-config"],
    queryFn: async () => (await spinApi.config()).data,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/products", label: "Sản phẩm" },
    { to: "/accessories", label: "Phụ kiện" },
    { to: "/blog", label: "Blog" },
    { to: "/spin", label: "🎁 Quay thưởng" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gunmetal/40 bg-charcoal/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[81px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-warmwhite">
              Cell<span className="text-crimson">Zone</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="btn-ghost text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="btn-ghost relative p-2"
              aria-label="Giỏ hàng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-xs font-bold text-white">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link to="/admin" className="hidden items-center gap-1.5 rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson transition-colors hover:bg-crimson/20 md:flex">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
            )}

            {user && (spinBalance?.user_credits ?? 0) > 0 && (
              <Link
                to="/spin"
                className="hidden items-center gap-1.5 rounded-lg border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm font-bold text-crimson transition-colors hover:bg-crimson/20 md:flex"
                title="Bạn có lượt quay may mắn"
              >
                🎁 {spinBalance?.user_credits}
              </Link>
            )}

            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gunmetal text-xs font-bold text-warmwhite">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <Link to="/profile" className="text-sm text-softgray hover:text-warmwhite">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="btn-ghost p-2 text-steelgray hover:text-warmwhite"
                  aria-label="Đăng xuất"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="btn-ghost p-2 md:hidden"
              aria-label="Mở menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-charcoal border-l border-gunmetal/40 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gunmetal/40">
              <span className="font-bold text-warmwhite">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="btn-ghost p-2"
                aria-label="Đóng"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-softgray transition-colors hover:bg-gunmetal hover:text-warmwhite"
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-crimson transition-colors hover:bg-crimson/10"
                >
                  Dashboard
                </Link>
              )}
            </nav>
            <div className="mt-auto border-t border-gunmetal/40 p-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gunmetal text-xs font-bold text-warmwhite">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-softgray">{user.name}</span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-lg px-4 py-2 text-left text-sm text-softgray transition-colors hover:bg-gunmetal hover:text-warmwhite"
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm text-steelgray transition-colors hover:bg-gunmetal hover:text-warmwhite"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary w-full justify-center text-sm py-2"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full justify-center text-sm py-2"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
