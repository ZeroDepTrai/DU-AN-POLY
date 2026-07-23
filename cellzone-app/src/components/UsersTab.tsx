import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, getApiBase } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { User } from "../types";
import { Plus, Trash2, Shield, UserCog, RefreshCw } from "lucide-react";

export default function UsersTab() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: users = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Warm the proxy → Railway TLS connection before the request,
      // so the first HTTPS round-trip is fast instead of waiting ~400ms
      // for TLS alone.
      await fetch(`${getApiBase().replace(/\/api$/, "")}/api/health`).catch(() => {});
      return usersApi.list();
    },
    retry: 1,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return usersApi.createSupport(form.email, form.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm({ email: "", password: "" });
      setShowForm(false);
      setSuccess("Tạo tài khoản hỗ trợ thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSuccess("Xóa tài khoản thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) { setError("Email không được để trống"); return; }
    if (!form.password || form.password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý người dùng</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">Tạo và quản lý tài khoản nhân viên hỗ trợ</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="glass-button px-4 py-2 flex items-center gap-2 text-[#f0f0f5]"
        >
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Create Form */}
      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Tạo tài khoản nhân viên hỗ trợ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="support@cellzone.com"
                  required
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full glass-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="px-4 py-2 text-[#8b8b9a] hover:text-[#f0f0f5]">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-[#8b8b9a]">{users.length} người dùng</span>
          {(isError || isLoading) && (
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Tải lại
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-400 text-sm mb-3">
              {queryError instanceof Error
                ? queryError.message
                : "Không thể kết nối máy chủ. Vui lòng thử lại."}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
              className="glass-button px-4 py-2 text-sm text-[#f0f0f5] flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có người dùng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => (
                <tr key={u.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        u.role === "admin" ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                      }`}>
                        {u.role === "admin" ? <Shield className="w-5 h-5 text-white" /> : <UserCog className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-[#f0f0f5]">{u.email}</p>
                        {u.id === currentUser?.id && <span className="text-[10px] text-indigo-400">(Bạn)</span>}
                        {u.created_at && !isNaN(new Date(u.created_at).getTime()) && (
                          <span className="ml-2 text-xs text-[#5a5a6a]">{new Date(u.created_at).toLocaleDateString("vi-VN")}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "admin" ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
                    }`}>
                      {u.role === "admin" ? "Quản trị viên" : "Nhân viên hỗ trợ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (confirm(`Xóa tài khoản "${u.email}"?`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
