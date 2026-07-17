import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";

export default function OrderConfirmation() {
  const { trackingCode } = useParams();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", trackingCode],
    queryFn: async () => {
      const { data } = await ordersApi.track(trackingCode!);
      return data;
    },
    enabled: Boolean(trackingCode),
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải thông tin đơn hàng..." />;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-warmwhite">Đơn hàng không tồn tại</h2>
        <Link to="/" className="btn-primary">Quay về trang chủ</Link>
      </div>
    );
  }

  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <GlassCard intensity="high" glow className="mb-8 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold aurora-text-gradient">Đặt hàng thành công!</h1>
        <p className="mt-2 text-softgray">Cảm ơn bạn đã đặt hàng tại CellZone. Đơn hàng của bạn đang được xử lý.</p>
      </GlassCard>

      <GlassCard intensity="med" className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-warmwhite">Thông tin đơn hàng</h2>
          <AuroraBadge tone="cyan">{order.status.replace("_", " ")}</AuroraBadge>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-steelgray">Mã theo dõi</p>
            <p className="font-mono font-bold aurora-text-rainbow">{order.tracking_code}</p>
          </div>
          <div>
            <p className="text-steelgray">Số điện thoại</p>
            <p className="font-medium text-warmwhite">{order.delivery_phone}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-steelgray">Địa chỉ giao hàng</p>
            <p className="font-medium text-warmwhite">{order.delivery_address}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard intensity="med" className="mb-6 p-6">
        <h2 className="mb-4 font-bold text-warmwhite">Sản phẩm đã đặt</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aurora-gradient text-white text-xs font-bold shadow-glow-violet">
                  {item.quantity}
                </div>
                <span className="text-warmwhite">{item.product_name}</span>
              </div>
              <span className="font-semibold text-warmwhite">
                {new Intl.NumberFormat("vi-VN").format(item.unit_price * item.quantity)} VND
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-bold text-warmwhite">Tổng cộng</span>
          <span className="aurora-text-rainbow text-xl font-extrabold">
            {new Intl.NumberFormat("vi-VN").format(total)} VND
          </span>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-3 sm:flex-row">
        <GlowButton
          variant="aurora"
          onClick={() => (window.location.href = `/track/${order.tracking_code}`)}
          className="flex-1 justify-center py-3"
        >
          Theo dõi giao hàng
        </GlowButton>
        <Link
          to="/"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 font-semibold text-warmwhite backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}