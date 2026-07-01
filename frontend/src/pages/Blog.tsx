import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { blogApi, productsApi } from "../api/client";
import BlogCard from "../components/BlogCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { label: "Tất cả", value: "" },
  { label: "Tin công nghệ", value: "tech" },
  { label: "Review sản phẩm", value: "review" },
  { label: "Mẹo hay", value: "tips" },
];

const BRANDS = [
  { label: "Apple", icon: "🍎" },
  { label: "Samsung", icon: "📱" },
  { label: "Xiaomi", icon: "📲" },
  { label: "OPPO", icon: "📞" },
];

const PAGE_SIZE = 6;

export default function Blog() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["blog-posts-all"],
    queryFn: async () => {
      const { data } = await blogApi.list();
      return data;
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data } = await productsApi.list();
      return data.slice(0, 4);
    },
  });

  const filtered = posts.filter((p) => {
    if (category && !p.title.toLowerCase().includes(category.toLowerCase())) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const [featured, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Brand Categories ───────────────────────────── */}
      <section className="border-b border-gunmetal/40 bg-graphite/50 mb-10">
        <div className="flex items-center justify-center gap-6 overflow-x-auto px-4 py-5 sm:gap-12">
          {BRANDS.map((brand) => (
            <button
              key={brand.label}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gunmetal/40 bg-charcoal text-2xl transition-all group-hover:border-rose/40 group-hover:bg-gunmetal">
                {brand.icon}
              </div>
              <span className="text-xs font-medium text-steelgray transition-colors group-hover:text-crimson">
                {brand.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-px w-8 bg-crimson" />
          <span className="text-xs font-medium uppercase tracking-widest text-crimson">Blog</span>
        </div>
        <h1 className="text-3xl font-extrabold text-warmwhite">Tin công nghệ & Reviews</h1>
        <p className="mt-2 text-sm text-steelgray">Những bài viết mới nhất về điện thoại, công nghệ và xu hướng</p>
      </div>

      {/* Featured Post */}
      {featured && !search && (
        <a
          href={`/blog/${featured.slug}`}
          className="group mb-10 grid overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/30 md:grid-cols-2"
        >
          {featured.image_url && (
            <div className="aspect-video overflow-hidden md:aspect-auto">
              <img
                src={featured.image_url}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex flex-col justify-between p-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-xs font-medium text-sakura">
                <span className="h-1.5 w-1.5 rounded-full bg-crimson" />
                Bài viết nổi bật
              </div>
              <h2 className="text-2xl font-bold text-warmwhite group-hover:text-sakura transition-colors leading-tight">
                {featured.title}
              </h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-steelgray">
                {new Date(featured.created_at).toLocaleDateString("vi-VN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-crimson group-hover:text-sakura transition-colors">
                Đọc ngay
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      )}

      {/* Tabs + Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                category === c.value
                  ? "bg-crimson text-white"
                  : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-steelgray pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Grid */}
      {postsLoading ? (
        <LoadingSpinner label="Đang tải blog..." />
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-16 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gunmetal/40">
              <svg className="h-10 w-10 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-warmwhite mb-2">Chưa có bài viết nào</h3>
          <p className="text-sm text-steelgray">Quay lại sau để đọc những bài viết thú vị nhất!</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ── Featured Products ─────────────────────────────── */}
      {!search && (
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px w-8 bg-crimson" />
                <span className="text-xs font-medium uppercase tracking-widest text-crimson">Bạn có thể thích</span>
              </div>
              <h2 className="text-2xl font-extrabold text-warmwhite">Sản phẩm nổi bật</h2>
            </div>
            <Link
              to="/products"
              className="hidden items-center gap-1 text-sm font-medium text-crimson transition-colors hover:text-sakura sm:flex"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {productsLoading ? (
            <LoadingSpinner label="Đang tải sản phẩm..." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="small" />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
