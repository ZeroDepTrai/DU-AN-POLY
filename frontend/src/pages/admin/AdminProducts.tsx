import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { Product } from "../../types";

const TAG_PRESETS = [
  "iPhone", "Android", "Samsung", "Xiaomi", "Flagship",
  "Budget", "5G", "Gaming", "Featured", "Accessory",
];

const emptyForm = { name: "", price: "", tags: "", description: "", stock: "10" };
const emptyQuickForm = { name: "", price: "", tags: "" };

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"quick" | "full">("quick");
  const [form, setForm] = useState(emptyForm);
  const [quickForm, setQuickForm] = useState(emptyQuickForm);
  const [image, setImage] = useState<File | null>(null);
  const [quickImage, setQuickImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [quickTagChips, setQuickTagChips] = useState<string[]>([]);
  const [fullTagChips, setFullTagChips] = useState<string[]>([]);

  const allTags = [...TAG_PRESETS, ...customTags];

  const addTagChip = (tag: string, chips: string[], setChips: React.Dispatch<React.SetStateAction<string[]>>) => {
    const t = tag.trim().toLowerCase();
    if (t && !chips.includes(t)) setChips((p) => [...p, t]);
    setTagInput("");
  };

  const addCustomTag = () => {
    const t = tagInput.trim();
    if (t && !allTags.includes(t)) setCustomTags((p) => [...p, t]);
    setTagInput("");
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await adminApi.listProducts();
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("tags", fullTagChips.join(","));
      formData.append("description", form.description);
      formData.append("stock", form.stock);
      if (image) formData.append("image", image);
      else if (!editing) throw new Error("Hình ảnh bắt buộc cho sản phẩm mới");
      return editing ? adminApi.updateProduct(editing.id, formData) : adminApi.createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm(emptyForm); setImage(null); setEditing(null); setError("");
      setTab("quick"); setFullTagChips([]);
    },
    onError: (err: Error) => setError(err.message || "Lỗi lưu sản phẩm"),
  });

  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Hình ảnh bắt buộc");
      const fd = new FormData();
      fd.append("name", quickForm.name); fd.append("price", quickForm.price);
      fd.append("tags", quickTagChips.join(",")); fd.append("image", quickImage);
      return adminApi.quickAddProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuickForm(emptyQuickForm); setQuickTagChips([]); setQuickImage(null);
    },
    onError: (err: Error) => setError(err.message || "Lỗi thêm sản phẩm"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const startEdit = (p: Product) => {
    setEditing(p); setTab("full");
    const chips = p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    setFullTagChips(chips);
    setForm({ name: p.name, price: String(p.price), tags: p.tags, description: p.description, stock: String(p.stock) });
    setImage(null);
  };

  if (isLoading) return <LoadingSpinner label="Đang tải sản phẩm..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý sản phẩm</h1>

      {/* Tag management bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
          }}
          placeholder="Thêm nhãn mới..."
          list="admin-all-tags"
          className="input-field w-48 text-sm"
        />
        <datalist id="admin-all-tags">
          {allTags.map((t) => <option key={t} value={t} />)}
        </datalist>
        <button type="button" onClick={addCustomTag} className="btn-secondary text-sm whitespace-nowrap">+ Thêm nhãn</button>
        <div className="flex flex-wrap gap-1.5 ml-2">
          <span className="text-xs text-steelgray self-center">Có sẵn:</span>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { addTagChip(t, quickTagChips, setQuickTagChips); addTagChip(t, fullTagChips, setFullTagChips); }}
              className="tag-badge cursor-pointer hover:opacity-80"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Form tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-charcoal p-1 border border-gunmetal/60 w-fit">
        <button onClick={() => { setTab("quick"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${tab === "quick" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"}`}>
          Thêm nhanh
        </button>
        <button onClick={() => { setTab("full"); setEditing(null); setError(""); }}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${tab === "full" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"}`}>
          Thêm đầy đủ
        </button>
      </div>

      {tab === "quick" && (
        <form onSubmit={(e) => { e.preventDefault(); quickMutation.mutate(); }}
          className="mb-8 space-y-4 rounded-xl border border-gunmetal/60 bg-graphite p-6">
          <h2 className="text-base font-bold text-sakura">Thêm sản phẩm nhanh</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input required placeholder="Tên sản phẩm (VD: iPhone 15 Pro)" value={quickForm.name}
              onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} className="input-field" />
            <input required type="number" step="1000" placeholder="Giá (VND)" value={quickForm.price}
              onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })} className="input-field" />
            <div>
              <label className="mb-1 block text-xs text-steelgray">Hình ảnh sản phẩm</label>
              <input required type="file" accept="image/*"
                onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
                className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crimson file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
            </div>
          </div>
          {/* Tag chips */}
          <div>
            <label className="mb-1 block text-xs text-steelgray">Nhãn đã chọn (nhấn nhãn bên trên để thêm):</label>
            <div className="mb-2 flex flex-wrap gap-1.5 min-h-[28px]">
              {quickTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setQuickTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                </span>
              ))}
              {quickTagChips.length === 0 && <span className="text-xs text-steelgray">Chưa chọn nhãn nào...</span>}
            </div>
            <input type="text" value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addTagChip(tagInput, quickTagChips, setQuickTagChips); }
                if (e.key === "Backspace" && !tagInput && quickTagChips.length > 0)
                  setQuickTagChips((p) => p.slice(0, -1));
              }}
              placeholder="Gõ nhãn → Enter để thêm, Backspace để xóa..."
              list="admin-all-tags"
              className="input-field text-sm w-full" />
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={quickMutation.isPending} className="btn-primary">
            {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
          </button>
        </form>
      )}

      {tab === "full" && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="mb-8 space-y-4 rounded-xl border border-gunmetal/60 bg-graphite p-6">
          <h2 className="text-base font-bold text-warmwhite">
            {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm đầy đủ"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input required placeholder="Tên" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            <input required type="number" step="1000" placeholder="Giá (VND)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
            <input type="number" placeholder="Số lượng tồn kho" value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
            {/* Tag chips */}
            <div>
              <label className="mb-1 block text-xs text-steelgray">Nhãn đã chọn:</label>
              <div className="mb-1.5 flex flex-wrap gap-1.5 min-h-[28px]">
                {fullTagChips.map((t) => (
                  <span key={t} className="tag-badge flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => setFullTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                  </span>
                ))}
                {fullTagChips.length === 0 && <span className="text-xs text-steelgray self-center">Chưa chọn nhãn...</span>}
              </div>
              <input type="text" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTagChip(tagInput, fullTagChips, setFullTagChips); }
                  if (e.key === "Backspace" && !tagInput && fullTagChips.length > 0)
                    setFullTagChips((p) => p.slice(0, -1));
                }}
                placeholder="Gõ nhãn → Enter..."
                list="admin-all-tags"
                className="input-field text-sm w-full" />
            </div>
          </div>
          <textarea placeholder="Mô tả sản phẩm" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none" rows={3} />
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">
              Hình ảnh {editing ? "(bỏ trống để giữ hình cũ)" : ""}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm sản phẩm"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setTab("quick"); setFullTagChips([]); }}
                className="btn-secondary">Hủy</button>
            )}
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="border-b border-gunmetal/40 px-4 py-3">
          <span className="text-sm text-steelgray">{products.length} sản phẩm</span>
        </div>
        {products.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Không có sản phẩm nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gunmetal/40 bg-charcoal">
              <tr className="text-left text-steelgray">
                <th className="px-4 py-3">Hình ảnh</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const tagChips = p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
                return (
                  <tr key={p.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors">
                    <td className="px-4 py-3"><img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover" /></td>
                    <td className="px-4 py-3 font-medium text-warmwhite">{p.name}</td>
                    <td className="px-4 py-3 text-crimson font-semibold">
                      {new Intl.NumberFormat("vi-VN").format(p.price)} VND
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tagChips.map((t: string) => <span key={t} className="tag-badge">{t}</span>)}
                        {tagChips.length === 0 && <span className="text-xs text-steelgray">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 5 ? "text-deeprose font-semibold" : "text-warmwhite"}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(p)} className="text-sm text-crimson hover:text-sakura transition-colors">Sửa</button>
                        <button onClick={() => { if (confirm(`Xóa "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                          className="text-sm text-deeprose hover:text-rose transition-colors">Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
