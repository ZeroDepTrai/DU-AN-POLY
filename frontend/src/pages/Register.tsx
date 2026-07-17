import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import { AuroraInput } from "../components/aurora/AuroraInput";
import AuroraBadge from "../components/aurora/AuroraBadge";

export default function Register() {
  const { registerWithCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await authApi.sendVerificationCode({ email, name, password });
      setStep("verify");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Gửi mã thất bại. Vui lòng thử lại.";
      setError(typeof msg === "string" ? msg : "Gửi mã thất bại");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await registerWithCode(name, email, password, code);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Mã xác minh không hợp lệ hoặc đã hết hạn.";
      setError(typeof msg === "string" ? msg : "Mã xác minh không hợp lệ");
    }
  };

  return (
    <div className="container-padding section-padding">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <AuroraBadge tone="sakura" glow className="mb-4">
            Aurora UI · CellZone
          </AuroraBadge>
          <h1 className="mb-4 text-5xl font-extrabold leading-tight text-balance">
            <span className="aurora-text-rainbow">Tạo tài khoản</span>
            <br />
            <span className="aurora-text-gradient">mới</span>
          </h1>
          <p className="mb-6 max-w-md text-base leading-relaxed text-softgray">
            Một tài khoản CellZone mở ra thế giới ưu đãi, lượt quay may mắn và đề xuất được cá nhân hóa.
          </p>
          <GlassCard intensity="low" className="space-y-3 p-5">
            {[
              "Tích lũy đơn hàng để nhận lượt quay may mắn",
              "Đánh giá sản phẩm, chia sẻ trải nghiệm",
              "Danh sách yêu thích đồng bộ trên mọi thiết bị",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aurora-gradient">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm text-softgray">{t}</p>
              </div>
            ))}
          </GlassCard>
        </div>

        <GlassCard intensity="high" glow className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold aurora-text-gradient">
              {step === "form" ? "Tạo tài khoản" : "Nhập mã xác minh"}
            </h2>
            <p className="mt-1 text-sm text-softgray">
              {step === "form"
                ? "Đăng ký để mua sắm và theo dõi đơn hàng"
                : `Mã đã được gửi đến ${email}`}
            </p>
          </div>

          {step === "form" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <AuroraInput
                label="Họ và tên"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
              <AuroraInput
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <AuroraInput
                label="Mật khẩu"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
              />
              {error && (
                <div className="rounded-xl border border-deeprose/40 bg-deeprose/10 p-3 text-sm text-lightpink">
                  {error}
                </div>
              )}
              <GlowButton variant="aurora" size="lg" type="submit" loading={sending} className="w-full justify-center">
                {sending ? "Đang gửi mã..." : "Đăng ký"}
              </GlowButton>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-xl border border-aurora-mint/40 bg-aurora-mint/10 p-3 text-sm text-emerald-400">
                Chúng tôi đã gửi mã xác minh 6 chữ số đến email của bạn. Mã có hiệu lực trong 10 phút.
              </div>
              <AuroraInput
                label="Mã xác minh"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="______"
                className="text-center text-2xl tracking-[12px] font-mono"
              />
              {error && (
                <div className="rounded-xl border border-deeprose/40 bg-deeprose/10 p-3 text-sm text-lightpink">
                  {error}
                </div>
              )}
              <GlowButton variant="aurora" size="lg" type="submit" className="w-full justify-center">
                Xác minh & Đăng ký
              </GlowButton>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full py-2 text-center text-sm text-steelgray transition-colors hover:text-softgray"
              >
                Quay lại
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-softgray">
            Đã có tài khoản?{" "}
            <Link to="/login" className="aurora-text-rainbow font-medium hover:text-sakura transition-colors">
              Đăng nhập
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}