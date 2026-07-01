import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-gunmetal/40 bg-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-warmwhite">
                Cell<span className="text-crimson">Zone</span>
              </span>
            </Link>
            <p className="text-sm text-steelgray leading-relaxed">
              Redefining the standard of premium mobile technology through precision engineering and visionary design.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-warmwhite">Sản phẩm</h4>
            <ul className="space-y-3">
              {[
                { label: "Điện thoại", to: "/products" },
                { label: "Phụ kiện", to: "/accessories" },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-steelgray transition-colors hover:text-crimson">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-warmwhite">Hỗ trợ</h4>
            <ul className="space-y-3">
              {[
                { label: "Liên hệ", to: "/#contact" },
                { label: "Chính sách đổi trả", to: "/#policies" },
                { label: "Câu hỏi thường gặp", to: "/#faq" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-steelgray transition-colors hover:text-crimson">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-warmwhite">Pháp lý</h4>
            <ul className="space-y-3">
              {[
                { label: "Chính sách bảo mật", to: "/privacy" },
                { label: "Điều khoản sử dụng", to: "/terms" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-steelgray transition-colors hover:text-crimson">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gunmetal/40 pt-6 text-center">
          <p className="text-sm text-steelgray">
            &copy; 2026 CellZone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
