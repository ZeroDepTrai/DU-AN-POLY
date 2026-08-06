import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { couponsApi, ordersApi } from "../api/client";
import type { CouponValidateResult } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput, AuroraTextarea } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";
import SectionHeading from "../components/aurora/SectionHeading";
import OptimizedImage from "../components/OptimizedImage";

type Step = 1 | 2 | 3;

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "COD",
    sublabel: "Thanh toán khi nhận hàng",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "sakura",
  },
  {
    id: "transfer",
    label: "Chuyển khoản",
    sublabel: "Ngân hàng Việt Nam",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    color: "aurora",
  },
  {
    id: "momo",
    label: "MoMo",
    sublabel: "Ví điện tử MoMo",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="12" fill="#A50068" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">M</text>
      </svg>
    ),
    color: "magenta",
  },
  {
    id: "zalo",
    label: "ZaloPay",
    sublabel: "Ví điện tử Zalo",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="12" fill="#0068FF" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Z</text>
      </svg>
    ),
    color: "blue",
  },
];

export default function Checkout() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState<{ tracking_code: string; total: number } | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResult | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping = 0;
  const tax = Math.round(totalPrice * 0.1);
  const discount = appliedCoupon?.discount ?? 0;
  const grand = Math.max(0, totalPrice + shipping + tax - discount);

  const paidItems = items.filter((item) => item.source !== "free");
  const freeItems = items.filter((item) => item.source === "free");

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
        items: paidItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        coupon_code: appliedCoupon?.coupon.code,
      });
      setOrderData({ tracking_code: data.tracking_code, total: grand });
      clearCart();
      setOrderSuccess(true);
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

  // Success State
  if (orderSuccess && orderData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <GlassCard intensity="med" glow className="p-10 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold aurora-text-gradient">Đặt hàng thành công!</h1>
          <p className="mb-6 text-steelgray">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>

          {/* Order Details */}
          <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-steelgray">Mã đơn hàng</span>
              <span className="font-mono font-bold text-sakura">{orderData.tracking_code}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-steelgray">Tổng thanh toán</span>
              <span className="font-bold aurora-text-rainbow">
                {new Intl.NumberFormat("vi-VN").format(orderData.total)} VND
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={`/orders/${orderData.tracking_code}`}
              className="aurora-glow-btn focus-aurora flex items-center justify-center gap-2 py-3"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Xem chi tiết đơn hàng
            </Link>
            <Link
              to="/products"
              className="focus-rose flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/5 px-5 py-2.5 text-sm text-softgray transition-all hover:border-white/20 hover:text-warmwhite"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <Link to="/" className="hover:text-sakura transition-colors">Trang chủ</Link>
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link to="/cart" className="hover:text-sakura transition-colors">Giỏ hàng</Link>
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-warmwhite">Thanh toán</span>
      </nav>

      <SectionHeading
        eyebrow="Thanh toán"
        title="Hoàn tất đơn hàng"
        subtitle={`${items.length} sản phẩm · Tổng ${new Intl.NumberFormat("vi-VN").format(grand)} VND`}
      />

      {/* Stepper */}
      <div className="mt-8 mb-10 flex items-center justify-center gap-4">
        {([1, 2, 3] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm transition-all ${
                  step >= s
                    ? "bg-aurora-gradient text-white shadow-glow-violet"
                    : "border border-white/[0.12] bg-white/[0.04] text-steelgray"
                }`}
              >
                {step > s ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold ${step >= s ? "text-warmwhite" : "text-steelgray"}`}>
                  {s === 1 ? "Thông tin giao hàng" : s === 2 ? "Phương thức thanh toán" : "Xác nhận đơn hàng"}
                </p>
              </div>
            </div>
            {idx < 2 && (
              <div className={`h-px w-16 sm:w-24 ${step > s ? "bg-sakura/50" : "bg-white/[0.08]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">

          {/* Step 1: Shipping Info */}
          {step === 1 && (
            <GlassCard intensity="med" className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">1</div>
                <h2 className="text-lg font-bold text-warmwhite">Thông tin giao hàng</h2>
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
              <div className="mt-6 flex justify-end">
                <GlowButton variant="aurora" onClick={() => setStep(2)} className="px-8">
                  Tiếp tục
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </GlowButton>
              </div>
            </GlassCard>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <GlassCard intensity="med" className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">2</div>
                <h2 className="text-lg font-bold text-warmwhite">Phương thức thanh toán</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
                      payment === m.id
                        ? "border-sakura/60 bg-sakura/10 shadow-[0_0_20px_rgba(255,105,180,0.15)]"
                        : "border-white/[0.06] bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]"
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
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      payment === m.id ? "border-sakura bg-sakura" : "border-white/30"
                    }`}>
                      {payment === m.id && <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-warmwhite">
                      {m.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-warmwhite">{m.label}</p>
                      <p className="text-xs text-steelgray">{m.sublabel}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <GlowButton variant="ghost" onClick={() => setStep(1)} className="px-6">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại
                </GlowButton>
                <GlowButton variant="aurora" onClick={() => setStep(3)} className="px-8">
                  Xem đơn hàng
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </GlowButton>
              </div>
            </GlassCard>
          )}

          {/* Step 3: Order Confirmation */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <GlassCard intensity="med" className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">3</div>
                  <h2 className="text-lg font-bold text-warmwhite">Xác nhận đơn hàng</h2>
                </div>

                {/* Shipping Summary */}
                <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sakura">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Địa chỉ giao hàng
                  </div>
                  <p className="text-sm text-warmwhite">{user.name}</p>
                  <p className="text-sm text-steelgray">{phone}</p>
                  <p className="mt-1 text-sm text-steelgray">{address}</p>
                </div>

                {/* Payment Method Summary */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sakura">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Phương thức thanh toán
                  </div>
                  <p className="text-sm text-warmwhite">
                    {PAYMENT_METHODS.find((m) => m.id === payment)?.label} — {PAYMENT_METHODS.find((m) => m.id === payment)?.sublabel}
                  </p>
                </div>
              </GlassCard>

              {error && (
                <div className="rounded-xl border border-deeprose/40 bg-deeprose/10 p-3 text-sm text-rose">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <GlowButton variant="ghost" onClick={() => setStep(2)} type="button" className="px-6">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại
                </GlowButton>
                <GlowButton
                  variant="aurora"
                  size="lg"
                  loading={loading}
                  type="submit"
                  disabled={items.length === 0}
                  className="px-10"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Xác nhận đặt hàng
                </GlowButton>
              </div>
            </form>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <GlassCard intensity="med" glow className="sticky top-24 overflow-hidden p-0">
            {/* Summary Header */}
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <h3 className="text-base font-bold text-warmwhite">Tóm tắt đơn hàng</h3>
              <p className="mt-0.5 text-xs text-steelgray">{items.length} sản phẩm</p>
            </div>

            {/* Cart Items */}
            <div className="max-h-[320px] overflow-y-auto p-4 space-y-3">
              {paidItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
                    <OptimizedImage
                      src={item.product_image_url}
                      alt={item.product_name}
                      sizes="56px"
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sakura text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-warmwhite">{item.product_name}</p>
                    <p className="text-xs text-steelgray">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold aurora-text-rainbow shrink-0">
                    {new Intl.NumberFormat("vi-VN").format(item.product_price * item.quantity)}đ
                  </p>
                </div>
              ))}

              {freeItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 opacity-70">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
                    <OptimizedImage
                      src={item.product_image_url}
                      alt={item.product_name}
                      sizes="56px"
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-warmwhite">{item.product_name}</p>
                    <AuroraBadge tone="mint">Quà tặng</AuroraBadge>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 shrink-0">Miễn phí</p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-white/[0.06] p-4">
              <p className="mb-2 text-xs font-semibold text-sakura">Mã giảm giá</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã..."
                  className="aurora-input flex-1 text-sm"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <GlowButton variant="ghost" onClick={removeCoupon} className="text-sm whitespace-nowrap px-3">Bỏ</GlowButton>
                ) : (
                  <GlowButton
                    variant="aurora"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    loading={applyingCoupon}
                    className="text-sm whitespace-nowrap px-3"
                  >
                    Áp dụng
                  </GlowButton>
                )}
              </div>
              {couponMessage && <p className="mt-2 text-xs text-emerald-400">{couponMessage}</p>}
              {couponError && <p className="mt-2 text-xs text-lightpink">{couponError}</p>}
            </div>

            {/* Totals */}
            <div className="border-t border-white/[0.06] p-4 space-y-2">
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
                    <button onClick={removeCoupon} className="ml-1 text-[10px] text-lightpink hover:underline">bỏ</button>
                  </span>
                  <span>-{new Intl.NumberFormat("vi-VN").format(discount)} VND</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-base font-bold text-warmwhite">Tổng cộng</span>
                <span className="text-lg font-bold text-sakura">
                  {new Intl.NumberFormat("vi-VN").format(grand)} VND
                </span>
              </div>
            </div>

            {/* Security Note */}
            <div className="border-t border-white/[0.06] p-4 flex items-center gap-2 text-xs text-softgray">
              <svg className="h-4 w-4 text-sakura shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
