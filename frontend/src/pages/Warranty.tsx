import { Link } from "react-router-dom";
import SectionHeading from "../components/aurora/SectionHeading";
import GlassCard from "../components/aurora/GlassCard";
import AuroraBadge from "../components/aurora/AuroraBadge";

const WARRANTY_TIMELINE = [
  {
    step: 1,
    title: "Kiểm tra sản phẩm",
    desc: "Sản phẩm được kiểm tra tình trạng, serial, và xác nhận thông tin bảo hành.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Tiếp nhận & xử lý",
    desc: "Nhân viên tiếp nhận và chuyển đến trung tâm bảo hành ủy quyền của hãng.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Bảo hành tại hãng",
    desc: "Thời gian xử lý tùy thuộc vào tình trạng: đổi mới, sửa chữa, hoặc bảo hành linh kiện.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "Nhận sản phẩm",
    desc: "Sau khi hoàn tất bảo hành, nhân viên sẽ thông báo để bạn đến nhận hoặc giao tận nơi.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

const BRANDS = [
  { name: "Apple", logo: "🍎", warranty: "12 tháng", color: "from-gray-600 to-gray-400" },
  { name: "Samsung", logo: "📱", warranty: "12 tháng", color: "from-blue-600 to-blue-400" },
  { name: "Xiaomi", logo: "📲", warranty: "12 tháng", color: "from-orange-500 to-amber-400" },
  { name: "OPPO", logo: "📞", warranty: "12 tháng", color: "from-emerald-600 to-emerald-400" },
  { name: "vivo", logo: "🔲", warranty: "12 tháng", color: "from-indigo-600 to-indigo-400" },
  { name: "Realme", logo: "🔴", warranty: "12 tháng", color: "from-yellow-500 to-yellow-300" },
];

const COVERAGE = [
  { icon: "✓", text: "Lỗi kỹ thuật từ nhà sản xuất", ok: true },
  { icon: "✓", text: "Lỗi màn hình, pin, camera theo tiêu chuẩn hãng", ok: true },
  { icon: "✓", text: "Phụ kiện đi kèm trong hộp (cáp, sạc chính hãng)", ok: true },
  { icon: "✓", text: "Bảo hành quốc tế tại các trung tâm ủy quyền", ok: true },
  { icon: "✗", text: "Rơi vỡ, cong vênh, vào nước", ok: false },
  { icon: "✗", text: "Tự ý sửa chữa, root, nâng cấp phần mềm tự do", ok: false },
  { icon: "✗", text: "Sản phẩm đã hết thời hạn bảo hành", ok: false },
  { icon: "✗", text: "Hư hỏng do thiên tai, cháy nổ", ok: false },
];

export default function Warranty() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-aurora-bg-deep py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="hero-orb animate-aurora-pan" style={{ width: 500, height: 500, top: -150, left: -100 }} />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        </div>
        <div className="container-padding relative">
          <div className="mx-auto max-w-3xl text-center">
            <AuroraBadge tone="rose" glow className="mb-4 inline-flex">
              Cam kết chất lượng
            </AuroraBadge>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              <span className="aurora-text-gradient">Chính sách bảo hành</span>
            </h1>
            <p className="text-lg text-softgray">
              Mọi sản phẩm tại CellZone đều được bảo hành chính hãng theo tiêu chuẩn quốc tế. Đội ngũ kỹ thuật viên chuyên nghiệp luôn sẵn sàng hỗ trợ bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Coverage grid */}
      <div className="container-padding section-padding">
        <SectionHeading
          title="Phạm vi bảo hành"
          subtitle="Những gì được bảo hành và những trường hợp không được bảo hành"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {COVERAGE.map((item, i) => (
            <GlassCard key={i} intensity={item.ok ? "low" : "low"} className={`flex items-center gap-4 p-4 ${!item.ok ? "border-deeprose/10" : ""}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${item.ok ? "bg-mint/20 text-mint" : "bg-deeprose/20 text-deeprose"}`}>
                {item.icon}
              </div>
              <span className={`text-sm ${item.ok ? "text-softgray" : "text-steelgray"}`}>{item.text}</span>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Brand warranty */}
      <div className="border-t border-white/[0.06] bg-white/[0.01] py-16">
        <div className="container-padding">
          <SectionHeading
            title="Bảo hành theo hãng"
            subtitle="Thời gian bảo hành tiêu chuẩn cho từng thương hiệu"
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BRANDS.map((brand) => (
              <GlassCard key={brand.name} hoverable className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${brand.color} text-2xl`}>
                  {brand.logo}
                </div>
                <div>
                  <h3 className="font-bold text-warmwhite">{brand.name}</h3>
                  <AuroraBadge tone="mint" className="mt-1 text-[10px]">{brand.warranty}</AuroraBadge>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="container-padding section-padding">
        <SectionHeading
          title="Quy trình bảo hành"
          subtitle="4 bước đơn giản để được hỗ trợ nhanh chóng"
        />
        <div className="mt-8 relative">
          <div className="absolute left-8 top-0 h-full w-px bg-gradient-to-b from-crimson/50 via-sakura/30 to-transparent sm:left-1/2 sm:-translate-x-px" />
          <div className="space-y-8">
            {WARRANTY_TIMELINE.map((step, i) => (
              <div key={step.step} className={`relative flex gap-6 sm:items-center ${i % 2 === 1 ? "sm:flex-row-reverse" : ""}`}>
                <div className="flex items-start gap-4 sm:w-1/2 sm:gap-0">
                  {i % 2 === 1 && <div className="hidden sm:block sm:w-20" />}
                  <GlassCard className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-aurora-gradient text-white shadow-glow-violet sm:mx-auto">
                    {step.icon}
                  </GlassCard>
                  {i % 2 === 0 && <div className="hidden sm:block sm:w-20" />}
                </div>
                <div className={`sm:w-1/2 ${i % 2 === 1 ? "sm:order-first" : ""}`}>
                  <GlassCard intensity="low" className="p-5">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-crimson/20 text-xs font-bold text-crimson">
                        {step.step}
                      </span>
                      <h3 className="font-bold text-warmwhite">{step.title}</h3>
                    </div>
                    <p className="text-sm text-softgray">{step.desc}</p>
                  </GlassCard>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/[0.06] py-16">
        <div className="container-padding">
          <GlassCard glow className="mx-auto max-w-2xl p-8 text-center">
            <h3 className="mb-2 text-xl font-bold text-warmwhite">Cần hỗ trợ bảo hành?</h3>
            <p className="mb-6 text-sm text-softgray">Đội ngũ kỹ thuật viên của chúng tôi luôn sẵn sàng tiếp nhận và xử lý yêu cầu bảo hành nhanh chóng.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="tel:19001234" className="aurora-glow-btn inline-flex items-center gap-2 px-6 py-3">
                📞 1900 1234 — Nhánh 2
              </a>
              <Link to="/return" className="btn-secondary inline-flex items-center gap-2 px-6 py-3">
                Chính sách đổi trả
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
