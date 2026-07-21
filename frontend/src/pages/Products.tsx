import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import GlassCard from "../components/aurora/GlassCard";
import SectionHeading from "../components/aurora/SectionHeading";

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
  { label: "Vivo", value: "vivo" },
  { label: "Realme", value: "realme" },
  { label: "Huawei", value: "huawei" },
  { label: "Sony", value: "sony" },
  { label: "Nokia", value: "nokia" },
];

const PRICE_FILTERS = [
  { label: "Tất cả", min: 0, max: 0 },
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: 0 },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const brand = searchParams.get("brand") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const search = searchParams.get("search") ?? "";
  const priceMin = Number(searchParams.get("priceMin") ?? 0);
  const priceMax = Number(
    searchParams.get("priceMax") === "0" ? 0 : (searchParams.get("priceMax") ?? 0)
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

  const [bentoProduct, ...gridProducts] = products;

  return (
    <div className="container-padding py-10">
      <SectionHeading
        eyebrow="Sản phẩm"
        title="Điện thoại thông minh"
        subtitle="Khám phá bộ sưu tập smartphone cao cấp mới nhất — tuyển chọn bởi CellZone."
        rightSlot={
          <div className="flex items-center gap-3">
            <span className="text-sm text-softgray">{total} sản phẩm</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="aurora-input w-48 py-2"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-aurora-bg-deep">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mt-10 flex gap-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <GlassCard intensity="med" className="sticky top-24 p-6">
            <h3 className="mb-6 text-lg font-bold uppercase tracking-wider text-warmwhite">
              Bộ lọc
            </h3>

            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-sakura">
                Hãng
              </p>
              <div className="space-y-2">
                {BRAND_FILTERS.map((f) => (
                  <label key={f.value} className="flex cursor-pointer items-center gap-3 group">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        brand === f.value
                          ? "border-sakura bg-sakura/20"
                          : "border-white/15 bg-white/[0.04] group-hover:border-sakura/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={brand === f.value}
                        onChange={() => setParam("brand", brand === f.value ? "" : f.value)}
                        className="sr-only"
                      />
                      {brand === f.value && (
                        <svg className="h-3 w-3 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-sakura">
                Khoảng giá
              </p>
              <div className="space-y-1">
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
                          if (f.min) next.set("priceMin", String(f.min)); else next.delete("priceMin");
                          if (f.max) next.set("priceMax", String(f.max)); else next.delete("priceMax");
                        }
                        setSearchParams(next);
                      }}
                      className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive
                          ? "border border-sakura/50 bg-sakura/15 text-sakura"
                          : "border border-transparent text-softgray hover:bg-white/5 hover:text-warmwhite"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <LoadingSpinner label="Đang tải sản phẩm..." />
          ) : products.length === 0 ? (
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
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-warmwhite">Không có sản phẩm</h3>
              <p className="text-sm text-softgray">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </GlassCard>
          ) : (
            <>
              {bentoProduct && (
                <div className="mb-5">
                  <ProductCard product={bentoProduct} variant="bento" requireAuth />
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gridProducts.map((product) => (
                  <ProductCard key={product.id} product={product} requireAuth />
                ))}
              </div>
            </>
          )}

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