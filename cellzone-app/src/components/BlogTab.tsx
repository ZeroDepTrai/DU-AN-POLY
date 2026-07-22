import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi, normalizeMediaUrl } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { BlogPost } from "../types";
import { Edit2, Trash2 } from "lucide-react";

export default function BlogTab() {
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission("blog:create") || hasPermission("blog:edit");
  const canDelete = hasPermission("blog:delete");
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: [] as string[] });
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog"],
    queryFn: blogApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("tags", form.tags.join(","));
      if (imageFile) fd.append("image", imageFile);
      return editing ? blogApi.update(editing.id, fd) : blogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      resetForm();
      setSuccess(editing ? "Cập nhật bài viết thành công!" : "Đăng bài viết thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => blogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      setSuccess("Xóa bài viết thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", content: "", tags: [] });
    setImageFile(null);
    setTagInput("");
    setError("");
  };

  const handleEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      content: post.content,
      tags: post.tags ? post.tags.split(",").filter(Boolean) : [],
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim().toLowerCase())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim().toLowerCase()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Tiêu đề không được để trống"); return; }
    if (!form.content.trim() || form.content === "<p></p>") { setError("Nội dung không được để trống"); return; }
    setError("");
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý Blog</h1>
        <p className="text-sm text-[#8b8b9a] mt-1">
          {canEdit ? "Viết và quản lý bài viết" : "Xem danh sách bài viết"}
        </p>
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {canEdit && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">
            {editing ? "Sửa: " + editing.title : "Viết bài mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiêu đề bài viết"
              required
              className="w-full glass-input text-lg font-semibold"
            />

            <div className="flex flex-wrap gap-2">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-white">x</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Thêm nhãn..."
                className="flex-1 glass-input text-sm"
              />
              <button type="button" onClick={addTag} className="glass-button px-3">+</button>
            </div>

            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Nội dung bài viết..."
              rows={6}
              className="w-full glass-input resize-none"
            />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 glass-input cursor-pointer hover:bg-white/5 px-3 py-2">
                <span className="text-sm text-[#8b8b9a]">{imageFile ? imageFile.name : "Chọn ảnh..."}</span>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <div className="flex gap-2 ml-auto">
                {editing && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-[#8b8b9a] hover:text-[#f0f0f5]">
                    Hủy
                  </button>
                )}
                <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                  {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Đăng bài"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-[#8b8b9a]">{posts.length} bài viết</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có bài viết nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Slug</th>
                {(canEdit || canDelete) && <th className="px-4 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">
                    {post.image_url && <img src={normalizeMediaUrl(post.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#f0f0f5] max-w-[200px] truncate">{post.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {post.tags ? post.tags.split(",").slice(0, 2).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-[#8b8b9a]">{t}</span>
                      )) : <span className="text-[#8b8b9a]">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8b8b9a]">{post.slug}</td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {canEdit && <button onClick={() => handleEdit(post)} className="text-indigo-400 hover:text-indigo-300"><Edit2 className="w-4 h-4" /></button>}
                        {canDelete && <button onClick={() => { if (confirm("Xóa \"" + post.title + "\"?")) deleteMutation.mutate(post.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
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
