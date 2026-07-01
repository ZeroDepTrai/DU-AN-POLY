import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => {
      const { data } = await adminApi.listAdminEmails();
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (email: string) => adminApi.addAdminEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
      setNewEmail("");
      setAddSuccess("Đã thêm email thành công.");
      setAddError("");
      setTimeout(() => setAddSuccess(""), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Thêm thất bại.";
      setAddError(msg);
      setAddSuccess("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    addMutation.mutate(newEmail.trim());
  };

  if (isLoading) {
    return <LoadingSpinner label="Đang tải..." />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-warmwhite">Cài đặt</h1>
        <p className="mt-1 text-sm text-steelgray">Quản lý email nhận thông báo đơn hàng</p>
      </div>

      <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-6">
        <h2 className="mb-4 text-base font-semibold text-warmwhite">Email nhận thông báo đơn hàng</h2>

        {emails.length === 0 ? (
          <p className="py-6 text-center text-sm text-steelgray">Chưa có email nào được thêm.</p>
        ) : (
          <ul className="mb-4 divide-y divide-gunmetal/40">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm text-warmwhite">{e.email}</span>
                  <span className="ml-2 text-xs text-steelgray">
                    {new Date(e.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(e.id)}
                  className="ml-4 flex-shrink-0 rounded-lg px-3 py-1.5 text-xs text-rose hover:bg-deeprose/10 transition-colors"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="mt-6 flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="admin@example.com"
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !newEmail.trim()}
            className="btn-primary whitespace-nowrap disabled:opacity-60"
          >
            {addMutation.isPending ? "Đang thêm..." : "Thêm email"}
          </button>
        </form>

        {addError && (
          <p className="mt-2 text-sm text-rose">{addError}</p>
        )}
        {addSuccess && (
          <p className="mt-2 text-sm text-emerald">{addSuccess}</p>
        )}
      </div>
    </div>
  );
}
