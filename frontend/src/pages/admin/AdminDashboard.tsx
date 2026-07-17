import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  adminBlogApi,
  adminCouponsApi,
} from "../../api/client";
import type { Coupon, ProductMediaItem } from "../../api/client";
import SpinTab from "./SpinTab";
import AdminRatings from "./AdminRatings";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminMapPicker from "../../components/AdminMapPicker";
import RichTextEditor from "../../components/RichTextEditor";
import GlassCard from "../../components/aurora/GlassCard";
import AuroraBadge from "../../components/aurora/AuroraBadge";
import type { Order, OrderStatus, Product } from "../../types";

type Tab = "dashboard" | "products" | "orders" | "blog" | "media" | "coupons" | "spin" | "settings" | "ratings";

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: "products",
    label: "S?n ph?m",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Hình ?nh / Video",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 10l-4 4m0-4l4 4M3 17l5-5 7 7" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "??n hàng",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "blog",
    label: "Blog",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: "coupons",
    label: "Coupon",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    id: "spin",
    label: "Vòng quay",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.5-6.5l-2.1 2.1m-2.8 5.8l-2.1 2.1m0-10.6l2.1 2.1m2.8 5.8l2.1 2.1" />
      </svg>
    ),
  },
  {
    id: "ratings",
    label: "?ánh giá",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Cài ??t",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Ch? xác nh?n" },
  { value: "processing", label: "?ang x? lý" },
  { value: "shipped", label: "?ã xu?t kho" },
  { value: "in_transit", label: "?ang giao hàng" },
  { value: "delivered", label: "?ã giao" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => { const { data } = await adminApi.listProducts(); return data; },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => { const { data } = await adminApi.listOrders(); return data; },
  });

  const isLoading = loadingProducts || loadingOrders;

  return (
    <div className="flex min-h-screen bg-aurora-bg-deep">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-graphite/80 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <a href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </a>
          <a href="/" className="font-extrabold aurora-text-gradient">CellZone</a>
          <span className="ml-auto rounded-full bg-crimson\/10 px-2 py-0.5 text-xs font-semibold text-crimson">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "aurora-shimmer border border-white/10 text-warmwhite shadow-glow-soft"
                  : "text-softgray hover:bg-white/5 hover:text-warmwhite"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 bg-graphite\/80 backdrop-blur-xl/80 p-2 backdrop-blur-xl md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-crimson text-white"
                  : "text-softgray hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner label="?ang t?i dashboard..." />
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardTab products={products} orders={orders} />}
              {activeTab === "products" && <ProductsTab products={products} />}
              {activeTab === "orders" && <OrdersTab orders={orders} />}
              {activeTab === "blog" && <BlogTab />}
              {activeTab === "media" && <MediaTab products={products} />}
              {activeTab === "coupons" && <CouponsTab />}
              {activeTab === "spin" && <SpinTab />}
              {activeTab === "ratings" && <AdminRatings />}
              {activeTab === "settings" && <SettingsTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// -- Dashboard Tab --------------------------------------------
function DashboardTab({ products, orders }: { products: Product[]; orders: Order[] }) {
  const lowStock = products.filter((p) => p.stock < 5);
  const totalRevenue = orders.reduce((s, o) => s + o.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0), 0);
  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  const totalLikes = products.reduce((s, p) => s + (p.like_count ?? 0), 0);
  const totalRatings = products.reduce((s, p) => s + (p.rating_count ?? 0), 0);
  const ratedProducts = products.filter((p) => (p.rating_count ?? 0) > 0);
  const avgRating =
    ratedProducts.length === 0
      ? 0
      : ratedProducts.reduce((s, p) => s + (p.avg_rating ?? 0), 0) / ratedProducts.length;

  return (
    <div>
      <div className="mb-6">
        <AuroraBadge tone="violet" glow className="mb-2">
          Aurora UI · Admin Dashboard
        </AuroraBadge>
        <h1 className="aurora-text-gradient text-2xl font-extrabold md:text-3xl">Xin chào, Admin</h1>
        <p className="mt-1 text-sm text-softgray">?ây là b?ng ?i?u khi?n c?a CellZone</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="T?ng s?n ph?m"
          value={String(products.length)}
          tone="indigo"
          icon="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <KpiTile
          label="T?ng ??n hàng"
          value={String(orders.length)}
          tone="cyan"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
        <KpiTile
          label="T?ng doanh thu"
          value={new Intl.NumberFormat("vi-VN").format(totalRevenue) + " ?"}
          tone="mint"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <KpiTile
          label="C?nh báo t?n kho"
          value={String(lowStock.length)}
          tone="rose"
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiTile
          label="T?ng l??t thích"
          value={String(totalLikes)}
          tone="rose"
          icon="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z"
        />
        <KpiTile
          label="T?ng ?ánh giá"
          value={String(totalRatings)}
          tone="amber"
          icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
        <KpiTile
          label="?ánh giá trung bình"
          value={avgRating.toFixed(2)}
          tone="violet"
          icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </div>

      {lowStock.length > 0 && (
        <GlassCard intensity="med" className="mb-8 border-aurora-pink/30 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-aurora-pink">
            <span className="text-xl">??</span> C?nh báo t?n kho th?p
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-medium text-warmwhite truncate max-w-[150px]">{p.name}</p>
                  <p className="text-xs text-aurora-pink">Ch? còn {p.stock} s?n ph?m</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard intensity="med" className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-bold text-warmwhite">??n hàng g?n ?ây</h2>
          <span className="text-sm text-softgray">{orders.length} ??n hàng</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-softgray">Ch?a có ??n hàng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-white/[0.04]">
              <tr className="text-left text-softgray">
                <th className="px-5 py-3">Mã theo dõi</th>
                <th className="px-5 py-3">Tr?ng thái</th>
                <th className="px-5 py-3">??a ch?</th>
                <th className="px-5 py-3">Theo dõi</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.04]">
                  <td className="px-5 py-3 font-mono font-medium aurora-text-rainbow">{order.tracking_code}</td>
                  <td className="px-5 py-3">
                    <AuroraBadge tone={order.status === "delivered" ? "mint" : order.status === "pending" ? "amber" : "cyan"}>
                      {order.status.replace("_", " ")}
                    </AuroraBadge>
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-softgray">{order.delivery_address}</td>
                  <td className="px-5 py-3">
                    <Link to={`/track/${order.tracking_code}`} className="text-sm aurora-text-rainbow hover:text-aurora-cyan transition-colors">
                      Theo dõi ?
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}

const KPI_TONE: Record<string, { gradient: string; iconBg: string; text: string }> = {
  indigo: {
    gradient: "from-aurora-indigo to-aurora-violet",
    iconBg: "bg-aurora-indigo/20 text-[#9AA6FF]",
    text: "text-[#9AA6FF]",
  },
  cyan: {
    gradient: "from-aurora-cyan to-aurora-mint",
    iconBg: "bg-aurora-cyan/20 text-aurora-cyan",
    text: "text-aurora-cyan",
  },
  mint: {
    gradient: "from-aurora-mint to-aurora-cyan",
    iconBg: "bg-aurora-mint/20 text-aurora-mint",
    text: "text-aurora-mint",
  },
  violet: {
    gradient: "from-aurora-violet to-aurora-indigo",
    iconBg: "bg-aurora-violet/20 text-aurora-violet",
    text: "text-aurora-violet",
  },
  rose: {
    gradient: "from-aurora-pink to-crimson",
    iconBg: "bg-aurora-pink/20 text-aurora-pink",
    text: "text-aurora-pink",
  },
  amber: {
    gradient: "from-amber-400 to-amber-500",
    iconBg: "bg-amber-500/20 text-amber-200",
    text: "text-amber-200",
  },
};

function KpiTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof KPI_TONE;
  icon: string;
}) {
  const t = KPI_TONE[tone] ?? KPI_TONE.indigo;
  return (
    <GlassCard intensity="low" hoverable className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-softgray">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-glow-soft`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      <p className={`text-2xl font-extrabold ${t.text}`}>{value}</p>
    </GlassCard>
  );
}

// -- Products Tab ------------------------------------------

// Phone / general-purpose tag presets
// Shared chip button used everywhere in the products tab.
// Lives at module scope so it's accessible from any JSX block below.
function ChipButton({
  tag,
  label,
  selected,
  onToggle,
}: {
  tag: string;
  label?: string;
  selected: boolean;
  onToggle: (tag: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
        selected
          ? "bg-crimson text-white"
          : "border border-white\/10 bg-graphite\/80 backdrop-blur-xl text-softgray hover:border-silvergray hover:text-warmwhite"
      }`}
    >
      {label ?? tag}
    </button>
  );
}

const PHONE_TAG_PRESETS = [
  "iPhone", "Apple", "Android", "Samsung", "Xiaomi", "OPPO",
  "Vivo", "Flagship", "Budget", "5G", "Gaming", "Featured",
];

// Accessory category keywords ? each maps onto the same keywords that the
// Accessories page filters by. Picking any chip also auto-toggles the
// umbrella "accessory" tag.
const ACCESSORY_CATEGORY_TAGS: { label: string; chips: string[] }[] = [
  { label: "?p l?ng",        chips: ["?p l?ng", "?p", "case"] },
  { label: "Tai nghe",       chips: ["tai nghe", "earphone", "earbud", "airpod"] },
  { label: "S?c d? phòng",   chips: ["s?c d? phòng", "power bank", "powerbank"] },
  { label: "Cáp s?c",        chips: ["cáp s?c", "cáp", "cable", "dây s?c"] },
  { label: "Mi?ng dán",      chips: ["mi?ng dán", "c??ng l?c", "kính"] },
  { label: "G?y selfie",     chips: ["g?y selfie", "g?y", "selfie"] },
];

// Accessory compatibility tokens the Accessories page filters by.
const ACCESSORY_COMPAT_TAGS = ["iPhone", "Samsung", "Xiaomi", "OPPO", "Universal","Apple","VIVO"];

const ACCESSORY_UMBRELLA = "accessory";

const SPEC_LABELS = [
  "H? ?i?u hành",
  "Chipset",
  "B? nh? trong",
  "Lo?i CPU",
  "GPU",
  "Kích th??c màn hình",
  "Công ngh? màn hình",
  "?? phân gi?i màn hình",
  "Camera Sau",
  "Camera tr??c",
  "H? tr? m?ng",
  "Th? SIM",
  "Công ngh? NFC",
  "Th?i ?i?m ra m?t",
  "Pin",
  "S?c",
  "B?o m?t",
  "RAM",
  "Th? nh?",
];

const EMPTY_FORM = {
  name: "",
  price: "",
  tags: "",
  description: "",
  specifications: {} as Record<string, string>,
  stock: "10",
};

function ProductsTab({ products }: { products: Product[] }) {
  const queryClient = useQueryClient();

  // -- State ----------------------------------------------
  const [formTab, setFormTab] = useState<"quick" | "full">("quick");
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");

  // Quick form
  const [quickForm, setQuickForm] = useState({ name: "", price: "" });
  const [quickImage, setQuickImage] = useState<File | null>(null);
  const [quickTagChips, setQuickTagChips] = useState<string[]>([]);

  // Full form
  const [fullForm, setFullForm] = useState(EMPTY_FORM);
  const [fullImage, setFullImage] = useState<File | null>(null);
  const [fullTagChips, setFullTagChips] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // -- Spec helpers ---------------------------------------
  const buildSpecsStr = (specs: Record<string, string>) =>
    SPEC_LABELS
      .map((l) => {
        const v = specs[l]?.trim();
        return v ? `${l}: ${v}` : "";
      })
      .filter(Boolean)
      .join("\n");

  const parseSpecsStr = (str: string): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const label of SPEC_LABELS) {
      const lines = str.split("\n");
      for (const line of lines) {
        const lower = line.toLowerCase();
        const pat = label.toLowerCase();
        if (
          lower.startsWith(pat + ":") ||
          lower.startsWith(pat + " ?") ||
          lower.startsWith(pat + " -")
        ) {
          const parts = line.split(/[:??]/);
          if (parts.length >= 2) {
            result[label] = parts.slice(1).join(":").trim();
          }
        }
      }
    }
    return result;
  };

  // -- Mutations -------------------------------------------
  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Hình ?nh b?t bu?c");
      const fd = new FormData();
      fd.append("name", quickForm.name);
      fd.append("price", quickForm.price);
      fd.append("tags", quickTagChips.join(","));
      fd.append("image", quickImage);
      return adminApi.quickAddProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuickForm({ name: "", price: "" });
      setQuickTagChips([]);
      setQuickImage(null);
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const fullMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", fullForm.name);
      fd.append("price", fullForm.price);
      fd.append("tags", fullTagChips.join(","));
      fd.append("description", fullForm.description);
      fd.append("specifications", buildSpecsStr(fullForm.specifications));
      fd.append("stock", fullForm.stock);
      if (fullImage) fd.append("image", fullImage);
      return editing ? adminApi.updateProduct(editing.id, fd) : adminApi.createProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      setFullForm(EMPTY_FORM);
      setFullTagChips([]);
      setFullImage(null);
      setFormTab("quick");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await adminApi.deleteProduct(id);
      return resp.data as { ok: boolean; soft_deleted?: boolean; order_items?: number; message?: string };
    },
    onSuccess: (data) => {
      if (data?.soft_deleted) {
        setInfo(
          data.message ||
            `S?n ph?m ?ã ???c ?n kh?i c?a hàng (còn ${data.order_items ?? 0} ??n hàng tham chi?u ? không th? xóa hoàn toàn ?? gi? l?ch s?).`,
        );
      } else {
        setInfo("?ã xóa hoàn toàn s?n ph?m kh?i database.");
      }
      setError("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : err.message || "Xóa th?t b?i";
      setError(typeof message === "string" ? message : "Xóa th?t b?i");
      setInfo("");
    },
  });

  // -- Handlers ------------------------------------------
  // Edit needs the FULL product (description + specifications). The
  // listProducts() endpoint deliberately drops those to keep the table
  // payload small, so we fetch them on demand here.
  const editQuery = useQuery({
    queryKey: ["admin-product", editing?.id],
    queryFn: async () => {
      if (!editing) return null;
      const { data } = await adminApi.getProduct(editing.id);
      return data;
    },
    enabled: !!editing,
    staleTime: 30_000,
  });

  const startEdit = (p: Product) => {
    setEditing(p);
    setFormTab("full");
    setError("");
    // Pre-populate the cheap fields immediately so the form looks
    // responsive; description/specs get patched in once the detail query
    // resolves.
    const chips = p.tags
      ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];
    setFullTagChips(chips);
    setFullForm({
      name: p.name,
      price: String(p.price),
      tags: p.tags,
      description: p.description ?? "",
      specifications: p.specifications ? parseSpecsStr(p.specifications) : {},
      stock: String(p.stock),
    });
    setFullImage(null);
  };

  // Once the detail query resolves, overwrite description/specifications
  // with the authoritative values from the backend.
  useEffect(() => {
    const data = editQuery.data;
    if (!data) return;
    setFullForm((prev) => ({
      ...prev,
      description: data.description ?? prev.description,
      specifications: data.specifications ? parseSpecsStr(data.specifications) : prev.specifications,
    }));
  }, [editQuery.data]);

  const cancelEdit = () => {
    setEditing(null);
    setFullForm(EMPTY_FORM);
    setFullTagChips([]);
    setFullImage(null);
    setFormTab("quick");
    setError("");
  };

  const handleDelete = async (p: Product) => {
    const ok = window.confirm(
      `Xaa "${p.name}"?\n\n` +
        `? Nau s?n ph?m chua t?ng duac d?t h?ng, s? b? xaa hoan toan kh?i database.\n` +
        `? N?u ?ã có ??n hàng tham chi?u, s?n ph?m s? ???c ?N (gi? l?ch s? ??n).\n\n` +
        `Hanh d?ng n?y KHaNG TH? hoan t?c d?i v?i xaa hoan toan.`,
    );
    if (!ok) return;
    deleteMutation.mutate(p.id);
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const { data } = await adminApi.importDocx(file);
      setFullForm((prev) => ({ ...prev, description: data.html || prev.description }));
    } catch {
      setError("Nh?p file DOCX th?t b?i.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const toggleTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!quickTagChips.includes(t)) setQuickTagChips((p) => [...p, t]);
    if (!fullTagChips.includes(t)) setFullTagChips((p) => [...p, t]);
  };

  // Returns the union of accessory-category chips + compatibility chips that
  // are currently selected, used to drive auto-toggling of the umbrella tag.
  const accessoryChipsSelected = (chips: string[]): string[] => {
    const all = new Set<string>();
    for (const grp of ACCESSORY_CATEGORY_TAGS) {
      grp.chips.forEach((c) => all.add(c));
    }
    ACCESSORY_COMPAT_TAGS.forEach((c) => all.add(c.toLowerCase()));
    return chips.filter((c) => all.has(c));
  };

  const removeQuickTag = (t: string) => {
    setQuickTagChips((p) => {
      const next = p.filter((x) => x !== t);
      const accChips = accessoryChipsSelected(next);
      if (accChips.length > 0 && !next.includes(ACCESSORY_UMBRELLA)) return [...next, ACCESSORY_UMBRELLA];
      if (accChips.length === 0 && next.includes(ACCESSORY_UMBRELLA)) return next.filter((x) => x !== ACCESSORY_UMBRELLA);
      return next;
    });
  };
  const removeFullTag = (t: string) => {
    setFullTagChips((p) => {
      const next = p.filter((x) => x !== t);
      const accChips = accessoryChipsSelected(next);
      if (accChips.length > 0 && !next.includes(ACCESSORY_UMBRELLA)) return [...next, ACCESSORY_UMBRELLA];
      if (accChips.length === 0 && next.includes(ACCESSORY_UMBRELLA)) return next.filter((x) => x !== ACCESSORY_UMBRELLA);
      return next;
    });
  };

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold text-warmwhite">Qu?n lý s?n ph?m</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm s?n ph?m..."
          className="input-field w-full sm:w-64"
        />
      </div>

      {/* Tag presets ? phones + categories + compatibility */}
      <div className="mb-4 space-y-3">
        {/* Phone / general chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-softgray">
            San ph?m
          </span>
          {PHONE_TAG_PRESETS.map((t) => (
            <ChipButton
              key={t}
              tag={t}
              selected={
                quickTagChips.includes(t.toLowerCase()) ||
                fullTagChips.includes(t.toLowerCase())
              }
              onToggle={toggleTag}
            />
          ))}
        </div>

        {/* Accessory umbrella chip (toggleable manually too) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-rose">
            Ph? ki?n
          </span>
          <ChipButton
            tag={ACCESSORY_UMBRELLA}
            label="accessory"
            selected={
              quickTagChips.includes(ACCESSORY_UMBRELLA) ||
              fullTagChips.includes(ACCESSORY_UMBRELLA)
            }
            onToggle={(t) => {
              const lc = t.toLowerCase();
              setQuickTagChips((p) =>
                p.includes(lc) ? p.filter((x) => x !== lc) : [...p, lc]
              );
              setFullTagChips((p) =>
                p.includes(lc) ? p.filter((x) => x !== lc) : [...p, lc]
              );
            }}
          />
          <span className="text-[11px] text-softgray">
            (t? d?ng b?t khi ch?n danh màc / tuong th?ch b?n duai)
          </span>
        </div>

        {/* Accessory categories */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-softgray">
            ? Danh m?c
          </span>
          {ACCESSORY_CATEGORY_TAGS.flatMap((cat) =>
            cat.chips.map((c) => (
              <ChipButton
                key={c}
                tag={c}
                selected={
                  quickTagChips.includes(c) || fullTagChips.includes(c)
                }
                onToggle={(tag) => {
                  const lc = tag.toLowerCase();
                  setQuickTagChips((p) => {
                    if (p.includes(lc)) return p.filter((x) => x !== lc);
                    const next = [...p, lc];
                    if (!next.includes(ACCESSORY_UMBRELLA))
                      next.push(ACCESSORY_UMBRELLA);
                    return next;
                  });
                  setFullTagChips((p) => {
                    if (p.includes(lc)) return p.filter((x) => x !== lc);
                    const next = [...p, lc];
                    if (!next.includes(ACCESSORY_UMBRELLA))
                      next.push(ACCESSORY_UMBRELLA);
                    return next;
                  });
                }}
              />
            ))
          )}
        </div>

        {/* Compatibility */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-softgray">
            ? Tuong th?ch
          </span>
          {ACCESSORY_COMPAT_TAGS.map((t) => {
            const lc = t.toLowerCase();
            return (
              <ChipButton
                key={t}
                tag={t}
                label={t}
                selected={
                  quickTagChips.includes(lc) || fullTagChips.includes(lc)
                }
                onToggle={(tag) => {
                  const lower = tag.toLowerCase();
                  setQuickTagChips((p) => {
                    if (p.includes(lower)) return p.filter((x) => x !== lower);
                    const next = [...p, lower];
                    if (!next.includes(ACCESSORY_UMBRELLA))
                      next.push(ACCESSORY_UMBRELLA);
                    return next;
                  });
                  setFullTagChips((p) => {
                    if (p.includes(lower)) return p.filter((x) => x !== lower);
                    const next = [...p, lower];
                    if (!next.includes(ACCESSORY_UMBRELLA))
                      next.push(ACCESSORY_UMBRELLA);
                    return next;
                  });
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Form tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-charcoal p-1 border border-white\/10 w-fit">
        <button
          onClick={() => { setFormTab("quick"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
            formTab === "quick" ? "bg-crimson text-white" : "text-softgray hover:text-warmwhite"
          }`}
        >
          Thêm nhanh
        </button>
        <button
          onClick={() => { setFormTab("full"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
            formTab === "full" ? "bg-crimson text-white" : "text-softgray hover:text-warmwhite"
          }`}
        >
          Thêm ??y ??
        </button>
      </div>

      {/* -- Quick add form -- */}
      {formTab === "quick" && (
        <form
          onSubmit={(e) => { e.preventDefault(); quickMutation.mutate(); }}
          className="mb-6 space-y-4 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5"
        >
          <h3 className="text-base font-bold text-aurora-cyan">Thêm s?n ph?m nhanh</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input
              required
              placeholder="Tên s?n ph?m (VD: iPhone 15 Pro)"
              value={quickForm.name}
              onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
              className="input-field"
            />
            <input
              required
              type="number"
              step="1000"
              placeholder="Gi? (VND)"
              value={quickForm.price}
              onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
              className="input-field"
            />
            <div>
              <label className="mb-1 block text-xs text-softgray">Hình ?nh s?n ph?m</label>
              <input
                required
                type="file"
                accept="image/*"
                onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
                className="text-sm text-softgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crimson file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </div>
          </div>
          {/* Selected quick tags */}
          <div>
            <label className="mb-1.5 block text-xs text-softgray">Nhãn ?ã ch?n:</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {quickTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => removeQuickTag(t)} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">?</button>
                </span>
              ))}
              {quickTagChips.length === 0 && (
                <span className="text-xs text-softgray italic">Nh?n nh?n b?n tr?n d? ch?n...</span>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={quickMutation.isPending} className="btn-primary">
            {quickMutation.isPending ? "?ang thêm..." : "Thêm s?n ph?m"}
          </button>
        </form>
      )}

      {/* -- Full add/edit form -- */}
      {formTab === "full" && (
        <form
          onSubmit={(e) => { e.preventDefault(); fullMutation.mutate(); }}
          className="mb-6 space-y-6 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5"
        >
          <h3 className="text-base font-bold text-warmwhite flex items-center gap-2">
            {editing ? `S?a: ${editing.name}` : "Thêm s?n ph?m ??y ??"}
            {editing && editQuery.isFetching && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-softgray">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                dang t?i m? t? + th?ng s??
              </span>
            )}
            {editing && editQuery.isError && (
              <span className="text-xs font-normal text-aurora-pink">
                ?? Không t?i ???c mô t?/thông s?. V?n có th? l?u.
              </span>
            )}
          </h3>

          {/* Name, Price, Stock */}
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              placeholder="Tên s?n ph?m"
              value={fullForm.name}
              onChange={(e) => setFullForm({ ...fullForm, name: e.target.value })}
              className="input-field"
            />
            <input
              required
              type="number"
              step="1000"
              placeholder="Gi? (VND)"
              value={fullForm.price}
              onChange={(e) => setFullForm({ ...fullForm, price: e.target.value })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="S? l??ng t?n kho"
              value={fullForm.stock}
              onChange={(e) => setFullForm({ ...fullForm, stock: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Selected full tags */}
          <div>
            <label className="mb-1.5 block text-xs text-softgray">Nhãn ?ã ch?n:</label>
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {fullTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => removeFullTag(t)} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">?</button>
                </span>
              ))}
              {fullTagChips.length === 0 && (
                <span className="text-xs text-softgray italic self-center">Nh?n nh?n b?n tr?n d? ch?n...</span>
              )}
            </div>
          </div>

          {/* Description ? Tiptap + DOCX import */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-softgray font-medium">Mô t? s?n ph?m (h? tr? DOCX)</label>
              <label className="btn-secondary cursor-pointer text-xs py-1.5 px-3">
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleImportDocx}
                  disabled={importing}
                />
                {importing ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    ?ang nh?p...
                  </span>
                ) : "Nh?p t? DOCX"}
              </label>
            </div>
            <RichTextEditor
              value={fullForm.description}
              onChange={(html) => setFullForm((prev) => ({ ...prev, description: html }))}
              placeholder="Nh?p mô t? s?n ph?m... H? tr? in ??m, in nghiêng, tiêu ??, danh sách, ?nh..."
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm text-softgray font-medium mb-3">Thông s? k? thu?t</label>
            <div className="grid gap-3 md:grid-cols-2">
              {SPEC_LABELS.map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-sm text-softgray w-48 shrink-0">{label}</label>
                  <input
                    type="text"
                    value={fullForm.specifications[label] || ""}
                    onChange={(e) =>
                      setFullForm((prev) => ({
                        ...prev,
                        specifications: { ...prev.specifications, [label]: e.target.value },
                      }))
                    }
                    placeholder="?"
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1.5 block text-sm text-softgray">
              Hình ?nh {editing ? "(b? tr?ng ?? gi? hình c?)" : ""}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFullImage(e.target.files?.[0] ?? null)}
              className="text-sm text-softgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-aurora-pink\/30 bg-aurora-pink\/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={fullMutation.isPending} className="btn-primary">
              {fullMutation.isPending ? "?ang l?u..." : editing ? "C?p nh?t" : "Thêm s?n ph?m"}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Hay
              </button>
            )}
          </div>
        </form>
      )}

      {/* Products table */}
      <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white\/10 px-4 py-3">
          <span className="text-sm text-softgray">{filtered.length} s?n ph?m</span>
        </div>
        {(info || deleteMutation.isError || error) && (
          <div
            className={`mx-4 mt-3 rounded-lg border p-3 text-sm ${
              deleteMutation.isError || error
                ? "border-aurora-pink\/30 bg-aurora-pink\/10 text-rose"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {deleteMutation.isError || error
              ? error || "Xóa th?t b?i"
              : info}
            <button
              type="button"
              onClick={() => { setError(""); setInfo(""); deleteMutation.reset(); }}
              className="ml-3 text-xs underline opacity-70 hover:opacity-100"
            >
              d?ng
            </button>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-softgray">Không có s?n ph?m nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white\/10 bg-charcoal/50">
              <tr className="text-left text-softgray">
                <th className="px-4 py-3">Hình ?nh</th>
                <th className="px-4 py-3">Tên s?n ph?m</th>
                <th className="px-4 py-3">Gi?</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">T?n kho</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const tagChips = p.tags
                  ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                  : [];
                return (
                  <tr
                    key={p.id}
                    className="border-t border-white\/10 hover:bg-charcoal/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                    </td>
                    <td className="px-4 py-3 font-medium text-warmwhite max-w-[200px] truncate">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-crimson">
                      {new Intl.NumberFormat("vi-VN").format(p.price)} VND
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tagChips.map((t: string) => (
                          <span key={t} className="tag-badge">{t}</span>
                        ))}
                        {tagChips.length === 0 && <span className="text-xs text-softgray">?</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 5 ? "text-aurora-pink font-semibold" : "text-warmwhite"}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-sm text-crimson hover:text-aurora-cyan transition-colors"
                        >
                          Saa
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-aurora-pink hover:text-rose transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending && deleteMutation.variables === p.id
                            ? "?ang xóa..."
                            : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// -- Orders Tab ---------------------------------------------
function OrdersTab({ orders }: { orders: Order[] }) {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lat, setLat] = useState(10.7769);
  const [lng, setLng] = useState(106.7009);
  const [status, setStatus] = useState<OrderStatus>("in_transit");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const filtered = orders.filter((o) => !filterStatus || o.status === filterStatus);

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateLocation(selectedOrder!.id, { current_lat: lat, current_lng: lng, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const selectOrder = (o: Order) => {
    setSelectedOrder(o); setLat(o.current_lat || 10.7769); setLng(o.current_lng || 106.7009);
    setStatus(o.status); setSuccess(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-warmwhite">Qu?n lý ??n hàng</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-48">
          <option value="">Tat c? tr?ng th?i</option>
          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl overflow-hidden">
          <div className="border-b border-white\/10 px-4 py-3">
            <span className="text-sm text-softgray">{filtered.length} ??n hàng</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-softgray">Ch?a có ??n hàng nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white\/10 bg-charcoal/50">
                <tr className="text-left text-softgray">
                  <th className="px-4 py-3">M?</th>
                  <th className="px-4 py-3">Tr?ng thái</th>
                  <th className="px-4 py-3">??a ch?</th>
                  <th className="px-4 py-3">Xem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className={`cursor-pointer border-t border-white\/10 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-crimson\/10" : "hover:bg-charcoal/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-warmwhite">{order.tracking_code}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-crimson\/10 px-2.5 py-0.5 text-xs font-medium capitalize text-crimson">
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-softgray">{order.delivery_address}</td>
                    <td className="px-4 py-3">
                      <Link to={`/track/${order.tracking_code}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-crimson hover:text-aurora-cyan transition-colors">
                        Theo dõi ?
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5 space-y-4">
          <h2 className="font-bold text-warmwhite">C?p nh?t v? trí giao hàng</h2>
          {selectedOrder ? (
            <>
              <div className="rounded-lg border border-white\/10 bg-charcoal p-3 text-sm">
                <p className="font-medium text-warmwhite">??n: {selectedOrder.tracking_code}</p>
                <p className="text-xs text-softgray mt-0.5">{selectedOrder.delivery_address}</p>
              </div>
              <AdminMapPicker lat={lat} lng={lng} onChange={(l, g) => { setLat(l); setLng(g); }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-softgray">Vi d?</label>
                  <input type="number" step="any" value={lat}
                    onChange={(e) => setLat(Number(e.target.value))} className="input-field text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-softgray">Kinh d?</label>
                  <input type="number" step="any" value={lng}
                    onChange={(e) => setLng(Number(e.target.value))} className="input-field text-xs" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-softgray">Tr?ng thái</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="input-field">
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-crimson/30 bg-crimson\/10 p-3 text-sm text-aurora-cyan">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  C?p nh?t thành công!
                </div>
              )}
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
                className="btn-primary w-full">
                {updateMutation.isPending ? "?ang c?p nh?t..." : "G?i c?p nh?t v? trí"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white\/5">
                <svg className="h-7 w-7 text-softgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-sm text-softgray">Ch?n màt don h?ng d? cóp nh?t v? tr? giao h?ng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Blog Tab -----------------------------------------------
function BlogTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [tagInput, setTagInput] = useState("");
  const [tagChips, setTagChips] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<import("../../types").BlogPost | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => { const { data } = await adminBlogApi.list(); return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title); fd.append("content", form.content);
      fd.append("tags", tagChips.join(","));
      if (image) fd.append("image", image);
      return editing ? adminBlogApi.update(editing.id, fd) : adminBlogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setForm({ title: "", content: "", tags: "" }); setTagChips([]); setImage(null); setCoverPreview(null); setEditing(null); setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminBlogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Tiêu ?? không ???c ?? tr?ng"); return; }
    if (!form.content.trim() || form.content === "<p></p>") { setError("N?i dung không ???c ?? tr?ng"); return; }
    setError(""); saveMutation.mutate();
  };

  const addTagChip = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tagChips.includes(t)) {
      setTagChips((prev) => [...prev, t]);
    }
    setTagInput("");
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setError("");
    try {
      const { data } = await adminBlogApi.importDocx(file);
      setForm((prev) => ({ ...prev, title: data.title || prev.title, content: data.html || prev.content }));
      if (data.cover_image_url) setCoverPreview(data.cover_image_url);
    } catch {
      setError("Nh?p file DOCX th?t b?i.");
    } finally { setImporting(false); e.target.value = ""; }
  };

  if (isLoading) return <LoadingSpinner label="?ang t?i blog..." />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Qu?n lý Blog</h1>

      {/* Editor */}
      <div className="mb-6 space-y-4 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5">
        <h2 className="text-base font-bold text-warmwhite">
          {editing ? `S?a bài: ${editing.title}` : "Vi?t bài m?i"}
        </h2>
        <input required placeholder="Tiêu ?? bài vi?t" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field text-lg font-semibold" />

        {/* Tags chips */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-softgray">Nhãn (Tags)</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tagChips.map((t) => (
              <span key={t} className="tag-badge flex items-center gap-1">
                {t}
                <button type="button" onClick={() => setTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">?</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              list="blog-tags-datalist"
              placeholder="Gõ nhãn (VD: tech, review, tips)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagChip(tagInput); } }}
              className="input-field flex-1"
            />
            <button type="button" onClick={() => addTagChip(tagInput)} className="btn-secondary">+ Th?m</button>
            <datalist id="blog-tags-datalist">
              {["tech", "review", "tips", "news", "guide"].map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-softgray">Nh?p t? DOCX</label>
            <label className="btn-secondary cursor-pointer">
              <input type="file" accept=".docx" className="hidden" onChange={handleImportDocx} disabled={importing} />
              {importing ? "?ang nh?p..." : "Ch?n file DOCX"}
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-sm text-softgray">?nh ??i di?n {editing ? "(b? tr?ng ?? gi? ?nh c?)" : ""}</label>
            <input type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null; setImage(file);
                if (file) { const r = new FileReader(); r.onload = (ev) => setCoverPreview(ev.target?.result as string); r.readAsDataURL(file); }
                else setCoverPreview(null);
              }}
              className="text-sm text-softgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
            {(coverPreview || (editing && editing.image_url)) && (
              <img src={coverPreview ?? editing?.image_url ?? ""} alt="" className="mt-2 h-16 w-24 rounded-lg object-cover" />
            )}
          </div>
        </div>
        {error && <div className="rounded-lg border border-aurora-pink\/30 bg-aurora-pink\/10 p-3 text-sm text-rose">{error}</div>}
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? "?ang luu..." : editing ? "Cap nh?t b?i viat" : "?ang b?i viat"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: "", content: "", tags: "" }); setTagChips([]); setImage(null); setCoverPreview(null); }}
              className="btn-secondary">Hay</button>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white\/10 px-4 py-3">
          <span className="text-sm text-softgray">{posts.length} bài vi?t</span>
        </div>
        {posts.length === 0 ? (
          <div className="p-8 text-center text-softgray">Chua c? b?i viat n?o.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white\/10 bg-charcoal/50">
              <tr className="text-left text-softgray">
                <th className="px-4 py-3">?nh</th>
                <th className="px-4 py-3">Tiêu ??</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác gi?</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const postTags = post.tags ? post.tags.split(",").filter(Boolean) : [];
                return (
                  <tr key={post.id} className="border-t border-white\/10 hover:bg-charcoal/30 transition-colors">
                    <td className="px-4 py-3">
                      {post.image_url && <img src={post.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-warmwhite max-w-[200px] truncate">{post.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {postTags.length > 0
                          ? postTags.map((t: string) => <span key={t} className="tag-badge">{t}</span>)
                          : <span className="text-softgray text-xs">?</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-softgray">{post.slug}</td>
                    <td className="px-4 py-3 text-softgray">{post.author_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => {
                          setEditing(post as import("../../types").BlogPost);
                          setForm({ title: post.title, content: (post as import("../../types").BlogPost).content, tags: post.tags });
                          setTagChips(postTags);
                          setImage(null); setCoverPreview(null);
                        }}
                          className="text-sm text-crimson hover:text-aurora-cyan transition-colors">Saa</button>
                        <button onClick={() => { if (confirm(`Xaa "${post.title}"?`)) deleteMutation.mutate(post.id); }}
                          className="text-sm text-aurora-pink hover:text-rose transition-colors">Xaa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// -- Settings Tab --------------------------------------------
function SettingsTab() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => { const { data } = await adminApi.listAdminEmails(); return data; },
  });

  const addMutation = useMutation({
    mutationFn: (email: string) => adminApi.addAdminEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
      setNewEmail(""); setAddSuccess("?? th?m email th?nh cóng."); setAddError("");
      setTimeout(() => setAddSuccess(""), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Th?m th?t b?i.";
      setAddError(msg);
      setAddSuccess("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminEmail(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-emails"] }),
  });

  if (isLoading) return <LoadingSpinner label="?ang t?i..." />;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Cai d?t</h1>
      <p className="mb-6 text-sm text-softgray">Quan l? email nh?n th?ng b?o don h?ng</p>

      <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-6">
        <h2 className="mb-4 text-base font-semibold text-warmwhite">Email nh?n th?ng b?o don h?ng</h2>

        {emails.length === 0 ? (
          <p className="py-6 text-center text-sm text-softgray">Chua c? email n?o duac th?m.</p>
        ) : (
          <ul className="mb-4 divide-y divide-gunmetal/40">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm text-warmwhite">{e.email}</span>
                  <span className="ml-2 text-xs text-softgray">{new Date(e.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(e.id)}
                  className="ml-4 flex-shrink-0 rounded-lg px-3 py-1.5 text-xs text-rose hover:bg-aurora-pink\/10 transition-colors">
                  Xaa
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={(e) => { e.preventDefault(); if (newEmail.trim()) addMutation.mutate(newEmail.trim()); }}
          className="mt-6 flex gap-3">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="admin@example.com" className="input-field flex-1" />
          <button type="submit" disabled={addMutation.isPending || !newEmail.trim()}
            className="btn-primary whitespace-nowrap disabled:opacity-60">
            {addMutation.isPending ? "?ang th?m..." : "Th?m email"}
          </button>
        </form>

        {addError && <p className="mt-2 text-sm text-rose">{addError}</p>}
        {addSuccess && <p className="mt-2 text-sm text-aurora-cyan">{addSuccess}</p>}
      </div>
    </div>
  );
}

// -- Media Tab ----------------------------------------------
function MediaTab({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(products[0]?.id ?? null);
  const [filter, setFilter] = useState("");

  const filtered = products.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const target = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Hanh ?nh & Video s?n ph?m</h1>
      <p className="mb-6 text-sm text-softgray">
        Ch?n màt s?n ph?m d? xem v? quan l? gallery (?nh + video). ?nh d?u tian (cover) s? duac
        d?ng l?m thumbnail s?n ph?m tr?n toan trang.
      </p>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-4">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm s?n ph?m..."
            className="input-field mb-3"
          />
          <div className="max-h-[64vh] overflow-y-auto space-y-1.5">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-softgray">Kh?ng t?m th?y.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                    selectedId === p.id
                      ? "border-crimson bg-crimson\/10"
                      : "border-white\/10 bg-charcoal hover:border-silvergray/40"
                  }`}
                >
                  <img src={p.image_url} alt="" className="h-9 w-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                    <p className="text-[10px] text-softgray">#{p.id}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          {target ? (
            <ProductGalleryEditor product={target} />
          ) : (
            <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-10 text-center text-softgray">
              Ch?n màt s?n ph?m b?n tr?i d? b?t d?u.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGalleryEditor({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [nextIsCover, setNextIsCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["product-media", product.id],
    queryFn: async () => {
      const { data } = await adminApi.listProductMedia(product.id);
      return data;
    },
    enabled: Boolean(product?.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["product-media", product.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product", String(product.id)] });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        await adminApi.uploadProductMedia(product.id, f, nextIsCover && media.length === 0);
      }
      invalidate();
    } finally {
      setUploading(false);
    }
  };

  const setCover = (m: ProductMediaItem) =>
    adminApi.updateMedia(m.id, { is_cover: true }).then(invalidate);

  const deleteMedia = (m: ProductMediaItem) => {
    if (!confirm("Xaa h?nh ?nh/video n?y?")) return;
    adminApi.deleteMedia(m.id).then(invalidate);
  };

  return (
    <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-warmwhite">{product.name}</h2>
          <p className="text-xs text-softgray">M? s?n ph?m: #{product.id}</p>
        </div>
        <div className="text-xs text-softgray">
          {media.length} màc media
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white\/10 bg-charcoal/40 py-6 text-center hover:border-crimson cursor-pointer transition-colors"
      >
        <svg className="h-6 w-6 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-medium text-warmwhite">
          {uploading ? "?ang t?i l?n..." : "Kao th? hoac nh?n d? ch?n ?nh/video"}
        </span>
        <span className="text-[10px] text-softgray">JPG, PNG, WEBP, MP4, WEBM ? t?i da 100MB mài file</span>
        <span
          className="mt-2 inline-flex items-center gap-2 text-xs text-softgray"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="accent-rose"
            checked={nextIsCover}
            onChange={(e) => setNextIsCover(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          ??t file t?i l?n d?u tian l?m ?nh cover
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner label="?ang t?i gallery..." />
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-white\/10 bg-charcoal p-8 text-center text-sm text-softgray">
          San ph?m n?y chua c? ?nh/video trong gallery. Hian dang d?ng ?nh thumbnail màc d?nh.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className="relative overflow-hidden rounded-xl border border-white\/10 bg-charcoal">
              <div className="aspect-square">
                {m.media_type === "video" ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              {m.is_cover && (
                <span className="absolute left-2 top-2 rounded-full bg-crimson px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  Cover
                </span>
              )}
              {m.media_type === "video" && (
                <span className="absolute right-2 top-2 rounded-full bg-charcoal/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Video
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-charcoal/95 to-transparent p-2 opacity-100">
                {!m.is_cover && (
                  <button
                    onClick={() => setCover(m)}
                    className="rounded-lg bg-crimson px-2 py-1 text-[10px] font-semibold text-white hover:bg-raspberry"
                  >
                    ??t l?m cover
                  </button>
                )}
                <button
                  onClick={() => deleteMedia(m)}
                  className="ml-auto rounded-lg bg-deeprose px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose"
                >
                  Xaa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Coupons Tab ----------------------------------------------
function CouponsTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    min_order_total: 0,
    max_discount: null as number | null,
    usage_limit: null as number | null,
    starts_at: "",
    expires_at: "",
  });
  const [error, setError] = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data } = await adminCouponsApi.list();
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => adminCouponsApi.create({
      code: form.code,
      description: form.description,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_total: Number(form.min_order_total || 0),
      max_discount: form.max_discount,
      usage_limit: form.usage_limit,
      starts_at: form.starts_at,
      expires_at: form.expires_at,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setForm({ ...form, code: "", description: "", discount_value: 10 });
      setError("");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Lai t?o coupon";
      setError(typeof msg === "string" ? msg : "Lai t?o coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? adminCouponsApi.update(editing.id, {
      description: form.description,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_total: Number(form.min_order_total || 0),
      max_discount: form.max_discount,
      usage_limit: form.usage_limit,
      starts_at: form.starts_at,
      expires_at: form.expires_at,
    }) : Promise.reject("no editing"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCouponsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const startEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_total: c.min_order_total,
      max_discount: c.max_discount,
      usage_limit: c.usage_limit,
      starts_at: c.starts_at,
      expires_at: c.expires_at,
    });
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Quan l? m? giam gi? (Coupon)</h1>
      <p className="mb-6 text-sm text-softgray">Tao v? quan l? cóc m? giam gi? ?p d?ng ? buac thanh toan.</p>

      <div className="mb-6 rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-5 space-y-3">
        <h2 className="text-base font-bold text-warmwhite">{editing ? `Saa: ${editing.code}` : "Tao coupon mài"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-softgray">M? (CODE)</label>
            <input
              disabled={!!editing}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VD: SALE10"
              className="input-field font-mono uppercase"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">M? t?</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="VD: Giam 10% cho don =3 triau"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">Loai giam gi?</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
              className="input-field"
            >
              <option value="percent">Ph?n tram (%)</option>
              <option value="fixed">S? tian c? d?nh (VND)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">
              Gi? tr? {form.discount_type === "percent" ? "(1?100)" : "(VND)"}
            </label>
            <input
              type="number"
              min={0}
              step={form.discount_type === "percent" ? 1 : 1000}
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">?on h?ng t?i thiau (VND)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.min_order_total}
              onChange={(e) => setForm({ ...form, min_order_total: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">Giam t?i da (VND, kh?ng b?t buac)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.max_discount ?? ""}
              onChange={(e) => setForm({ ...form, max_discount: e.target.value === "" ? null : Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">S? luat t?i da (0 = kh?ng giai h?n)</label>
            <input
              type="number"
              min={0}
              value={form.usage_limit ?? ""}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value === "" ? null : Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">Bat d?u (t?y ch?n)</label>
            <input
              type="text"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              placeholder="2025-01-01"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-softgray">Hat h?n (t?y ch?n)</label>
            <input
              type="text"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              placeholder="2026-01-01"
              className="input-field"
            />
          </div>
        </div>
        {error && <p className="text-sm text-rose">{error}</p>}
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? "?ang luu..." : "Cap nh?t"}
              </button>
              <button onClick={() => { setEditing(null); }} className="btn-secondary">Hay</button>
            </>
          ) : (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.code} className="btn-primary">
              {createMutation.isPending ? "?ang t?o..." : "Tao coupon"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="?ang t?i coupon..." />
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl p-8 text-center text-sm text-softgray">
          Chua c? coupon n?o.
        </div>
      ) : (
        <div className="rounded-2xl border border-white\/10 bg-graphite\/80 backdrop-blur-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white\/10 bg-charcoal/50">
              <tr className="text-left text-softgray">
                <th className="px-4 py-3">M?</th>
                <th className="px-4 py-3">M? t?</th>
                <th className="px-4 py-3">Giam</th>
                <th className="px-4 py-3">Tai thiau</th>
                <th className="px-4 py-3">?? d?ng / Giai h?n</th>
                <th className="px-4 py-3">Tr?ng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-white\/10 hover:bg-charcoal/30">
                  <td className="px-4 py-3 font-mono font-bold text-warmwhite">{c.code}</td>
                  <td className="px-4 py-3 text-softgray max-w-[220px] truncate">{c.description || "?"}</td>
                  <td className="px-4 py-3 text-crimson font-semibold">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `${new Intl.NumberFormat("vi-VN").format(c.discount_value)}?`}
                  </td>
                  <td className="px-4 py-3 text-softgray">
                    {c.min_order_total ? `${new Intl.NumberFormat("vi-VN").format(c.min_order_total)}?` : "?"}
                  </td>
                  <td className="px-4 py-3 text-softgray">
                    {c.usage_count}/{c.usage_limit ?? "8"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.active ? "bg-emerald/15 text-emerald" : "bg-deeprose/15 text-rose"}`}>
                      {c.active ? "Hoat d?ng" : "Tat"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-sm text-crimson hover:text-aurora-cyan">Saa</button>
                      <button onClick={() => { if (confirm(`Xaa m? ${c.code}?`)) deleteMutation.mutate(c.id); }} className="text-sm text-aurora-pink hover:text-rose">Xaa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
