import { Link } from "react-router-dom";
import GlowButton from "../components/aurora/GlowButton";

const QUICK_LINKS = [
  { label: "Trang chủ", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Sản phẩm", href: "/products", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "Phụ kiện", href: "/accessories", icon: "M15 10l-4 4m0 0l-4-4m4 4V3" },
  { label: "Blog", href: "/blog", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
];

export default function NotFound() {
  return (
    <div className="container-padding py-24">
      <div className="mx-auto max-w-2xl text-center">
        {/* Large decorative 404 */}
        <div className="relative mb-8">
          <span className="text-[150px] font-extrabold leading-none text-white/[0.03] sm:text-[200px] select-none pointer-events-none">
            404
          </span>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold aurora-text-gradient">Oops! Trang không tồn tại</h1>
            <p className="mt-3 max-w-sm text-base text-softgray">
              Trang bạn tìm kiếm không có hoặc đã bị di chuyển. Hãy quay về trang chủ để tiếp tục mua sắm.
            </p>
          </div>
        </div>

        {/* Quick navigation links */}
        <div className="mb-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-steelgray">Điều hướng nhanh</p>
          <div className="flex flex-wrap justify-center gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="inline-flex items-center gap-2 rounded-fig-pill border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-warmwhite backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/[0.08] focus-rose"
              >
                <svg className="h-4 w-4 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="aurora-glow-btn px-7 py-3.5 text-sm uppercase tracking-wider focus-aurora">
            Quay về trang chủ
          </Link>
          <GlowButton
            variant="ghost"
            onClick={() => window.history.back()}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-warmwhite backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.08] focus-rose"
          >
            Quay lại
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
