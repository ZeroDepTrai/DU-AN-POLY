import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, normalizeMediaUrl } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { Product } from "../types";
import { Plus, Edit2, Trash2, Search, X, Upload, EyeOff, RotateCcw } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

const PHONE_TAG_PRESETS = [
  "iPhone", "Apple", "Android", "Samsung", "Xiaomi", "OPPO",
  "Vivo", "Flagship", "Budget", "5G", "Gaming", "Featured",
  "Sony", "Realme", "Huawei", "Nokia", "Accessory",
];

const SPEC_FIELDS = [
  "Hệ điều hành", "Chipset", "Bộ nhớ trong", "Loại CPU", "GPU",
  "Kích thước màn hình", "Công nghệ màn hình", "Độ phân giải màn hình",
  "Camera Sau", "Camera trước", "Hỗ trợ mạng", "Thẻ SIM",
  "Công nghệ NFC", "Thời điểm ra mắt", "Pin", "Sạc", "Bảo mật",
  "RAM", "Thẻ nhớ",
];

const emptyForm = {
  name: "",
  price: "",
  stock: "10",
  tags: [] as string[],
  description: "",
  specifications: {} as Record<string, string>,
};

export default function ProductsTab() {
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const canEdit = hasPermission("products:create") || hasPermission("products:edit");
  const canDelete = hasPermission("products:delete");

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"quick" | "full">("quick");
  const [showHidden, setShowHidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [quickForm, setQuickForm] = useState({ name: "", price: "", tags: [] as string[] });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [quickImage, setQuickImage] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [customSpecLabel, setCustomSpecLabel] = useState("");
  const [customSpecLabels, setCustomSpecLabels] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: productsApi.listAdmin,
    staleTime: 0,
  });

  const displayed = showHidden
    ? products
    : products.filter((p) => p.is_active !== false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("price", formData.price);
      fd.append("stock", formData.stock);
      fd.append("tags", formData.tags.join(","));
      fd.append("description", formData.description);
      const specsStr = SPEC_FIELDS.concat(customSpecLabels)
        .map((label) => {
          const val = formData.specifications[label]?.trim();
          return val ? `${label}: ${val}` : "";
        })
        .filter(Boolean)
        .join("\n");
      fd.append("specifications", specsStr);
      if (imageFile) fd.append("image", imageFile);
      return productsApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
      setSuccess("Thêm sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
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
      const specsStr = SPEC_FIELDS.concat(customSpecLabels)
        .map((label) => {
          const val = formData.specifications[label]?.trim();
          return val ? `${label}: ${val}` : "";
        })
        .filter(Boolean)
        .join("\n");
      fd.append("specifications", specsStr);
      if (imageFile) fd.append("image", imageFile);
      return productsApi.update(editing.id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      resetForm();
      setSuccess("Cập nhật sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Vui lòng chọn hình ảnh");
      const fd = new FormData();
      fd.append("name", quickForm.name);
      fd.append("price", quickForm.price);
      fd.append("tags", quickForm.tags.join(","));
      fd.append("image", quickImage);
      return productsApi.quickAdd(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuickForm({ name: "", price: "", tags: [] });
      setQuickImage(null);
      setSuccess("Thêm sản phẩm nhanh thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccess("Đã ẩn sản phẩm.");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => productsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccess("Đã khôi phục sản phẩm.");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccess("Đã xóa sản phẩm.");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setImageFile(null);
    setShowForm(false);
    setError("");
    setCustomSpecLabels([]);
    setCustomSpecLabel([]);
  };

  const parseSpecs = (specsStr: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = specsStr.split("\n").map((l) => l.trim()).filter(Boolean);
    const allLabels = [...SPEC_FIELDS, ...customSpecLabels];
    for (const label of allLabels) {
      for (const line of lines) {
        if (line.toLowerCase().startsWith(label.toLowerCase() + ":") ||
            line.toLowerCase().startsWith(label.toLowerCase() + " –") ||
            line.toLowerCase().startsWith(label.toLowerCase() + " -")) {
          const parts = line.split(/[:–—]/);
          if (parts.length >= 2) result[label] = parts.slice(1).join(":").trim();
        }
      }
    }
    return result;
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    const chips = p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const specs = p.specifications ? parseSpecs(p.specifications) : {};
    setFormData({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      tags: chips,
      description: p.description || "",
      specifications: specs,
    });
    setTab("full");
    setShowForm(true);
    setImageFile(null);
    setCustomSpecLabels([]);
  };

  const handleHide = (p: Product) => {
    if (!confirm(`Ẩn sản phẩm "${p.name}"? Sản phẩm sẽ biến mất khỏi cửa hàng nhưng lịch sử đơn hàng vẫn được giữ.`)) return;
    softDeleteMutation.mutate(p.id);
  };

  const handleRestore = (p: Product) => {
    restoreMutation.mutate(p.id);
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`Xóa vĩnh viễn sản phẩm "${p.name}"? Hành động này không thể hoàn tác.`)) return;
    deleteMutation.mutate(p.id);
  };

  const toggleTag = (tag: string, tags: string[], setTags: React.Dispatch<React.SetStateAction<string[]>>) => {
    const t = tag.toLowerCase();
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);
  };

  const addCustomTag = (tags: string[], setTags: React.Dispatch<React.SetStateAction<string[]>>) => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const addCustomSpec = () => {
    const label = customSpecLabel.trim();
    if (!label || [...SPEC_FIELDS, ...customSpecLabels].includes(label)) return;
    setCustomSpecLabels((prev) => [...prev, label]);
    setCustomSpecLabel("");
  };

  const removeCustomSpec = (label: string) => {
    setCustomSpecLabels((prev) => prev.filter((l) => l !== label));
    setFormData((prev) => {
      const next = { ...prev.specifications };
      delete next[label];
      return { ...prev, specifications: next };
    });
  };

  const handleSpecChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, specifications: { ...prev.specifications, [label]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (editing) {
      updateMutation.mutate();
    } else {
      if (tab === "full" && !imageFile) {
        setError("Vui lòng chọn hình ảnh sản phẩm");
        return;
      }
      createMutation.mutate();
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    quickMutation.mutate();
  };

  const filtered = displayed.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (p: Product) => {
    handleEdit(p);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý sản phẩm</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">
            {canEdit ? "Thêm, sửa và quản lý sản phẩm" : "Xem danh sách sản phẩm"}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); resetForm(); setShowForm(true); setTab("quick"); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-[#f0f0f5]"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Tag selector bar */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-[#5a5a6a] mr-1">Chọn nhãn:</span>
          {PHONE_TAG_PRESETS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (showForm) {
                  if (tab === "quick") toggleTag(tag, quickForm.tags, setQuickForm);
                  else toggleTag(tag, formData.tags, setFormData);
                }
              }}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer glass hover:bg-white/10 text-[#8b8b9a] hover:text-[#f0f0f5]"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

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

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Add/Edit Form */}
      {showForm && canEdit && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#f0f0f5]">
              {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm"}
            </h2>
            <button onClick={() => { resetForm(); setEditing(null); }} className="text-[#8b8b9a] hover:text-[#f0f0f5]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab switcher */}
          {!editing && (
            <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10 w-fit mb-4">
              <button
                onClick={() => setTab("quick")}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === "quick" ? "bg-indigo-500 text-white" : "text-[#8b8b9a] hover:text-[#f0f0f5]"
                }`}
              >
                Thêm nhanh
              </button>
              <button
                onClick={() => setTab("full")}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === "full" ? "bg-indigo-500 text-white" : "text-[#8b8b9a] hover:text-[#f0f0f5]"
                }`}
              >
                Thêm đầy đủ
              </button>
            </div>
          )}

          {/* Quick add form */}
          {tab === "quick" && !editing && (
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    required
                    className="w-full glass-input"
                    placeholder="VD: iPhone 15 Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Giá (VND)</label>
                  <input
                    type="number"
                    value={quickForm.price}
                    onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                    required
                    className="w-full glass-input"
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Hình ảnh</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>
              {/* Selected quick tags */}
              {quickForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickForm.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
                      {t}
                      <button type="button" onClick={() => toggleTag(t, quickForm.tags, setQuickForm)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
              <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
              </button>
            </form>
          )}

          {/* Full form */}
          {(tab === "full" || editing) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Tên sản phẩm</label>
                  <input type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full glass-input" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Giá (VND)</label>
                  <input type="number" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="w-full glass-input" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b8b9a] mb-1">Tồn kho</label>
                  <input type="number" value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full glass-input" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-2">Nhãn</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PHONE_TAG_PRESETS.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag, formData.tags, setFormData)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        formData.tags.includes(tag.toLowerCase())
                          ? "bg-indigo-500 text-white"
                          : "glass hover:bg-white/10 text-[#8b8b9a]"
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag(formData.tags, setFormData))}
                    placeholder="Thêm nhãn tùy chỉnh..." className="flex-1 glass-input text-sm" />
                  <button type="button" onClick={() => addCustomTag(formData.tags, setFormData)} className="glass-button px-3">+</button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
                        {t}
                        <button type="button" onClick={() => toggleTag(t, formData.tags, setFormData)} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">Mô tả</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Mô tả sản phẩm..."
                />
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-[#8b8b9a] font-medium">Thông số kỹ thuật</label>
                  <div className="flex gap-2">
                    <input type="text" value={customSpecLabel}
                      onChange={(e) => setCustomSpecLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSpec(); } }}
                      placeholder="Thêm spec mới..." className="glass-input text-sm h-9 w-48" />
                    <button type="button" onClick={addCustomSpec} className="glass-button px-3 text-sm py-1.5">+ Thêm</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...SPEC_FIELDS, ...customSpecLabels].map((label) => (
                    <div key={label} className="flex items-center gap-2">
                      <label className="text-sm text-[#8b8b9a] w-44 shrink-0 flex items-center gap-1">
                        {label}
                        {customSpecLabels.includes(label) && (
                          <button type="button" onClick={() => removeCustomSpec(label)} className="text-red-400 hover:text-red-300 ml-1" title="Xóa">×</button>
                        )}
                      </label>
                      <input type="text" value={formData.specifications[label] || ""}
                        onChange={(e) => handleSpecChange(label, e.target.value)}
                        placeholder="—" className="flex-1 glass-input text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm text-[#8b8b9a] mb-1">
                  Hình ảnh {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}
                </label>
                <label className="flex items-center gap-2 glass-input cursor-pointer hover:bg-white/5 px-3 py-2 w-fit">
                  <Upload className="w-4 h-4 text-[#8b8b9a]" />
                  <span className="text-sm text-[#8b8b9a]">
                    {imageFile ? imageFile.name : "Chọn file..."}
                  </span>
                  <input type="file" accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden" />
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                  {createMutation.isPending || updateMutation.isPending ? "Đang xử lý..." : editing ? "Cập nhật" : "Thêm sản phẩm"}
                </button>
                {editing && (
                  <button type="button" onClick={() => { setEditing(null); resetForm(); }}
                    className="px-6 py-2 text-[#8b8b9a] hover:text-[#f0f0f5]">
                    Hủy
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 gap-4">
          <span className="text-sm text-[#8b8b9a]">
            {filtered.length} sản phẩm
            {!showHidden && products.length > filtered.length && (
              <span className="ml-2 text-xs text-[#5a5a6a]">({products.length - filtered.length} đã ẩn)</span>
            )}
          </span>
          <label className="flex items-center gap-2 text-xs text-[#8b8b9a] cursor-pointer">
            <input type="checkbox" checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="accent-indigo-500" />
            Hiển thị đã ẩn
          </label>
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
                    <img src={normalizeMediaUrl(p.image_url)} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f0f0f5] max-w-[200px] truncate">{p.name}</span>
                      {p.is_active === false && (
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-400">
                    {new Intl.NumberFormat("vi-VN").format(p.price)} VND
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags
                        ? p.tags.split(",").slice(0, 3).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-[#8b8b9a]">{t}</span>
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
                          <button onClick={() => handleStartEdit(p)} className="text-indigo-400 hover:text-indigo-300" title="Sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && p.is_active !== false && (
                          <button onClick={() => handleHide(p)} className="text-amber-400 hover:text-amber-300" title="Ẩn">
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && p.is_active === false && (
                          <button onClick={() => handleRestore(p)} className="text-emerald-400 hover:text-emerald-300" title="Khôi phục">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-300" title="Xóa vĩnh viễn">
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
