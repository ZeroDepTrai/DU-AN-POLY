import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await doRegister(name, email, password);
      navigate("/");
    } catch {
      setError("Đăng ký thất bại. Email có thể đã được sử dụng.");
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
        <h1 className="text-2xl font-bold text-warmwhite">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-steelgray">Đăng ký để mua sắm và theo dõi đơn hàng</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
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
        <button type="submit" className="btn-primary w-full py-2.5">
          Tạo tài khoản
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-steelgray">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-medium text-crimson hover:text-raspberry transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
