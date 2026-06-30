import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBlogApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import RichTextEditor from "../../components/RichTextEditor";
import type { BlogPost } from "../../types";

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", content: "" });
  const [image, setImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data } = await adminBlogApi.list();
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      if (image) fd.append("image", image);
      return editing ? adminBlogApi.update(editing.id, fd) : adminBlogApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setForm({ title: "", content: "" });
      setImage(null);
      setEditing(null);
      setError("");
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

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({ title: post.title, content: post.content });
    setImage(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    if (!form.content.trim() || form.content === "<p></p>") {
      setError("Nội dung không được để trống");
      return;
    }
    setError("");
    saveMutation.mutate();
  };

  if (isLoading) return <LoadingSpinner label="Đang tải blog..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý Blog</h1>

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

        {/* Cover image */}
        <div>
          <label className="mb-1.5 block text-sm text-steelgray">
            Ảnh đại diện bài viết {editing ? "(bỏ trống để giữ ảnh cũ)" : ""}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-sm text-steelgray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gunmetal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-warmwhite"
          />
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
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
