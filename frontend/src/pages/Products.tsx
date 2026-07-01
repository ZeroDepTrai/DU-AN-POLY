import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Giá: Thấp → Cao", value: "price_asc" },
  { label: "Giá: Cao → Thấp", value: "price_desc" },
];

const BRAND_FILTERS = [
  { label: "Apple", value: "apple" },
  { label: "Samsung", value: "samsung" },
  { label: "Xiaomi", value: "xiaomi" },
  { label: "OPPO", value: "oppo" },
];

const PRICE_FILTERS = [
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const brand = searchParams.get("brand") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const search = searchParams.get("search") ?? "";
  const priceMin = Number(searchParams.get("priceMin") ?? 0);
  const priceMax = Number(
    searchParams.get("priceMax") === "Infinity" ? Infinity : (searchParams.get("priceMax") ?? 0)
  );

  const { data, isLoading } = useQuery({
    queryKey: ["products-search", brand, sort, page, search],
    queryFn: async () => {
      const resp = await productsApi.search({
        brand: brand || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      return resp.data;
    },
  });

  const allProducts = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const products = allProducts.filter((p) => {
    if (priceMin !== 0 && p.price < priceMin) return false;
    if (priceMax !== 0 && p.price > priceMax) return false;
    return true;
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-px w-8 bg-crimson" />
          <span className="text-xs font-medium uppercase tracking-widest text-crimson">
            Sản phẩm
          </span>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-extrabold text-warmwhite">Điện thoại thông minh</h1>
          <p className="text-sm text-steelgray">{total} sản phẩm</p>
        </div>
      </div>

      {/* Top bar: sort */}
      <div className="mb-6 flex items-center justify-end">
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="input-field w-full sm:w-52"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Brand filters */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-steelgray">
            Hãng
          </p>
          <div className="flex flex-wrap gap-2">
            {BRAND_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setParam("brand", brand === f.value ? "" : f.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  brand === f.value
                    ? "bg-crimson text-white shadow-md shadow-crimson/30"
                    : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price range filters */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-steelgray">
            Khoảng giá
          </p>
          <div className="flex flex-wrap gap-2">
            {PRICE_FILTERS.map((f) => {
              const isActive =
                priceMin === f.min && priceMax === f.max;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("page");
                    if (isActive) {
                      next.delete("priceMin");
                      next.delete("priceMax");
                    } else {
                      next.set("priceMin", String(f.min));
                      next.set("priceMax", String(f.max));
                    }
                    setSearchParams(next);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-crimson text-white shadow-md shadow-crimson/30"
                      : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner label="Đang tải sản phẩm..." />
      ) : products.length === 0 ? (
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
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-warmwhite">Không có sản phẩm</h3>
          <p className="text-sm text-steelgray">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
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
  );
}
