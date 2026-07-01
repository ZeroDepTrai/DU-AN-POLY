import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, adminBlogApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminMapPicker from "../../components/AdminMapPicker";
import RichTextEditor from "../../components/RichTextEditor";
import type { Order, OrderStatus, Product } from "../../types";

type Tab = "dashboard" | "products" | "orders" | "blog" | "settings";

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

const TAG_PRESETS = ["iPhone", "Android", "Samsung", "Xiaomi", "Flagship", "Budget", "5G", "Gaming"];
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-warmwhite">CellZone</span>
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
function ProductsTab({ products }: { products: Product[] }) {
  const queryClient = useQueryClient();
  const [formTab, setFormTab] = useState<"quick" | "full">("quick");
  const [quickForm, setQuickForm] = useState({ name: "", price: "", tag: "" });
  const [fullForm, setFullForm] = useState({ name: "", price: "", tag: "", description: "", stock: "10" });
  const [quickImage, setQuickImage] = useState<File | null>(null);
  const [fullImage, setFullImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Hình ảnh bắt buộc");
      const fd = new FormData();
      fd.append("name", quickForm.name); fd.append("price", quickForm.price);
      fd.append("tag", quickForm.tag); fd.append("image", quickImage);
      return adminApi.quickAddProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuickForm({ name: "", price: "", tag: "" }); setQuickImage(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const fullMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", fullForm.name); fd.append("price", fullForm.price);
      fd.append("tag", fullForm.tag); fd.append("description", fullForm.description);
      fd.append("stock", fullForm.stock);
      if (fullImage) fd.append("image", fullImage);
      return editing ? adminApi.updateProduct(editing.id, fd) : adminApi.createProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      setFullForm({ name: "", price: "", tag: "", description: "", stock: "10" });
      setFullImage(null);
      setFormTab("quick");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const startEdit = (p: Product) => {
    setEditing(p); setFormTab("full");
    setFullForm({ name: p.name, price: String(p.price), tag: p.tag, description: p.description, stock: String(p.stock) });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-warmwhite">Quản lý sản phẩm</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="input-field w-64"
        />
      </div>

      {/* Add Form */}
      <div className="mb-6 flex gap-1 rounded-xl bg-charcoal p-1 border border-gunmetal/40 w-fit">
        <button onClick={() => { setFormTab("quick"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${formTab === "quick" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"}`}>
          Thêm nhanh
        </button>
        <button onClick={() => { setFormTab("full"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${formTab === "full" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"}`}>
          Thêm đầy đủ
        </button>
      </div>

      {formTab === "quick" && (
        <form onSubmit={(e) => { e.preventDefault(); quickMutation.mutate(); }}
          className="mb-6 grid gap-4 rounded-2xl border border-gunmetal/60 bg-graphite p-5 md:grid-cols-2 lg:grid-cols-4">
          <input required placeholder="Tên sản phẩm" value={quickForm.name}
            onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} className="input-field" />
          <input required type="number" step="1000" placeholder="Giá (VND)" value={quickForm.price}
            onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })} className="input-field" />
          <select required value={quickForm.tag}
            onChange={(e) => setQuickForm({ ...quickForm, tag: e.target.value })} className="input-field">
            <option value="">Chọn nhãn...</option>
            {TAG_PRESETS.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
          </select>
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">Hình ảnh</label>
            <input required type="file" accept="image/*"
              onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crimson file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
          </div>
          {error && <p className="col-span-full text-sm text-rose">{error}</p>}
          <button type="submit" disabled={quickMutation.isPending}
            className="col-span-full btn-primary lg:w-auto">
            {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
          </button>
        </form>
      )}

      {formTab === "full" && (
        <form onSubmit={(e) => { e.preventDefault(); fullMutation.mutate(); }}
          className="mb-6 grid gap-4 rounded-2xl border border-gunmetal/60 bg-graphite p-5">
          <h3 className="col-span-full text-base font-bold text-warmwhite">
            {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm đầy đủ"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input required placeholder="Tên" value={fullForm.name}
              onChange={(e) => setFullForm({ ...fullForm, name: e.target.value })} className="input-field" />
            <input required type="number" step="1000" placeholder="Giá (VND)" value={fullForm.price}
              onChange={(e) => setFullForm({ ...fullForm, price: e.target.value })} className="input-field" />
            <input required placeholder="Nhãn" value={fullForm.tag}
              onChange={(e) => setFullForm({ ...fullForm, tag: e.target.value })} className="input-field" />
            <input type="number" placeholder="Số lượng tồn kho" value={fullForm.stock}
              onChange={(e) => setFullForm({ ...fullForm, stock: e.target.value })} className="input-field" />
          </div>
          <textarea placeholder="Mô tả sản phẩm" value={fullForm.description}
            onChange={(e) => setFullForm({ ...fullForm, description: e.target.value })}
            className="input-field resize-none" rows={3} />
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">
              Hình ảnh {editing ? "(bỏ trống để giữ hình cũ)" : ""}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setFullImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={fullMutation.isPending} className="btn-primary">
              {fullMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm sản phẩm"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setFormTab("quick"); setFullForm({ name: "", price: "", tag: "", description: "", stock: "10" }); }}
                className="btn-secondary">Hủy</button>
            )}
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="border-b border-gunmetal/40 px-4 py-3">
          <span className="text-sm text-steelgray">{filtered.length} sản phẩm</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Không có sản phẩm nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal/50">
              <tr className="text-left text-steelgray">
                <th className="px-4 py-3">Hình</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors">
                  <td className="px-4 py-3"><img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover" /></td>
                  <td className="px-4 py-3 font-medium text-warmwhite max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-3 font-semibold text-crimson">
                    {new Intl.NumberFormat("vi-VN").format(p.price)} VND
                  </td>
                  <td className="px-4 py-3"><span className="tag-badge">{p.tag}</span></td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 5 ? "text-deeprose font-semibold" : "text-warmwhite"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(p)} className="text-sm text-crimson hover:text-sakura transition-colors">Sửa</button>
                      <button onClick={() => { if (confirm(`Xóa "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                        className="text-sm text-deeprose hover:text-rose transition-colors">Xóa</button>
                    </div>
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
  const [form, setForm] = useState({ title: "", content: "" });
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
      if (image) fd.append("image", image);
      return editing ? adminBlogApi.update(editing.id, fd) : adminBlogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setForm({ title: "", content: "" }); setImage(null); setCoverPreview(null); setEditing(null); setError("");
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
            <button onClick={() => { setEditing(null); setForm({ title: "", content: "" }); setImage(null); setCoverPreview(null); }}
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
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors">
                  <td className="px-4 py-3">
                    {post.image_url && <img src={post.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-warmwhite max-w-[200px] truncate">{post.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-steelgray">{post.slug}</td>
                  <td className="px-4 py-3 text-softgray">{post.author_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => { setEditing(post); setForm({ title: post.title, content: post.content }); setImage(null); setCoverPreview(null); }}
                        className="text-sm text-crimson hover:text-sakura transition-colors">Sửa</button>
                      <button onClick={() => { if (confirm(`Xóa "${post.title}"?`)) deleteMutation.mutate(post.id); }}
                        className="text-sm text-deeprose hover:text-rose transition-colors">Xóa</button>
                    </div>
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
