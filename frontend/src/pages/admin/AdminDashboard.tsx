import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function AdminDashboard() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await adminApi.listProducts();
      return data;
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await adminApi.listOrders();
      return data;
    },
  });

  const isLoading = loadingProducts || loadingOrders;

  if (isLoading) {
    return <LoadingSpinner label="Đang tải dashboard..." />;
  }

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 6);
  const lowStock = products.filter((p) => p.stock < 5);
  const totalRevenue = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-warmwhite">Xin chào, Admin</h1>
        <p className="mt-1 text-sm text-steelgray">Đây là bảng điều khiển của CellZone</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tổng sản phẩm",
            value: products.length,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
            color: "text-crimson",
            bg: "bg-crimson/10",
          },
          {
            label: "Tổng đơn hàng",
            value: orders.length,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            color: "text-sakura",
            bg: "bg-sakura/10",
          },
          {
            label: "Tổng doanh thu",
            value: new Intl.NumberFormat("vi-VN").format(totalRevenue) + " VND",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: "text-gold",
            bg: "bg-gold/10",
          },
          {
            label: "Cảnh báo tồn kho",
            value: lowStock.length,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ),
            color: "text-deeprose",
            bg: "bg-deeprose/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gunmetal/60 bg-graphite p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-steelgray">{stat.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-extrabold text-warmwhite">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/admin/products" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm sản phẩm
        </Link>
        <Link to="/admin/blog" className="btn-secondary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Viết bài blog
        </Link>
        <Link to="/admin/orders" className="btn-secondary">
          Quản lý đơn hàng
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-8 rounded-xl border border-deeprose/30 bg-deeprose/10 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-deeprose">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Cảnh báo tồn kho thấp
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-deeprose/20 bg-charcoal p-3 text-sm hover:bg-charcoal/80 transition-colors"
              >
                <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-warmwhite">{p.name}</p>
                  <p className="text-xs text-deeprose">Chỉ còn {p.stock} sản phẩm</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="flex items-center justify-between border-b border-gunmetal/40 px-5 py-4">
          <h2 className="font-bold text-warmwhite">Đơn hàng gần đây</h2>
          <Link to="/admin/orders" className="text-sm text-crimson hover:text-sakura transition-colors">
            Xem tất cả &rarr;
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Chưa có đơn hàng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40">
              <tr className="text-left text-steelgray">
                <th className="px-5 py-3">Mã</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Địa chỉ</th>
                <th className="px-5 py-3">Theo dõi</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-gunmetal/40 hover:bg-charcoal/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-warmwhite">{order.tracking_code}</td>
                  <td className="px-5 py-3 capitalize">
                    <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-xs font-medium text-crimson">
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-steelgray">{order.delivery_address}</td>
                  <td className="px-5 py-3">
                    <Link to={`/track/${order.tracking_code}`} className="text-sm text-crimson hover:text-sakura transition-colors">
                      Theo dõi
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
