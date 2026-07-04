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
  { label: "Tất cả", min: 0, max: Infinity },
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

  // Split: first product gets the bento (featured span), rest get the standard grid
  const [bentoProduct, ...gridProducts] = products;

  return (
    <div className="container-padding py-10">
      {/* ── Page header (Figma "Page Header" 19:410) ──────────────────── */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px w-10 bg-crimson" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">
              Sản phẩm
            </span>
          </div>
          <h1 className="mb-2 text-4xl font-extrabold text-warmwhite">Điện thoại thông minh</h1>
          <p className="text-sm text-softgray">
            Khám phá bộ sưu tập smartphone cao cấp mới nhất.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-softgray">{total} sản phẩm</span>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="input-field w-44"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* ── Sidebar filters (Figma 19:4 / 19:7) ──────────────────────── */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-bento border border-rose/20 bg-cardtint/60 p-6 backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-bold uppercase tracking-wider text-warmwhite">
              Bộ lọc
            </h3>

            {/* Brand */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-softgray">
                Hãng
              </p>
              <div className="space-y-2">
                {BRAND_FILTERS.map((f) => (
                  <label key={f.value} className="flex cursor-pointer items-center gap-3 group">
                    <input
                      type="checkbox"
                      checked={brand === f.value}
                      onChange={() => setParam("brand", brand === f.value ? "" : f.value)}
                      className="h-4 w-4 accent-rose"
                    />
                    <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-softgray">
                Khoảng giá
              </p>
              <div className="space-y-2">
                {PRICE_FILTERS.map((f) => {
                  const isActive = priceMin === f.min && priceMax === f.max;
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
                      className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-rose/15 text-rose"
                          : "text-softgray hover:bg-gunmetal hover:text-warmwhite"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Grid (Figma "Product Grid" 19:485) ───────────────────────── */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <LoadingSpinner label="Đang tải sản phẩm..." />
          ) : products.length === 0 ? (
            <div className="rounded-showcase border border-rose/20 bg-cardtint/60 p-16 text-center backdrop-blur-sm">
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
              <p className="text-sm text-softgray">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <>
              {/* Bento: featured span (Figma card 19:487) */}
              {bentoProduct && (
                <div className="mb-5 h-[560px]">
                  <ProductCard product={bentoProduct} variant="bento" />
                </div>
              )}

              {/* Standard 3-col grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gridProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
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
    </div>
  );
}