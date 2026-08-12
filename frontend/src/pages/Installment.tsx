import SectionHeading from "../components/aurora/SectionHeading";
import { Link } from "react-router-dom";

export default function Installment() {
  return (
    <div className="container-padding section-padding">
      <SectionHeading title="Trả góp 0%" subtitle="Mua sắm dễ dàng với hình thức trả góp lãi suất 0%" />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Đối tác trả góp</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["Home Credit", "Fe Credit", "ACS", "Mirae Asset", "HD SAISON", "Shinhan Finance"].map((p) => (
              <div key={p} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center text-sm text-softgray">
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Yêu cầu</h2>
          <ul className="space-y-2 text-sm text-softgray">
            <li>✓ Tuổi từ 18 - 60</li>
            <li>✓ CMND/CCCD và Hộ khẩu/KT3</li>
            <li>✓ Hợp đồng điện nước hoặc sao kê lương 3 tháng gần nhất</li>
            <li>✓ Thẻ tín dụng (cho hình thức trả góp qua thẻ)</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Kỳ hạn trả góp</h2>
          <div className="flex flex-wrap gap-2">
            {[3, 6, 9, 12, 18, 24].map((m) => (
              <span key={m} className="rounded-full border border-sakura/30 bg-sakura/10 px-3 py-1 text-xs font-medium text-sakura">
                {m} tháng
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-softgray">Lãi suất 0% áp dụng cho kỳ hạn 3-12 tháng với đối tác Home Credit và Fe Credit.</p>
        </div>
        <div className="rounded-fig-card border border-sakura/20 bg-sakura/5 p-6 backdrop-blur-xl text-center">
          <p className="mb-4 text-sm text-softgray">Bạn có thể đăng ký trả góp trực tiếp tại cửa hàng hoặc liên hệ hotline để được tư vấn.</p>
          <Link to="/products" className="inline-flex items-center gap-2 rounded-full aurora-glow-btn px-6 py-3 text-sm">
            Xem sản phẩm ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
