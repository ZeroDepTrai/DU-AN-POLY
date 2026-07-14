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
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminMapPicker from "../../components/AdminMapPicker";
import RichTextEditor from "../../components/RichTextEditor";
import type { Order, OrderStatus, Product } from "../../types";

type Tab = "dashboard" | "products" | "orders" | "blog" | "media" | "coupons" | "spin" | "settings";

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
    label: "Sản phẩm",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Hình ảnh / Video",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 10l-4 4m0-4l4 4M3 17l5-5 7 7" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Đơn hàng",
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
    id: "settings",
    label: "Cài đặt",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped", label: "Đã xuất kho" },
  { value: "in_transit", label: "Đang giao hàng" },
  { value: "delivered", label: "Đã giao" },
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
    <div className="flex min-h-screen bg-charcoal">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gunmetal/40 bg-graphite md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gunmetal/40 px-4">
          <a href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </a>
          <a href="/" className="font-bold text-warmwhite hover:text-sakura transition-colors">CellZone</a>
          <span className="ml-auto rounded-full bg-crimson/10 px-2 py-0.5 text-xs font-semibold text-crimson">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-crimson/10 text-crimson"
                  : "text-steelgray hover:bg-gunmetal/40 hover:text-warmwhite"
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
        <div className="flex gap-1 overflow-x-auto border-b border-gunmetal/40 bg-graphite p-2 md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-crimson text-white"
                  : "text-steelgray hover:bg-gunmetal/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner label="Đang tải dashboard..." />
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardTab products={products} orders={orders} />}
              {activeTab === "products" && <ProductsTab products={products} />}
              {activeTab === "orders" && <OrdersTab orders={orders} />}
              {activeTab === "blog" && <BlogTab />}
              {activeTab === "media" && <MediaTab products={products} />}
              {activeTab === "coupons" && <CouponsTab />}
              {activeTab === "spin" && <SpinTab />}
              {activeTab === "settings" && <SettingsTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Dashboard Tab ────────────────────────────────────────────
function DashboardTab({ products, orders }: { products: Product[]; orders: Order[] }) {
  const lowStock = products.filter((p) => p.stock < 5);
  const totalRevenue = orders.reduce((s, o) => s + o.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0), 0);
  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-warmwhite">Xin chào, Admin</h1>
        <p className="mt-1 text-sm text-steelgray">Đây là bảng điều khiển của CellZone</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng sản phẩm", value: products.length, icon: "📱", color: "crimson" },
          { label: "Tổng đơn hàng", value: orders.length, icon: "📋", color: "sakura" },
          { label: "Tổng doanh thu", value: new Intl.NumberFormat("vi-VN").format(totalRevenue) + " VND", icon: "💰", color: "gold" },
          { label: "Cảnh báo tồn kho", value: lowStock.length, icon: "⚠️", color: "deeprose" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gunmetal/60 bg-graphite p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-steelgray">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-warmwhite">{stat.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mb-8 rounded-2xl border border-deeprose/30 bg-deeprose/10 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-deeprose">
            ⚠️ Cảnh báo tồn kho thấp
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-deeprose/20 bg-charcoal p-3">
                <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-medium text-warmwhite truncate max-w-[150px]">{p.name}</p>
                  <p className="text-xs text-deeprose">Chỉ còn {p.stock} sản phẩm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="flex items-center justify-between border-b border-gunmetal/40 px-5 py-4">
          <h2 className="font-bold text-warmwhite">Đơn hàng gần đây</h2>
          <span className="text-sm text-steelgray">{orders.length} đơn hàng</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Chưa có đơn hàng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal/50">
              <tr className="text-left text-steelgray">
                <th className="px-5 py-3">Mã theo dõi</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Địa chỉ</th>
                <th className="px-5 py-3">Theo dõi</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-gunmetal/40 hover:bg-charcoal/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-warmwhite">{order.tracking_code}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-xs font-medium capitalize text-crimson">
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-steelgray">{order.delivery_address}</td>
                  <td className="px-5 py-3">
                    <Link to={`/track/${order.tracking_code}`} className="text-sm text-crimson hover:text-sakura transition-colors">
                      Theo dõi →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────

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
          : "border border-gunmetal/60 bg-graphite text-steelgray hover:border-silvergray hover:text-warmwhite"
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

// Accessory category keywords — each maps onto the same keywords that the
// Accessories page filters by. Picking any chip also auto-toggles the
// umbrella "accessory" tag.
const ACCESSORY_CATEGORY_TAGS: { label: string; chips: string[] }[] = [
  { label: "Ốp lưng",        chips: ["ốp lưng", "ốp", "case"] },
  { label: "Tai nghe",       chips: ["tai nghe", "earphone", "earbud", "airpod"] },
  { label: "Sạc dự phòng",   chips: ["sạc dự phòng", "power bank", "powerbank"] },
  { label: "Cáp sạc",        chips: ["cáp sạc", "cáp", "cable", "dây sạc"] },
  { label: "Miếng dán",      chips: ["miếng dán", "cường lực", "kính"] },
  { label: "Gậy selfie",     chips: ["gậy selfie", "gậy", "selfie"] },
];

// Accessory compatibility tokens the Accessories page filters by.
const ACCESSORY_COMPAT_TAGS = ["iPhone", "Samsung", "Xiaomi", "OPPO", "Universal","Apple","VIVO"];

const ACCESSORY_UMBRELLA = "accessory";

const SPEC_LABELS = [
  "Hệ điều hành",
  "Chipset",
  "Bộ nhớ trong",
  "Loại CPU",
  "GPU",
  "Kích thước màn hình",
  "Công nghệ màn hình",
  "Độ phân giải màn hình",
  "Camera Sau",
  "Camera trước",
  "Hỗ trợ mạng",
  "Thẻ SIM",
  "Công nghệ NFC",
  "Thời điểm ra mắt",
  "Pin",
  "Sạc",
  "Bảo mật",
  "RAM",
  "Thẻ nhớ",
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

  // ── State ──────────────────────────────────────────────
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

  // ── Spec helpers ───────────────────────────────────────
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
          lower.startsWith(pat + " –") ||
          lower.startsWith(pat + " -")
        ) {
          const parts = line.split(/[:–—]/);
          if (parts.length >= 2) {
            result[label] = parts.slice(1).join(":").trim();
          }
        }
      }
    }
    return result;
  };

  // ── Mutations ───────────────────────────────────────────
  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Hình ảnh bắt buộc");
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
            `Sản phẩm đã được ẩn khỏi cửa hàng (còn ${data.order_items ?? 0} đơn hàng tham chiếu — không thể xóa hoàn toàn để giữ lịch sử).`,
        );
      } else {
        setInfo("Đã xóa hoàn toàn sản phẩm khỏi database.");
      }
      setError("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : err.message || "Xóa thất bại";
      setError(typeof message === "string" ? message : "Xóa thất bại");
      setInfo("");
    },
  });

  // ── Handlers ──────────────────────────────────────────
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
      `Xóa "${p.name}"?\n\n` +
        `• Nếu sản phẩm chưa từng được đặt hàng, sẽ bị xóa hoàn toàn khỏi database.\n` +
        `• Nếu đã có đơn hàng tham chiếu, sản phẩm sẽ được ẨN (giữ lịch sử đơn).\n\n` +
        `Hành động này KHÔNG THỂ hoàn tác đối với xóa hoàn toàn.`,
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
      setError("Nhập file DOCX thất bại.");
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
        <h1 className="text-2xl font-extrabold text-warmwhite">Quản lý sản phẩm</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="input-field w-full sm:w-64"
        />
      </div>

      {/* Tag presets — phones + categories + compatibility */}
      <div className="mb-4 space-y-3">
        {/* Phone / general chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-steelgray">
            Sản phẩm
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
            Phụ kiện
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
          <span className="text-[11px] text-steelgray">
            (tự động bật khi chọn danh mục / tương thích bên dưới)
          </span>
        </div>

        {/* Accessory categories */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-steelgray">
            · Danh mục
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
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-steelgray">
            · Tương thích
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
      <div className="mb-4 flex gap-1 rounded-xl bg-charcoal p-1 border border-gunmetal/40 w-fit">
        <button
          onClick={() => { setFormTab("quick"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
            formTab === "quick" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"
          }`}
        >
          Thêm nhanh
        </button>
        <button
          onClick={() => { setFormTab("full"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
            formTab === "full" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"
          }`}
        >
          Thêm đầy đủ
        </button>
      </div>

      {/* ── Quick add form ── */}
      {formTab === "quick" && (
        <form
          onSubmit={(e) => { e.preventDefault(); quickMutation.mutate(); }}
          className="mb-6 space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-5"
        >
          <h3 className="text-base font-bold text-sakura">Thêm sản phẩm nhanh</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input
              required
              placeholder="Tên sản phẩm (VD: iPhone 15 Pro)"
              value={quickForm.name}
              onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
              className="input-field"
            />
            <input
              required
              type="number"
              step="1000"
              placeholder="Giá (VND)"
              value={quickForm.price}
              onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
              className="input-field"
            />
            <div>
              <label className="mb-1 block text-xs text-steelgray">Hình ảnh sản phẩm</label>
              <input
                required
                type="file"
                accept="image/*"
                onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
                className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crimson file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </div>
          </div>
          {/* Selected quick tags */}
          <div>
            <label className="mb-1.5 block text-xs text-steelgray">Nhãn đã chọn:</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {quickTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => removeQuickTag(t)} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                </span>
              ))}
              {quickTagChips.length === 0 && (
                <span className="text-xs text-steelgray italic">Nhấn nhãn bên trên để chọn...</span>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={quickMutation.isPending} className="btn-primary">
            {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
          </button>
        </form>
      )}

      {/* ── Full add/edit form ── */}
      {formTab === "full" && (
        <form
          onSubmit={(e) => { e.preventDefault(); fullMutation.mutate(); }}
          className="mb-6 space-y-6 rounded-2xl border border-gunmetal/60 bg-graphite p-5"
        >
          <h3 className="text-base font-bold text-warmwhite flex items-center gap-2">
            {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm đầy đủ"}
            {editing && editQuery.isFetching && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-steelgray">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                đang tải mô tả + thông số…
              </span>
            )}
            {editing && editQuery.isError && (
              <span className="text-xs font-normal text-deeprose">
                — Không tải được mô tả/thông số. Vẫn có thể lưu.
              </span>
            )}
          </h3>

          {/* Name, Price, Stock */}
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              placeholder="Tên sản phẩm"
              value={fullForm.name}
              onChange={(e) => setFullForm({ ...fullForm, name: e.target.value })}
              className="input-field"
            />
            <input
              required
              type="number"
              step="1000"
              placeholder="Giá (VND)"
              value={fullForm.price}
              onChange={(e) => setFullForm({ ...fullForm, price: e.target.value })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Số lượng tồn kho"
              value={fullForm.stock}
              onChange={(e) => setFullForm({ ...fullForm, stock: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Selected full tags */}
          <div>
            <label className="mb-1.5 block text-xs text-steelgray">Nhãn đã chọn:</label>
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {fullTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => removeFullTag(t)} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                </span>
              ))}
              {fullTagChips.length === 0 && (
                <span className="text-xs text-steelgray italic self-center">Nhấn nhãn bên trên để chọn...</span>
              )}
            </div>
          </div>

          {/* Description — Tiptap + DOCX import */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-steelgray font-medium">Mô tả sản phẩm (hỗ trợ DOCX)</label>
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
                    Đang nhập...
                  </span>
                ) : "Nhập từ DOCX"}
              </label>
            </div>
            <RichTextEditor
              value={fullForm.description}
              onChange={(html) => setFullForm((prev) => ({ ...prev, description: html }))}
              placeholder="Nhập mô tả sản phẩm... Hỗ trợ in đậm, in nghiêng, tiêu đề, danh sách, ảnh..."
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm text-steelgray font-medium mb-3">Thông số kỹ thuật</label>
            <div className="grid gap-3 md:grid-cols-2">
              {SPEC_LABELS.map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-sm text-steelgray w-48 shrink-0">{label}</label>
                  <input
                    type="text"
                    value={fullForm.specifications[label] || ""}
                    onChange={(e) =>
                      setFullForm((prev) => ({
                        ...prev,
                        specifications: { ...prev.specifications, [label]: e.target.value },
                      }))
                    }
                    placeholder="—"
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">
              Hình ảnh {editing ? "(bỏ trống để giữ hình cũ)" : ""}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFullImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={fullMutation.isPending} className="btn-primary">
              {fullMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm sản phẩm"}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {/* Products table */}
      <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="border-b border-gunmetal/40 px-4 py-3">
          <span className="text-sm text-steelgray">{filtered.length} sản phẩm</span>
        </div>
        {(info || deleteMutation.isError || error) && (
          <div
            className={`mx-4 mt-3 rounded-lg border p-3 text-sm ${
              deleteMutation.isError || error
                ? "border-deeprose/30 bg-deeprose/10 text-rose"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {deleteMutation.isError || error
              ? error || "Xóa thất bại"
              : info}
            <button
              type="button"
              onClick={() => { setError(""); setInfo(""); deleteMutation.reset(); }}
              className="ml-3 text-xs underline opacity-70 hover:opacity-100"
            >
              đóng
            </button>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Không có sản phẩm nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal/50">
              <tr className="text-left text-steelgray">
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Tồn kho</th>
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
                    className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors"
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
                        {tagChips.length === 0 && <span className="text-xs text-steelgray">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 5 ? "text-deeprose font-semibold" : "text-warmwhite"}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-sm text-crimson hover:text-sakura transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-deeprose hover:text-rose transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending && deleteMutation.variables === p.id
                            ? "Đang xóa..."
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

// ── Orders Tab ─────────────────────────────────────────────
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
        <h1 className="text-2xl font-extrabold text-warmwhite">Quản lý đơn hàng</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-48">
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
          <div className="border-b border-gunmetal/40 px-4 py-3">
            <span className="text-sm text-steelgray">{filtered.length} đơn hàng</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-steelgray">Chưa có đơn hàng nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gunmetal/40 bg-charcoal/50">
                <tr className="text-left text-steelgray">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3">Xem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className={`cursor-pointer border-t border-gunmetal/40 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-crimson/10" : "hover:bg-charcoal/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-warmwhite">{order.tracking_code}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-xs font-medium capitalize text-crimson">
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-steelgray">{order.delivery_address}</td>
                    <td className="px-4 py-3">
                      <Link to={`/track/${order.tracking_code}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-crimson hover:text-sakura transition-colors">
                        Theo dõi →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-gunmetal/60 bg-graphite p-5 space-y-4">
          <h2 className="font-bold text-warmwhite">Cập nhật vị trí giao hàng</h2>
          {selectedOrder ? (
            <>
              <div className="rounded-lg border border-gunmetal/40 bg-charcoal p-3 text-sm">
                <p className="font-medium text-warmwhite">Đơn: {selectedOrder.tracking_code}</p>
                <p className="text-xs text-steelgray mt-0.5">{selectedOrder.delivery_address}</p>
              </div>
              <AdminMapPicker lat={lat} lng={lng} onChange={(l, g) => { setLat(l); setLng(g); }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-steelgray">Vĩ độ</label>
                  <input type="number" step="any" value={lat}
                    onChange={(e) => setLat(Number(e.target.value))} className="input-field text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-steelgray">Kinh độ</label>
                  <input type="number" step="any" value={lng}
                    onChange={(e) => setLng(Number(e.target.value))} className="input-field text-xs" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-steelgray">Trạng thái</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="input-field">
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-crimson/30 bg-crimson/10 p-3 text-sm text-sakura">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Cập nhật thành công!
                </div>
              )}
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
                className="btn-primary w-full">
                {updateMutation.isPending ? "Đang cập nhật..." : "Gửi cập nhật vị trí"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gunmetal/40">
                <svg className="h-7 w-7 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-sm text-steelgray">Chọn một đơn hàng để cập nhật vị trí giao hàng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Blog Tab ───────────────────────────────────────────────
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
    if (!form.title.trim()) { setError("Tiêu đề không được để trống"); return; }
    if (!form.content.trim() || form.content === "<p></p>") { setError("Nội dung không được để trống"); return; }
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
      setError("Nhập file DOCX thất bại.");
    } finally { setImporting(false); e.target.value = ""; }
  };

  if (isLoading) return <LoadingSpinner label="Đang tải blog..." />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý Blog</h1>

      {/* Editor */}
      <div className="mb-6 space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-5">
        <h2 className="text-base font-bold text-warmwhite">
          {editing ? `Sửa bài: ${editing.title}` : "Viết bài mới"}
        </h2>
        <input required placeholder="Tiêu đề bài viết" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field text-lg font-semibold" />

        {/* Tags chips */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-softgray">Nhãn (Tags)</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tagChips.map((t) => (
              <span key={t} className="tag-badge flex items-center gap-1">
                {t}
                <button type="button" onClick={() => setTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
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
            <button type="button" onClick={() => addTagChip(tagInput)} className="btn-secondary">+ Thêm</button>
            <datalist id="blog-tags-datalist">
              {["tech", "review", "tips", "news", "guide"].map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">Nhập từ DOCX</label>
            <label className="btn-secondary cursor-pointer">
              <input type="file" accept=".docx" className="hidden" onChange={handleImportDocx} disabled={importing} />
              {importing ? "Đang nhập..." : "Chọn file DOCX"}
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-sm text-steelgray">Ảnh đại diện {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}</label>
            <input type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null; setImage(file);
                if (file) { const r = new FileReader(); r.onload = (ev) => setCoverPreview(ev.target?.result as string); r.readAsDataURL(file); }
                else setCoverPreview(null);
              }}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
            {(coverPreview || (editing && editing.image_url)) && (
              <img src={coverPreview ?? editing?.image_url ?? ""} alt="" className="mt-2 h-16 w-24 rounded-lg object-cover" />
            )}
          </div>
        </div>
        {error && <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">{error}</div>}
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật bài viết" : "Đăng bài viết"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: "", content: "", tags: "" }); setTagChips([]); setImage(null); setCoverPreview(null); }}
              className="btn-secondary">Hủy</button>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="border-b border-gunmetal/40 px-4 py-3">
          <span className="text-sm text-steelgray">{posts.length} bài viết</span>
        </div>
        {posts.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Chưa có bài viết nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal/50">
              <tr className="text-left text-steelgray">
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const postTags = post.tags ? post.tags.split(",").filter(Boolean) : [];
                return (
                  <tr key={post.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors">
                    <td className="px-4 py-3">
                      {post.image_url && <img src={post.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-warmwhite max-w-[200px] truncate">{post.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {postTags.length > 0
                          ? postTags.map((t: string) => <span key={t} className="tag-badge">{t}</span>)
                          : <span className="text-steelgray text-xs">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-steelgray">{post.slug}</td>
                    <td className="px-4 py-3 text-softgray">{post.author_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => {
                          setEditing(post as import("../../types").BlogPost);
                          setForm({ title: post.title, content: (post as import("../../types").BlogPost).content, tags: post.tags });
                          setTagChips(postTags);
                          setImage(null); setCoverPreview(null);
                        }}
                          className="text-sm text-crimson hover:text-sakura transition-colors">Sửa</button>
                        <button onClick={() => { if (confirm(`Xóa "${post.title}"?`)) deleteMutation.mutate(post.id); }}
                          className="text-sm text-deeprose hover:text-rose transition-colors">Xóa</button>
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

// ── Settings Tab ────────────────────────────────────────────
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
      setNewEmail(""); setAddSuccess("Đã thêm email thành công."); setAddError("");
      setTimeout(() => setAddSuccess(""), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Thêm thất bại.";
      setAddError(msg);
      setAddSuccess("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminEmail(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-emails"] }),
  });

  if (isLoading) return <LoadingSpinner label="Đang tải..." />;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Cài đặt</h1>
      <p className="mb-6 text-sm text-steelgray">Quản lý email nhận thông báo đơn hàng</p>

      <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
        <h2 className="mb-4 text-base font-semibold text-warmwhite">Email nhận thông báo đơn hàng</h2>

        {emails.length === 0 ? (
          <p className="py-6 text-center text-sm text-steelgray">Chưa có email nào được thêm.</p>
        ) : (
          <ul className="mb-4 divide-y divide-gunmetal/40">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm text-warmwhite">{e.email}</span>
                  <span className="ml-2 text-xs text-steelgray">{new Date(e.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(e.id)}
                  className="ml-4 flex-shrink-0 rounded-lg px-3 py-1.5 text-xs text-rose hover:bg-deeprose/10 transition-colors">
                  Xóa
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
            {addMutation.isPending ? "Đang thêm..." : "Thêm email"}
          </button>
        </form>

        {addError && <p className="mt-2 text-sm text-rose">{addError}</p>}
        {addSuccess && <p className="mt-2 text-sm text-sakura">{addSuccess}</p>}
      </div>
    </div>
  );
}

// ── Media Tab ──────────────────────────────────────────────
function MediaTab({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(products[0]?.id ?? null);
  const [filter, setFilter] = useState("");

  const filtered = products.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const target = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Hình ảnh & Video sản phẩm</h1>
      <p className="mb-6 text-sm text-steelgray">
        Chọn một sản phẩm để xem và quản lý gallery (ảnh + video). Ảnh đầu tiên (cover) sẽ được
        dùng làm thumbnail sản phẩm trên toàn trang.
      </p>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-4">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="input-field mb-3"
          />
          <div className="max-h-[64vh] overflow-y-auto space-y-1.5">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-steelgray">Không tìm thấy.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                    selectedId === p.id
                      ? "border-crimson bg-crimson/10"
                      : "border-gunmetal/40 bg-charcoal hover:border-silvergray/40"
                  }`}
                >
                  <img src={p.image_url} alt="" className="h-9 w-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                    <p className="text-[10px] text-steelgray">#{p.id}</p>
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
            <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-10 text-center text-steelgray">
              Chọn một sản phẩm bên trái để bắt đầu.
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
    if (!confirm("Xóa hình ảnh/video này?")) return;
    adminApi.deleteMedia(m.id).then(invalidate);
  };

  return (
    <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-warmwhite">{product.name}</h2>
          <p className="text-xs text-steelgray">Mã sản phẩm: #{product.id}</p>
        </div>
        <div className="text-xs text-steelgray">
          {media.length} mục media
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
        className="mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gunmetal/60 bg-charcoal/40 py-6 text-center hover:border-crimson cursor-pointer transition-colors"
      >
        <svg className="h-6 w-6 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-medium text-warmwhite">
          {uploading ? "Đang tải lên..." : "Kéo thả hoặc nhấn để chọn ảnh/video"}
        </span>
        <span className="text-[10px] text-steelgray">JPG, PNG, WEBP, MP4, WEBM — tối đa 100MB mỗi file</span>
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
          Đặt file tải lên đầu tiên làm ảnh cover
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
        <LoadingSpinner label="Đang tải gallery..." />
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-gunmetal/60 bg-charcoal p-8 text-center text-sm text-steelgray">
          Sản phẩm này chưa có ảnh/video trong gallery. Hiện đang dùng ảnh thumbnail mặc định.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className="relative overflow-hidden rounded-xl border border-gunmetal/60 bg-charcoal">
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
                    Đặt làm cover
                  </button>
                )}
                <button
                  onClick={() => deleteMedia(m)}
                  className="ml-auto rounded-lg bg-deeprose px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Coupons Tab ──────────────────────────────────────────────
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
      const msg = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Lỗi tạo coupon";
      setError(typeof msg === "string" ? msg : "Lỗi tạo coupon");
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
      <h1 className="mb-2 text-2xl font-extrabold text-warmwhite">Quản lý mã giảm giá (Coupon)</h1>
      <p className="mb-6 text-sm text-steelgray">Tạo và quản lý các mã giảm giá áp dụng ở bước thanh toán.</p>

      <div className="mb-6 rounded-2xl border border-gunmetal/60 bg-graphite p-5 space-y-3">
        <h2 className="text-base font-bold text-warmwhite">{editing ? `Sửa: ${editing.code}` : "Tạo coupon mới"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-steelgray">Mã (CODE)</label>
            <input
              disabled={!!editing}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VD: SALE10"
              className="input-field font-mono uppercase"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-steelgray">Mô tả</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="VD: Giảm 10% cho đơn ≥3 triệu"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-steelgray">Loại giảm giá</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
              className="input-field"
            >
              <option value="percent">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VND)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-steelgray">
              Giá trị {form.discount_type === "percent" ? "(1–100)" : "(VND)"}
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
            <label className="mb-1 block text-xs text-steelgray">Đơn hàng tối thiểu (VND)</label>
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
            <label className="mb-1 block text-xs text-steelgray">Giảm tối đa (VND, không bắt buộc)</label>
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
            <label className="mb-1 block text-xs text-steelgray">Số lượt tối đa (0 = không giới hạn)</label>
            <input
              type="number"
              min={0}
              value={form.usage_limit ?? ""}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value === "" ? null : Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-steelgray">Bắt đầu (tùy chọn)</label>
            <input
              type="text"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              placeholder="2025-01-01"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-steelgray">Hết hạn (tùy chọn)</label>
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
                {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
              </button>
              <button onClick={() => { setEditing(null); }} className="btn-secondary">Hủy</button>
            </>
          ) : (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.code} className="btn-primary">
              {createMutation.isPending ? "Đang tạo..." : "Tạo coupon"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Đang tải coupon..." />
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-8 text-center text-sm text-steelgray">
          Chưa có coupon nào.
        </div>
      ) : (
        <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal/50">
              <tr className="text-left text-steelgray">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Giảm</th>
                <th className="px-4 py-3">Tối thiểu</th>
                <th className="px-4 py-3">Đã dùng / Giới hạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30">
                  <td className="px-4 py-3 font-mono font-bold text-warmwhite">{c.code}</td>
                  <td className="px-4 py-3 text-softgray max-w-[220px] truncate">{c.description || "—"}</td>
                  <td className="px-4 py-3 text-crimson font-semibold">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `${new Intl.NumberFormat("vi-VN").format(c.discount_value)}₫`}
                  </td>
                  <td className="px-4 py-3 text-steelgray">
                    {c.min_order_total ? `${new Intl.NumberFormat("vi-VN").format(c.min_order_total)}₫` : "—"}
                  </td>
                  <td className="px-4 py-3 text-steelgray">
                    {c.usage_count}/{c.usage_limit ?? "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.active ? "bg-emerald/15 text-emerald" : "bg-deeprose/15 text-rose"}`}>
                      {c.active ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-sm text-crimson hover:text-sakura">Sửa</button>
                      <button onClick={() => { if (confirm(`Xóa mã ${c.code}?`)) deleteMutation.mutate(c.id); }} className="text-sm text-deeprose hover:text-rose">Xóa</button>
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
