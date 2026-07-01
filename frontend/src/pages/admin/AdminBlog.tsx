import axios from "axios";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBlogApi, blogApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import RichTextEditor from "../../components/RichTextEditor";
import type { BlogPost } from "../../types";

const BLOG_TAG_PRESETS = [
  "featured", "tech", "review", "tips", "news", "guide",
];

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", content: "" });
  const [image, setImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data } = await adminBlogApi.list();
      return data;
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("tags", selectedTags.join(","));
      if (image) fd.append("image", image);
      if (coverPreview) fd.append("cover_image_url", coverPreview);
      return editing ? adminBlogApi.update(editing.id, fd) : adminBlogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setForm({ title: "", content: "" });
      setImage(null);
      setCoverPreview(null);
      setEditing(null);
      setError("");
      setSelectedTags([]);
    },
    onError: (err: Error) => setError(err.message || "Lỗi lưu bài viết"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminBlogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  // Sync: just open the edit panel immediately
  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({ title: post.title, content: "" }); // content loaded async below
    setImage(null);
    setCoverPreview(null);
    setError("");
    const tags = post.tags
      ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];
    setSelectedTags(tags);
  };

  // Async: load full post content after the panel opens
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await blogApi.get(editing.slug);
        if (!cancelled) {
          setForm((f) => ({ ...f, content: data.content }));
          const tags = data.tags
            ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
            : [];
          setSelectedTags(tags);
        }
      } catch {
        // ignore — form already has title
      }
    })();
    return () => { cancelled = true; };
  }, [editing?.id]);

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    if (!form.content || !form.content.trim() || form.content === "<p></p>") {
      setError("Nội dung không được để trống");
      return;
    }
    setError("");
    saveMutation.mutate();
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const { data } = await adminBlogApi.importDocx(file);
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        content: data.html || prev.content,
      }));
      if (data.cover_image_url) {
        setCoverPreview(data.cover_image_url);
      }
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

  if (isLoading) return <LoadingSpinner label="Đang tải blog..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý Blog</h1>

      {/* Tag selector */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-steelgray mr-1">Nhãn bài viết:</span>
        {BLOG_TAG_PRESETS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              selectedTags.includes(tag)
                ? "bg-crimson text-white"
                : "border border-gunmetal/60 bg-graphite text-steelgray hover:border-silvergray hover:text-warmwhite"
            }`}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="text-xs text-steelgray hover:text-rose ml-2 underline"
          >
            Xóa tất cả
          </button>
        )}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 w-full">
            {selectedTags.map((t) => (
              <span key={t} className="tag-badge flex items-center gap-1">
                {t}
                <button type="button" onClick={() => toggleTag(t)} className="text-warmwhite/60 hover:text-warmwhite ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="mb-8 space-y-4 rounded-xl border border-gunmetal/60 bg-graphite p-6">
        <h2 className="text-base font-bold text-warmwhite">
          {editing ? `Sửa bài: ${editing.title}` : "Viết bài mới"}
        </h2>

        {/* Title */}
        <input
          required
          placeholder="Tiêu đề bài viết"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field text-lg font-semibold"
        />

        {/* Rich text editor */}
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm({ ...form, content: html })}
          placeholder="Nhập nội dung bài viết... Bạn có thể nhấn nút hình ảnh để chèn ảnh vào bài viết."
        />

        {/* Import DOCX + cover image row */}
        <div className="flex flex-wrap items-start gap-4">
          {/* DOCX import */}
          <div>
            <label className="mb-1.5 block text-sm text-steelgray">Nhập từ DOCX</label>
            <label className="btn-secondary cursor-pointer">
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleImportDocx}
                disabled={importing}
              />
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang nhập...
                </span>
              ) : (
                "Chọn file DOCX"
              )}
            </label>
          </div>

          {/* Cover image */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-sm text-steelgray">
              Ảnh đại diện {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImage(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setCoverPreview(null);
                }
              }}
              className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite"
            />
            {(coverPreview || (editing && editing.image_url)) && (
              <img
                src={coverPreview ?? editing?.image_url ?? ""}
                alt="Cover preview"
                className="mt-2 h-20 w-28 rounded-lg object-cover"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-deeprose/30 bg-deeprose/10 p-3 text-sm text-rose">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật bài viết" : "Đăng bài viết"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ title: "", content: "" });
                setImage(null);
                setCoverPreview(null);
                setSelectedTags([]);
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="rounded-xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <div className="border-b border-gunmetal/40 px-4 py-3">
          <span className="text-sm font-medium text-steelgray">{posts.length} bài viết</span>
        </div>
        {posts.length === 0 ? (
          <div className="p-8 text-center text-steelgray">Chưa có bài viết nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gunmetal/40 text-left text-steelgray">
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const tagList = post.tags
                  ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                  : [];
                return (
                  <tr
                    key={post.id}
                    className="border-t border-gunmetal/40 hover:bg-charcoal/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-warmwhite max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tagList.map((t: string) => (
                          <span key={t} className="tag-badge text-xs">{t}</span>
                        ))}
                        {tagList.length === 0 && <span className="text-xs text-steelgray">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-steelgray">{post.slug}</td>
                    <td className="px-4 py-3 text-softgray">{post.author_name}</td>
                    <td className="px-4 py-3 text-steelgray">{post.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(post)}
                          className="text-sm text-crimson hover:text-sakura transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xóa bài "${post.title}"?`)) {
                              deleteMutation.mutate(post.id);
                            }
                          }}
                          className="text-sm text-deeprose hover:text-rose transition-colors"
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
