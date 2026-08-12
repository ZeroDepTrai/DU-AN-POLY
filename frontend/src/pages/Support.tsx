import { useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/aurora/SectionHeading";
import GlassCard from "../components/aurora/GlassCard";
import { AuroraInput, AuroraTextarea } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";
import GlowButton from "../components/aurora/GlowButton";

const HOTLINE = "1900 1234";

const SUPPORT_CHANNELS = [
  {
    icon: (
      <svg className="h-8 w-8 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    title: "Hotline 24/7",
    desc: "Luôn sẵn sàng, mọi lúc mọi nơi",
    detail: "Nhánh 1 — Tư vấn mua hàng\nNhánh 2 — Bảo hành & đổi trả",
    badge: "Phản hồi < 30s",
    badgeTone: "rose" as const,
  },
  {
    icon: (
      <svg className="h-8 w-8 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226H3.32c-.334 0-.64.213-.72.52-.055.208.029.426.184.57a4.5 4.5 0 004.95 1.75l2.93-2.93a4.5 4.5 0 00-1.75-4.95l2.93-2.93a4.5 4.5 0 00-4.95-1.75l-2.93 2.93a3.33 3.33 0 00-.57-.184.75.75 0 01-.72-.52H3a.75.75 0 00-.75.75v3.57c0 .414.336.75.75.75h3.57a.75.75 0 00.72-.52c.055-.208.029-.426-.184-.57a3.33 3.33 0 00-.57-.184.75.75 0 01-.72-.52V6.5A.75.75 0 003 6h3.57a.75.75 0 00.75-.75V4.5c0-.414.336-.75.75-.75h3.57a.75.75 0 00.75.75v3.57c0 .414.336.75.75.75h3.57a.75.75 0 00.75-.75v-2.25A.75.75 0 0021 3c0-.414-.336-.75-.75-.75h-3.57a.75.75 0 00-.75.75v3.57c0 .414.336.75.75.75H18a.75.75 0 00.75-.75v-2.25A.75.75 0 0018 3h-2.25A.75.75 0 0015 3.75v3.57c0 .414.336.75.75.75h2.25c.414 0 .75-.336.75-.75V6.5H18c-.414 0-.75.336-.75.75v3.57c0 .414.336.75.75.75H21c.414 0 .75-.336.75-.75V12z" />
      </svg>
    ),
    title: "Chat trực tuyến",
    desc: "Đội ngũ tư vấn viên chuyên nghiệp",
    detail: "Nhấn vào biểu tượng chat góc dưới bên phải màn hình để được hỗ trợ ngay.",
    badge: "Online ngay",
    badgeTone: "mint" as const,
  },
  {
    icon: (
      <svg className="h-8 w-8 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: "Email hỗ trợ",
    desc: "Gửi yêu cầu chi tiết qua email",
    detail: "hotro@cellzone.vn\nPhản hồi trong vòng 24 giờ làm việc",
    badge: "Hỗ trợ 24h",
    badgeTone: "sakura" as const,
  },
  {
    icon: (
      <svg className="h-8 w-8 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: "Cửa hàng",
    desc: "193 Đỗ Văn Thi, Biên Hòa, Đồng Nai",
    detail: "Mở cửa: 8:00 - 22:00\nTừ Thứ 2 đến Chủ nhật",
    badge: "8 cửa hàng",
    badgeTone: "amber" as const,
  },
];

const FAQ_CATEGORIES = [
  {
    category: "Đơn hàng & Giao hàng",
    questions: [
      { q: "Làm sao theo dõi đơn hàng?", a: "Sau khi đặt hàng thành công, bạn sẽ nhận mã tracking qua email/SMS. Truy cập trang 'Theo dõi đơn hàng' và nhập mã để xem chi tiết." },
      { q: "Thời gian giao hàng là bao lâu?", a: "Nội thành: 1-2 ngày. Ngoại thành: 2-4 ngày. Miễn phí giao hàng cho đơn từ 500.000đ." },
      { q: "Tôi có thể thay đổi địa chỉ giao hàng không?", a: "Liên hệ hotline trong vòng 30 phút sau khi đặt hàng để được hỗ trợ thay đổi." },
    ],
  },
  {
    category: "Thanh toán",
    questions: [
      { q: "CellZone chấp nhận những hình thức thanh toán nào?", a: "COD (nhận hàng rồi trả tiền), chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ, ví điện tử (VNPay, MoMo, ZaloPay), và trả góp 0%." },
      { q: "Thanh toán qua thẻ tín dụng có mất phí không?", a: "Không. Thanh toán qua thẻ Visa, Mastercard, JCB hoàn toàn miễn phí." },
      { q: "Tôi quên mã giảm giá, có lấy lại được không?", a: "Liên hệ hotline hoặc chat trực tiếp, nhân viên sẽ kiểm tra và hỗ trợ nếu mã còn hiệu lực." },
    ],
  },
  {
    category: "Bảo hành & Đổi trả",
    questions: [
      { q: "Chính sách bảo hành như thế nào?", a: "Tất cả sản phẩm được bảo hành chính hãng từ 12-24 tháng. Xem chi tiết tại trang Chính sách bảo hành." },
      { q: "Sản phẩm lỗi trong bao lâu thì được đổi?", a: "Đổi mới trong 7 ngày đầu tiên kể từ ngày nhận hàng. Sau 7 ngày, áp dụng bảo hành chính hãng." },
      { q: "Phí đổi trả như thế nào?", a: "Đổi trả miễn phí nếu lỗi từ nhà sản xuất. Các trường hợp khác, khách hàng chịu phí vận chuyển 25.000đ." },
    ],
  },
];

export default function Support() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-aurora-bg-deep py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-crimson/30 via-transparent to-sakura/20" />
          <div className="hero-orb animate-aurora-pan" style={{ width: 600, height: 600, top: -200, right: -100 }} />
        </div>
        <div className="container-padding relative">
          <div className="mx-auto max-w-3xl text-center">
            <AuroraBadge tone="rose" glow className="mb-4 inline-flex">
              Hỗ trợ khách hàng
            </AuroraBadge>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              <span className="aurora-text-gradient">Trung tâm hỗ trợ</span>
            </h1>
            <p className="text-lg text-softgray">
              Chúng tôi luôn sẵn sàng đồng hành cùng bạn 24/7. Đội ngũ tư vấn viên chuyên nghiệp sẽ giải đáp mọi thắc mắc nhanh chóng.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="aurora-glow-btn inline-flex items-center gap-2 px-8 py-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {HOTLINE}
              </a>
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-8 py-3 text-sm font-medium text-warmwhite backdrop-blur-xl transition-all hover:border-sakura/40 hover:text-sakura">
                Khám phá sản phẩm →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="border-y border-white/[0.06] bg-white/[0.02] py-6 backdrop-blur-xl">
        <div className="container-padding">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "50K+", label: "Khách hàng tin tưởng" },
              { value: "24/7", label: "Hỗ trợ liên tục" },
              { value: "<30s", label: "Phản hồi trung bình" },
              { value: "4.9★", label: "Đánh giá dịch vụ" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold aurora-text-rainbow">{s.value}</p>
                <p className="mt-1 text-xs text-softgray">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support channels */}
      <div className="container-padding section-padding">
        <SectionHeading
          title="Kênh hỗ trợ"
          subtitle="Chọn kênh liên lạc phù hợp với bạn"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SUPPORT_CHANNELS.map((ch, i) => (
            <GlassCard key={i} hoverable className="p-6">
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-aurora-gradient/20">
                  {ch.icon}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-bold text-warmwhite">{ch.title}</h3>
                    <AuroraBadge tone={ch.badgeTone} className="text-[10px]">{ch.badge}</AuroraBadge>
                  </div>
                  <p className="mb-2 text-sm text-softgray">{ch.desc}</p>
                  <p className="whitespace-pre-line text-xs text-steelgray">{ch.detail}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/[0.06] bg-white/[0.01] py-16">
        <div className="container-padding">
          <SectionHeading
            title="Câu hỏi thường gặp"
            subtitle="Tìm nhanh câu trả lời cho những thắc mắc phổ biến"
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {FAQ_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-sakura">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.questions.map((item, qi) => {
                    const globalIdx = cat.questions.indexOf(item);
                    const isOpen = expandedFaq === globalIdx;
                    return (
                      <GlassCard key={qi} intensity="low" className="overflow-hidden">
                        <button
                          className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-warmwhite transition-colors hover:text-sakura"
                          onClick={() => setExpandedFaq(isOpen ? null : globalIdx)}
                        >
                          {item.q}
                          <svg
                            className={`ml-3 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 text-sm text-softgray">
                            {item.a}
                          </div>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="container-padding section-padding">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            align="center"
            title="Gửi yêu cầu hỗ trợ"
            subtitle="Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ"
          />
          {submitted ? (
            <GlassCard glow className="mt-8 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint/20">
                <svg className="h-8 w-8 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-warmwhite">Gửi yêu cầu thành công!</h3>
              <p className="text-sm text-softgray">Cảm ơn bạn đã liên hệ. Đội ngũ CellZone sẽ phản hồi qua email trong vòng 24 giờ làm việc.</p>
              <button onClick={() => { setSubmitted(false); setContactForm({ name: "", email: "", subject: "", message: "" }); }} className="btn-secondary mt-6">
                Gửi yêu cầu khác
              </button>
            </GlassCard>
          ) : (
            <GlassCard className="mt-8 p-6 sm:p-8">
              <form className="space-y-5" onSubmit={handleContactSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuroraInput
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                  <AuroraInput
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <AuroraInput
                  label="Chủ đề"
                  placeholder="VD: Không nhận được hàng, cần đổi trả..."
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                />
                <AuroraTextarea
                  label="Nội dung"
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
                <GlowButton variant="aurora" size="lg" type="submit" className="w-full justify-center">
                  Gửi yêu cầu hỗ trợ
                </GlowButton>
              </form>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
