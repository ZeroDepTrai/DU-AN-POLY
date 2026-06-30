import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await productsApi.get(Number(id));
      return data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải sản phẩm..." />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mb-4 text-5xl">
          <svg className="mx-auto h-16 w-16 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-warmwhite">Sản phẩm không tồn tại</h2>
        <p className="mt-2 text-steelgray">Sản phẩm này có thể đã bị xóa hoặc không còn bán.</p>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <a href="/" className="hover:text-crimson transition-colors">Trang chủ</a>
        <span>/</span>
        <a href="/" className="hover:text-crimson transition-colors capitalize">{product.tag}</a>
        <span>/</span>
        <span className="text-warmwhite">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite">
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="tag-badge">{product.tag}</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-warmwhite leading-tight">{product.name}</h1>

          <div className="mb-6 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-crimson">
              {new Intl.NumberFormat("vi-VN").format(product.price)}
              <span className="text-lg font-normal text-steelgray"> VND</span>
            </p>
          </div>

          <div className="mb-6 flex items-center gap-2 rounded-lg border border-gunmetal/60 bg-graphite p-3">
            {inStock ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson/10">
                  <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-warmwhite">Còn hàng</p>
                  <p className="text-xs text-steelgray">{product.stock} sản phẩm sẵn sàng</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deeprose/10">
                  <svg className="h-4 w-4 text-deeprose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-deeprose">Hết hàng</p>
                  <p className="text-xs text-steelgray">Liên hệ để đặt trước</p>
                </div>
              </>
            )}
          </div>

          <div className="mb-8">
            <h3 className="mb-2 font-semibold text-warmwhite">Mô tả sản phẩm</h3>
            <p className="text-sm leading-relaxed text-softgray">
              {product.description || "Chưa có mô tả cho sản phẩm này."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => addItem(product)}
              disabled={!inStock}
              className="btn-primary flex-1 py-3 text-base disabled:opacity-40"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </button>
            <button className="btn-secondary flex-1 py-3 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Yêu thích
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { text: "Bảo hành 12 tháng" },
              { text: "Đổi trả 7 ngày" },
              { text: "Giao hàng miễn phí" },
              { text: "Trả góp 0%" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-gunmetal/40 bg-charcoal px-3 py-2 text-xs text-steelgray">
                <svg className="h-3.5 w-3.5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
