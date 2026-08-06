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

const PROMO_BANNERS = [
  {
    id: 1,
    title: "iPhone 16 Series",
    subtitle: "Giảm 20%",
    cta: "Mua ngay",
    href: "/products?brand=apple",
    gradient: "from-crimson via-rose to-sakura",
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Samsung Galaxy S25",
    subtitle: "Flash Sale",
    cta: "Xem ngay",
    href: "/products?brand=samsung",
    gradient: "from-blue-700 via-blue-500 to-cyan-500",
    img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80&auto=format&fit=crop",
  },
];

function PromoBannerCard({ banner }: { banner: (typeof PROMO_BANNERS)[number] }) {
  return (
    <a
      href={banner.href}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-aurora sm:min-h-[260px] md:flex-row"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${banner.img}')` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient} opacity-75`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <GlassCard
        intensity="low"
        className="relative z-10 flex flex-1 flex-col justify-end p-7 backdrop-blur-md"
        as="div"
      >
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-xl shadow-lg">
          {banner.subtitle}
        </span>
        <h3 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">{banner.title}</h3>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-200 group-hover:bg-white/20">
          {banner.cta}
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </GlassCard>
    </a>
  );
}

const PRICE_LABEL_MAP: Record<string, string> = {
  "0-5000000": "Dưới 5 triệu",
  "5000000-10000000": "5 - 10 triệu",
  "10000000-20000000": "10 - 20 triệu",
  "20000000-0": "Trên 20 triệu",
};

function ActiveFilterChips({
  brand,
  priceMin,
  priceMax,
  setParam,
}: {
  brand: string;
  priceMin: number;
  priceMax: number;
  setParam: (key: string, value: string) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (brand) {
    const label = BRAND_FILTERS.find((f) => f.value === brand)?.label ?? brand;
    chips.push({ label, onRemove: () => setParam("brand", "") });
  }

  if (priceMin > 0 || priceMax > 0) {
    const key = `${priceMin}-${priceMax}`;
    const label = PRICE_LABEL_MAP[key] ?? `${priceMin > 0 ? `${(priceMin / 1_000_000).toFixed(0)}tr` : ""}${priceMax > 0 ? ` – ${(priceMax / 1_000_000).toFixed(0)}tr` : ""}`;
    chips.push({ label, onRemove: () => setParam("priceMin", "0") });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-softgray">Đang lọc:</span>
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-sakura/40 bg-sakura/10 px-3 py-1 text-xs font-semibold text-sakura backdrop-blur-xl transition-all duration-200 hover:border-sakura/70 hover:bg-sakura/20"
        >
          {chip.label}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
    </div>
  );
}

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
    queryKey: ["products-search", brand, sort, page, search, priceMin, priceMax],
    queryFn: async () => {
      const resp = await productsApi.search({
        brand: brand || undefined,
        sort: sort || undefined,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        price_min: priceMin > 0 ? priceMin : undefined,
        price_max: priceMax > 0 ? priceMax : undefined,
      });
      return resp.data;
    },
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const [bentoProduct, ...gridProducts] = products;

  const hasActiveFilters = Boolean(brand) || priceMin > 0 || priceMax > 0;

  return (
    <div className="container-padding py-10">

      {/* ── Promotional Banner Section ─────────────────────────────── */}
      <section className="mb-10 grid gap-5 sm:grid-cols-2">
        {PROMO_BANNERS.map((banner) => (
          <PromoBannerCard key={banner.id} banner={banner} />
        ))}
      </section>

      {/* ── Section Heading ────────────────────────────────────────── */}
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
              className="aurora-input w-48 cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-warmwhite backdrop-blur-xl transition-all duration-200 hover:border-white/20 focus:border-sakura/50 focus:outline-none focus:ring-2 focus:ring-sakura/20"
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

      {/* ── Active Filter Chips ────────────────────────────────────── */}
      <ActiveFilterChips
        brand={brand}
        priceMin={priceMin}
        priceMax={priceMax}
        setParam={setParam}
      />

      {/* ── Main Layout ───────────────────────────────────────────── */}
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
              <div className="space-y-1.5">
                {BRAND_FILTERS.map((f) => (
                  <label
                    key={f.value}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200 focus-rose hover:bg-white/[0.04]"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200 ${
                        brand === f.value
                          ? "border-sakura bg-sakura/20 shadow-[0_0_8px_rgba(252,85,116,0.35)]"
                          : "border-white/15 bg-white/[0.04] group-hover:border-sakura/50 group-hover:shadow-[0_0_6px_rgba(252,85,116,0.2)]"
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
                    <span className="text-sm text-softgray transition-colors duration-200 group-hover:text-warmwhite">
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
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 focus-rose ${
                        isActive
                          ? "border border-sakura/50 bg-sakura/15 text-sakura shadow-[0_0_8px_rgba(252,85,116,0.2)]"
                          : "border border-transparent text-softgray hover:bg-white/5 hover:text-warmwhite hover:shadow-[0_0_6px_rgba(255,255,255,0.06)]"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("brand");
                  next.delete("priceMin");
                  next.delete("priceMax");
                  next.delete("page");
                  setSearchParams(next);
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-softgray transition-all duration-200 hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa bộ lọc
              </button>
            )}
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

          {totalPages > 1 && products.length > 0 && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setParam("page", String(p))}
                baseUrl="/products"
                searchParams={searchParams}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
