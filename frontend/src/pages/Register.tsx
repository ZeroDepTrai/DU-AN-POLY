import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

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
      setError(msg);
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
      setError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10">
          <svg className="h-7 w-7 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-warmwhite">
          {step === "form" ? "Tạo tài khoản" : "Nhập mã xác minh"}
        </h1>
        <p className="mt-1 text-sm text-steelgray">
          {step === "form"
            ? "Đăng ký để mua sắm và theo dõi đơn hàng"
            : `Mã đã được gửi đến ${email}`}
        </p>
      </div>

      {step === "form" ? (
        <form onSubmit={handleSendCode} className="space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-softgray">Họ và tên</label>
            <input
              required
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-softgray">Email</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-softgray">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}
          <button type="submit" disabled={sending} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {sending ? "Đang gửi mã..." : "Đăng ký"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
          <div className="rounded-lg border border-emerald/20 bg-emerald/10 p-3 text-sm text-emerald">
            Chúng tôi đã gửi mã xác minh 6 chữ số đến email của bạn. Mã có hiệu lực trong 10 phút.
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-softgray">Mã xác minh</label>
            <input
              required
              maxLength={6}
              placeholder="______"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="input-field text-center text-2xl tracking-[12px] font-mono"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full py-2.5">
            Xác minh & Đăng ký
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full py-2 text-center text-sm text-steelgray hover:text-softgray transition-colors"
          >
            Quay lại
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-steelgray">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-medium text-crimson hover:text-raspberry transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
