import { Link } from "react-router-dom";
import SectionHeading from "../components/aurora/SectionHeading";
import GlassCard from "../components/aurora/GlassCard";
import AuroraBadge from "../components/aurora/AuroraBadge";

const PARTNERS = [
  { name: "Home Credit", logo: "🏠", tagline: "Trả góp 0%", color: "from-blue-600 to-blue-400", highlights: ["0% lãi suất", "6-24 tháng", "Duyệt nhanh 15 phút"] },
  { name: "Fe Credit", logo: "💳", tagline: "Duyệt tức thì", color: "from-purple-600 to-purple-400", highlights: ["0% lãi suất", "3-24 tháng", "Không cần thế chấp"] },
  { name: "ACS", logo: "📋", tagline: "Lãi suất thấp", color: "from-emerald-600 to-emerald-400", highlights: ["Lãi suất 1.5%/tháng", "3-18 tháng", "Nhiều ưu đãi"] },
  { name: "Mirae Asset", logo: "📊", tagline: "Duyệt online", color: "from-orange-500 to-amber-400", highlights: ["0% lãi suất", "6-24 tháng", "Tự động phê duyệt"] },
  { name: "Shinhan Finance", logo: "🇰🇷", tagline: "Uy tín Hàn", color: "from-red-600 to-red-400", highlights: ["Lãi suất 1.2%/tháng", "6-36 tháng", "Bảo hiểm kèm theo"] },
  { name: "HD SAISON", logo: "🌟", tagline: "Nhiều gói linh hoạt", color: "from-teal-500 to-cyan-400", highlights: ["0% lãi suất", "3-18 tháng", "Trả trước linh hoạt"] },
];

const TENURES = [
  { months: 3, rate: "0%", note: "Phổ biến nhất" },
  { months: 6, rate: "0%", note: "Cân đối chi tiêu" },
  { months: 9, rate: "0%", note: "Phù hợp nhất" },
  { months: 12, rate: "0%", note: "Phổ biến" },
  { months: 18, rate: "1.2%", note: "Giảm áp lực trả góp" },
  { months: 24, rate: "1.5%", note: "Trả đều mỗi tháng" },
];

const REQUIREMENTS = [
  {
    icon: (
      <svg className="h-7 w-7 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Độ tuổi",
    detail: "18 - 60 tuổi",
    sub: "Tính theo ngày sinh trên CMND/CCCD",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 6.75h.008v.008H12v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: "Giấy tờ cần thiết",
    detail: "CMND/CCCD + Hộ khẩu/KT3",
    sub: "Hoặc passport + hợp đồng điện/nước",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Thu nhập",
    detail: "Tối thiểu 3 triệu/tháng",
    sub: "Sao kê lương 3 tháng hoặc hợp đồng lao động",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: "Lịch sử tín dụng",
    detail: "Không nợ xấu",
    sub: "CIC không có nợ nhóm 2 trở lên",
  },
];

const EXAMPLE_PRODUCTS = [
  { name: "iPhone 16 Pro Max", price: "34.990.000đ", monthly3: "11.663.000đ", monthly6: "5.831.000đ", monthly12: "2.915.000đ", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&q=80&auto=format&fit=crop" },
  { name: "Samsung Galaxy S25 Ultra", price: "27.990.000đ", monthly3: "9.330.000đ", monthly6: "4.665.000đ", monthly12: "2.332.000đ", img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&q=80&auto=format&fit=crop" },
  { name: "Xiaomi 15 Ultra", price: "18.990.000đ", monthly3: "6.330.000đ", monthly6: "3.165.000đ", monthly12: "1.582.000đ", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80&auto=format&fit=crop" },
];

export default function Installment() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-aurora-bg-deep py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-crimson/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-sakura/20 blur-3xl" />
          <div className="hero-orb animate-aurora-pan" style={{ width: 400, height: 400, top: -50, left: "40%" }} />
        </div>
        <div className="container-padding relative">
          <div className="mx-auto max-w-3xl text-center">
            <AuroraBadge tone="rose" glow className="mb-4 inline-flex">
              Mua sắm thông minh
            </AuroraBadge>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              <span className="aurora-text-gradient">Trả góp 0%</span>
            </h1>
            <p className="text-lg text-softgray">
              Sở hữu ngay chiếc điện thoại旗舰 mà không cần trả trước quá nhiều. Duyệt nhanh, lãi suất 0%, giấy tờ tối giản.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/products" className="aurora-glow-btn inline-flex items-center gap-2 px-8 py-3">
                Xem sản phẩm trả góp →
              </Link>
              <a href="tel:19001234" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-8 py-3 text-sm font-medium text-warmwhite backdrop-blur-xl transition-all hover:border-sakura/40 hover:text-sakura">
                📞 Tư vấn: 1900 1234
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-white/[0.06] bg-white/[0.02] py-6 backdrop-blur-xl">
        <div className="container-padding">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "0%", label: "Lãi suất 0%" },
              { value: "6+", label: "Đối tác tài chính" },
              { value: "<15ph", label: "Duyệt hồ sơ" },
              { value: "50K+", label: "Khách trả góp" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold aurora-text-rainbow">{s.value}</p>
                <p className="mt-1 text-xs text-softgray">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partners */}
      <div className="container-padding section-padding">
        <SectionHeading
          title="Đối tác trả góp"
          subtitle="Hợp tác với các công ty tài chính uy tín hàng đầu Việt Nam"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((p) => (
            <GlassCard key={p.name} hoverable className="overflow-hidden p-0">
              <div className={`h-2 bg-gradient-to-r ${p.color}`} />
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-2xl`}>
                    {p.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-warmwhite">{p.name}</h3>
                    <AuroraBadge tone="mint" className="mt-0.5 text-[10px]">{p.tagline}</AuroraBadge>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-softgray">
                      <svg className="h-3.5 w-3.5 shrink-0 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Tenures */}
      <div className="border-t border-white/[0.06] bg-white/[0.01] py-16">
        <div className="container-padding">
          <SectionHeading title="Kỳ hạn trả góp" subtitle="Lựa chọn kỳ hạn phù hợp với khả năng tài chính của bạn" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TENURES.map((t) => (
              <GlassCard key={t.months} hoverable className="p-4 text-center">
                <p className="text-2xl font-extrabold aurora-text-rainbow">{t.months}</p>
                <p className="text-sm font-semibold text-warmwhite">tháng</p>
                <div className="my-2 flex items-center justify-center gap-1">
                  <AuroraBadge tone={t.rate === "0%" ? "mint" : "amber"} className="text-xs font-bold">
                    {t.rate} lãi
                  </AuroraBadge>
                </div>
                <p className="text-xs text-steelgray">{t.note}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="container-padding section-padding">
        <SectionHeading title="Yêu cầu" subtitle="Điều kiện để được duyệt trả góp dễ dàng" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {REQUIREMENTS.map((req) => (
            <GlassCard key={req.title} hoverable className="flex gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-aurora-gradient/20">
                {req.icon}
              </div>
              <div>
                <h3 className="font-bold text-warmwhite">{req.title}</h3>
                <p className="mt-0.5 text-sm font-semibold text-sakura">{req.detail}</p>
                <p className="mt-1 text-xs text-steelgray">{req.sub}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Example */}
      <div className="border-t border-white/[0.06] bg-white/[0.01] py-16">
        <div className="container-padding">
          <SectionHeading
            title="Ví dụ trả góp"
            subtitle="Tính toán nhanh cho các sản phẩm phổ biến (lãi suất 0%, kỳ hạn 3-12 tháng)"
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {EXAMPLE_PRODUCTS.map((p) => (
              <GlassCard key={p.name} hoverable className="overflow-hidden p-0">
                <div className="relative aspect-square overflow-hidden bg-aurora-bg-mid">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-bold text-warmwhite">{p.name}</p>
                    <p className="text-xs text-steelgray">Giá: {p.price}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-steelgray">Mỗi tháng trả</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "3 tháng", val: p.monthly3 },
                      { label: "6 tháng", val: p.monthly6 },
                      { label: "12 tháng", val: p.monthly12 },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-center">
                        <p className="text-[10px] text-steelgray">{m.label}</p>
                        <p className="mt-0.5 text-xs font-bold text-sakura">{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container-padding section-padding">
        <GlassCard glow className="mx-auto max-w-2xl p-8 text-center">
          <h3 className="mb-2 text-xl font-bold text-warmwhite">Bắt đầu trả góp ngay hôm nay</h3>
          <p className="mb-6 text-sm text-softgray">
            Đến cửa hàng CellZone gần nhất hoặc liên hệ hotline để được đội ngũ tư vấn hỗ trợ làm hồ sơ trả góp.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" className="aurora-glow-btn inline-flex items-center gap-2 px-6 py-3">
              Chọn sản phẩm
            </Link>
            <a href="tel:19001234" className="btn-secondary inline-flex items-center gap-2 px-6 py-3">
              📞 Tư vấn trả góp
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
