import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi, ordersApi, spinApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Order } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";

type Tab = "overview" | "orders" | "favorites";

export default function Profile() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await ordersApi.list()).data,
  });

  const { data: spinCfg } = useQuery({
    queryKey: ["spin-config"],
    queryFn: async () => (await spinApi.config()).data,
  });
  const spendPerSpin = spinCfg?.spend_per_spin_vnd ?? 3_000_000;
  const userCredits = spinCfg?.user_credits ?? 0;

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: async () => (await favoritesApi.list()).data,
    enabled: tab === "favorites" && !!user,
  });

  if (!user) {
    return (
      <div className="container-padding section-padding text-center">
        <p className="text-softgray">Bạn cần đăng nhập.</p>
        <Link className="btn-primary mt-4 inline-block" to="/login">Đăng nhập</Link>
      </div>
    );
  }

  const deliverOrders = (orders as Order[]).filter((o) => o.status === "delivered");
  const totalSpend = deliverOrders.reduce(
    (s, o) => s + (o.items?.reduce((x, i) => x + i.unit_price * i.quantity, 0) || 0),
    0
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "orders", label: "Đơn hàng", count: orders.length },
    { key: "favorites", label: "Yêu thích", count: favorites.length },
  ];

  return (
    <div className="container-padding section-padding">
      <div className="mx-auto max-w-5xl">
        <GlassCard intensity="med" glow className="mb-8 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aurora-gradient text-3xl font-bold text-white shadow-glow-violet">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="aurora-text-gradient text-2xl font-extrabold">{user.name}</h1>
              <p className="text-sm text-softgray">{user.email}</p>
            </div>
            <GlowButton variant="ghost" onClick={logout}>
              Đăng xuất
            </GlowButton>
          </div>
        </GlassCard>

        <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                tab === t.key
                  ? "aurora-chip-active"
                  : "text-softgray hover:text-warmwhite",
              ].join(" ")}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${tab === t.key ? "bg-white/30 text-white" : "bg-white/10 text-softgray"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <GlassCard intensity="med" className="p-5">
                <p className="text-xs uppercase tracking-wider text-steelgray">Tổng chi đã giao</p>
                <p className="mt-2 text-3xl font-bold text-warmwhite">
                  {new Intl.NumberFormat("vi-VN").format(totalSpend)} <span className="text-sm text-steelgray">VND</span>
                </p>
                <p className="mt-1 text-xs text-softgray">Đơn đã giao: {deliverOrders.length}</p>
              </GlassCard>
              <GlassCard intensity="med" className="p-5">
                <p className="text-xs uppercase tracking-wider text-steelgray">Tổng đơn hàng</p>
                <p className="mt-2 text-4xl font-bold text-warmwhite">{ordersLoading ? "..." : orders.length}</p>
                <button
                  onClick={() => setTab("orders")}
                  className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow hover:text-aurora-cyan"
                >
                  Xem đơn →
                </button>
              </GlassCard>
              <GlassCard intensity="med" glow className="p-5">
                <p className="text-xs uppercase tracking-wider text-aurora-pink">Yêu thích của bạn</p>
                <p className="mt-2 text-4xl font-bold aurora-text-rainbow">
                  ♥ {favoritesLoading ? "..." : favorites.length}
                </p>
                <button
                  onClick={() => setTab("favorites")}
                  className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow hover:text-aurora-cyan"
                >
                  Xem →
                </button>
              </GlassCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard intensity="low" hoverable className="p-5">
                <AuroraBadge tone="amber" glow className="mb-2">🎰 Vòng quay</AuroraBadge>
                <p className="text-2xl font-bold text-warmwhite">{userCredits} lượt quay</p>
                <p className="mt-1 text-xs text-softgray">
                  Cứ mỗi {new Intl.NumberFormat("vi-VN").format(spendPerSpin)} VND đã mua bạn được cộng 1 lượt.
                </p>
                <Link to="/spin" className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow hover:text-aurora-cyan">
                  Quay ngay →
                </Link>
              </GlassCard>
              <GlassCard intensity="low" hoverable className="p-5">
                <AuroraBadge tone="cyan" className="mb-2">📜 Lịch sử</AuroraBadge>
                <p className="text-lg font-bold text-warmwhite">Lịch sử vòng quay</p>
                <p className="mt-1 text-xs text-softgray">Xem tất cả giải thưởng bạn từng trúng và mã giảm giá nhận được.</p>
                <Link to="/spin/history" className="mt-3 inline-block text-xs font-semibold aurora-text-rainbow hover:text-aurora-cyan">
                  Xem →
                </Link>
              </GlassCard>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <GlassCard intensity="med" className="p-6">
            {ordersLoading ? (
              <LoadingSpinner label="Đang tải đơn hàng..." />
            ) : orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-softgray">Bạn chưa có đơn hàng nào.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {(orders as Order[]).map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-mono text-sm font-bold aurora-text-rainbow">{o.tracking_code}</p>
                      <p className="text-xs text-softgray">{o.items.length} sản phẩm · {o.delivery_address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <AuroraBadge tone={o.status === "delivered" ? "mint" : o.status === "pending" ? "amber" : "cyan"}>
                        {o.status.replace("_", " ")}
                      </AuroraBadge>
                      <Link
                        to={`/track/${o.tracking_code}`}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-warmwhite transition-all hover:bg-white/[0.08]"
                      >
                        Theo dõi
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        )}

        {tab === "favorites" && (
          <div>
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
                <p className="mb-6 text-sm text-softgray">Nhấn ♥ trên sản phẩm để lưu vào danh sách yêu thích của bạn.</p>
                <Link to="/products" className="aurora-glow-btn inline-flex justify-center">
                  Khám phá sản phẩm
                </Link>
              </GlassCard>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}