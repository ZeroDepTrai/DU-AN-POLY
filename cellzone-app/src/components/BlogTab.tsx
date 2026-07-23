import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi, normalizeMediaUrl } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { BlogPost } from "../types";
import { Edit2, Trash2, Search, X, Upload } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

const BLOG_TAG_PRESETS = [
  "featured", "tech", "review", "tips", "news", "guide",
];

export default function BlogTab() {
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission("blog:create") || hasPermission("blog:edit");
  const canDelete = hasPermission("blog:delete");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: blogApi.listAdmin,
    staleTime: 0,
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) setSelectedTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("tags", selectedTags.join(","));
      if (imageFile) fd.append("image", imageFile);
      if (coverPreview) fd.append("cover_image_url", coverPreview);
      return editing ? blogApi.update(editing.id, fd) : blogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      resetForm();
      setSuccess(editing ? "Cập nhật bài viết thành công!" : "Đăng bài viết thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => blogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      setSuccess("Đã xóa bài viết.");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: unknown) => setError((e as Error).message),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", content: "" });
    setSelectedTags([]);
    setImageFile(null);
    setCoverPreview(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({ title: post.title, content: post.content || "" });
    setImageFile(null);
    setCoverPreview(null);
    setError("");
    const tags = post.tags
      ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];
    setSelectedTags(tags);
    setShowForm(true);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Tiêu đề không được để trống"); return; }
    if (!form.content.trim() || form.content === "<p></p>") { setError("Nội dung không được để trống"); return; }
    setError("");
    saveMutation.mutate();
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const filtered = posts.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý Blog</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">
            {canEdit ? "Viết và quản lý bài viết" : "Xem danh sách bài viết"}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-[#f0f0f5]"
          >
            Viết bài mới
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
          placeholder="Tìm bài viết..."
          className="w-full glass-input pl-10"
        />
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Tag selector */}
      {canEdit && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="self-center text-xs text-[#5a5a6a] mr-1">Nhãn bài viết:</span>
          {BLOG_TAG_PRESETS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-indigo-500 text-white"
                  : "glass hover:bg-white/10 text-[#8b8b9a]"
              }`}
            >
              {tag}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Thêm nhãn..."
              className="glass-input text-xs h-7 w-28 px-2 py-1"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="h-7 w-7 flex items-center justify-center rounded glass text-[#8b8b9a] hover:text-[#f0f0f5] text-sm"
            >
              +
            </button>
          </div>
          {selectedTags.length > 0 && (
            <button type="button" onClick={() => setSelectedTags([])}
              className="text-xs text-[#5a5a6a] hover:text-red-400 ml-1 underline">
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
              {t}
              <button type="button" onClick={() => toggleTag(t)} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && canEdit && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#f0f0f5]">
              {editing ? `Sửa: ${editing.title}` : "Viết bài mới"}
            </h2>
            <button onClick={resetForm} className="text-[#8b8b9a] hover:text-[#f0f0f5]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiêu đề bài viết"
              required
              className="w-full glass-input text-lg font-semibold"
            />

            {/* Rich text editor */}
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              placeholder="Nhập nội dung bài viết..."
            />

            {/* Cover image */}
            <div>
              <label className="block text-sm text-[#8b8b9a] mb-1">
                Ảnh đại diện {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}
              </label>
              <label className="flex items-center gap-2 glass-input cursor-pointer hover:bg-white/5 px-3 py-2 w-fit">
                <Upload className="w-4 h-4 text-[#8b8b9a]" />
                <span className="text-sm text-[#8b8b9a]">
                  {imageFile ? imageFile.name : "Chọn ảnh..."}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              {(coverPreview || (editing && editing.image_url)) && (
                <img
                  src={coverPreview ?? normalizeMediaUrl(editing?.image_url) ?? ""}
                  alt="Cover"
                  className="mt-2 h-20 w-28 rounded-lg object-cover"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleSubmit}
                className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
                {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật bài viết" : "Đăng bài viết"}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} className="px-4 py-2 text-[#8b8b9a] hover:text-[#f0f0f5]">
                  Hủy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-[#8b8b9a]">{filtered.length} bài viết</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có bài viết nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Ngày</th>
                {(canEdit || canDelete) && <th className="px-4 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const tagList = post.tags
                  ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                  : [];
                return (
                  <tr key={post.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      {post.image_url && (
                        <img src={normalizeMediaUrl(post.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#f0f0f5] max-w-[200px] truncate">{post.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tagList.slice(0, 2).map((t: string) => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-[#8b8b9a]">{t}</span>
                        ))}
                        {tagList.length === 0 && <span className="text-[#5a5a6a]">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#8b8b9a]">{post.slug}</td>
                    <td className="px-4 py-3 text-[#8b8b9a]">{post.author_name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#8b8b9a]">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          {canEdit && (
                            <button onClick={() => handleEdit(post)} className="text-indigo-400 hover:text-indigo-300" title="Sửa">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => {
                              if (confirm(`Xóa bài "${post.title}"?`)) deleteMutation.mutate(post.id);
                            }} className="text-red-400 hover:text-red-300" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
