import { useRef, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

// ── Hero: abstract glow + product lifestyle image, layered on dark canvas ─────
const HERO_GLOW =
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=85&auto=format&fit=crop";

const BRANDS = [
  { name: "Apple", path: "/products?brand=apple" },
  { name: "Samsung", path: "/products?brand=samsung" },
  { name: "Xiaomi", path: "/products?brand=xiaomi" },
  { name: "OPPO", path: "/products?brand=oppo" },
];

export default function Home() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const { data: showcase = [], isLoading } = useQuery({
    queryKey: ["home-showcase"],
    queryFn: async () => {
      const { data } = await productsApi.list();
      return data
        .filter((p) => p.tags.toLowerCase().includes("featured") && !p.tags.toLowerCase().includes("accessory"))
        .slice(0, 3);
    },
  });

  const handleContact = (e: FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div>
      {/* ── Hero (Figma "Hero Section" 20:1066) ─────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-padding pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: copy + CTA */}
            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-10 bg-crimson" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">
                  CellZone Premium
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-warmwhite sm:text-5xl lg:text-6xl leading-tight">
                Trải nghiệm<br />không gian mua sắm<br />thượng lưu
              </h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed text-softgray sm:text-lg">
                Nơi công nghệ tối tân hội tụ cùng nghệ thuật thiết kế đỉnh cao.
                Khám phá những thiết bị di động định hình tương lai.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="btn-primary py-3.5 px-7 text-sm uppercase tracking-wider">
                  Mua sắm ngay
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link to="/accessories" className="btn-secondary py-3.5 px-7 text-sm uppercase tracking-wider">
                  Phụ kiện cao cấp
                </Link>
              </div>
            </div>

            {/* Right: glow + product image */}
            <div className="relative aspect-square max-h-[520px] w-full">
              <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accentFrom/30 blur-3xl shadow-glow" />
              <div className="absolute inset-0 overflow-hidden rounded-showcase">
                <img
                  src={HERO_GLOW}
                  alt="Premium smartphone"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Categories (Figma "Section - Brand Categories" 19:219) ── */}
      <section className="border-y border-rose/15 bg-graphite/30">
        <div className="container-padding py-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BRANDS.map((b) => (
              <Link
                key={b.name}
                to={b.path}
                className="group flex flex-col items-center justify-center gap-3 rounded-bento border border-rose/15 bg-cardtint/40 py-6 transition-all hover:border-rose/40 hover:bg-cardtint/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose/10 text-rose transition-colors group-hover:bg-rose/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-base font-semibold uppercase tracking-wider text-warmwhite">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Smartphones Showcase (Figma 19:240) ─────────────────────────── */}
      <section className="container-padding section-padding">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px w-10 bg-crimson" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">
                Bộ sưu tập
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-warmwhite sm:text-4xl">
              Sản phẩm nổi bật
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-rose transition-colors hover:text-sakura"
          >
            Xem tất cả
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Đang tải sản phẩm..." />
        ) : showcase.length === 0 ? (
          <div className="rounded-showcase border border-rose/15 bg-cardtint/40 p-16 text-center">
            <p className="text-softgray">Chưa có sản phẩm nổi bật.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((product) => (
              <ProductCard key={product.id} product={product} variant="featured" />
            ))}
          </div>
        )}
      </section>

      {/* ── Core Values (Figma "Section - Core Values" 19:935) ───────────── */}
      <section className="border-y border-rose/15 bg-graphite/30">
        <div className="container-padding section-padding">
          <div className="grid gap-5 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col items-center rounded-bento border border-rose/20 bg-cardtint/60 p-8 text-center backdrop-blur-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Tiên phong</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Mang đến những sản phẩm công nghệ đột phá, kiến tạo chuẩn mực mới cho cuộc sống hiện đại và trải nghiệm người dùng.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center rounded-bento border border-rose/20 bg-cardtint/60 p-8 text-center backdrop-blur-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Đẳng cấp</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Trở thành biểu tượng của sự tiên phong và đẳng cấp trong lĩnh vực bán lẻ thiết bị thông minh cao cấp tại khu vực.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center rounded-bento border border-rose/20 bg-cardtint/60 p-8 text-center backdrop-blur-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-warmwhite">Cam kết</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Cam kết tuyệt đối về độ hoàn thiện, dịch vụ hậu mãi chuyên nghiệp và sự hài lòng tối đa của từng khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policies (Figma "Section - Policies" 19:957) ─────────────────── */}
      <section className="container-padding section-padding">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex items-start gap-5 rounded-bento border border-rose/15 bg-cardtint p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Bảo hành VIP 1 đổi 1</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Mọi sản phẩm tại CellZone đều được hưởng chế độ bảo hành VIP 1 đổi 1 trong 30 ngày và hỗ trợ kỹ thuật trọn đời.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5 rounded-bento border border-rose/15 bg-cardtint p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Hỗ trợ 24/7</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Đội ngũ chuyên viên tư vấn cá nhân hóa sẵn sàng hỗ trợ 24/7, đảm bảo trải nghiệm liền mạch sau khi mua sắm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact (Figma "Contact Section" 19:972) ─────────────────────── */}
      <section
        id="contact"
        ref={contactRef}
        className="border-t border-rose/15 bg-graphite/30"
      >
        <div className="container-padding section-padding">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Map + Address */}
            <div className="overflow-hidden rounded-bento border border-rose/20 bg-cardtint">
              <iframe
                title="CellZone Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.6%2C10.7%2C106.8%2C10.9&layer=mapnik"
                className="h-80 w-full border-0 lg:h-[420px]"
                loading="lazy"
              />
              <div className="border-t border-rose/15 bg-cardtint p-6">
                <h3 className="mb-3 text-xl font-bold text-warmwhite">Trụ Sở Chính</h3>
                <p className="flex items-center gap-2 text-sm text-softgray">
                  <svg className="h-4 w-4 shrink-0 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  123 Đường Công Nghệ, Quận 1, TP. HCM
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-bento border border-rose/20 bg-cardtint p-8">
              <h3 className="mb-2 text-2xl font-bold text-warmwhite">Gửi Thông Điệp</h3>
              <p className="mb-6 text-sm text-softgray">
                Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
              </p>
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose/15">
                    <svg className="h-8 w-8 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-warmwhite">Gửi thành công!</h3>
                  <p className="text-sm text-softgray">CellZone sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
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