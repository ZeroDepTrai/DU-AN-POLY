import { Link } from "react-router-dom";
import GlassCard from "./aurora/GlassCard";

export default function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-aurora-bg-deep/40 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora-indigo/50 to-transparent" />
      <div className="container-padding py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-aurora bg-aurora-gradient shadow-glow-violet">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="aurora-text-gradient">Cell</span>
                <span className="aurora-text-rainbow">Zone</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-softgray">
              Trải nghiệm mua sắm thiết bị di động đẳng cấp với công nghệ Aurora — nơi công nghệ tối tân hội tụ cùng nghệ thuật thiết kế đỉnh cao.
            </p>
            <div className="flex items-center gap-2">
              {["facebook", "instagram", "youtube", "tiktok"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-softgray transition-all hover:border-aurora-cyan/40 hover:text-aurora-cyan"
                  aria-label={s}
                >
                  <span className="text-[10px] font-bold uppercase">{s.slice(0, 2)}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-warmwhite">Khám phá</h4>
            <ul className="space-y-2 text-sm text-softgray">
              {[
                { to: "/products", label: "Sản phẩm" },
                { to: "/accessories", label: "Phụ kiện cao cấp" },
                { to: "/blog", label: "Blog công nghệ" },
                { to: "/spin", label: "Vòng quay may mắn" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-aurora-cyan">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-warmwhite">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-softgray">
              {[
                "Trung tâm hỗ trợ",
                "Chính sách bảo hành",
                "Đổi trả 7 ngày",
                "Trả góp 0%",
              ].map((l) => (
                <li key={l}>
                  <a href="#" className="transition-colors hover:text-aurora-cyan">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <GlassCard intensity="med" className="p-5">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-warmwhite">
              Bản tin Aurora
            </h4>
            <p className="mb-4 text-xs text-softgray">
              Nhận thông báo sớm nhất về sản phẩm mới và ưu đãi độc quyền.
            </p>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                type="email"
                placeholder="email@example.com"
                className="aurora-input text-sm"
                required
              />
              <button type="submit" className="aurora-glow-btn w-full justify-center text-sm">
                Đăng ký
              </button>
            </form>
          </GlassCard>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-steelgray sm:flex-row">
          <p>© {new Date().getFullYear()} CellZone. All rights reserved.</p>
          <p className="aurora-text-rainbow">Crafted with Aurora UI · v2.0</p>
        </div>
      </div>
    </footer>
  );
}