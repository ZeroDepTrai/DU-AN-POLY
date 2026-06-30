import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Email hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10">
          <svg className="h-7 w-7 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-warmwhite">Đăng nhập</h1>
        <p className="mt-1 text-sm text-steelgray">Đăng nhập để quản lý đơn hàng và nhiều hơn</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
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
            placeholder="Nhập mật khẩu"
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
        <button type="submit" className="btn-primary w-full py-2.5">
          Đăng nhập
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-steelgray">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-medium text-crimson hover:text-raspberry transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
