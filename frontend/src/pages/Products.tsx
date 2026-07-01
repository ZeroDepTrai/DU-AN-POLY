import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";

// Products hero banner
const PRODUCTS_BANNER =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1440&q=85&auto=format&fit=crop";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Giá: Thấp → Cao", value: "price_asc" },
  { label: "Giá: Cao → Thấp", value: "price_desc" },
];

const TAG_FILTERS = [
  { label: "Tất cả", value: "" },
  { label: "iPhone", value: "iphone" },
  { label: "Samsung", value: "samsung" },
  { label: "Xiaomi", value: "xiaomi" },
  { label: "Flagship", value: "flagship" },
  { label: "Gaming", value: "gaming" },
  { label: "5G", value: "5g" },
  { label: "Budget", value: "budget" },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const tag = searchParams.get("tag") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const search = searchParams.get("search") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["products-search", tag, sort, page, search],
    queryFn: async () => {
      const resp = await productsApi.search({
        tag: tag || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      return resp.data;
    },
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  return (
    <div>
      {/* ── Hero Banner ──────────────────────────────────── */}
      <section className="relative h-[640px] w-full overflow-hidden">
        <img
          src={PRODUCTS_BANNER}
          alt="Sản phẩm"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/90" />

        <div className="relative z-10 flex h-full flex-col justify-end px-16 pb-14">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-sm text-softgray">
            <Link to="/" className="hover:text-crimson transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-warmwhite">Sản phẩm nổi bật</span>
          </div>

          {/* Large white title */}
          <h1 className="text-[80px] font-extrabold leading-none text-warmwhite tracking-tight">
            Sản phẩm nổi bật
          </h1>
        </div>
      </section>

      {/* ── Products Content ─────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Top bar: count + sort */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-steelgray">
            {total} sản phẩm
          </p>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="input-field w-full sm:w-52"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TAG_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setParam("tag", f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tag === f.value
                  ? "bg-crimson text-white shadow-md shadow-crimson/30"
                  : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <LoadingSpinner label="Đang tải sản phẩm..." />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-16 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gunmetal/40">
                <svg className="h-10 w-10 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-warmwhite">Không có sản phẩm</h3>
            <p className="text-sm text-steelgray">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setParam("page", String(p))}
              baseUrl="/products"
            />
          </div>
        )}
      </div>
    </div>
  );
}
