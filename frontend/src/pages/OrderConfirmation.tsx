import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

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
    return <LoadingSpinner label="Dang tai don hang..." />;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-warmwhite">Don hang khong ton tai</h2>
        <Link to="/" className="btn-primary mt-6">Quay ve trang chu</Link>
      </div>
    );
  }

  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Success banner */}
      <div className="mb-8 rounded-2xl border border-crimson/20 bg-crimson/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-crimson/20">
          <svg className="h-8 w-8 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-warmwhite">Dat hang thanh cong!</h1>
        <p className="mt-2 text-softgray">Cam on ban da dat hang tai CellZone. Don hang cua ban dang duoc xu ly.</p>
      </div>

      {/* Order details */}
      <div className="mb-6 rounded-xl border border-gunmetal/60 bg-graphite p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-warmwhite">Thong tin don hang</h2>
          <span className="tag-badge">{order.status.replace("_", " ")}</span>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-steelgray">Ma theo doi</p>
            <p className="font-mono font-bold text-crimson">{order.tracking_code}</p>
          </div>
          <div>
            <p className="text-steelgray">So dien thoai</p>
            <p className="font-medium text-warmwhite">{order.delivery_phone}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-steelgray">Dia chi giao hang</p>
            <p className="font-medium text-warmwhite">{order.delivery_address}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6 rounded-xl border border-gunmetal/60 bg-graphite p-6">
        <h2 className="mb-4 font-bold text-warmwhite">San pham da dat</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson/10 text-crimson text-xs font-bold">
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
        <div className="mt-4 border-t border-gunmetal/40 pt-4 flex justify-between items-center">
          <span className="font-bold text-warmwhite">Tong cong</span>
          <span className="text-xl font-extrabold text-crimson">
            {new Intl.NumberFormat("vi-VN").format(total)} VND
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to={`/track/${order.tracking_code}`} className="btn-primary flex-1 justify-center py-3">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Theo doi giao hang
        </Link>
        <Link to="/" className="btn-secondary flex-1 justify-center py-3">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Tiep tuc mua sam
        </Link>
      </div>
    </div>
  );
}
