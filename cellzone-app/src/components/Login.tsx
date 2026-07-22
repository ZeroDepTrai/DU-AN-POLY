import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { getApiBase } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<{status?: number; data?: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDebug(null);

    try {
      const apiUrl = `${getApiBase()}/auth/login`;
      setDebug({ status: 0, data: `Connecting to: ${apiUrl}` });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch((err) => {
        setDebug({ status: -1, data: `Network error: ${err.message}\nName: ${err.name}\nStack: ${err.stack?.slice(0, 200)}` });
        throw err;
      });

      setDebug({ status: response.status, data: "" });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Unknown error" }));
        setDebug({ status: response.status, data: JSON.stringify(errData) });
        setError("Email hoặc mật khẩu không đúng");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setDebug({ status: response.status, data: "Got token: " + (data.access_token ? "YES" : "NO") });

      // Fetch user info
      const meResponse = await fetch(`${getApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (!meResponse.ok) {
        setDebug({ status: meResponse.status, data: "/me failed" });
        setError("Failed to get user info");
        setLoading(false);
        return;
      }

      const user = await meResponse.json();
      useAuthStore.getState().setAuth(user, data.access_token);
    } catch (err) {
      setDebug({ status: -1, data: `Exception: ${err}` });
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 glow-primary">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text">CellZone</h1>
          <p className="text-[#8b8b9a] mt-2">Quản lý cửa hàng điện thoại</p>
        </div>

        {/* Login form */}
        <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-semibold text-[#f0f0f5] mb-6 text-center">
            Đăng nhập
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#8b8b9a] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cellzone.com"
                required
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8b8b9a] mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full glass-input"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {debug && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono">
                <div>Status: {debug.status}</div>
                <div className="break-all">{debug.data}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-3 text-[#f0f0f5] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#5a5a6a]">
            <p>Tài khoản Customer Support được tạo bởi Admin</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#5a5a6a]">
          <p>© 2026 CellZone. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </div>
  );
}
