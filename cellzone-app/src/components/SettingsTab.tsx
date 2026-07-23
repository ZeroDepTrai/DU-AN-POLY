import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { Mail, Plus, Trash2 } from "lucide-react";

export default function SettingsTab() {
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission("settings:edit");
  const queryClient = useQueryClient();

  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["settings-emails"],
    queryFn: settingsApi.listEmails,
  });

  const addMutation = useMutation({
    mutationFn: (email: string) => settingsApi.addEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-emails"] });
      setNewEmail("");
      setSuccess("Thêm email thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsApi.deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-emails"] });
      setSuccess("Xóa email thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newEmail.trim()) { setError("Email không được để trống"); return; }
    addMutation.mutate(newEmail.trim());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Cài đặt</h1>
        <p className="text-sm text-[#8b8b9a] mt-1">
          {canEdit ? "Quản lý cài đặt hệ thống" : "Xem cài đặt hệ thống"}
        </p>
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Notification Emails */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-[#f0f0f5]">Email nhận thông báo</h2>
        </div>
        <p className="text-sm text-[#8b8b9a] mb-4">
          Các email này sẽ nhận thông báo khi có đơn hàng mới hoặc cập nhật trạng thái.
        </p>

        {isLoading ? (
          <div className="text-center text-[#8b8b9a] py-4">Đang tải...</div>
        ) : emails.length === 0 ? (
          <div className="text-center text-[#5a5a6a] py-4">Chưa có email nào được thêm.</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#8b8b9a]" />
                  <span className="text-[#f0f0f5]">{e.email}</span>
                  <span className="text-xs text-[#5a5a6a]">{new Date(e.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                {canEdit && (
                  <button
                    onClick={() => deleteMutation.mutate(e.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 glass-input"
            />
            <button type="submit" className="glass-button px-4 py-2 text-[#f0f0f5] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm
            </button>
          </form>
        )}
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Thông tin hệ thống</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#8b8b9a]">Phiên bản</span>
            <span className="text-[#f0f0f5]">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8b9a]">Tên ứng dụng</span>
            <span className="text-[#f0f0f5]">CellZone</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8b9a]">Nền tảng</span>
            <span className="text-[#f0f0f5]">Windows (Tauri)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
