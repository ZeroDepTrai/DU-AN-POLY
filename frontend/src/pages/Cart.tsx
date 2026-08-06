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
        <GlassCard intensity="med" glow className="mx-auto max-w-sm p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold aurora-text-gradient">Giỏ hàng trống</h1>
          <p className="mb-8 text-steelgray">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
          <GlowButton variant="aurora" size="lg" onClick={() => (window.location.href = "/")} className="focus-aurora">
            Khám phá sản phẩm
          </GlowButton>
        </GlassCard>
      </div>
    );
  }

  const shipping = 0;
  const tax = Math.round(totalPrice * 0.1);
  const grand = totalPrice + shipping + tax;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <Link to="/" className="hover:text-sakura transition-colors">Trang chủ</Link>
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-warmwhite">Giỏ hàng</span>
      </nav>

      <SectionHeading
        eyebrow="Giỏ hàng"
        title={
          <>
            Giỏ hàng của bạn
            <span className="ml-3 text-base font-normal text-steelgray">({items.length} sản phẩm)</span>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        {/* Cart Items Table */}
        <div className="lg:col-span-2">
          <GlassCard intensity="med" className="overflow-hidden p-0">
            {/* Table Header */}
            <div className="hidden grid-cols-[80px_1fr_110px_110px_110px_48px] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-steelgray md:grid">
              <div className="col-span-1">Hình ảnh</div>
              <div className="col-span-1">Sản phẩm</div>
              <div className="col-span-1 text-right">Đơn giá</div>
              <div className="col-span-1 text-center">Số lượng</div>
              <div className="col-span-1 text-right">Thành tiền</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/[0.04]">
              {items.map((item) => {
                const isFree = item.source === "free";
                return (
                  <div
                    key={item.id}
                    className="group grid grid-cols-[80px_1fr_110px_110px_110px_48px] items-center gap-4 px-4 py-4 transition-all duration-200 hover:bg-white/[0.03] hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] md:py-4"
                  >
                    {/* Product Image */}
                    <div className="col-span-1">
                      <Link to={`/products/${item.product_id}`} className="focus-rose relative block overflow-hidden rounded-xl ring-1 ring-white/[0.06] transition-all hover:ring-sakura/40">
                        <OptimizedImage
                          src={item.product_image_url}
                          alt={item.product_name}
                          sizes="80px"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>
                    </div>

                    {/* Product Info */}
                    <div className="col-span-1 min-w-0">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="focus-rose font-semibold text-warmwhite hover:text-sakura transition-colors line-clamp-2"
                      >
                        {item.product_name}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <AuroraBadge tone="sakura">{item.product_tags}</AuroraBadge>
                        {isFree && <AuroraBadge tone="mint">Quà tặng</AuroraBadge>}
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-1 text-right">
                      {isFree ? (
                        <span className="text-sm font-bold text-emerald-400">Miễn phí</span>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold aurora-text-rainbow">
                            {new Intl.NumberFormat("vi-VN").format(item.product_price)}
                          </p>
                          <p className="text-xs text-steelgray">VND</p>
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-1 flex justify-center">
                      {!isFree ? (
                        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 backdrop-blur-sm">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="focus-rose flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-warmwhite transition-all hover:bg-white/[0.12] hover:text-sakura text-sm font-medium"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-warmwhite">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="focus-rose flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-warmwhite transition-all hover:bg-white/[0.12] hover:text-sakura text-sm font-medium"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-steelgray">SL: {item.quantity}</span>
                      )}
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-1 text-right">
                      {isFree ? (
                        <span className="text-sm font-bold text-emerald-400">Miễn phí</span>
                      ) : (
                        <div>
                          <p className="text-sm font-bold aurora-text-rainbow">
                            {new Intl.NumberFormat("vi-VN").format(item.product_price * item.quantity)}
                          </p>
                          <p className="text-xs text-steelgray">VND</p>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="focus-rose flex items-center justify-center h-8 w-8 rounded-full text-steelgray transition-all hover:bg-deeprose/20 hover:text-lightpink"
                        title="Xóa sản phẩm"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Shipping Info */}
          <GlassCard intensity="low" className="mt-4 flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sakura/10">
              <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-warmwhite">Miễn phí vận chuyển</p>
              <p className="text-xs text-steelgray">Giao hàng nhanh trong 2-5 ngày làm việc trên toàn quốc</p>
            </div>
          </GlassCard>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <GlassCard intensity="med" glow className="sticky top-24 overflow-hidden p-0">
            {/* Summary Header */}
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <h2 className="text-base font-bold text-warmwhite">Tổng cộng</h2>
            </div>

            {/* Summary Body */}
            <div className="p-5 space-y-3">
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

              {/* Divider */}
              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-warmwhite">Tổng cộng</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-sakura">
                      {new Intl.NumberFormat("vi-VN").format(grand)} VND
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout" className="aurora-glow-btn focus-aurora mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-base">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Tiến hành thanh toán
              </Link>

              {/* Continue Shopping */}
              <Link to="/" className="focus-rose mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/5 px-5 py-2.5 text-sm text-softgray transition-all hover:border-white/20 hover:text-warmwhite">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Tiếp tục mua sắm
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
