import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";
import SectionHeading from "../components/aurora/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
import OptimizedImage from "../components/OptimizedImage";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, loading } = useCart();

  if (loading) {
    return <LoadingSpinner label="Đang tải giỏ hàng..." />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold aurora-text-gradient">Giỏ hàng trống</h1>
        <p className="mb-8 text-steelgray">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <GlowButton variant="aurora" size="lg" onClick={() => (window.location.href = "/")}>
          Tiếp tục mua sắm
        </GlowButton>
      </div>
    );
  }

  const shipping = 0;
  const tax = Math.round(totalPrice * 0.1);
  const grand = totalPrice + shipping + tax;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="Giỏ hàng"
        title={
          <>
            Giỏ hàng của bạn
            <span className="ml-3 text-base font-normal text-steelgray">({items.length} sản phẩm)</span>
          </>
        }
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const isFree = item.source === "free";
            return (
              <GlassCard intensity="med" key={item.id} className="flex items-center gap-4 p-4">
                <Link to={`/products/${item.product_id}`} className="relative shrink-0 overflow-hidden rounded-xl">
                  <OptimizedImage
                    src={item.product_image_url}
                    alt={item.product_name}
                    sizes="96px"
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-semibold text-warmwhite hover:text-sakura transition-colors"
                    >
                      {item.product_name}
                    </Link>
                    <span className="ml-2 align-middle">
                      <AuroraBadge tone="sakura">{item.product_tags}</AuroraBadge>
                    </span>
                    {isFree && (
                      <span className="ml-2 align-middle">
                        <AuroraBadge tone="mint">Quà tặng</AuroraBadge>
                      </span>
                    )}
                    <p className={`mt-2 text-sm font-bold ${isFree ? "text-emerald-400" : "aurora-text-rainbow"}`}>
                      {isFree ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(item.product_price)} VND`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    {!isFree ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-warmwhite hover:bg-white/10 transition-colors text-lg font-light"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-warmwhite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-warmwhite hover:bg-white/10 transition-colors text-lg font-light"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-steelgray">Số lượng: {item.quantity}</span>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-sm text-steelgray hover:text-lightpink transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-base font-bold ${isFree ? "text-emerald-400" : "aurora-text-rainbow"}`}>
                    {isFree ? "Miễn phí" : new Intl.NumberFormat("vi-VN").format(item.product_price * item.quantity)}
                    {!isFree && <span className="text-xs font-normal text-steelgray"> VND</span>}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>

        <div>
          <GlassCard intensity="med" glow className="sticky top-24 p-6">
            <h2 className="mb-4 text-lg font-bold text-warmwhite">Tóm tắt đơn hàng</h2>

            <div className="mb-4 space-y-3">
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
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between text-base font-bold text-warmwhite">
                  <span>Tổng cộng</span>
                  <span className="aurora-text-rainbow">
                    {new Intl.NumberFormat("vi-VN").format(grand)} VND
                  </span>
                </div>
              </div>
            </div>

            <Link to="/checkout" className="aurora-glow-btn w-full justify-center py-3 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Thanh toán ngay
            </Link>
            <Link to="/" className="mt-2 inline-flex w-full justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-softgray transition-colors hover:text-warmwhite">
              Tiếp tục mua sắm
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
