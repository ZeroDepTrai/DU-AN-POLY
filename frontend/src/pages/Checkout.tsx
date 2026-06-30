import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await ordersApi.create({
        delivery_address: address,
        delivery_phone: phone,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      navigate(`/orders/${data.tracking_code}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Thanh toán thất bại";
      setError(typeof message === "string" ? message : "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-warmwhite">Thanh toán đơn hàng</h1>
        <p className="mt-1 text-sm text-steelgray">
          {items.length} sản phẩm &mdash; Tổng: {new Intl.NumberFormat("vi-VN").format(totalPrice)} VND
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-3">
          <div className="rounded-xl border border-gunmetal/60 bg-graphite p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-warmwhite">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-crimson/10 text-crimson text-sm font-bold">1</div>
              Địa chỉ giao hàng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-softgray">Họ và tên</label>
                <input
                  disabled
                  value={user.name}
                  className="input-field opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-softgray">Email</label>
                <input
                  disabled
                  value={user.email}
                  className="input-field opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-softgray">Số điện thoại *</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="VD: 090 123 4567"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-softgray">Địa chỉ nhận hàng *</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gunmetal/60 bg-graphite p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-warmwhite">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-crimson/10 text-crimson text-sm font-bold">2</div>
              Phương thức thanh toán
            </h2>
            <div className="space-y-2">
              {[
                "Thanh toán khi nhận hàng (COD)",
                "Chuyển khoản ngân hàng",
                "Trả góp 0% lãi suất",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gunmetal/60 bg-charcoal p-3 text-sm transition-colors hover:border-silvergray/40"
                >
                  <input type="radio" name="payment" defaultChecked={opt === "Thanh toán khi nhận hàng (COD)"} className="accent-rose" />
                  <span className="text-warmwhite">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đặt hàng ngay
              </>
            )}
          </button>
        </form>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-gunmetal/60 bg-graphite p-5">
            <h3 className="mb-4 font-bold text-warmwhite">Đơn hàng của bạn</h3>
            <div className="mb-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-warmwhite">{item.product.name}</p>
                    <p className="text-xs text-steelgray">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-crimson shrink-0">
                    {new Intl.NumberFormat("vi-VN").format(item.product.price * item.quantity)} VND
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-gunmetal/40 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-steelgray">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat("vi-VN").format(totalPrice)} VND</span>
              </div>
              <div className="flex justify-between text-sm text-steelgray">
                <span>Phí giao hàng</span>
                <span className="text-crimson">Miễn phí</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-warmwhite">
                <span>Tổng cộng</span>
                <span className="text-crimson">{new Intl.NumberFormat("vi-VN").format(totalPrice)} VND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
