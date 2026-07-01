import { useRef, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

const BRANDS = [
  { label: "Apple", icon: "🍎" },
  { label: "Samsung", icon: "📱" },
  { label: "Xiaomi", icon: "📲" },
  { label: "OPPO", icon: "📞" },
];

export default function Home() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data } = await productsApi.list();
      return data.slice(0, 6);
    },
  });

  const handleContact = (e: FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-charcoal via-graphite to-charcoal border-b border-gunmetal/40">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-crimson blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-rose blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-4 py-1.5 text-xs font-medium text-sakura">
                <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
                Sản phẩm mới 2026
              </div>
              <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-warmwhite sm:text-5xl lg:text-6xl leading-tight">
                Experience<br />
                <span className="text-crimson">The Future</span>
              </h1>
              <p className="mb-8 max-w-lg text-base text-softgray leading-relaxed">
                Khám phá thế hệ điện thoại thông minh mới nhất với công nghệ tiên tiến, thiết kế đột phá và hiệu năng vượt trội. CellZone — điện thoại chính hãng, giá tốt nhất.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="btn-primary py-3 text-base px-6">
                  SHOP NOW
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/blog" className="btn-secondary py-3 text-base px-6">
                  Tin công nghệ
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:flex justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 rounded-full bg-crimson blur-3xl" />
              </div>
              <div className="relative flex h-96 w-96 items-center justify-center">
                <div className="absolute h-80 w-80 rounded-full bg-gradient-to-br from-crimson/20 to-rose/10 border border-crimson/20" />
                <svg className="absolute h-80 w-80 text-crimson/30" viewBox="0 0 200 200" fill="none">
                  <rect x="60" y="20" width="80" height="160" rx="16" stroke="currentColor" strokeWidth="2" />
                  <rect x="65" y="30" width="70" height="120" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="100" cy="165" r="8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div className="absolute text-center">
                  <p className="text-6xl font-extrabold text-warmwhite drop-shadow-lg">📱</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Categories ──────────────────────────────── */}
      <section className="border-b border-gunmetal/40 bg-graphite/50">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-5 sm:px-6 sm:gap-12">
          {BRANDS.map((brand) => (
            <button
              key={brand.label}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gunmetal/40 bg-charcoal text-2xl transition-all group-hover:border-rose/40 group-hover:bg-gunmetal">
                {brand.icon}
              </div>
              <span className="text-xs font-medium text-steelgray transition-colors group-hover:text-crimson">
                {brand.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Smartphones Showcase ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px w-8 bg-crimson" />
              <span className="text-xs font-medium uppercase tracking-widest text-crimson">Sản phẩm nổi bật</span>
            </div>
            <h2 className="text-3xl font-extrabold text-warmwhite">Điện thoại thông minh</h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-medium text-crimson transition-colors hover:text-sakura sm:flex"
          >
            Xem tất cả
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Đang tải sản phẩm..." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/products" className="btn-secondary">
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>

      {/* ── Why CellZone ─────────────────────────────────── */}
      <section className="border-t border-gunmetal/40 bg-graphite/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-crimson" />
              <span className="text-xs font-medium uppercase tracking-widest text-crimson">Tại sao chọn chúng tôi</span>
              <div className="h-px w-8 bg-crimson" />
            </div>
            <h2 className="text-3xl font-extrabold text-warmwhite">Tại sao CellZone?</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Premium Warranty",
                desc: "Bảo hành chính hãng 12 tháng cho mọi sản phẩm. Đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
                title: "Instant Trade-In",
                desc: "Đổi điện thoại cũ lấy iPhone mới với mức giá hấp dẫn. Nhanh chóng, minh bạch, không rườm rà.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Express Delivery",
                desc: "Giao hàng trong 24h tại TP.HCM và 2-3 ngày cho các tỉnh thành khác. Miễn phí vận chuyển.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card flex flex-col items-start gap-4 p-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gunmetal/40 bg-charcoal text-crimson">
                  {item.icon}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-warmwhite">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-steelgray">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <section id="contact" ref={contactRef} className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px w-8 bg-crimson" />
            <span className="text-xs font-medium uppercase tracking-widest text-crimson">Liên hệ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-warmwhite">Gửi thông điệp</h2>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite overflow-hidden aspect-square max-h-96 lg:max-h-none">
            <iframe
              title="CellZone Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.6%2C10.7%2C106.8%2C10.9&layer=mapnik"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            {contactSent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-crimson/10">
                  <svg className="h-8 w-8 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-warmwhite">Gửi thành công!</h3>
                <p className="text-sm text-steelgray">CellZone sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                <button
                  onClick={() => setContactSent(false)}
                  className="btn-primary mt-6"
                >
                  Gửi thêm
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-softgray">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Nguyen Van A"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-softgray">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-softgray">Nội dung</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Viết tin nhắn của bạn..."
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3">
                  Gửi thông điệp
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
