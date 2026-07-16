import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { couponsApi, ordersApi } from "../api/client";
import type { CouponValidateResult } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Thẻ Tín dụng/Ghi nợ",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "transfer",
    label: "Ví điện tử (Apple Pay, Google Pay)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "installment",
    label: "Thanh toán khi nhận hàng (COD)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function Checkout() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResult | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping = 0;
  const tax = Math.round(totalPrice * 0.1);
  const discount = appliedCoupon?.discount ?? 0;
  const grand = Math.max(0, totalPrice + shipping + tax - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    setCouponMessage("");
    try {
      const { data } = await couponsApi.validate(couponCode.trim(), totalPrice);
      setAppliedCoupon(data);
      setCouponMessage(`Áp dụng thành công: giảm ${new Intl.NumberFormat("vi-VN").format(data.discount)} VND`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Mã không hợp lệ";
      setAppliedCoupon(null);
      setCouponError(typeof msg === "string" ? msg : "Mã không hợp lệ");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await ordersApi.create({
        delivery_address: address,
        delivery_phone: phone,
        items: items
          .filter((item) => item.source !== "free")
          .map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        coupon_code: appliedCoupon?.coupon.code,
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-8 bg-crimson" />
          <span className="text-xs font-medium uppercase tracking-widest text-crimson">Thanh toán</span>
        </div>
        <h1 className="text-3xl font-extrabold text-warmwhite">Phương thức thanh toán</h1>
        <p className="mt-1 text-sm text-steelgray">
          {items.length} sản phẩm — Tổng: {new Intl.NumberFormat("vi-VN").format(grand)} VND
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[760px_1fr]">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shipping */}
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-crimson/10 text-sm font-bold text-crimson">1</div>
              <h2 className="text-lg font-bold text-warmwhite">Địa chỉ giao hàng</h2>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-softgray">Họ và tên</label>
                  <input disabled value={user.name} className="input-field opacity-60" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-softgray">Email</label>
                  <input disabled value={user.email} className="input-field opacity-60" />
                </div>
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

          {/* Payment */}
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-crimson/10 text-sm font-bold text-crimson">2</div>
              <h2 className="text-lg font-bold text-warmwhite">Phương thức thanh toán</h2>
            </div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                    payment === m.id
                      ? "border-crimson bg-crimson/5"
                      : "border-gunmetal/60 bg-charcoal hover:border-silvergray/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                    className="accent-rose"
                  />
                  <span className="text-warmwhite">{m.icon}</span>
                  <span className="flex-1 text-sm font-medium text-warmwhite">{m.label}</span>
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

        {/* Right: Summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            <h3 className="mb-4 text-lg font-bold text-warmwhite">Tóm tắt đơn hàng</h3>

            <div className="mb-4 space-y-3">
              {items.map((item) => {
                const isFree = item.source === "free";
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-warmwhite">{item.product_name}</p>
                      {isFree && (
                        <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] font-semibold text-emerald-400">Quà tặng</span>
                      )}
                      <p className="text-xs text-steelgray">x{item.quantity}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${isFree ? "text-emerald-400" : "text-crimson"}`}>
                      {isFree
                        ? "Miễn phí"
                        : `${new Intl.NumberFormat("vi-VN").format(item.product_price * item.quantity)} VND`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gunmetal/40 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-steelgray">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat("vi-VN").format(totalPrice)} VND</span>
              </div>
              <div className="flex justify-between text-sm text-steelgray">
                <span>Phí giao hàng</span>
                <span className="text-crimson">Miễn phí</span>
              </div>
              <div className="flex justify-between text-sm text-steelgray">
                <span>Thuế (VAT 10%)</span>
                <span>{new Intl.NumberFormat("vi-VN").format(tax)} VND</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald">
                  <span className="flex items-center gap-1">
                    Coupon {appliedCoupon.coupon.code}
                    <button onClick={removeCoupon} className="ml-1 text-[10px] text-rose hover:underline">bỏ</button>
                  </span>
                  <span>-{new Intl.NumberFormat("vi-VN").format(discount)} VND</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gunmetal/40 pt-3 text-lg font-bold text-warmwhite">
                <span>Tổng cộng</span>
                <span className="text-crimson">
                  {new Intl.NumberFormat("vi-VN").format(grand)} VND
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gunmetal/40 bg-charcoal/40 p-3">
              <p className="mb-1.5 text-xs text-steelgray">Mã giảm giá</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã..."
                  className="input-field flex-1 text-sm"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button onClick={removeCoupon} className="btn-secondary text-sm whitespace-nowrap">Bỏ</button>
                ) : (
                  <button
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="btn-primary text-sm whitespace-nowrap disabled:opacity-60"
                  >
                    {applyingCoupon ? "..." : "Áp dụng"}
                  </button>
                )}
              </div>
              {couponMessage && <p className="mt-2 text-xs text-emerald">{couponMessage}</p>}
              {couponError && <p className="mt-2 text-xs text-rose">{couponError}</p>}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-steelgray">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Thanh toán an toàn & bảo mật
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
