import axios from "axios";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import RichTextEditor from "../../components/RichTextEditor";
import type { Product } from "../../types";

const TAG_PRESETS = [
  "iPhone", "Android", "Samsung", "Xiaomi", "OPPO",
  "Flagship", "Budget", "5G", "Gaming", "Featured", "Accessory",
];

const SPEC_FIELDS = [
  "Hệ điều hành",
  "Chipset",
  "Bộ nhớ trong",
  "Loại CPU",
  "GPU",
  "Kích thước màn hình",
  "Công nghệ màn hình",
  "Độ phân giải màn hình",
  "Camera Sau",
  "Camera trước",
  "Hỗ trợ mạng",
  "Thẻ SIM",
  "Công nghệ NFC",
  "Thời điểm ra mắt",
  "Pin",
  "Sạc",
  "Bảo mật",
  "RAM",
  "Thẻ nhớ",
];

const emptyForm = {
  name: "",
  price: "",
  tags: "",
  description: "",
  specifications: {} as Record<string, string>,
  stock: "10",
};
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
  const [info, setInfo] = useState("");
  const [quickTagChips, setQuickTagChips] = useState<string[]>([]);
  const [fullTagChips, setFullTagChips] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [customSpecLabel, setCustomSpecLabel] = useState("");
  const [customSpecLabels, setCustomSpecLabels] = useState<string[]>([]);

  const toggleTag = (tag: string, chips: string[], setChips: React.Dispatch<React.SetStateAction<string[]>>) => {
    const t = tag.trim().toLowerCase();
    if (chips.includes(t)) {
      setChips(chips.filter((c) => c !== t));
    } else {
      setChips([...chips, t]);
    }
  };

  const buildSpecsString = (specs: Record<string, string>) => {
    return SPEC_FIELDS
      .map((label) => {
        const val = specs[label]?.trim();
        return val ? `${label}: ${val}` : "";
      })
      .filter(Boolean)
      .join("\n");
  };

  const parseSpecsString = (specsStr: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = specsStr.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const label of SPEC_FIELDS) {
      for (const line of lines) {
        if (line.toLowerCase().startsWith(label.toLowerCase() + ":") ||
            line.toLowerCase().startsWith(label.toLowerCase() + " –") ||
            line.toLowerCase().startsWith(label.toLowerCase() + " -")) {
          const parts = line.split(/[:–—]/);
          if (parts.length >= 2) {
            result[label] = parts.slice(1).join(":").trim();
          }
        }
      }
    }
    return result;
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
      formData.append("specifications", buildSpecsString(form.specifications));
      formData.append("stock", form.stock);
      if (image) formData.append("image", image);
      else if (!editing) throw new Error("Hình ảnh bắt buộc cho sản phẩm mới");
      return editing ? adminApi.updateProduct(editing.id, formData) : adminApi.createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      setForm(emptyForm); setImage(null); setEditing(null); setError("");
      setTab("quick"); setFullTagChips([]); setCustomSpecLabels([]); setCustomSpecLabel("");
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
    onSuccess: (resp) => {
      const data: { soft_deleted?: boolean; message?: string; order_items?: number } =
        (resp as { data?: { soft_deleted?: boolean; message?: string; order_items?: number } }).data ?? {};
      if (data?.soft_deleted) {
        const orderItems = data.order_items ?? 0;
        const msg =
          data.message ||
          `Sản phẩm đã được ẩn khỏi cửa hàng (còn ${orderItems} đơn hàng tham chiếu — không thể xóa hoàn toàn để giữ lịch sử).`;
        setInfo(msg);
        setError("");
      } else {
        setInfo("Đã xóa sản phẩm.");
        setError("");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : err.message || "Xóa thất bại";
      setError(typeof message === "string" ? message : "Xóa thất bại");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => adminApi.restoreProduct(id),
    onSuccess: () => {
      setInfo("Đã khôi phục sản phẩm.");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => setError(err.message || "Khôi phục thất bại"),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.softDeleteProduct(id),
    onSuccess: (resp) => {
      const data = (resp as { data?: { already_hidden?: boolean; order_items?: number } }).data ?? {};
      const items = data.order_items ?? 0;
      setInfo(
        data.already_hidden
          ? `Sản phẩm đã được ẩn trước đó (còn ${items} đơn hàng tham chiếu).`
          : `Đã ẩn sản phẩm khỏi cửa hàng${items > 0 ? ` (còn ${items} đơn hàng tham chiếu — lịch sử đơn vẫn được giữ)` : ""}.`,
      );
      setError("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => setError(err.message || "Ẩn sản phẩm thất bại"),
  });

  const handleHide = (p: Product) => {
    const ok = window.confirm(
      `Ẩn sản phẩm "${p.name}"?\n\n` +
        `• Sản phẩm sẽ biến mất khỏi cửa hàng, trang chủ, tìm kiếm và sản phẩm liên quan.\n` +
        `• Lịch sử đơn hàng vẫn được giữ nguyên — đơn cũ không bị ảnh hưởng.\n` +
        `• Bạn có thể "Khôi phục" bất cứ lúc nào.\n\nTiếp tục?`,
    );
    if (!ok) return;
    softDeleteMutation.mutate(p.id);
  };

  const handleDelete = (p: Product) => {
    const ok = window.confirm(
      `Xóa sản phẩm "${p.name}"?\n\n` +
        `• Nếu không còn đơn hàng nào tham chiếu → xóa hoàn toàn.\n` +
        `• Nếu còn đơn hàng tham chiếu → sản phẩm sẽ bị ẨN khỏi cửa hàng (vẫn giữ để xem lịch sử đơn).`,
    );
    if (!ok) return;
    deleteMutation.mutate(p.id);
  };

  const handleRestore = (p: Product) => {
    restoreMutation.mutate(p.id);
  };

  const startEdit = (p: Product) => {
    setEditing(p); setTab("full");
    const chips = p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    setFullTagChips(chips);
    const specs = p.specifications ? parseSpecsString(p.specifications) : {};
    setForm({
      name: p.name,
      price: String(p.price),
      tags: p.tags,
      description: p.description,
      specifications: specs,
      stock: String(p.stock),
    });
    setImage(null);
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const { data } = await adminApi.importDocx(file);
      setForm((prev) => ({ ...prev, description: data.html || prev.description }));
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : "Nhập file DOCX thất bại. Vui lòng kiểm tra định dạng file.";
      setError(String(msg));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleSpecChange = (label: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [label]: value },
    }));
  };

  const addCustomSpec = () => {
    const label = customSpecLabel.trim();
    if (!label) return;
    const existsInPresets = SPEC_FIELDS.includes(label);
    const existsInCustom = customSpecLabels.includes(label);
    if (!existsInPresets && !existsInCustom) {
      setCustomSpecLabels((prev) => [...prev, label]);
    }
    setCustomSpecLabel("");
  };

  const removeCustomSpec = (label: string) => {
    setCustomSpecLabels((prev) => prev.filter((l) => l !== label));
    setForm((prev) => {
      const next = { ...prev.specifications };
      delete next[label];
      return { ...prev, specifications: next };
    });
  };

  if (isLoading) return <LoadingSpinner label="Đang tải sản phẩm..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý sản phẩm</h1>

      {/* Tag selection bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="self-center text-xs text-steelgray mr-1">Chọn nhãn:</span>
        {TAG_PRESETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              toggleTag(t, quickTagChips, setQuickTagChips);
              toggleTag(t, fullTagChips, setFullTagChips);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              quickTagChips.includes(t.toLowerCase()) || fullTagChips.includes(t.toLowerCase())
                ? "bg-crimson text-white"
                : "border border-gunmetal/60 bg-graphite text-steelgray hover:border-silvergray hover:text-warmwhite"
            }`}
          >
            {t}
          </button>
        ))}
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
          {/* Selected tag chips */}
          <div>
            <label className="mb-1.5 block text-xs text-steelgray">Nhãn đã chọn:</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {quickTagChips.map((t) => (
                <span key={t} className="tag-badge flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setQuickTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                </span>
              ))}
              {quickTagChips.length === 0 && <span className="text-xs text-steelgray italic">Nhấn nhãn bên trên để chọn...</span>}
            </div>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={quickMutation.isPending} className="btn-primary">
            {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
          </button>
        </form>
      )}

      {tab === "full" && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="mb-8 space-y-6 rounded-xl border border-gunmetal/60 bg-graphite p-6">
          <h2 className="text-base font-bold text-warmwhite">
            {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm đầy đủ"}
          </h2>

          {/* Name, Price, Stock */}
          <div className="grid gap-4 md:grid-cols-2">
            <input required placeholder="Tên sản phẩm" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            <input required type="number" step="1000" placeholder="Giá (VND)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
            <input type="number" placeholder="Số lượng tồn kho" value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
            {/* Selected tag chips */}
            <div>
              <label className="mb-1.5 block text-xs text-steelgray">Nhãn đã chọn:</label>
              <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                {fullTagChips.map((t) => (
                  <span key={t} className="tag-badge flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => setFullTagChips((p) => p.filter((x) => x !== t))} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
                  </span>
                ))}
                {fullTagChips.length === 0 && <span className="text-xs text-steelgray italic self-center">Nhấn nhãn bên trên để chọn...</span>}
              </div>
            </div>
          </div>

          {/* Description — Rich text editor + DOCX import */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-steelgray font-medium">Mô tả sản phẩm (hỗ trợ DOCX)</label>
              <label className="btn-secondary cursor-pointer text-xs py-1.5 px-3">
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleImportDocx}
                  disabled={importing}
                />
                {importing ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang nhập...
                  </span>
                ) : "Nhập từ DOCX"}
              </label>
            </div>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
              placeholder="Nhập mô tả sản phẩm... Hỗ trợ in đậm, in nghiêng, tiêu đề, danh sách, ảnh..."
            />
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm text-steelgray font-medium">Thông số kỹ thuật</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSpecLabel}
                  onChange={(e) => setCustomSpecLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSpec(); } }}
                  placeholder="Thêm spec mới (VD: Khối lượng)"
                  className="input-field text-sm h-9 w-64"
                />
                <button type="button" onClick={addCustomSpec} className="btn-secondary text-xs py-1.5 px-3">
                  + Thêm
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[...SPEC_FIELDS, ...customSpecLabels].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-sm text-steelgray w-48 shrink-0 flex items-center gap-1">
                    {label}
                    {customSpecLabels.includes(label) && (
                      <button
                        type="button"
                        onClick={() => removeCustomSpec(label)}
                        className="ml-1 text-deeprose hover:text-rose"
                        title="Xóa spec"
                      >
                        ×
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.specifications[label] || ""}
                    onChange={(e) => handleSpecChange(label, e.target.value)}
                    placeholder="—"
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">
              Hình ảnh {editing ? "(bỏ trống để giữ hình cũ)" : ""}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
          </div>

{error && (
          <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">{error}</div>
        )}
        {info && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{info}</div>
        )}

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
                    <td className="px-4 py-3 font-medium text-warmwhite">
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.is_active === false && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                </td>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-sm text-crimson hover:text-sakura transition-colors"
                        >
                          Sửa
                        </button>
                        {p.is_active === false ? (
                          <>
                            <span className="text-xs text-steelgray">·</span>
                            <button
                              onClick={() => handleRestore(p)}
                              disabled={restoreMutation.isPending}
                              className="text-sm text-emerald-400 hover:text-emerald-200 transition-colors disabled:opacity-50"
                            >
                              Khôi phục
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-steelgray">·</span>
                            <button
                              onClick={() => handleHide(p)}
                              disabled={softDeleteMutation.isPending}
                              className="text-sm text-amber-300 hover:text-amber-200 transition-colors disabled:opacity-50"
                            >
                              Ẩn
                            </button>
                          </>
                        )}
                        <span className="text-xs text-steelgray">·</span>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-deeprose hover:text-rose transition-colors disabled:opacity-50"
                        >
                          Xóa
                        </button>
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
