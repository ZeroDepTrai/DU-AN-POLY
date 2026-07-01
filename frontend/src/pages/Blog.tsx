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

// Hero banner image
const BLOG_BANNER =
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1152&q=85&auto=format&fit=crop";

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      {/* ── Hero Banner ──────────────────────────────────── */}
      <section className="relative h-[640px] w-full overflow-hidden">
        <img
          src={BLOG_BANNER}
          alt="Blog"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />

        <div className="relative z-10 flex h-full flex-col justify-end px-16 pb-14">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-sm text-softgray">
            <Link to="/" className="hover:text-crimson transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-warmwhite">Blog</span>
          </div>

          {/* Large white title */}
          <h1 className="text-[80px] font-extrabold leading-none text-warmwhite tracking-tight">
            BLOG
          </h1>
        </div>
      </section>

      {/* ── Brand Categories ─────────────────────────────── */}
      <section className="border-b border-gunmetal/40 bg-graphite/50">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-5 sm:gap-12">
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

      {/* ── Category Tabs + Search ───────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1); }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
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

        {/* ── Blog Grid ─────────────────────────────────── */}
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
      </div>

      {/* ── Featured Products ─────────────────────────────── */}
      {!search && (
        <section className="mt-20 border-t border-gunmetal/40">
          <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
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
          </div>
        </section>
      )}
    </div>
  );
}
