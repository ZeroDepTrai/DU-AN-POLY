import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { Product } from "../../types";

const TAG_PRESETS = ["iPhone", "Android", "Samsung", "Xiaomi", "Flagship", "Budget", "5G", "Gaming"];

const emptyForm = { name: "", price: "", tag: "", description: "", stock: "10" };
const emptyQuickForm = { name: "", price: "", tag: "" };

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"quick" | "full">("quick");
  const [form, setForm] = useState(emptyForm);
  const [quickForm, setQuickForm] = useState(emptyQuickForm);
  const [image, setImage] = useState<File | null>(null);
  const [quickImage, setQuickImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");

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
      formData.append("tag", form.tag);
      formData.append("description", form.description);
      formData.append("stock", form.stock);
      if (image) formData.append("image", image);
      else if (!editing) throw new Error("Hình ảnh bắt buộc cho sản phẩm mới");
      return editing ? adminApi.updateProduct(editing.id, formData) : adminApi.createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm(emptyForm); setImage(null); setEditing(null); setError(""); setTab("quick");
    },
    onError: (err: Error) => setError(err.message || "Lỗi lưu sản phẩm"),
  });

  const quickMutation = useMutation({
    mutationFn: async () => {
      if (!quickImage) throw new Error("Hình ảnh bắt buộc");
      const fd = new FormData();
      fd.append("name", quickForm.name); fd.append("price", quickForm.price);
      fd.append("tag", quickForm.tag); fd.append("image", quickImage);
      return adminApi.quickAddProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuickForm(emptyQuickForm); setQuickImage(null);
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

  const startEdit = (product: Product) => {
    setEditing(product); setTab("full");
    setForm({ name: product.name, price: String(product.price), tag: product.tag,
      description: product.description, stock: String(product.stock) });
    setImage(null);
  };

  if (isLoading) return <LoadingSpinner label="Đang tải sản phẩm..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý sản phẩm</h1>

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
          className="mb-8 grid gap-4 rounded-xl border border-gunmetal/60 bg-graphite p-6 md:grid-cols-3">
          <h2 className="md:col-span-3 text-base font-bold text-sakura">Thêm sản phẩm nhanh</h2>
          <input required placeholder="Tên điện thoại (VD: iPhone 15 Pro)" value={quickForm.name}
            onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} className="input-field" />
          <input required type="number" step="1000" placeholder="Giá (VND)" value={quickForm.price}
            onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })} className="input-field" />
          <select required value={quickForm.tag}
            onChange={(e) => setQuickForm({ ...quickForm, tag: e.target.value })} className="input-field">
            <option value="">Chọn nhãn...</option>
            {TAG_PRESETS.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
          </select>
          <div className="md:col-span-3">
            <label className="mb-1.5 block text-sm text-steelgray">Hình ảnh sản phẩm</label>
            <input required type="file" accept="image/*" onChange={(e) => setQuickImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crimson file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
          </div>
          {error && <p className="md:col-span-3 text-sm text-rose">{error}</p>}
          <div className="md:col-span-3">
            <button type="submit" disabled={quickMutation.isPending} className="btn-primary">
              {quickMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      )}

      {tab === "full" && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="mb-8 grid gap-4 rounded-xl border border-gunmetal/60 bg-graphite p-6 md:grid-cols-2">
          <h2 className="md:col-span-2 text-base font-bold text-warmwhite">
            {editing ? `Sửa: ${editing.name}` : "Thêm sản phẩm đầy đủ"}
          </h2>
          <input required placeholder="Tên" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          <input required type="number" step="1000" placeholder="Giá (VND)" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
          <input required placeholder="Nhãn (VD: iphone, samsung)" value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })} className="input-field" />
          <input type="number" placeholder="Số lượng tồn kho" value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
          <textarea placeholder="Mô tả sản phẩm" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field md:col-span-2 resize-none" rows={3} />
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm text-steelgray">
              Hình ảnh {editing ? "(bỏ trống để giữ hình cũ)" : ""}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite" />
          </div>
          {error && <p className="md:col-span-2 text-sm text-rose">{error}</p>}
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setTab("quick"); }}
                className="btn-secondary">Hủy</button>
            )}
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gunmetal/60 bg-graphite overflow-hidden">
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
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors">
                <td className="px-4 py-3"><img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium text-warmwhite">{p.name}</td>
                <td className="px-4 py-3 text-crimson font-semibold">{new Intl.NumberFormat("vi-VN").format(p.price)} VND</td>
                <td className="px-4 py-3"><span className="tag-badge">{p.tag}</span></td>
                <td className="px-4 py-3">
                  <span className={p.stock < 5 ? "text-deeprose font-semibold" : "text-warmwhite"}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-sm text-crimson hover:text-sakura transition-colors">Sửa</button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="text-sm text-deeprose hover:text-rose transition-colors">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
