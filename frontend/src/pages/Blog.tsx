import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { blogApi } from "../api/client";
import BlogCard from "../components/BlogCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 6;

const TAG_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Tin công nghệ", value: "tech" },
  { label: "Review sản phẩm", value: "review" },
  { label: "Mẹo hay", value: "tips" },
];

export default function Blog() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts", selectedTags],
    queryFn: async () => {
      const { data } = await blogApi.list(selectedTags.length ? selectedTags.join(",") : undefined);
      return data;
    },
  });

  const filtered = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const featuredTags = posts[0]?.tags
    ? posts[0].tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const formattedDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-charcoal">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="border-b border-gunmetal/40 bg-graphite/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-steelgray mb-3">
            <Link to="/" className="hover:text-crimson transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-warmwhite">Blog</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-crimson" />
            <h1 className="text-3xl font-extrabold text-warmwhite tracking-tight">
              Tin công nghệ &amp; Reviews
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        {/* ── Featured Post ───────────────────────────────── */}
        {!isLoading && posts.length > 0 && (
          <Link
            to={`/blog/${posts[0].slug}`}
            className="group mb-10 flex flex-col overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/30 lg:flex-row"
          >
            <div className="relative w-full overflow-hidden lg:w-1/2">
              <img
                src={posts[0].image_url}
                alt={posts[0].title}
                className="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:aspect-auto"
              />
              <div className="absolute left-4 top-4 rounded-full bg-crimson px-3 py-1 text-xs font-bold text-white">
                Nổi bật
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 lg:w-1/2">
              {featuredTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {featuredTags.map((t: string) => (
                    <span key={t} className="rounded-full bg-crimson/20 px-3 py-0.5 text-xs font-medium text-sakura">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <p className="mb-3 text-xs font-medium text-steelgray">
                {formattedDate(posts[0].created_at)}
              </p>
              <h2 className="mb-4 text-2xl font-extrabold text-warmwhite group-hover:text-sakura transition-colors line-clamp-3 lg:text-3xl">
                {posts[0].title}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-steelgray line-clamp-2">
                Khám phá những tin tức công nghệ mới nhất, đánh giá chi tiết sản phẩm và những mẹo hay dành cho bạn.
              </p>
              <div className="flex items-center gap-1 text-sm font-semibold text-crimson group-hover:text-sakura transition-colors">
                Đọc ngay
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* ── Tag Tabs + Search ─────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TAG_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => toggleTag(tab.value)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  tab.value === "" && selectedTags.length === 0
                    ? "bg-crimson text-white"
                    : tab.value !== "" && selectedTags.includes(tab.value)
                    ? "bg-crimson/80 text-white"
                    : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steelgray"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm bài viết..."
              className="input-field pl-10 w-full sm:w-64"
            />
          </div>
        </div>

        {/* ── Blog Grid ─────────────────────────────────── */}
        {isLoading ? (
          <LoadingSpinner label="Đang tải blog..." />
        ) : paginated.length === 0 ? (
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-16 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gunmetal/40">
                <svg
                  className="h-10 w-10 text-steelgray"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-warmwhite">Chưa có bài viết nào</h3>
            <p className="text-sm text-steelgray">Quay lại sau để đọc những bài viết thú vị nhất!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <div className="h-16" />
    </div>
  );
}
