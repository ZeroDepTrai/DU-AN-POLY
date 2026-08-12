import SectionHeading from "../components/aurora/SectionHeading";

export default function Support() {
  return (
    <div className="container-padding section-padding">
      <SectionHeading title="Trung tâm hỗ trợ" subtitle="Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7" />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Liên hệ Hotline</h2>
          <p className="text-softgray">📞 1900 1234 - Nhánh 1</p>
          <p className="text-softgray">⏰ 8:00 - 22:00 (Thứ 2 - CN)</p>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Chat trực tuyến</h2>
          <p className="text-softgray">💬 Nhắn tin ngay với đội ngũ tư vấn của chúng tôi trong khung chat bên dưới.</p>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Email</h2>
          <p className="text-softgray">📧 hotro@cellzone.vn</p>
          <p className="text-softgray">⏰ Phản hồi trong vòng 24 giờ</p>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Câu hỏi thường gặp</h2>
          <ul className="space-y-3 text-sm text-softgray">
            <li>• Làm sao để theo dõi đơn hàng?</li>
            <li>• Chính sách bảo hành như thế nào?</li>
            <li>• Tôi có thể đổi trả trong bao lâu?</li>
            <li>• Hình thức thanh toán nào được chấp nhận?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
