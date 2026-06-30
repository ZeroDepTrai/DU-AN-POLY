import ProductGrid from "../components/ProductGrid";

export default function Home() {
  return (
    <div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-charcoal via-graphite to-charcoal border-b border-gunmetal/40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-crimson blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-rose blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-3 py-1 text-xs font-medium text-sakura">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />
              Sản phẩm mới 2026
            </div>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-warmwhite md:text-5xl">
              Điện thoại chính hãng
              <br />
              <span className="text-crimson">Giá tốt nhất thị trường</span>
            </h1>
            <p className="mb-8 max-w-lg text-base text-softgray">
              Trải nghiệm mua sắm điện thoại với giá cả hấp dẫn, nhiều ưu đãi và dịch vụ giao hàng nhanh chóng. Các thương hiệu nổi tiếng: iPhone, Samsung, Xiaomi...
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#products" className="btn-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Mua sắm ngay
              </a>
              <a href="/blog" className="btn-secondary">
                Tin công nghệ
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Brand bar */}
      <div className="border-b border-gunmetal/40 bg-graphite/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 overflow-x-auto px-4 py-3">
          {["iPhone", "Samsung", "Xiaomi", "OPPO", "Vivo", "Realme"].map((brand) => (
            <span key={brand} className="shrink-0 text-sm font-medium text-steelgray hover:text-crimson cursor-pointer transition-colors">
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div id="products" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-warmwhite">Điện thoại nổi bật</h2>
          <span className="text-sm text-steelgray">Tra cứu theo giá</span>
        </div>
        <ProductGrid />
      </div>

      {/* Feature strip */}
      <div className="border-t border-gunmetal/40 bg-graphite/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: "Sản phẩm chính hãng 100%",
              desc: "Bảo hành chính hãng, đổi trả trong 7 ngày",
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: "Giao hàng nhanh chóng",
              desc: "Giao trong 24h tại TP.HCM, 2-3 ngày các tỉnh",
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
              title: "Thanh toán an toàn",
              desc: "COD, chuyển khoản, trả góp 0% lãi suất",
            },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-gunmetal/40 bg-charcoal p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-crimson/10 text-crimson">
                {f.icon}
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-warmwhite">{f.title}</h3>
                <p className="text-sm text-steelgray">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
