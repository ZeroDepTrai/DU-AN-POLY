import { useRef, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

// ── Hero background image (high-quality phone lifestyle) ──────────────────────
const HERO_BG =
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1440&q=85&auto=format&fit=crop";

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
      <section className="relative h-[540px] w-full overflow-hidden">
        {/* Full-bleed background image */}
        <img
          src={HERO_BG}
          alt="Premium smartphones"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/90" />

        {/* Hero content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-warmwhite sm:text-5xl lg:text-6xl leading-tight">
            Trải nghiệm không gian<br />mua sắm thượng lưu
          </h1>
          <p className="mb-8 max-w-2xl text-base text-softgray leading-relaxed">
            Nơi công nghệ tối tân hội tụ cùng nghệ thuật thiết kế đỉnh cao.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" className="btn-primary py-3 text-base px-8">
              Khám phá ngay
            </Link>
            <Link to="/blog" className="btn-secondary py-3 text-base px-8">
              Tin công nghệ
            </Link>
          </div>
        </div>
      </section>

      {/* ── Smartphones Showcase ──────────────────────────── */}
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

      {/* ── Core Values ──────────────────────────────────── */}
      <section className="border-t border-gunmetal/40 bg-graphite/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col items-center rounded-2xl border border-gunmetal/40 bg-charcoal/60 p-8 text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-crimson">
                <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Tiên phong</h3>
              <p className="text-sm leading-relaxed text-steelgray">
                Mang đến những sản phẩm công nghệ đột phá, kiến tạo chuẩn mực mới cho cuộc sống hiện đại và trải nghiệm người dùng.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center rounded-2xl border border-gunmetal/40 bg-charcoal/60 p-8 text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-crimson">
                <svg className="h-10 w-10" viewBox="0 0 44 30" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h34M5 20h34M5 4h34" />
                  <circle cx="35" cy="16" r="5" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Đẳng cấp</h3>
              <p className="text-sm leading-relaxed text-steelgray">
                Trở thành biểu tượng của sự tiên phong và đẳng cấp trong lĩnh vực bán lẻ thiết bị thông minh cao cấp tại khu vực.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center rounded-2xl border border-gunmetal/40 bg-charcoal/60 p-8 text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-crimson">
                <svg className="h-10 w-10" viewBox="0 0 32 42" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Cam kết</h3>
              <p className="text-sm leading-relaxed text-steelgray">
                Cam kết tuyệt đối về độ hoàn thiện, dịch vụ hậu mãi chuyên nghiệp và sự hài lòng tối đa của từng khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policies ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Policy 1 */}
          <div className="flex items-start gap-5 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center text-crimson">
              <svg className="h-8 w-8" viewBox="0 0 37 35" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Bảo hành VIP 1 đổi 1</h3>
              <p className="text-sm leading-relaxed text-steelgray">
                Mọi sản phẩm tại CellZone đều được hưởng chế độ bảo hành VIP 1 đổi 1 trong 30 ngày và hỗ trợ kỹ thuật trọn đời.
              </p>
            </div>
          </div>

          {/* Policy 2 */}
          <div className="flex items-start gap-5 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center text-crimson">
              <svg className="h-8 w-8" viewBox="0 0 33 30" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64A9 9 0 105.53 18.36M16.5 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Hỗ trợ 24/7</h3>
              <p className="text-sm leading-relaxed text-steelgray">
                Đội ngũ chuyên viên tư vấn cá nhân hóa sẵn sàng hỗ trợ 24/7, đảm bảo trải nghiệm liền mạch sau khi mua sắm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <section id="contact" ref={contactRef} className="border-t border-gunmetal/40 bg-graphite/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-gunmetal/60 h-96 lg:h-auto lg:max-h-[502px]">
              <iframe
                title="CellZone Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.6%2C10.7%2C106.8%2C10.9&layer=mapnik"
                className="h-full w-full border-0"
                loading="lazy"
              />
              <div className="border-t border-gunmetal/40 bg-charcoal p-5">
                <h3 className="mb-2 text-xl font-bold text-warmwhite">Trụ Sở Chính</h3>
                <p className="flex items-center gap-2 text-sm text-steelgray">
                  <svg className="h-4 w-4 shrink-0 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  123 Đường Công Nghệ, Quận 1, TP. HCM
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-gunmetal/60 bg-charcoal p-8">
              <h3 className="mb-6 text-2xl font-bold text-warmwhite">Gửi Thông Điệp</h3>
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-crimson/10">
                    <svg className="h-8 w-8 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-warmwhite">Gửi thành công!</h3>
                  <p className="text-sm text-steelgray">CellZone sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                  <button onClick={() => setContactSent(false)} className="btn-primary mt-6">
                    Gửi thêm
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-softgray">Tên của bạn</label>
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
                    <label className="mb-1.5 block text-sm font-medium text-softgray">Email liên hệ</label>
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
                    <label className="mb-1.5 block text-sm font-medium text-softgray">Nội dung cần hỗ trợ...</label>
                    <textarea
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="input-field resize-none"
                      placeholder="Viết tin nhắn của bạn..."
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-base">
                    Gửi thông điệp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
