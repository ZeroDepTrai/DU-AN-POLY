import SectionHeading from "../components/aurora/SectionHeading";

export default function Return() {
  return (
    <div className="container-padding section-padding">
      <SectionHeading title="Chính sách đổi trả" subtitle="Đổi trả dễ dàng trong 7 ngày đầu tiên" />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Điều kiện đổi trả</h2>
          <ul className="space-y-2 text-sm text-softgray">
            <li>✓ Sản phẩm còn nguyên vẹn, chưa qua sử dụng</li>
            <li>✓ Hộp, phụ kiện, phiếu bảo hành đầy đủ</li>
            <li>✓ Yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận hàng</li>
            <li>✓ Còn hóa đơn mua hàng</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Quy trình đổi trả</h2>
          <ul className="space-y-2 text-sm text-softgray">
            <li>1. Liên hệ hotline 1900 1234 hoặc gửi email về hotro@cellzone.vn</li>
            <li>2. Nhân viên xác nhận và hướng dẫn gửi sản phẩm về</li>
            <li>3. Sau khi xác nhận sản phẩm đạt yêu cầu, hoàn tiền trong 3-5 ngày làm việc</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Phương thức hoàn tiền</h2>
          <ul className="space-y-2 text-sm text-softgray">
            <li>• Chuyển khoản ngân hàng (theo thông tin tài khoản đã cung cấp)</li>
            <li>• Hoàn vào tài khoản CellZone của bạn</li>
            <li>• Đổi sang sản phẩm khác có giá trị tương đương</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-deeprose/30 bg-deeprose/5 p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-deeprose">Lưu ý quan trọng</h2>
          <p className="text-sm text-softgray">Sản phẩm bị trầy xước, đã kích hoạt sim/icloud, hoặc có dấu hiệu đã sử dụng sẽ không được chấp nhận đổi trả theo chính sách này.</p>
        </div>
      </div>
    </div>
  );
}
