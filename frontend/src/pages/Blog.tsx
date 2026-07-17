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
import AuroraInput from "../components/aurora/AuroraInput";

const PAGE_SIZE = 6;

const TAG_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Nổi bật", value: "featured" },
  { label: "Tin công nghệ", value: "tech" },
  { label: "Review sản phẩm", value: "review" },
  { label: "Mẹo hay", value: "tips" },
];

export default function Blog() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: featuredPosts = [] } = useQuery({
    queryKey: ["blog-featured"],
    queryFn: async () => {
      const { data } = await blogApi.list("featured");
      return data;
    },
  });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["blog-posts", selectedTags],
    queryFn: async () => {
      const { data } = await blogApi.list(selectedTags.length ? selectedTags.join(",") : undefined);
      return data;
    },
  });

  const featuredPost = featuredPosts[0];

  const posts = featuredPost
    ? allPosts.filter((p) => p.id !== featuredPost.id)
    : allPosts;

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
    <div>
      <div className="container-padding py-10">
        <div className="mb-4 flex items-center gap-2 text-sm text-steelgray">
          <Link to="/" className="hover:text-aurora-cyan transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-warmwhite">Blog</span>
        </div>
        <SectionHeading
          eyebrow="Blog"
          title="Tin công nghệ & Reviews"
          subtitle="Khám phá những tin tức, đánh giá và mẹo hay từ đội ngũ CellZone."
        />
      </div>

      <div className="container-padding pb-16">
        {!isLoading && featuredPost && (
          <Link to={`/blog/${featuredPost.slug}`} className="group mb-10 block">
            <GlassCard intensity="med" hoverable className="flex flex-col overflow-hidden p-0 lg:flex-row">
              <div className="relative w-full overflow-hidden lg:w-1/2">
                <img
                  src={featuredPost.image_url}
                  alt={featuredPost.title}
                  className="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:aspect-auto"
                />
                <div className="absolute left-4 top-4">
                  <AuroraBadge tone="violet" glow>Nổi bật</AuroraBadge>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 lg:w-1/2">
                {featuredTags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {featuredTags.map((t: string) => (
                      <AuroraBadge key={t} tone="cyan">{t}</AuroraBadge>
                    ))}
                  </div>
                )}
                <p className="mb-3 text-xs font-medium text-steelgray">
                  {formattedDate(featuredPost.created_at)}
                </p>
                <h2 className="mb-4 line-clamp-3 text-2xl font-extrabold text-warmwhite group-hover:text-aurora-cyan transition-colors lg:text-3xl">
                  {featuredPost.title}
                </h2>
                <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-steelgray">
                  Khám phá những tin tức công nghệ mới nhất, đánh giá chi tiết sản phẩm và những mẹo hay dành cho bạn.
                </p>
                <div className="flex items-center gap-1 text-sm font-semibold aurora-text-rainbow group-hover:text-aurora-cyan transition-colors">
                  Đọc ngay
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </GlassCard>
          </Link>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TAG_TABS.map((tab) => {
              const active = tab.value === "" ? selectedTags.length === 0 : selectedTags.includes(tab.value);
              return (
                <button
                  key={tab.value}
                  onClick={() => toggleTag(tab.value)}
                  className={[
                    "rounded-full border px-5 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-transparent aurora-chip-active"
                      : "border-white/10 bg-white/[0.04] text-softgray hover:border-white/30 hover:text-warmwhite",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="w-full sm:w-64">
            <AuroraInput
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm bài viết..."
            />
          </div>
        </div>

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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

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
    </div>
  );
}