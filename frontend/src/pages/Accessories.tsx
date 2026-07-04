import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

// Each accessory falls into a "category" keyword that we look for in product.tags.
// e.g. an "Ốp lưng" tag matches the "ốp" keyword in our accessory data.
const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Ốp lưng", keywords: ["ốp", "op", "case"] },
  { label: "Tai nghe", keywords: ["tai nghe", "earphone", "earbud", "airpod"] },
  { label: "Sạc dự phòng", keywords: ["sạc dự phòng", "power bank", "powerbank"] },
  { label: "Cáp sạc", keywords: ["cáp", "cable", "dây sạc"] },
  { label: "Miếng dán", keywords: ["miếng dán", "cường lực", "kính"] },
  { label: "Gậy selfie", keywords: ["gậy", "selfie"] },
];
const COMPATIBILITY = ["iPhone", "Samsung", "Xiaomi", "OPPO", "Universal"];
const PRICE_RANGE = [
  { label: "Tất cả", min: 0, max: Infinity },
  { label: "Dưới 100K", min: 0, max: 100000 },
  { label: "100K - 300K", min: 100000, max: 300000 },
  { label: "300K - 500K", min: 300000, max: 500000 },
  { label: "Trên 500K", min: 500000, max: Infinity },
];

function matchesCategory(tags: string, cat: { keywords: string[] }) {
  const t = tags.toLowerCase();
  return cat.keywords.some((k) => t.includes(k));
}

function matchesCompat(tags: string, c: string) {
  const t = tags.toLowerCase();
  if (c === "Universal") return true; // universal is the safe fallback
  return t.includes(c.toLowerCase());
}

export default function Accessories() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompatibility, setSelectedCompatibility] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGE[0]);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["accessories-products"],
    queryFn: async () => {
      const { data } = await productsApi.list("accessory");
      return data.filter((p) => p.tags.toLowerCase().includes("accessory"));
    },
  });

  // Each filter is applied in this pipeline. An empty filter array means "no
  // filter on this dimension" (do not restrict).
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      // Price
      if (selectedPrice.min !== 0) {
        if (p.price < selectedPrice.min || p.price > selectedPrice.max) return false;
      }
      // Category (OR within the same group: any chosen bucket matches)
      if (selectedCategories.length > 0) {
        const cats = CATEGORIES.filter((c) => selectedCategories.includes(c.label));
        const ok = cats.some((c) => matchesCategory(p.tags, c));
        if (!ok) return false;
      }
      // Compatibility (OR within the group)
      if (selectedCompatibility.length > 0) {
        const ok = selectedCompatibility.some((c) => matchesCompat(p.tags, c));
        if (!ok) return false;
      }
      return true;
    });
  }, [allProducts, selectedCategories, selectedCompatibility, selectedPrice]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const toggleCompat = (c: string) => {
    setSelectedCompatibility((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedCompatibility([]);
    setSelectedPrice(PRICE_RANGE[0]);
  };

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedCompatibility.length > 0 ||
    selectedPrice !== PRICE_RANGE[0];

  const FilterChips = () => {
    const total = selectedCategories.length + selectedCompatibility.length;
    return total > 0 ? (
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-softgray">
        <span>Đang lọc:</span>
        {[...selectedCategories, ...selectedCompatibility].map((f) => (
          <button
            key={f}
            onClick={() => {
              if (selectedCategories.includes(f)) toggleCategory(f);
              else toggleCompat(f);
            }}
            className="rounded-full bg-rose/15 px-3 py-1 text-rose hover:bg-rose/25 transition-colors"
          >
            {f} ×
          </button>
        ))}
        <button
          onClick={clearAll}
          className="rounded-full border border-gunmetal/60 px-3 py-1 text-softgray hover:text-warmwhite transition-colors"
        >
          Xóa hết
        </button>
      </div>
    ) : null;
  };

  const Sidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-softgray">
          Danh mục
        </h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.label} className="flex cursor-pointer items-center gap-3 group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.label)}
                onChange={() => toggleCategory(cat.label)}
                className="h-4 w-4 accent-rose"
              />
              <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-softgray">
          Tương thích
        </h3>
        <div className="space-y-2">
          {COMPATIBILITY.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-3 group">
              <input
                type="checkbox"
                checked={selectedCompatibility.includes(c)}
                onChange={() => toggleCompat(c)}
                className="h-4 w-4 accent-rose"
              />
              <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">
                {c}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-softgray">
          Khoảng giá
        </h3>
        <div className="space-y-2">
          {PRICE_RANGE.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelectedPrice(p)}
              className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedPrice.label === p.label
                  ? "bg-rose/15 text-rose"
                  : "text-softgray hover:bg-gunmetal hover:text-warmwhite"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Split: first product bento, rest standard
  const [bentoProduct, ...gridProducts] = filtered;

  return (
    <div className="container-padding py-10">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px w-10 bg-crimson" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">
              Phụ kiện
            </span>
          </div>
          <h1 className="mb-2 text-4xl font-extrabold text-warmwhite">Phụ kiện điện thoại</h1>
          <p className="text-sm text-softgray">
            Nâng tầm trải nghiệm di động với phụ kiện chính hãng.
          </p>
        </div>
        <p className="text-sm text-softgray">
          {filtered.length} / {allProducts.length} sản phẩm
        </p>
      </div>

      <FilterChips />

      {/* Mobile filter button */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setFilterOpen(true)}
          className="btn-secondary w-full justify-center"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc {hasFilters ? `(${selectedCategories.length + selectedCompatibility.length + (selectedPrice !== PRICE_RANGE[0] ? 1 : 0)})` : ""}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-bento border border-rose/20 bg-cardtint/60 p-6 backdrop-blur-sm">
            <Sidebar />
            {hasFilters && (
              <button
                onClick={clearAll}
                className="mt-6 w-full rounded-lg border border-gunmetal/60 bg-gunmetal/40 py-2 text-sm text-softgray hover:text-warmwhite transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <LoadingSpinner label="Đang tải phụ kiện..." />
          ) : filtered.length === 0 ? (
            <div className="rounded-showcase border border-rose/20 bg-cardtint/60 p-16 text-center backdrop-blur-sm">
              <h3 className="mb-2 text-xl font-bold text-warmwhite">Không có phụ kiện</h3>
              <p className="text-sm text-softgray">
                {hasFilters ? "Thử thay đổi bộ lọc." : "Hãy quay lại sau."}
              </p>
              {hasFilters && (
                <button onClick={clearAll} className="btn-secondary mt-4">
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Bento featured */}
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
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto border-l border-rose/20 bg-cardtint p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-warmwhite">Bộ lọc</h3>
              <button onClick={() => setFilterOpen(false)} className="btn-ghost p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Sidebar />
            <button
              onClick={() => setFilterOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Áp dụng ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}