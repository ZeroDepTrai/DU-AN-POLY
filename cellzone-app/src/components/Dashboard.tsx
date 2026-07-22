import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Clock } from "lucide-react";
import { analyticsApi, normalizeMediaUrl } from "../api/client";
import type { AnalyticsStats, ChartDataPoint } from "../types";

interface DashboardProps {
  products: { id: number; name: string; stock: number; image_url: string }[];
  orders: { id: number; tracking_code: string; status: string; delivery_address: string; items: { quantity: number; unit_price: number }[] }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  in_transit: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đã xuất kho",
  in_transit: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export default function Dashboard({ products, orders }: DashboardProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewData, revenue, byStatus] = await Promise.all([
        analyticsApi.overview().catch(() => null),
        analyticsApi.revenue("7d").catch(() => ({ labels: [], values: [] })),
        analyticsApi.ordersByStatus().catch(() => ({ labels: [], values: [] })),
      ]);

      if (overviewData) setStats(overviewData);
      if (revenue.labels.length) {
        setRevenueData(revenue.labels.map((label, i) => ({
          name: label,
          value: revenue.values[i],
        })));
      }
      if (byStatus.labels.length) {
        setOrdersByStatus(byStatus.labels.map((label, i) => ({
          name: STATUS_LABELS[label] || label,
          value: byStatus.values[i],
        })));
      }
    } catch {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const lowStock = products.filter((p) => p.stock < 5);
  const totalRevenue = orders.reduce(
    (sum, o) => sum + o.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0),
    0
  );
  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  const statsCards = [
    {
      label: "Tổng sản phẩm",
      value: products.length,
      icon: <Package className="w-5 h-5" />,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Tổng đơn hàng",
      value: orders.length,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Tổng doanh thu",
      value: new Intl.NumberFormat("vi-VN").format(totalRevenue) + " VND",
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Cảnh báo tồn kho",
      value: lowStock.length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-amber-500 to-amber-600",
    },
    ...(stats
      ? [
          {
            label: "Người dùng",
            value: stats.active_users,
            icon: <Users className="w-5 h-5" />,
            color: "from-cyan-500 to-cyan-600",
          },
          {
            label: "Phản hồi chat",
            value: `${stats.chat_response_time}s`,
            icon: <Clock className="w-5 h-5" />,
            color: "from-pink-500 to-pink-600",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">
          Xin chào, {user?.role === "admin" ? "Admin" : "Nhân viên hỗ trợ"}
        </h1>
        <p className="text-sm text-[#8b8b9a] mt-1">
          Đây là bảng điều khiển của CellZone
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card p-5 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#8b8b9a]">{stat.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[#f0f0f5]">
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">
            Doanh thu 7 ngày gần đây
          </h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#8b8b9a" fontSize={12} />
                <YAxis stroke="#8b8b9a" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[#5a5a6a]">
              {loading ? "Đang tải..." : "Chưa có dữ liệu"}
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">
            Đơn hàng theo trạng thái
          </h2>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#5a5a6a]">
              {loading ? "Đang tải..." : "Chưa có dữ liệu"}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {ordersByStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[item.name.replace("Chờ xử lý", "pending")?.toLowerCase()] ||
                      "#8b8b9a",
                  }}
                />
                <span className="text-[#8b8b9a]">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div className="glass-card p-5 border-amber-500/20">
          <h2 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Cảnh báo tồn kho thấp
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <img
                  src={normalizeMediaUrl(p.image_url)}
                  alt={p.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-[#f0f0f5] truncate max-w-[150px]">
                    {p.name}
                  </p>
                  <p className="text-xs text-amber-400">Chỉ còn {p.stock} sản phẩm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#f0f0f5]">Đơn hàng gần đây</h2>
          <span className="text-sm text-[#8b8b9a]">{orders.length} đơn hàng</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có đơn hàng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-5 py-3">Mã theo dõi</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3 font-mono font-medium text-[#f0f0f5]">
                    {order.tracking_code}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: `${STATUS_COLORS[order.status] || "#8b8b9a"}20`,
                        color: STATUS_COLORS[order.status] || "#8b8b9a",
                      }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-[#8b8b9a]">
                    {order.delivery_address}
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
