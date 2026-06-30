import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gunmetal/40">
            <svg className="h-12 w-12 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-warmwhite">Giỏ hàng trống</h1>
        <p className="mb-8 text-steelgray">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link to="/" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-warmwhite">
        <span className="text-crimson">Giỏ hàng</span> của bạn
        <span className="ml-2 text-base font-normal text-steelgray">({items.length} sản phẩm)</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 rounded-xl border border-gunmetal/60 bg-graphite p-4"
            >
              <Link to={`/products/${item.product.id}`} className="shrink-0">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    to={`/products/${item.product.id}`}
                    className="font-semibold text-warmwhite hover:text-sakura transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  <span className="ml-2 tag-badge text-xs">{item.product.tag}</span>
                  <p className="mt-1 text-sm text-steelgray">
                    {new Intl.NumberFormat("vi-VN").format(item.product.price)} VND
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gunmetal/60 bg-charcoal text-warmwhite hover:bg-gunmetal transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-warmwhite">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gunmetal/60 bg-charcoal text-warmwhite hover:bg-gunmetal transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="flex items-center gap-1 text-sm text-steelgray hover:text-deeprose transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-bold text-crimson">
                  {new Intl.NumberFormat("vi-VN").format(item.product.price * item.quantity)}
                  <span className="text-xs font-normal text-steelgray"> VND</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-gunmetal/60 bg-graphite p-6">
            <h2 className="mb-4 font-bold text-warmwhite">Tổng cộng</h2>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm text-steelgray">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat("vi-VN").format(totalPrice)} VND</span>
              </div>
              <div className="flex justify-between text-sm text-steelgray">
                <span>Phí giao hàng</span>
                <span className="text-crimson">Miễn phí</span>
              </div>
              <div className="border-t border-gunmetal/40 pt-2" />
              <div className="flex justify-between text-lg font-bold text-warmwhite">
                <span>Tổng</span>
                <span className="text-crimson">
                  {new Intl.NumberFormat("vi-VN").format(totalPrice)} VND
                </span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full py-3 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Thanh toán ngay
            </Link>
            <Link to="/" className="btn-ghost mt-2 w-full justify-center text-sm">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
