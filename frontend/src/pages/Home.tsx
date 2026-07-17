import { useRef, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput, AuroraTextarea } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";
import SectionHeading from "../components/aurora/SectionHeading";

const HERO_GLOW =
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=85&auto=format&fit=crop";

const BRANDS = [
  { name: "Apple", path: "/products?brand=apple" },
  { name: "Samsung", path: "/products?brand=samsung" },
  { name: "Xiaomi", path: "/products?brand=xiaomi" },
  { name: "OPPO", path: "/products?brand=oppo" },
];

const VALUES = [
  {
    title: "Tiên phong",
    body: "Mang đến những sản phẩm công nghệ đột phá, kiến tạo chuẩn mực mới cho cuộc sống hiện đại.",
    gradient: "from-aurora-indigo via-aurora-violet to-aurora-cyan",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Đẳng cấp",
    body: "Biểu tượng của sự tiên phong và đẳng cấp trong lĩnh vực bán lẻ thiết bị thông minh cao cấp.",
    gradient: "from-aurora-pink via-aurora-violet to-aurora-indigo",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Cam kết",
    body: "Cam kết tuyệt đối về độ hoàn thiện, dịch vụ hậu mãi chuyên nghiệp và sự hài lòng tối đa.",
    gradient: "from-aurora-mint via-aurora-cyan to-aurora-indigo",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
];

export default function Home() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const { data: showcase = [], isLoading } = useQuery({
    queryKey: ["home-showcase"],
    queryFn: async () => {
      const { data } = await productsApi.list();
      const tokens = (s: string) =>
        (s || "")
          .toLowerCase()
          .split(/[,\s]+/)
          .map((x) => x.trim())
          .filter(Boolean);
      return data
        .filter((p) => tokens(p.tags).includes("featured"))
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
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-padding pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-xl">
                <span className="h-2 w-2 animate-pulse rounded-full bg-aurora-cyan shadow-glow-cyan" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-aurora-cyan">
                  CellZone · Aurora UI
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <span className="aurora-text-gradient">Trải nghiệm</span>
                <br />
                <span className="aurora-text-rainbow">không gian mua sắm</span>
                <br />
                <span className="aurora-text-gradient">thượng lưu</span>
              </h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed text-softgray text-pretty sm:text-lg">
                Nơi công nghệ tối tân hội tụ cùng nghệ thuật thiết kế đỉnh cao.
                Khám phá những thiết bị di động định hình tương lai.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="aurora-glow-btn px-7 py-3.5 text-sm uppercase tracking-wider">
                  Mua sắm ngay
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link to="/accessories" className="rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-warmwhite backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.08]">
                  Phụ kiện cao cấp
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-md">
                {[
                  { k: "12T", t: "Bảo hành" },
                  { k: "0%", t: "Trả góp" },
                  { k: "24/7", t: "Hỗ trợ" },
                ].map((b) => (
                  <GlassCard intensity="low" className="px-4 py-3" key={b.t}>
                    <p className="aurora-text-rainbow text-lg font-bold">{b.k}</p>
                    <p className="text-[11px] uppercase tracking-wider text-steelgray">{b.t}</p>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="relative aspect-square max-h-[540px] w-full">
              <div className="absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-gradient opacity-40 blur-3xl shadow-glow-violet" />
              <GlassCard intensity="high" glow className="absolute inset-0 overflow-hidden p-0">
                <img
                  src={HERO_GLOW}
                  alt="Premium smartphone"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-aurora-bg-deep via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
                  <div className="rounded-aurora border border-white/15 bg-aurora-bg-deep/70 px-3 py-2 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-wider text-steelgray">Flagship mới</p>
                    <p className="text-sm font-semibold text-warmwhite">Khám phá ngay</p>
                  </div>
                  <div className="rounded-full bg-aurora-gradient px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow-violet">
                    Hot
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand categories ──────────────────────────────────────── */}
      <section className="border-y border-white/10">
        <div className="container-padding py-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BRANDS.map((b, i) => (
              <Link
                key={b.name}
                to={b.path}
                className="group"
              >
                <GlassCard intensity="low" hoverable className="flex flex-col items-center justify-center gap-3 py-7">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-gradient text-white shadow-glow-violet transition-transform group-hover:scale-110"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-base font-semibold uppercase tracking-wider text-warmwhite">
                    {b.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-steelgray">
                    0{i + 1}
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured showcase ─────────────────────────────────────── */}
      <section className="container-padding section-padding">
        <SectionHeading
          eyebrow="Bộ sưu tập"
          title="Sản phẩm nổi bật"
          subtitle="Những thiết bị được tuyển chọn bởi đội ngũ CellZone — định hình chuẩn mực mới cho trải nghiệm di động."
          rightSlot={
            <Link
              to="/products"
              className="inline-flex items-center gap-1 rounded-full border border-aurora-cyan/40 bg-aurora-cyan/10 px-4 py-2 text-sm font-semibold text-aurora-cyan transition-all hover:bg-aurora-cyan/20"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          }
        />

        <div className="mt-10">
          {isLoading ? (
            <LoadingSpinner label="Đang tải sản phẩm..." />
          ) : showcase.length === 0 ? (
            <GlassCard intensity="med" className="p-16 text-center">
              <p className="text-softgray">Chưa có sản phẩm nổi bật.</p>
            </GlassCard>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((product) => (
                <ProductCard key={product.id} product={product} variant="featured" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Core values ───────────────────────────────────────────── */}
      <section className="border-y border-white/10">
        <div className="container-padding section-padding">
          <SectionHeading
            align="center"
            eyebrow="Giá trị cốt lõi"
            title="Trải nghiệm khác biệt"
            subtitle="Ba trụ cột giúp CellZone trở thành điểm đến tin cậy của mọi tín đồ công nghệ."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {VALUES.map((v) => (
              <GlassCard intensity="med" hoverable className="flex flex-col items-center p-8 text-center" key={v.title}>
                <div
                  className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${v.gradient} text-white shadow-glow-violet`}
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                  </svg>
                </div>
                <h3 className="mb-3 text-lg font-bold text-warmwhite">{v.title}</h3>
                <p className="text-sm leading-relaxed text-softgray">{v.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Policies ──────────────────────────────────────────────── */}
      <section className="container-padding section-padding">
        <div className="grid gap-5 lg:grid-cols-2">
          <GlassCard intensity="med" hoverable className="flex items-start gap-5 p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aurora-gradient shadow-glow-violet">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Bảo hành VIP 1 đổi 1</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Mọi sản phẩm tại CellZone đều được hưởng chế độ bảo hành VIP 1 đổi 1 trong 30 ngày và hỗ trợ kỹ thuật trọn đời.
              </p>
            </div>
          </GlassCard>
          <GlassCard intensity="med" hoverable className="flex items-start gap-5 p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aurora-mint to-aurora-cyan shadow-glow-cyan">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-warmwhite">Hỗ trợ 24/7</h3>
              <p className="text-sm leading-relaxed text-softgray">
                Đội ngũ chuyên viên tư vấn cá nhân hóa sẵn sàng hỗ trợ 24/7, đảm bảo trải nghiệm liền mạch sau khi mua sắm.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section
        id="contact"
        ref={contactRef}
        className="border-t border-white/10"
      >
        <div className="container-padding section-padding">
          <SectionHeading
            align="center"
            eyebrow="Liên hệ"
            title="Gửi thông điệp đến CellZone"
            subtitle="Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <GlassCard intensity="med" className="overflow-hidden p-0">
              <iframe
                title="CellZone Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.6%2C10.7%2C106.8%2C10.9&layer=mapnik"
                className="h-80 w-full border-0 lg:h-[420px]"
                loading="lazy"
              />
              <div className="border-t border-white/10 p-6">
                <AuroraBadge tone="indigo" glow className="mb-3">
                  Trụ sở chính
                </AuroraBadge>
                <h3 className="mb-2 text-xl font-bold text-warmwhite">123 Đường Công Nghệ</h3>
                <p className="flex items-center gap-2 text-sm text-softgray">
                  <svg className="h-4 w-4 shrink-0 text-aurora-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Quận 1, TP. HCM
                </p>
              </div>
            </GlassCard>

            <GlassCard intensity="med" className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <AuroraBadge tone="cyan">Aurora · Liên hệ</AuroraBadge>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-warmwhite">Gửi thông điệp</h3>
              <p className="mb-6 text-sm text-softgray">
                Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
              </p>
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-warmwhite">Gửi thành công!</h3>
                  <p className="text-sm text-softgray">CellZone sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                  <GlowButton variant="aurora" className="mt-6" onClick={() => setContactSent(false)}>
                    Gửi thêm
                  </GlowButton>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <AuroraInput
                    label="Tên của bạn"
                    placeholder="Nguyen Van A"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                  <AuroraInput
                    type="email"
                    label="Email liên hệ"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                  <AuroraTextarea
                    label="Nội dung cần hỗ trợ"
                    placeholder="Viết tin nhắn của bạn..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                  <GlowButton variant="aurora" size="lg" className="w-full">
                    Gửi thông điệp
                  </GlowButton>
                </form>
              )}
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}