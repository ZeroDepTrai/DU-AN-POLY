import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi, ordersApi, reviewsApi, spinApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Order } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";

type Tab = "overview" | "orders" | "favorites" | "reviews" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "orders", label: "Đơn hàng" },
  { key: "favorites", label: "Yêu thích" },
  { key: "reviews", label: "Đánh giá" },
  { key: "settings", label: "Cài đặt" },
];

type StatusTone = "neutral" | "mint" | "amber" | "sakura" | "crimson" | "rose";

const STATUS_CONFIG: Record<string, { label: string; tone: StatusTone }> = {
  delivered: { label: "Đã giao", tone: "mint" },
  pending: { label: "Chờ xác nhận", tone: "amber" },
  processing: { label: "Đang xử lý", tone: "sakura" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  shipped: { label: "Đang giao", tone: "sakura" },
  confirmed: { label: "Đã xác nhận", tone: "sakura" },
};

const LOYALTY_TIERS = [
  { name: "Đồng", min: 0, max: 5000000, color: "text-amber-400" },
  { name: "Bạc", min: 5000000, max: 15000000, color: "text-gray-300" },
  { name: "Vàng", min: 15000000, max: 50000000, color: "text-yellow-400" },
  { name: "Kim cương", min: 50000000, max: Infinity, color: "text-sakura" },
];

function getLoyaltyTier(totalSpend: number) {
  return LOYALTY_TIERS.find(t => totalSpend >= t.min && totalSpend < t.max) || LOYALTY_TIERS[0];
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await ordersApi.list()).data,
    enabled: !!user,
  });

  const { data: spinCfg } = useQuery({
    queryKey: ["spin-config"],
    queryFn: async () => (await spinApi.config()).data,
  });
  const spendPerSpin = spinCfg?.spend_per_spin_vnd ?? 3_000_000;
  const userCredits = spinCfg?.user_credits ?? 0;

  // Favorites are fetched unconditionally so the count in the header
  // and the Yêu thích stat card are always live, even before the user
  // visits the Yêu thích tab.
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: async () => (await favoritesApi.list()).data,
    enabled: !!user,
  });

  // Reviews the current user has written — needed to populate the
  // "Đánh giá" tab with real entries instead of the empty placeholder.
  const { data: myReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => (await reviewsApi.list()).data,
    enabled: !!user && tab === "reviews",
  });

  if (!user) {
    return (
      <div className="container-padding section-padding text-center">
        <p className="text-softgray">Bạn cần đăng nhập.</p>
        <Link className="btn-primary focus-rose mt-4 inline-block" to="/login">Đăng nhập</Link>
      </div>
    );
  }

  const deliverOrders = (orders as Order[]).filter((o) => o.status === "delivered");
  // Total spend is now calculated from ALL orders (not just delivered
  // ones) so the loyalty tier reflects the customer's real spend even
  // when items are still in transit. The stat card subtitle still
  // distinguishes total orders from delivered ones.
  const totalSpend = (orders as Order[]).reduce(
    (s, o) => s + (o.items?.reduce((x, i) => x + i.unit_price * i.quantity, 0) || 0),
    0
  );
  const loyaltyTier = getLoyaltyTier(totalSpend);

  return (
    <div className="min-h-screen bg-darkbase">
      {/* Profile Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sakura/10 blur-[128px]" />
          <div className="absolute right-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sakura/10 blur-[96px]" />
        </div>
        <div className="container-padding relative py-12">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Large Avatar */}
            <div className="group relative shrink-0">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-aurora-gradient text-4xl font-extrabold text-white shadow-glow-violet ring-4 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-gradient text-xs font-bold text-white shadow-glow-violet ring-2 ring-darkbase">
                ★
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h1 className="text-2xl font-extrabold text-warmwhite sm:text-3xl">{user.name}</h1>
                <AuroraBadge tone="rose" glow className="text-xs">
                  <span className={loyaltyTier.color}>★ {loyaltyTier.name}</span>
                </AuroraBadge>
              </div>
              <p className="mt-1 text-sm text-steelgray">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="flex items-center gap-1.5 text-xs text-steelgray">
                  <svg className="h-4 w-4 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Thành viên CellZone
                </div>
                <div className="flex items-center gap-1.5 text-xs text-steelgray">
                  <svg className="h-4 w-4 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {orders.length} đơn hàng
                </div>
                <div className="flex items-center gap-1.5 text-xs text-steelgray">
                  <svg className="h-4 w-4 text-sakura" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z" />
                  </svg>
                  {favorites.length} yêu thích
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex shrink-0 gap-2">
              <GlowButton variant="ghost" onClick={logout} className="focus-rose text-xs">
                Đăng xuất
              </GlowButton>
              <Link
                to="/spin"
                className="flex items-center gap-2 rounded-xl bg-rose-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vòng quay {userCredits > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{userCredits}</span>}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Navigation Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="container-padding">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={[
                    "relative shrink-0 px-5 py-3.5 text-sm font-medium transition-all focus-rose whitespace-nowrap",
                    isActive
                      ? "aurora-text-rainbow font-semibold"
                      : "text-steelgray hover:text-warmwhite",
                  ].join(" ")}
                >
                  {t.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-gradient" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-padding py-10">
        {/* ====== OVERVIEW TAB ====== */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GlassCard intensity="med" className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-gradient/20">
                  <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-steelgray">Tổng chi tiêu</p>
                <p className="mt-2 text-2xl font-bold text-warmwhite">
                  {formatVND(totalSpend)}
                  <span className="ml-1 text-sm font-normal text-steelgray">VND</span>
                </p>
                <p className="mt-1 text-xs text-softgray">
                  {orders.length} đơn · {deliverOrders.length} đã giao
                </p>
              </GlassCard>
              <GlassCard intensity="med" className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sakura/20">
                  <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-steelgray">Tổng đơn hàng</p>
                <p className="mt-2 text-4xl font-bold text-warmwhite">{ordersLoading ? "..." : orders.length}</p>
                <button
                  onClick={() => setTab("orders")}
                  className="mt-1 inline-block text-xs font-semibold aurora-text-rainbow transition-colors hover:text-sakura focus-rose"
                >
                  Xem đơn →
                </button>
              </GlassCard>
              <GlassCard intensity="med" glow className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sakura/20">
                  <svg className="h-5 w-5 text-sakura" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-lightpink">Yêu thích của bạn</p>
                <p className="mt-2 text-4xl font-bold aurora-text-rainbow">
                  ♥ {favoritesLoading ? "..." : favorites.length}
                </p>
                <button
                  onClick={() => setTab("favorites")}
                  className="mt-1 inline-block text-xs font-semibold aurora-text-rainbow transition-colors hover:text-sakura focus-rose"
                >
                  Xem →
                </button>
              </GlassCard>
              <GlassCard intensity="med" className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-steelgray">Cấp bậc</p>
                <p className={`mt-2 text-2xl font-bold ${loyaltyTier.color}`}>{loyaltyTier.name}</p>
                <p className="mt-1 text-xs text-softgray">
                  {loyaltyTier.max === Infinity
                    ? "Đã đạt cấp cao nhất!"
                    : `Cần ${formatVND(loyaltyTier.max - totalSpend)} VND để lên cấp`}
                </p>
              </GlassCard>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard intensity="low" hoverable className="p-5">
                <AuroraBadge tone="amber" glow className="mb-2">🎰 Vòng quay</AuroraBadge>
                <p className="text-2xl font-bold text-warmwhite">{userCredits} lượt quay</p>
                <p className="mt-1 text-xs text-softgray">
                  Cứ mỗi {formatVND(spendPerSpin)} VND đã mua bạn được cộng 1 lượt.
                </p>
                <Link to="/spin" className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow transition-colors hover:text-sakura focus-rose">
                  Quay ngay →
                </Link>
              </GlassCard>
              <GlassCard intensity="low" hoverable className="p-5">
                <AuroraBadge tone="sakura" className="mb-2">📜 Lịch sử</AuroraBadge>
                <p className="text-lg font-bold text-warmwhite">Lịch sử vòng quay</p>
                <p className="mt-1 text-xs text-softgray">Xem tất cả giải thưởng bạn từng trúng.</p>
                <Link to="/spin/history" className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow transition-colors hover:text-sakura focus-rose">
                  Xem →
                </Link>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ====== ORDERS TAB ====== */}
        {tab === "orders" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-warmwhite">Lịch sử đơn hàng</h2>
              <AuroraBadge tone="rose">{orders.length} đơn hàng</AuroraBadge>
            </div>
            {ordersLoading ? (
              <LoadingSpinner label="Đang tải đơn hàng..." />
            ) : orders.length === 0 ? (
              <GlassCard intensity="med" className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-warmwhite">Bạn chưa có đơn hàng nào</h3>
                <p className="mb-6 text-sm text-steelgray">Khám phá sản phẩm và đặt hàng ngay!</p>
                <Link to="/products" className="inline-flex justify-center rounded-xl bg-rose-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                  Khám phá sản phẩm
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {(orders as Order[]).map((o) => {
                  const statusCfg = STATUS_CONFIG[o.status] || { label: o.status, tone: "neutral" as const };
                  const orderTotal = o.items?.reduce((x, i) => x + i.unit_price * i.quantity, 0) || 0;
                  const itemImages = o.items?.slice(0, 4) || [];

                  return (
                    <GlassCard key={o.id} intensity="med" hoverable className="overflow-hidden p-0">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-gradient/20">
                            <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold aurora-text-rainbow">{o.tracking_code}</p>
                            <p className="text-xs text-steelgray">{o.items.length} sản phẩm · {formatDate((o as unknown as { created_at?: string }).created_at || new Date().toISOString())}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <AuroraBadge tone={statusCfg.tone} glow={o.status === "delivered" || o.status === "processing"}>
                            {statusCfg.label}
                          </AuroraBadge>
                          <p className="text-sm font-bold text-warmwhite">
                            {formatVND(orderTotal)} <span className="text-xs font-normal text-steelgray">VND</span>
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className="flex -space-x-3">
                          {itemImages.map((item, idx) => (
                            <div key={idx} className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-darkbase bg-white/[0.03] overflow-hidden">
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sakura/20 to-crimson/20 text-sm font-bold text-sakura">
                                {item.product_name?.charAt(0) || "?"}
                              </div>
                            </div>
                          ))}
                          {o.items.length > 4 && (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-darkbase bg-white/[0.06] text-xs font-medium text-steelgray">
                              +{o.items.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-steelgray line-clamp-1">{o.delivery_address}</p>
                        </div>

                        <Link
                          to={`/track/${o.tracking_code}`}
                          className="shrink-0 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-warmwhite transition-all hover:bg-white/[0.08] hover:border-white/20 focus-rose"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Theo dõi
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== FAVORITES TAB ====== */}
        {tab === "favorites" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-warmwhite">Sản phẩm yêu thích</h2>
              <AuroraBadge tone="sakura">{favorites.length} sản phẩm</AuroraBadge>
            </div>
            {favoritesLoading ? (
              <LoadingSpinner label="Đang tải danh sách yêu thích..." />
            ) : favorites.length === 0 ? (
              <GlassCard intensity="med" className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold aurora-text-gradient">Chưa có sản phẩm yêu thích</h3>
                <p className="mb-6 text-sm text-steelgray">Nhấn ♥ trên sản phẩm để lưu vào danh sách yêu thích của bạn.</p>
                <Link to="/products" className="inline-flex justify-center rounded-xl bg-rose-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                  Khám phá sản phẩm
                </Link>
              </GlassCard>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favorites.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== REVIEWS TAB ====== */}
        {tab === "reviews" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-warmwhite">Đánh giá của tôi</h2>
              <AuroraBadge tone="sakura">{myReviews.length} đánh giá</AuroraBadge>
            </div>
            {reviewsLoading ? (
              <LoadingSpinner label="Đang tải đánh giá..." />
            ) : myReviews.length === 0 ? (
              <GlassCard intensity="med" className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold aurora-text-gradient">Chưa có đánh giá nào</h3>
                <p className="mb-6 text-sm text-steelgray">Mua sản phẩm và để lại đánh giá của bạn để giúp người khác có quyết định tốt hơn.</p>
                <Link to="/products" className="inline-flex justify-center rounded-xl bg-rose-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                  Khám phá sản phẩm
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {myReviews.map((r) => (
                  <GlassCard key={r.id} intensity="med" hoverable className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/products/${r.product_id}`}
                          className="block truncate text-sm font-semibold text-warmwhite transition-colors hover:text-sakura focus-rose"
                        >
                          {r.product_name || `Sản phẩm #${r.product_id}`}
                        </Link>
                        <p className="mt-0.5 text-xs text-steelgray">
                          {formatDate(r.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${i < r.stars ? "fill-current" : "fill-white/10"}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {r.review && (
                      <p className="mt-3 text-sm leading-relaxed text-softgray">{r.review}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <Link
                        to={`/products/${r.product_id}`}
                        className="text-xs font-semibold aurora-text-rainbow transition-colors hover:text-sakura focus-rose"
                      >
                        Xem sản phẩm →
                      </Link>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== SETTINGS TAB ====== */}
        {tab === "settings" && (
          <div className="space-y-6">
            {/* Personal Info */}
            <GlassCard intensity="med" className="p-6">
              <h2 className="mb-5 text-lg font-bold text-warmwhite">Thông tin cá nhân</h2>
              <form className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-steelgray">Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-steelgray">Email</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-steelgray">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-steelgray">Ngày sinh</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-steelgray">Giới tính</label>
                  <div className="flex gap-3">
                    {["Nam", "Nữ", "Khác"].map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2 text-sm text-steelgray">
                        <input type="radio" name="gender" className="accent-sakura" />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button type="button" className="rounded-xl bg-rose-gradient px-8 py-3 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </GlassCard>

            {/* Address Book */}
            <GlassCard intensity="med" className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-warmwhite">Sổ địa chỉ</h2>
                <button className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-medium text-steelgray transition-all hover:border-white/20 hover:text-warmwhite focus-rose">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm địa chỉ
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Nhà riêng", address: "193 Đỗ Văn Thi, phường Trấn Biên, TP. Biên Hòa, Đồng Nai 700000", default: true },
                  { label: "Văn phòng", address: "456 Lê Lợi, Quận 3, TP.HCM", default: false },
                ].map((addr, idx) => (
                  <GlassCard key={idx} intensity="low" hoverable className="flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sakura/20">
                      <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-warmwhite">{addr.label}</span>
                        {addr.default && <AuroraBadge tone="mint" className="text-[10px]">Mặc định</AuroraBadge>}
                      </div>
                      <p className="text-xs text-steelgray leading-relaxed">{addr.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-steelgray transition-colors hover:text-sakura focus-rose">Sửa</button>
                      <button className="text-xs text-steelgray transition-colors hover:text-red-400 focus-rose">Xóa</button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>

            {/* Notification Settings */}
            <GlassCard intensity="med" className="p-6">
              <h2 className="mb-5 text-lg font-bold text-warmwhite">Cài đặt thông báo</h2>
              <div className="space-y-4">
                {[
                  { label: "Nhận thông báo khuyến mãi qua email", desc: "Nhận email về các chương trình khuyến mãi và ưu đãi đặc biệt." },
                  { label: "Nhận thông báo đơn hàng", desc: "Cập nhật trạng thái đơn hàng qua SMS/email." },
                  { label: "Thông báo blog mới", desc: "Nhận tin khi có bài viết mới trên CellZone Blog." },
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div>
                      <p className="text-sm font-medium text-warmwhite">{notif.label}</p>
                      <p className="mt-0.5 text-xs text-steelgray">{notif.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center shrink-0">
                      <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                      <div className="peer h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-rose-gradient peer-focus:ring-1 peer-focus:ring-sakura/30">
                        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard intensity="low" className="border-red-500/20 p-6">
              <h2 className="mb-2 text-lg font-bold text-red-400">Vùng nguy hiểm</h2>
              <p className="mb-4 text-xs text-steelgray">Các thao tác dưới đây không thể hoàn tác.</p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 focus-rose">
                  Xóa tài khoản
                </button>
                <GlowButton variant="ghost" onClick={logout} className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10">
                  Đăng xuất khỏi tất cả thiết bị
                </GlowButton>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
