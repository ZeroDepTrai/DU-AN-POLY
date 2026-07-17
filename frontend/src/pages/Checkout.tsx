import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { couponsApi, ordersApi } from "../api/client";
import type { CouponValidateResult } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput, AuroraTextarea } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";
import SectionHeading from "../components/aurora/SectionHeading";

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

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="Thanh toán"
        title="Phương thức thanh toán"
        subtitle={`${items.length} sản phẩm · Tổng ${new Intl.NumberFormat("vi-VN").format(grand)} VND`}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[760px_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <GlassCard intensity="med" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">1</div>
              <h2 className="text-lg font-bold text-warmwhite">Địa chỉ giao hàng</h2>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AuroraInput label="Họ và tên" value={user.name} disabled className="opacity-70" />
                <AuroraInput label="Email" value={user.email} disabled className="opacity-70" />
              </div>
              <AuroraInput
                label="Số điện thoại *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 090 123 4567"
                required
              />
              <AuroraTextarea
                label="Địa chỉ nhận hàng *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                rows={3}
                required
              />
            </div>
          </GlassCard>

          <GlassCard intensity="med" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">2</div>
              <h2 className="text-lg font-bold text-warmwhite">Phương thức thanh toán</h2>
            </div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                    payment === m.id
                      ? "border-aurora-cyan/60 bg-aurora-cyan/10 shadow-glow-cyan"
                      : "border-white/10 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                    className="sr-only"
                  />
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${payment === m.id ? "border-aurora-cyan bg-aurora-cyan" : "border-white/30"}`}>
                    {payment === m.id && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span className="text-warmwhite">{m.icon}</span>
                  <span className="flex-1 text-sm font-medium text-warmwhite">{m.label}</span>
                </label>
              ))}
            </div>
          </GlassCard>

          {error && (
            <div className="rounded-xl border border-deeprose/40 bg-deeprose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          <GlowButton variant="aurora" size="lg" loading={loading} type="submit" disabled={items.length === 0} className="w-full justify-center">
            Đặt hàng ngay
          </GlowButton>
        </form>

        <div>
          <GlassCard intensity="med" glow className="sticky top-24 p-6">
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
                      {isFree && <AuroraBadge tone="mint">Quà tặng</AuroraBadge>}
                      <p className="text-xs text-steelgray">x{item.quantity}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${isFree ? "text-emerald-400" : "aurora-text-rainbow"}`}>
                      {isFree
                        ? "Miễn phí"
                        : `${new Intl.NumberFormat("vi-VN").format(item.product_price * item.quantity)} VND`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between text-sm text-softgray">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat("vi-VN").format(totalPrice)} VND</span>
              </div>
              <div className="flex justify-between text-sm text-softgray">
                <span>Phí giao hàng</span>
                <span className="aurora-text-rainbow font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between text-sm text-softgray">
                <span>Thuế (VAT 10%)</span>
                <span>{new Intl.NumberFormat("vi-VN").format(tax)} VND</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span className="flex items-center gap-1">
                    Coupon {appliedCoupon.coupon.code}
                    <button onClick={removeCoupon} className="ml-1 text-[10px] text-aurora-pink hover:underline">bỏ</button>
                  </span>
                  <span>-{new Intl.NumberFormat("vi-VN").format(discount)} VND</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold text-warmwhite">
                <span>Tổng cộng</span>
                <span className="aurora-text-rainbow">
                  {new Intl.NumberFormat("vi-VN").format(grand)} VND
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="mb-1.5 text-xs text-aurora-cyan">Mã giảm giá</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã..."
                  className="aurora-input flex-1 text-sm"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <GlowButton variant="ghost" onClick={removeCoupon} className="text-sm whitespace-nowrap">Bỏ</GlowButton>
                ) : (
                  <GlowButton
                    variant="aurora"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    loading={applyingCoupon}
                    className="text-sm whitespace-nowrap"
                  >
                    Áp dụng
                  </GlowButton>
                )}
              </div>
              {couponMessage && <p className="mt-2 text-xs text-emerald-400">{couponMessage}</p>}
              {couponError && <p className="mt-2 text-xs text-aurora-pink">{couponError}</p>}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-softgray">
              <svg className="h-4 w-4 text-aurora-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Thanh toán an toàn & bảo mật
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}