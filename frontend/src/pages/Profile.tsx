import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, spinApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Order } from "../types";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: spinCfg, isLoading: spinLoading } = useQuery({
    queryKey: ["spin-config"],
    queryFn: async () => (await spinApi.config()).data,
  });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await ordersApi.list()).data,
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

  return (
    <div className="container-padding section-padding">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crimson text-3xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warmwhite">{user.name}</h1>
            <p className="text-sm text-steelgray">{user.email}</p>
          </div>
          <button onClick={logout} className="ml-auto btn-secondary text-sm py-2 px-4">
            Đăng xuất
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-bento border border-rose/20 bg-gradient-to-br from-crimson/15 via-cardtint to-cardtint p-5">
            <p className="text-xs uppercase tracking-wide text-rose">Lượt quay may mắn</p>
            <p className="mt-2 text-4xl font-bold text-warmwhite">
              {spinLoading ? "..." : spinCfg?.user_credits ?? 0}
            </p>
            <Link to="/spin" className="mt-3 inline-block text-xs font-semibold text-crimson hover:text-sakura">
              Quay ngay →
            </Link>
          </div>
          <div className="rounded-bento border border-gunmetal/40 bg-cardtint p-5">
            <p className="text-xs uppercase tracking-wide text-steelgray">Tổng chi đã giao</p>
            <p className="mt-2 text-3xl font-bold text-warmwhite">
              {new Intl.NumberFormat("vi-VN").format(totalSpend)} <span className="text-sm text-steelgray">VND</span>
            </p>
            <p className="mt-1 text-xs text-steelgray">Đơn đã giao: {deliverOrders.length}</p>
          </div>
          <div className="rounded-bento border border-gunmetal/40 bg-cardtint p-5">
            <p className="text-xs uppercase tracking-wide text-steelgray">Tổng đơn hàng</p>
            <p className="mt-2 text-4xl font-bold text-warmwhite">{ordersLoading ? "..." : orders.length}</p>
            <Link to="/orders" className="mt-3 inline-block text-xs font-semibold text-rose hover:text-sakura">
              Xem đơn →
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-bento border border-gunmetal/40 bg-cardtint/60 p-5">
          <h2 className="mb-2 text-base font-bold text-warmwhite">Quy tắc nhận lượt quay</h2>
          <p className="text-sm text-softgray">
            Mỗi{" "}
            <strong className="text-crimson">
              {new Intl.NumberFormat("vi-VN").format(spinCfg?.spend_per_spin_vnd || 3000000)} VND
            </strong>{" "}
            mua hàng đã giao sẽ tặng bạn <strong className="text-warmwhite">1 lượt quay</strong>. Lượt quay cộng dồn qua các đơn giao thành công.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link to="/orders" className="rounded-bento border border-gunmetal/40 bg-cardtint p-5 transition-colors hover:border-rose/40">
            <p className="text-xs uppercase tracking-wide text-steelgray">📦 Lịch sử đơn hàng</p>
            <p className="mt-2 text-sm text-softgray">Theo dõi vận chuyển, xem lại các đơn đã đặt.</p>
          </Link>
          <Link to="/spin" className="rounded-bento border border-gunmetal/40 bg-cardtint p-5 transition-colors hover:border-rose/40">
            <p className="text-xs uppercase tracking-wide text-steelgray">🎁 Vòng quay may mắn</p>
            <p className="mt-2 text-sm text-softgray">Dùng lượt quay để trúng thưởng quà giá trị.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
