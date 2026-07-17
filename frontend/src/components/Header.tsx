import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { spinApi } from "../api/client";

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: spinCfg } = useQuery({
    queryKey: ["spin-config-header"],
    queryFn: async () => (await spinApi.config()).data,
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const spinBalance = spinCfg?.user_credits ?? 0;

  const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/products", label: "Sản phẩm" },
    { to: "/accessories", label: "Phụ kiện" },
    { to: "/blog", label: "Blog" },
    { to: "/spin", label: "Vòng quay" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-aurora-bg-deep/60 backdrop-blur-2xl shadow-glow-soft">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-aurora bg-aurora-gradient shadow-glow-violet">
              <div className="absolute inset-0 rounded-aurora bg-aurora-shimmer opacity-0 transition-opacity group-hover:opacity-100" />
              <svg className="relative h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="aurora-text-gradient">Cell</span>
              <span className="aurora-text-rainbow">Zone</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-softgray transition-all hover:bg-white/5 hover:text-warmwhite"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <Link
                to="/profile"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-softgray transition-all hover:border-lightpink/40 hover:bg-lightpink/10 hover:text-warmwhite md:inline-flex"
                aria-label="Yêu thích của tôi"
              >
                <svg className="h-4 w-4 text-lightpink" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z" />
                </svg>
                Yêu thích
              </Link>
            )}

            <Link
              to="/cart"
              data-cart-icon
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-softgray transition-all hover:border-sakura/40 hover:text-warmwhite"
              aria-label="Giỏ hàng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-aurora-gradient text-xs font-bold text-white shadow-glow-violet">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link to="/admin" className="hidden items-center gap-1.5 rounded-full border border-rose/40 bg-rose/10 px-3 py-2 text-sm font-medium text-rose transition-all hover:bg-rose/20 md:inline-flex">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
            )}

            {user && spinBalance > 0 && (
              <Link to="/spin" className="hidden items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/20 md:inline-flex">
                <span className="text-base leading-none">🎰</span>
                {spinBalance} lượt quay
              </Link>
            )}

            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aurora-gradient text-xs font-bold text-white shadow-glow-violet">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <Link to="/profile" className="text-sm text-softgray hover:text-warmwhite">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-steelgray transition-all hover:border-lightpink/40 hover:text-lightpink"
                  aria-label="Đăng xuất"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-warmwhite transition-all hover:border-white/30 hover:bg-white/[0.08]">
                  Đăng nhập
                </Link>
                <Link to="/register" className="aurora-glow-btn px-5 py-2 text-sm">
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-softgray md:hidden"
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
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-white/10 bg-aurora-bg-deep/95 shadow-aurora-card backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <span className="aurora-text-gradient text-lg font-bold">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-softgray"
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
                  className="rounded-lg px-4 py-3 text-sm font-medium text-softgray transition-colors hover:bg-white/5 hover:text-warmwhite"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-lightpink transition-colors hover:bg-lightpink/10"
                >
                  Yêu thích của tôi
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-rose transition-colors hover:bg-rose/10"
                >
                  Dashboard
                </Link>
              )}
            </nav>
            <div className="mt-auto border-t border-white/10 p-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aurora-gradient text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-softgray">{user.name}</span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-lg px-4 py-2 text-left text-sm text-softgray transition-colors hover:bg-white/5 hover:text-warmwhite"
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm text-steelgray transition-colors hover:bg-white/5 hover:text-warmwhite"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm font-semibold text-warmwhite transition-all hover:border-white/30"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="aurora-glow-btn w-full justify-center px-4 py-2 text-sm"
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