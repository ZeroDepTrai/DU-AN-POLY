import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { Product } from "../types";
import { Plus, Edit2, Trash2, Search, X, Upload } from "lucide-react";

const PHONE_TAG_PRESETS = [
  "iPhone", "Apple", "Android", "Samsung", "Xiaomi", "OPPO",
  "Vivo", "Flagship", "Budget", "5G", "Gaming", "Featured",
  "Sony", "Realme", "Huawei", "Nokia",
];

export default function ProductsTab() {
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const canEdit = hasPermission("products:create") || hasPermission("products:edit");
  const canDelete = hasPermission("products:delete");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "10",
    tags: [] as string[],
    description: "",
    specifications: {} as Record<string, string>,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("price", formData.price);
      fd.append("stock", formData.stock);
      fd.append("tags", formData.tags.join(","));
      fd.append("description", formData.description);
      if (imageFile) fd.append("image", imageFile);
      return productsApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
      setSuccess("Thêm sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("price", formData.price);
      fd.append("stock", formData.stock);
      fd.append("tags", formData.tags.join(","));
      fd.append("description", formData.description);
      if (imageFile) fd.append("image", imageFile);
      return productsApi.update(editing.id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      resetForm();
      setSuccess("Cập nhật sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccess("Xóa sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      stock: "10",
      tags: [],
      description: "",
      specifications: {},
    });
    setImageFile(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setFormData({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : [],
      description: p.description || "",
      specifications: {},
    });
    setShowForm(true);
  };

  const handleDelete = (p: Product) => {
    if (confirm(`Xóa sản phẩm "${p.name}"?`)) {
      deleteMutation.mutate(p.id);
    }
  };

  const toggleTag = (tag: string) => {
    const t = tag.toLowerCase();
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(t) ? prev.tags.filter((x) => x !== t) : [...prev.tags, t],
    }));
  };

  const addCustomTag = () => {
    if (tagInput.trim()) {
      const t = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(t)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, t] }));
      }
      setTagInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (editing) {
      updateMutation.mutate();
    } else {
      if (!imageFile) {
        setError("Vui lòng chọn hình ảnh sản phẩm");
        return;
      }
      createMutation.mutate();
    }
  };

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý sản phẩm</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">
            {canEdit ? "Thêm, sửa và xóa sản phẩm" : "Xem danh sách sản phẩm"}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-[#f0f0f5]"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a5a6a]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="w-full glass-input pl-10"
        />
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && canEdit && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#f0f0f5]">
              {editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>
            <button onClick={resetForm} className="text-[#8b8b9a] hover:text-[#f0f0f5]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full glass-input"
                  placeholder="VD: iPhone 15 Pro"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Giá (VND)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full glass-input"
                  placeholder="25000000"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Số lượng tồn kho</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm text-[#8b8b9a] mb-2">Nhãn sản phẩm</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PHONE_TAG_PRESETS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      formData.tags.includes(tag.toLowerCase())
                        ? "bg-indigo-500 text-white"
                        : "glass hover:bg-white/10 text-[#8b8b9a]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                  placeholder="Thêm nhãn tùy chỉnh..."
                  className="flex-1 glass-input text-sm"
                />
                <button type="button" onClick={addCustomTag} className="glass-button px-3">
                  +
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
                      {t}
                      <button type="button" onClick={() => toggleTag(t)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm text-[#8b8b9a] mb-1">
                Hình ảnh {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}
              </label>
              <label className="flex items-center gap-2 glass-input cursor-pointer hover:bg-white/5">
                <Upload className="w-4 h-4 text-[#8b8b9a]" />
                <span className="text-sm text-[#8b8b9a]">
                  {imageFile ? imageFile.name : "Chọn file..."}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-[#8b8b9a] mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full glass-input resize-none"
                placeholder="Mô tả sản phẩm..."
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                {createMutation.isPending || updateMutation.isPending ? "Đang xử lý..." : editing ? "Cập nhật" : "Thêm sản phẩm"}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 text-[#8b8b9a] hover:text-[#f0f0f5]">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-[#8b8b9a]">{filtered.length} sản phẩm</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Không có sản phẩm nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Tồn kho</th>
                {(canEdit || canDelete) && <th className="px-4 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium text-[#f0f0f5] max-w-[200px] truncate">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-400">
                    {new Intl.NumberFormat("vi-VN").format(p.price)} VND
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags
                        ? p.tags.split(",").slice(0, 3).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-[#8b8b9a]">
                              {t}
                            </span>
                          ))
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 5 ? "text-amber-400 font-semibold" : "text-[#f0f0f5]"}>
                      {p.stock}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {canEdit && (
                          <button onClick={() => handleEdit(p)} className="text-indigo-400 hover:text-indigo-300">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
