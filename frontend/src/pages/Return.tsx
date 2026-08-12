import { useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/aurora/SectionHeading";
import GlassCard from "../components/aurora/GlassCard";
import AuroraBadge from "../components/aurora/AuroraBadge";
import { AuroraInput } from "../components/aurora/AuroraInput";

const RETURN_STEPS = [
  {
    step: 1,
    title: "Liên hệ yêu cầu",
    desc: "Gọi hotline 1900 1234 (nhánh 2) hoặc gửi email về hotro@cellzone.vn trong vòng 7 ngày kể từ ngày nhận hàng.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Xác nhận & hướng dẫn",
    desc: "Nhân viên kiểm tra thông tin và gửi hướng dẫn đóng gói, gửi trả sản phẩm qua đường bưu điện hoặc mang trực tiếp đến cửa hàng.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Kiểm tra sản phẩm",
    desc: "Sau khi nhận được sản phẩm, đội ngũ kỹ thuật sẽ xác nhận tình trạng trong vòng 1-2 ngày làm việc.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "Hoàn tiền / Đổi sản phẩm",
    desc: "Xác nhận thành công: hoàn tiền trong 3-5 ngày làm việc (theo phương thức thanh toán ban đầu) hoặc đổi sang sản phẩm khác.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const RETURN_POLICIES = [
  {
    icon: (
      <svg className="h-7 w-7 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Đổi trả miễn phí",
    desc: "Miễn phí đổi trả trong 7 ngày đầu nếu sản phẩm lỗi từ nhà sản xuất hoặc giao sai mẫu mã.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Hoàn tiền nhanh chóng",
    desc: "Hoàn tiền trong 3-5 ngày làm việc qua chuyển khoản hoặc vào tài khoản CellZone.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Đổi sang sản phẩm khác",
    desc: "Bạn có thể đổi sang bất kỳ sản phẩm nào cùng hoặc khác giá trị (bù tiền chênh lệch nếu có).",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Hỗ trợ tận nơi",
    desc: "Nhân viên có thể đến nhận sản phẩm tại nhà cho khách hàng tại khu vực nội thành.",
  },
];

const REFUND_METHODS = [
  { method: "Chuyển khoản ngân hàng", icon: "🏦", time: "3-5 ngày làm việc", note: "Cung cấp số tài khoản để nhận hoàn tiền" },
  { method: "Tài khoản CellZone", icon: "📱", time: "Ngay lập tức", note: "Số dư được cộng vào tài khoản, dùng mua tiếp" },
  { method: "Thẻ tín dụng/Ghi nợ", icon: "💳", time: "5-7 ngày làm việc", note: "Hoàn về thẻ đã thanh toán" },
  { method: "Tiền mặt tại cửa hàng", icon: "💵", time: "Tại chỗ", note: "Chỉ áp dụng đổi trả trực tiếp tại cửa hàng" },
];

export default function Return() {
  const [orderCode, setOrderCode] = useState("");
  const [checked, setChecked] = useState(false);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-aurora-bg-deep py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-crimson/20 blur-3xl" />
          <div className="hero-orb animate-aurora-pan" style={{ width: 500, height: 500, top: -100, right: -150 }} />
        </div>
        <div className="container-padding relative">
          <div className="mx-auto max-w-3xl text-center">
            <AuroraBadge tone="rose" glow className="mb-4 inline-flex">
              Đổi trả dễ dàng
            </AuroraBadge>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              <span className="aurora-text-gradient">Chính sách đổi trả</span>
            </h1>
            <p className="text-lg text-softgray">
              CellZone cam kết mang đến trải nghiệm mua sắm yên tâm nhất. Đổi trả trong 7 ngày đầu tiên — không phí, không rắc rối.
            </p>
          </div>
        </div>
      </div>

      {/* Return policies */}
      <div className="container-padding section-padding">
        <SectionHeading title="Cam kết đổi trả" subtitle="Những quyền lợi khi bạn mua sắm tại CellZone" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {RETURN_POLICIES.map((p, i) => (
            <GlassCard key={i} hoverable className="flex gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                {p.icon}
              </div>
              <div>
                <h3 className="mb-1 font-bold text-warmwhite">{p.title}</h3>
                <p className="text-sm text-softgray">{p.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="border-t border-white/[0.06] bg-white/[0.01] py-16">
        <div className="container-padding">
          <SectionHeading title="Quy trình đổi trả" subtitle="4 bước đơn giản để yêu cầu đổi trả" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RETURN_STEPS.map((step) => (
              <GlassCard key={step.step} hoverable className="relative p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-gradient text-white shadow-glow-violet">
                  {step.icon}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-crimson/20 text-xs font-bold text-crimson">
                    {step.step}
                  </span>
                  <h3 className="font-bold text-warmwhite">{step.title}</h3>
                </div>
                <p className="text-sm text-softgray">{step.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Refund methods */}
      <div className="container-padding section-padding">
        <SectionHeading title="Phương thức hoàn tiền" subtitle="Chọn cách nhận tiền phù hợp với bạn" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {REFUND_METHODS.map((m, i) => (
            <GlassCard key={i} hoverable className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-aurora-gradient/20 text-2xl">
                {m.icon}
              </div>
              <div>
                <h3 className="font-bold text-warmwhite">{m.method}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <AuroraBadge tone="mint" className="text-[10px]">{m.time}</AuroraBadge>
                </div>
                <p className="mt-1 text-xs text-steelgray">{m.note}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Important notice */}
      <div className="border-t border-white/[0.06] py-16">
        <div className="container-padding">
          <GlassCard intensity="high" className="mx-auto max-w-3xl p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deeprose/20">
                <svg className="h-5 w-5 text-deeprose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-3 font-bold text-deeprose">Lưu ý quan trọng</h3>
                <ul className="space-y-2 text-sm text-softgray">
                  <li>• Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng, đầy đủ phụ kiện và hộp</li>
                  <li>• Không áp dụng đổi trả với sản phẩm đã kích hoạt SIM/Apple ID/Google account</li>
                  <li>• Sản phẩm có dấu hiệu rơi vỡ, vào nước, tự ý sửa chữa sẽ không được chấp nhận</li>
                  <li>• Yêu cầu đổi trả phải được thực hiện trong vòng 7 ngày kể từ ngày nhận hàng</li>
                  <li>• Giữ nguyên hóa đơn và phiếu bảo hành để được hỗ trợ nhanh chóng</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick request */}
      <div className="container-padding section-padding">
        <div className="mx-auto max-w-xl">
          <SectionHeading align="center" title="Yêu cầu đổi trả nhanh" subtitle="Nhập mã đơn hàng để bắt đầu" />
          <GlassCard glow className="mt-8 p-6 sm:p-8">
            <form className="space-y-4">
              <AuroraInput
                label="Mã đơn hàng"
                placeholder="VD: CZ-2026-XXXXX"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
              />
              <label className="flex items-start gap-3 text-sm text-softgray">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 accent-crimson"
                />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <Link to="/return" className="text-sakura underline">chính sách đổi trả</Link>{" "}
                  của CellZone. Sản phẩm của tôi đáp ứng đầy đủ điều kiện đổi trả.
                </span>
              </label>
              <button
                type="button"
                disabled={!orderCode || !checked}
                className="aurora-glow-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bắt đầu yêu cầu đổi trả
              </button>
            </form>
          </GlassCard>
          <p className="mt-4 text-center text-xs text-steelgray">
            Bạn cần hỗ trợ ngay?{" "}
            <a href="tel:19001234" className="text-sakura underline">Gọi 1900 1234 (nhánh 2)</a>{" "}
            hoặc{" "}
            <Link to="/support" className="text-sakura underline">chat trực tuyến</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
