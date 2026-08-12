import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { blogApi } from "../api/client";
import BlogCard from "../components/BlogCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import GlassCard from "../components/aurora/GlassCard";
import SectionHeading from "../components/aurora/SectionHeading";
import AuroraBadge from "../components/aurora/AuroraBadge";
import OptimizedImage from "../components/OptimizedImage";

const PAGE_SIZE = 6;

const CATEGORY_PILLS = [
  { label: "Tất cả", value: "" },
  { label: "Công nghệ", value: "tech" },
  { label: "Review", value: "review" },
  { label: "Mẹo hay", value: "tips" },
  { label: "So sánh", value: "compare" },
  { label: "Hướng dẫn", value: "guide" },
  { label: "Tin khuyến mãi", value: "promo" },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const { data: featuredPosts = [] } = useQuery({
    queryKey: ["blog-featured"],
    queryFn: async () => {
      const { data } = await blogApi.list("featured");
      return data;
    },
  });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await blogApi.list();
      return data;
    },
  });

  const { data: popularPosts = [] } = useQuery({
    queryKey: ["blog-popular"],
    queryFn: async () => {
      const { data } = await blogApi.list("popular");
      return data;
    },
  });

  const featuredPost = featuredPosts[0];

  const posts = featuredPost
    ? allPosts.filter((p) => p.id !== featuredPost.id)
    : allPosts;

  const filtered = posts.filter((p) => {
    if (selectedCategory && !p.tags?.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
    return true;
  });

  const sidebarFiltered = allPosts.filter((p) =>
    sidebarSearch && p.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const featuredTags = featuredPost?.tags
    ? featuredPost.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const formattedDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-darkbase">
      {/* Blog Hero Section */}
      {featuredPost && (
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-darkbase via-[#1a1020]/50 to-darkbase" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sakura/20 blur-[128px]" />
            <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-violet/20 blur-[96px]" />
          </div>
          <div className="container-padding relative py-16">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-steelgray">
                <Link to="/" className="transition-colors hover:text-sakura focus-rose">Trang chủ</Link>
                <span>/</span>
                <span className="text-warmwhite">Blog</span>
              </div>
              <SectionHeading
                eyebrow="Blog"
                title="Tin công nghệ & Reviews"
                subtitle="Khám phá những tin tức, đánh giá và mẹo hay từ đội ngũ CellZone."
              />
            </div>

            <Link to={`/blog/${featuredPost.slug}`} className="group block focus-rose">
              <GlassCard intensity="med" glow hoverable className="flex flex-col overflow-hidden p-0 lg:flex-row">
                <div className="relative w-full overflow-hidden lg:w-3/5">
                  <OptimizedImage
                    src={featuredPost.image_url}
                    alt={featuredPost.title}
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="aspect-video h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:aspect-auto lg:h-[420px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-darkbase/90 via-darkbase/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <AuroraBadge tone="rose" glow className="text-xs">Nổi bật</AuroraBadge>
                      {featuredTags.slice(0, 2).map((t: string) => (
                        <AuroraBadge key={t} tone="sakura" className="text-xs">{t}</AuroraBadge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-8 lg:w-2/5 lg:p-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">
                      C
                    </div>
                    <div>
                      <p className="text-sm font-medium text-warmwhite">CellZone</p>
                      <p className="text-xs text-steelgray">{formattedDate(featuredPost.created_at)}</p>
                    </div>
                  </div>
                  <h2 className="mb-4 text-2xl font-extrabold text-warmwhite group-hover:text-sakura transition-colors lg:text-3xl xl:text-4xl leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-steelgray">
                    {featuredPost.tags?.replace(/,/g, " · ")}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-softgray">
                      ~3 phút đọc
                    </span>
                    <div className="flex items-center gap-1 text-sm font-semibold aurora-text-rainbow group-hover:text-sakura transition-colors">
                      Đọc ngay
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        </section>
      )}

      {/* Main Content with Sidebar */}
      <div className="container-padding py-12">
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Main Column */}
          <div className="flex-1 min-w-0">
            {/* Category Filter Pills */}
            <div className="mb-8">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <span className="shrink-0 text-xs font-medium text-steelgray">Danh mục:</span>
                {CATEGORY_PILLS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { setSelectedCategory(cat.value); setPage(1); }}
                    className={[
                      "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all focus-rose whitespace-nowrap",
                      selectedCategory === cat.value
                        ? "border-transparent aurora-chip-active"
                        : "border-white/[0.06] bg-white/[0.04] text-softgray hover:border-white/30 hover:text-warmwhite",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Grid */}
            {isLoading ? (
              <LoadingSpinner label="Đang tải blog..." />
            ) : paginated.length === 0 ? (
              <GlassCard intensity="med" className="p-16 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-aurora-gradient shadow-glow-violet">
                    <svg
                      className="h-10 w-10 text-white"
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
              </GlassCard>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Pagination */}
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

          {/* Sticky Sidebar */}
          <aside className="w-full lg:w-80 xl:w-96">
            <div className="sticky top-24 space-y-6">
              {/* Sidebar Search */}
              <GlassCard intensity="med" className="p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sakura">Tìm kiếm</h3>
                <div className="relative">
                  <input
                    type="search"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Nhập từ khóa..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 pl-10 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                {sidebarSearch && sidebarFiltered.length > 0 && (
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    {sidebarFiltered.slice(0, 5).map((p) => (
                      <Link
                        key={p.id}
                        to={`/blog/${p.slug}`}
                        className="block px-4 py-3 text-sm text-warmwhite transition-colors hover:bg-white/[0.05] hover:text-sakura"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Popular Posts */}
              <GlassCard intensity="med" className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sakura">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Bài viết phổ biến
                </h3>
                <div className="space-y-4">
                  {popularPosts.slice(0, 5).map((post, idx) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aurora-gradient text-xs font-bold text-white shadow-glow-violet">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-warmwhite group-hover:text-sakura transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </p>
                        <p className="mt-1 text-xs text-steelgray">
                          {formattedDate(post.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {popularPosts.length === 0 && !isLoading && (
                    <p className="text-xs text-steelgray">Chưa có bài viết phổ biến.</p>
                  )}
                </div>
              </GlassCard>

              {/* Category Cloud */}
              <GlassCard intensity="med" className="p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sakura">Chủ đề</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PILLS.filter(c => c.value).map((cat) => {
                    const count = allPosts.filter(p => p.tags?.toLowerCase().includes(cat.value.toLowerCase())).length;
                    return (
                      <Link
                        key={cat.value}
                        to={`/blog?category=${cat.value}`}
                        className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-steelgray transition-all hover:border-white/30 hover:text-warmwhite"
                      >
                        <span>{cat.label}</span>
                        {count > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sakura/20 text-[10px] font-bold text-sakura">
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Recent Comments / Newsletter */}
              <GlassCard intensity="med" className="p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sakura">Theo dõi blog</h3>
                <p className="mb-4 text-xs text-steelgray leading-relaxed">
                  Đăng ký nhận thông báo khi có bài viết mới từ CellZone.
                </p>
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="mb-3 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30"
                />
                <button className="w-full rounded-xl bg-rose-gradient py-3 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                  Đăng ký
                </button>
              </GlassCard>
            </div>
          </aside>
        </div>
      </div>

      {/* Scrollbar hide style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
