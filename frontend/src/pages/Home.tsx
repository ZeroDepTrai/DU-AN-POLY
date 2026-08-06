import { useRef, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import ProductCard from "../components/ProductCard";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput, AuroraTextarea } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";
import SectionHeading from "../components/aurora/SectionHeading";
import OptimizedImage from "../components/OptimizedImage";
import StarRating from "../components/aurora/StarRating";

const HERO_GLOW =
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=85&auto=format&fit=crop";

const BRANDS = [
  { name: "Apple", path: "/products?brand=apple" },
  { name: "Samsung", path: "/products?brand=samsung" },
  { name: "Xiaomi", path: "/products?brand=xiaomi" },
  { name: "OPPO", path: "/products?brand=oppo" },
];

// ── Promotional banner ads (Figma ad units) ────────────────────────────────
const PROMO_BANNERS = [
  {
    id: 1,
    tagline: "Giảm 20%",
    title: "iPhone 16 Series",
    subtitle: "Flagship mới — đặt hàng ngay hôm nay",
    cta: "Mua ngay",
    href: "/products?brand=apple",
    gradient: "from-crimson via-rose to-sakura",
    accent: "from-crimson",
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80&auto=format&fit=crop",
    size: "wide",
  },
  {
    id: 2,
    tagline: "Flash Sale",
    title: "Samsung Galaxy S25",
    subtitle: "Giá chỉ từ 18.990.000đ",
    cta: "Xem ngay",
    href: "/products?brand=samsung",
    gradient: "from-blue-700 via-blue-500 to-cyan-500",
    accent: "from-blue-600",
    img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80&auto=format&fit=crop",
    size: "tall",
  },
  {
    id: 3,
    tagline: "Mới nhất",
    title: "Xiaomi 15 Ultra",
    subtitle: "Camera 200MP — flagship killer",
    cta: "Khám phá",
    href: "/products?brand=xiaomi",
    gradient: "from-amber-600 via-orange-500 to-red-500",
    accent: "from-amber-600",
    img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80&auto=format&fit=crop",
    size: "tall",
  },
  {
    id: 4,
    tagline: "OPPO Find X8",
    title: "Chụp ảnh chuyên nghiệp",
    subtitle: "Hasselblad — nghệ thuật trong tầm tay",
    cta: "Đặt trước",
    href: "/products?brand=oppo",
    gradient: "from-emerald-700 via-teal-500 to-cyan-400",
    accent: "from-emerald-600",
    img: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&q=80&auto=format&fit=crop",
    size: "square",
  },
  {
    id: 5,
    tagline: "Trả góp 0%",
    title: "Gậy selfie cao cấp",
    subtitle: "Cho những khoảnh khắc đáng nhớ",
    cta: "Xem phụ kiện",
    href: "/accessories",
    gradient: "from-purple-700 via-pink-500 to-rose-400",
    accent: "from-purple-600",
    img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80&auto=format&fit=crop",
    size: "square",
  },
];

// ── Customer testimonials (Figma ratings / reviews showcase) ───────────────
const TESTIMONIAL_AVATARS = [
  { initials: "NVA", hue: "crimson" },
  { initials: "THL", hue: "rose" },
  { initials: "MKB", hue: "sakura" },
  { initials: "VDT", hue: "amber" },
  { initials: "LHP", hue: "teal" },
  { initials: "PTH", hue: "rose" },
];

// MOCK testimonials — in production these would come from ratingsApi.list per top-rated products
const TESTIMONIALS = [
  {
    id: 1,
    user_name: "Nguyễn Văn An",
    stars: 5,
    review: "CellZone giao hàng cực nhanh, đóng gói rất kỹ. Sản phẩm iPhone 16 Pro Max y như mô tả, máy mới 100%. Đội ngũ tư vấn nhiệt tình, sẽ ủng hộ dài dài!",
    product: "iPhone 16 Pro Max",
    daysAgo: 2,
    avatar: TESTIMONIAL_AVATARS[0],
  },
  {
    id: 2,
    user_name: "Trần Hồng Linh",
    stars: 5,
    review: "Mình mua Samsung Galaxy S25 Ultra ở đây, giá tốt hơn nhiều cửa hàng khác. Bảo hành 1 đổi 1 thật sự yên tâm. Đã giới thiệu cho cả nhà rồi.",
    product: "Samsung Galaxy S25 Ultra",
    daysAgo: 5,
    avatar: TESTIMONIAL_AVATARS[1],
  },
  {
    id: 3,
    user_name: "Mai Khánh Bảo",
    stars: 5,
    review: "Xiaomi 15 Ultra chụp ảnh quá đỉnh, camera 200MP không thua gì iPhone. CellZone tư vấn rất chuyên nghiệp, không quảng cáo thái quá. Highly recommended!",
    product: "Xiaomi 15 Ultra",
    daysAgo: 8,
    avatar: TESTIMONIAL_AVATARS[2],
  },
  {
    id: 4,
    user_name: "Vũ Đức Thắng",
    stars: 4,
    review: "Mua OPPO Find X8 Pro rất hài lòng. Màn hình đẹp, pin trâu, sạc nhanh 80W. Giao hàng trong ngày tại TP.HCM. Chờ đợi chương trình tích điểm thêm.",
    product: "OPPO Find X8 Pro",
    daysAgo: 12,
    avatar: TESTIMONIAL_AVATARS[3],
  },
  {
    id: 5,
    user_name: "Lê Hoàng Phúc",
    stars: 5,
    review: "Đã mua 3 chiếc điện thoại tại CellZone, lần nào cũng tuyệt vời. Nhân viên dễ thương, hỗ trợ 24/7. Giá cả phải chăng, khuyến mãi nhiều.",
    product: "iPhone 15 Pro",
    daysAgo: 15,
    avatar: TESTIMONIAL_AVATARS[4],
  },
  {
    id: 6,
    user_name: "Phạm Thị Hương",
    stars: 5,
    review: "Lần đầu mua online mà an tâm như đến cửa hàng. Ship COD, kiểm tra hàng trước khi thanh toán. Phụ kiện đi kèm chính hãng. 5 sao cho CellZone!",
    product: "Samsung Galaxy A55",
    daysAgo: 20,
    avatar: TESTIMONIAL_AVATARS[5],
  },
];

const VALUES = [
  {
    title: "Tiên phong",
    body: "Mang đến những sản phẩm công nghệ đột phá, kiến tạo chuẩn mực mới cho cuộc sống hiện đại.",
    gradient: "from-crimson via-rose to-sakura",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Đẳng cấp",
    body: "Biểu tượng của sự tiên phong và đẳng cấp trong lĩnh vực bán lẻ thiết bị thông minh cao cấp.",
    gradient: "from-lightpink via-rose to-crimson",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Cam kết",
    body: "Cam kết tuyệt đối về độ hoàn thiện, dịch vụ hậu mãi chuyên nghiệp và sự hài lòng tối đa.",
    gradient: "from-sakura via-rose to-deeprose",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
];

// Avatar color map
const AVATAR_STYLES: Record<string, string> = {
  crimson: "bg-crimson text-white",
  rose: "bg-rose text-white",
  sakura: "bg-sakura text-white",
  amber: "bg-amber-600 text-white",
  teal: "bg-teal-600 text-white",
};

function getAvatarStyle(hue: string) {
  return AVATAR_STYLES[hue] ?? "bg-sakura text-white";
}

function formatDaysAgo(days: number) {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  const avatarStyle = getAvatarStyle(t.avatar.hue);

  return (
    <GlassCard intensity="low" hoverable className="flex flex-col gap-4 p-6">
      {/* Stars + product */}
      <div className="flex items-center justify-between gap-2">
        <StarRating value={t.stars} readonly size="sm" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-steelgray">
          {t.product}
        </span>
      </div>

      {/* Review text */}
      <p className="flex-1 text-sm leading-relaxed text-softgray italic">
        &ldquo;{t.review}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarStyle}`}>
          {t.avatar.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-warmwhite">{t.user_name}</p>
          <p className="text-[10px] text-steelgray">{formatDaysAgo(t.daysAgo)}</p>
        </div>
        <AuroraBadge tone="sakura">
          Đã xác nhận
        </AuroraBadge>
      </div>
    </GlassCard>
  );
}

export default function Home() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const {
    data: showcase = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["home-showcase"],
    queryFn: async () => {
      const { data } = await productsApi.search({ tag: "featured", page: 1, limit: 6 });
      return data.products;
    },
    staleTime: 10 * 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
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
        <div className="container-padding pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-fig-pill border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sakura shadow-glow" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sakura">
                  CellZone · Aurora UI
                </span>
              </div>
              <h1 className="mb-5 text-fig-display">
                <span className="aurora-text-gradient">Trải nghiệm</span>
                <br />
                <span className="aurora-text-rainbow">không gian mua sắm</span>
                <br />
                <span className="aurora-text-gradient">thượng lưu</span>
              </h1>
              <p className="mb-8 max-w-lg text-base leading-relaxed text-softgray text-pretty sm:text-lg">
                Nơi công nghệ tối tân hội tụ cùng nghệ thuật thiết kế đỉnh cao.
                Khám phá những thiết bị di động định hình tương lai.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="aurora-glow-btn px-7 py-3.5 text-sm uppercase tracking-wider focus-aurora">
                  Mua sắm ngay
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link to="/accessories" className="rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-warmwhite backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.08] focus-rose">
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
                    <p className="text-[10px] uppercase tracking-wider text-steelgray">{b.t}</p>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="relative aspect-square max-h-[540px] w-full">
              <div className="absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-gradient opacity-40 blur-3xl shadow-glow-violet" />
              <GlassCard intensity="high" glow className="absolute inset-0 overflow-hidden p-0">
                <OptimizedImage
                  src={HERO_GLOW}
                  alt="Premium smartphone"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-aurora-bg-deep via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
                  <div className="rounded-fig-card border border-white/15 bg-aurora-bg-deep/70 px-3 py-2 backdrop-blur-xl">
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

      {/* ── Promotional banner ads (Figma ad units) ─────────────────── */}
      <section className="border-y border-white/[0.06]">
        <div className="container-padding section-padding">
          <SectionHeading
            eyebrow="Khuyến mãi"
            title="Ưu đãi đặc biệt"
            subtitle="Cập nhật khuyến mãi mới nhất từ CellZone — giảm giá flagship, flash sale, quà tặng hấp dẫn."
            rightSlot={
              <Link
                to="/products"
                className="inline-flex items-center gap-1 rounded-fig-pill border border-sakura/40 bg-sakura/10 px-4 py-2 text-sm font-semibold text-sakura transition-all hover:bg-sakura/20 focus-rose"
              >
                Xem tất cả
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Hero banner — spans full width on mobile and 2 cols on tablet */}
            {PROMO_BANNERS[0] && (
              <Link
                to={PROMO_BANNERS[0].href}
                className="group relative col-span-1 flex aspect-[16/7] overflow-hidden rounded-fig-card sm:col-span-2 lg:col-span-3 bg-aurora-bg-mid"
              >
                <OptimizedImage
                  src={PROMO_BANNERS[0].img}
                  alt={PROMO_BANNERS[0].title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${PROMO_BANNERS[0].gradient} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {PROMO_BANNERS[0].tagline}
                  </span>
                </div>
                <div className="relative z-10 flex flex-col justify-end p-5">
                  <h3 className="font-bold text-white text-2xl leading-tight">{PROMO_BANNERS[0].title}</h3>
                  <p className="mt-1 text-xs text-white/80">{PROMO_BANNERS[0].subtitle}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-xl transition-all group-hover:bg-white/35 w-fit">
                    {PROMO_BANNERS[0].cta}
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-fig-card ring-1 ring-white/0 transition-all duration-300 group-hover:ring-white/20" />
              </Link>
            )}

            {/* Remaining banners — auto grid, all equal size */}
            {PROMO_BANNERS.slice(1).map((banner) => (
              <Link
                key={banner.id}
                to={banner.href}
                className="group relative flex aspect-[16/9] overflow-hidden rounded-fig-card bg-aurora-bg-mid"
              >
                <OptimizedImage
                  src={banner.img}
                  alt={banner.title}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute left-3 top-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {banner.tagline}
                  </span>
                </div>
                <div className="relative z-10 flex flex-col justify-end p-4">
                  <h3 className="font-bold text-white text-base leading-tight">{banner.title}</h3>
                  <p className="mt-1 text-[10px] text-white/80">{banner.subtitle}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-xl transition-all group-hover:bg-white/35">
                    {banner.cta}
                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-fig-card ring-1 ring-white/0 transition-all duration-300 group-hover:ring-white/20" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand categories ──────────────────────────────────────── */}
      <section className="border-y border-white/[0.06]">
        <div className="container-padding py-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BRANDS.map((b, i) => (
              <Link
                key={b.name}
                to={b.path}
                className="group focus-rose"
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
              className="inline-flex items-center gap-1 rounded-fig-pill border border-sakura/40 bg-sakura/10 px-4 py-2 text-sm font-semibold text-sakura transition-all hover:bg-sakura/20 focus-rose"
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <GlassCard key={item} intensity="low" className="overflow-hidden p-0">
                  <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-white/[0.04] via-sakura/[0.08] to-crimson/[0.08]" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
                    <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : isError ? (
            <GlassCard intensity="med" className="p-12 text-center">
              <p className="text-warmwhite">Không thể tải sản phẩm nổi bật.</p>
              <p className="mt-2 text-sm text-softgray">Máy chủ đang tạm thời không phản hồi.</p>
              <button
                type="button"
                className="mt-5 rounded-xl border border-sakura/40 bg-sakura/10 px-5 py-2.5 text-sm font-semibold text-sakura transition-all hover:bg-sakura/20 disabled:cursor-wait disabled:opacity-60 focus-rose"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                {isFetching ? "Đang thử lại..." : "Thử lại"}
              </button>
            </GlassCard>
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

      {/* ── Customer testimonials / ratings showcase (Figma reviews) ─ */}
      <section className="border-y border-white/[0.06]">
        <div className="container-padding section-padding">
          <SectionHeading
            eyebrow="Đánh giá"
            title="Khách hàng nói gì về CellZone"
            subtitle="Hàng nghìn khách hàng đã tin tưởng lựa chọn CellZone. Đọc những trải nghiệm thực tế từ cộng đồng."
            rightSlot={
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="h-4 w-4 fill-sakura text-sakura" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-warmwhite">4.9 / 5.0</span>
                <span className="text-xs text-steelgray">(2.847 đánh giá)</span>
              </div>
            }
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-fig-pill border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-warmwhite backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.08] focus-rose"
            >
              Xem tất cả đánh giá
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Core values ───────────────────────────────────────────── */}
      <section>
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura to-crimson shadow-glow">
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
        className="border-t border-white/[0.06]"
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
                <AuroraBadge tone="crimson" glow className="mb-3">
                  Trụ sở chính
                </AuroraBadge>
                <h3 className="mb-2 text-xl font-bold text-warmwhite">193 Đỗ Văn Thi, phường Trấn Biên, TP. Biên Hòa, Đồng Nai 700000</h3>
                <p className="flex items-center gap-2 text-sm text-softgray">
                  <svg className="h-4 w-4 shrink-0 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  phường Trấn Biên, TP. Biên Hòa, Đồng Nai
                </p>
              </div>
            </GlassCard>

            <GlassCard intensity="med" className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <AuroraBadge tone="sakura">Aurora · Liên hệ</AuroraBadge>
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
                  <GlowButton variant="aurora" className="mt-6 focus-aurora" onClick={() => setContactSent(false)}>
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
                  <GlowButton variant="aurora" size="lg" className="w-full focus-aurora">
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
