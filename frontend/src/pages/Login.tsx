import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await login(loginEmail, loginPassword);
      navigate("/");
    } catch {
      setLoginError("Email hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-81px)] items-center justify-center px-4 py-12 bg-charcoal">
      <div className="w-full max-w-sm">
        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-gunmetal/60 bg-graphite p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${
              tab === "login"
                ? "bg-crimson text-white shadow-md shadow-crimson/30"
                : "text-softgray hover:text-warmwhite"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${
              tab === "register"
                ? "bg-crimson text-white shadow-md shadow-crimson/30"
                : "text-softgray hover:text-warmwhite"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
          {tab === "login" ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-warmwhite">Chào mừng trở lại!</h2>
                <p className="mt-1 text-sm text-steelgray">Đăng nhập để quản lý đơn hàng</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-softgray">Mật khẩu</label>
                    <button type="button" className="text-xs text-crimson hover:text-sakura transition-colors">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-steelgray pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
                    {loginError}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3 text-base">
                  Đăng nhập
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </form>

              <div className="mt-4">
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-gunmetal/60" />
                  <span className="text-xs text-steelgray">hoặc</span>
                  <div className="flex-1 border-t border-gunmetal/60" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="btn-secondary w-full justify-center gap-2 py-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Đăng nhập với Google
                </button>
                <button className="btn-secondary w-full justify-center gap-2 py-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Đăng nhập với Apple
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-warmwhite">Tạo tài khoản mới</h2>
                <p className="mt-1 text-sm text-steelgray">Đăng ký để nhận ưu đãi đặc biệt</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                <Input
                  label="Họ và tên"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nguyen Van A"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <Input
                  label="Mật khẩu"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                {regError && (
                  <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
                    {regError}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3 text-base">
                  Đăng ký
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </form>

              <div className="mt-4">
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-gunmetal/60" />
                  <span className="text-xs text-steelgray">hoặc</span>
                  <div className="flex-1 border-t border-gunmetal/60" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="btn-secondary w-full justify-center gap-2 py-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Đăng ký với Google
                </button>
                <button className="btn-secondary w-full justify-center gap-2 py-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Đăng ký với Apple
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
