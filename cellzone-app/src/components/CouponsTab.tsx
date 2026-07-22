import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponsApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { Coupon } from "../types";
import { Edit2, Trash2 } from "lucide-react";

export default function CouponsTab() {
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission("coupons:create") || hasPermission("coupons:edit");
  const canDelete = hasPermission("coupons:delete");
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    min_order_total: 0,
    max_discount: undefined as number | undefined,
    usage_limit: undefined as number | undefined,
    expires_at: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: couponsApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_total: Number(form.min_order_total || 0),
        max_discount: form.max_discount ?? undefined,
        usage_limit: form.usage_limit ?? undefined,
        expires_at: form.expires_at || undefined,
      };
      return editing ? couponsApi.update(editing.id, data) : couponsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      resetForm();
      setSuccess(editing ? "Cập nhật coupon thành công!" : "Tạo coupon thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setSuccess("Xóa coupon thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ code: "", description: "", discount_type: "percent", discount_value: 10, min_order_total: 0, max_discount: undefined, usage_limit: undefined, expires_at: "" });
    setError("");
  };

  const handleEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_total: c.min_order_total,
      max_discount: c.max_discount,
      usage_limit: c.usage_limit,
      expires_at: c.expires_at || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setError("Mã coupon không được để trống"); return; }
    setError("");
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý Coupon</h1>
        <p className="text-sm text-[#8b8b9a] mt-1">
          {canEdit ? "Tạo và quản lý mã giảm giá" : "Xem danh sách mã giảm giá"}
        </p>
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Create/Edit Form */}
      {canEdit && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">
            {editing ? `Sửa: ${editing.code}` : "Tạo coupon mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Mã (CODE)</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SALE10"
                  disabled={!!editing}
                  className="w-full glass-input font-mono uppercase disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Mô tả</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="VD: Giảm 10% cho đơn hàng"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Loại giảm</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
                  className="w-full glass-input"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VND)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">
                  Giá trị {form.discount_type === "percent" ? "(1-100)" : "(VND)"}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Đơn hàng tối thiểu (VND)</label>
                <input
                  type="number"
                  value={form.min_order_total}
                  onChange={(e) => setForm({ ...form, min_order_total: Number(e.target.value) })}
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Giảm tối đa (VND)</label>
                <input
                  type="number"
                  value={form.max_discount ?? ""}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Không giới hạn"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Số lượt sử dụng (0 = unlimited)</label>
                <input
                  type="number"
                  value={form.usage_limit ?? ""}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Ngày hết hạn</label>
                <input
                  type="text"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  placeholder="2026-12-31"
                  className="w-full glass-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo coupon"}
              </button>
              {editing && <button type="button" onClick={resetForm} className="px-4 py-2 text-[#8b8b9a]">Hủy</button>}
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-[#8b8b9a]">{coupons.length} coupon</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có coupon nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Giảm</th>
                <th className="px-4 py-3">Tối thiểu</th>
                <th className="px-4 py-3">Đã dùng</th>
                <th className="px-4 py-3">Trạng thái</th>
                {(canEdit || canDelete) && <th className="px-4 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono font-bold text-[#f0f0f5]">{c.code}</td>
                  <td className="px-4 py-3 text-[#8b8b9a] max-w-[200px] truncate">{c.description || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-400">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `${new Intl.NumberFormat("vi-VN").format(c.discount_value)}₫`}
                  </td>
                  <td className="px-4 py-3 text-[#8b8b9a]">{c.min_order_total ? `${new Intl.NumberFormat("vi-VN").format(c.min_order_total)}₫` : "—"}</td>
                  <td className="px-4 py-3 text-[#8b8b9a]">{c.usage_count}/{c.usage_limit ?? "∞"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {c.active ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {canEdit && <button onClick={() => handleEdit(c)} className="text-indigo-400 hover:text-indigo-300"><Edit2 className="w-4 h-4" /></button>}
                        {canDelete && <button onClick={() => { if (confirm(`Xóa coupon "${c.code}"?`)) deleteMutation.mutate(c.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
