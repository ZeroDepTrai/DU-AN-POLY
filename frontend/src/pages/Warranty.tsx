import SectionHeading from "../components/aurora/SectionHeading";

export default function Warranty() {
  return (
    <div className="container-padding section-padding">
      <SectionHeading title="Chính sách bảo hành" subtitle="Cam kết chất lượng sản phẩm" />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Bảo hành chính hãng</h2>
          <p className="text-softgray">Tất cả sản phẩm tại CellZone được bảo hành chính hãng theo quy định của nhà sản xuất. Thời gian bảo hành tùy thuộc vào từng dòng sản phẩm:</p>
          <ul className="mt-3 space-y-2 text-sm text-softgray">
            <li>• iPhone: 12 tháng theo chính sách Apple</li>
            <li>• Samsung Galaxy: 12 tháng theo chính sách Samsung</li>
            <li>• Xiaomi, OPPO, Vivo: 12 tháng theo chính sách hãng</li>
            <li>• Phụ kiện: 6 tháng (nếu có)</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Điều kiện bảo hành</h2>
          <ul className="space-y-2 text-sm text-softgray">
            <li>✓ Sản phẩm còn trong thời gian bảo hành</li>
            <li>✓ Phiếu bảo hành và hóa đơn còn nguyên vẹn</li>
            <li>✓ Lỗi kỹ thuật từ nhà sản xuất</li>
            <li>✗ Không bảo hành với lỗi do rơi vỡ, vào nước, tự ý sửa chữa</li>
          </ul>
        </div>
        <div className="rounded-fig-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold text-warmwhite">Quy trình bảo hành</h2>
          <p className="mb-3 text-sm text-softgray">Liên hệ hotline hoặc mang sản phẩm đến cửa hàng gần nhất để được hỗ trợ nhanh chóng.</p>
          <p className="text-sm text-softgray">📞 Hotline: 1900 1234 - Nhánh 2</p>
        </div>
      </div>
    </div>
  );
}
