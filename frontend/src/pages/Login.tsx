import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const redirectTo =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    setDebugInfo(`Trying to login to: ${import.meta.env.VITE_API_URL || "auto-detected"}`);
    try {
      await login(loginEmail, loginPassword);
      setDebugInfo("Login successful! Redirecting...");
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = error.response?.data?.detail || error.message || "Unknown error";
      setDebugInfo(`Login failed: ${msg}`);
      setLoginError("Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-padding section-padding">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <AuroraBadge tone="rose" glow className="mb-4">
            Aurora UI · CellZone
          </AuroraBadge>
          <h1 className="mb-4 text-5xl font-extrabold leading-tight text-balance">
            <span className="aurora-text-gradient">Trải nghiệm</span>
            <br />
            <span className="aurora-text-rainbow">mua sắm</span>
            <br />
            <span className="aurora-text-gradient">đẳng cấp</span>
          </h1>
          <p className="mb-6 max-w-md text-base leading-relaxed text-softgray">
            Đăng nhập để đồng bộ giỏ hàng, danh sách yêu thích và nhận đề xuất cá nhân hóa từ CellZone.
          </p>
          <div className="space-y-3">
            {[
              { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", label: "Lưu sản phẩm yêu thích" },
              { icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z", label: "Đánh giá & chia sẻ trải nghiệm" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Theo dõi đơn hàng realtime" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                  </svg>
                </div>
                <span className="text-sm text-softgray">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <GlassCard intensity="high" glow className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold aurora-text-gradient">Chào mừng trở lại!</h2>
            <p className="mt-1 text-sm text-softgray">Đăng nhập để quản lý đơn hàng</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AuroraInput
              label="Email"
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <AuroraInput
              label="Mật khẩu"
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-softgray">
                <input type="checkbox" className="h-4 w-4 rounded accent-sakura" />
                Ghi nhớ tôi
              </label>
              <a href="#" className="aurora-text-rainbow hover:text-sakura transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            {loginError && (
              <div className="rounded-xl border border-deeprose/40 bg-deeprose/10 p-3 text-sm text-lightpink">
                {loginError}
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-400 font-mono">
                {debugInfo}
              </div>
            )}

            <GlowButton variant="aurora" size="lg" loading={loading} type="submit" className="w-full justify-center">
              Đăng nhập
            </GlowButton>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-steelgray">hoặc</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-2">
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-warmwhite backdrop-blur-xl transition-all hover:bg-white/[0.08]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Đăng nhập với Google
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-softgray">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="aurora-text-rainbow font-medium hover:text-sakura transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}