import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["Ốp lưng", "Tai nghe", "Sạc dự phòng", "Cáp sạc", "Miếng dán", "Gậy selfie"];
const COMPATIBILITY = ["iPhone", "Samsung", "Xiaomi", "OPPO", "Universal"];
const PRICE_RANGE = [
  { label: "Tất cả", min: 0, max: Infinity },
  { label: "Dưới 100K", min: 0, max: 100000 },
  { label: "100K - 300K", min: 100000, max: 300000 },
  { label: "300K - 500K", min: 300000, max: 500000 },
  { label: "Trên 500K", min: 500000, max: Infinity },
];

export default function Accessories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompatibility, setSelectedCompatibility] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGE[0]);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["accessories-products"],
    queryFn: async () => {
      const { data } = await productsApi.list("accessory");
      return data;
    },
  });

  const filtered = allProducts.filter((p) => {
    if (selectedPrice.min !== 0 && (p.price < selectedPrice.min || p.price > selectedPrice.max)) return false;
    return true;
  });

  const toggleCompat = (c: string) => {
    setSelectedCompatibility((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const Sidebar = () => (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-warmwhite">Danh mục</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className="accent-rose"
              />
              <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-warmwhite">Tương thích</h3>
        <div className="space-y-2">
          {COMPATIBILITY.map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCompatibility.includes(c)}
                onChange={() => toggleCompat(c)}
                className="accent-rose"
              />
              <span className="text-sm text-softgray group-hover:text-warmwhite transition-colors">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-warmwhite">Khoảng giá</h3>
        <div className="space-y-2">
          {PRICE_RANGE.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelectedPrice(p)}
              className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedPrice.label === p.label
                  ? "bg-crimson/10 text-crimson"
                  : "text-softgray hover:bg-gunmetal hover:text-warmwhite"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-px w-8 bg-crimson" />
          <span className="text-xs font-medium uppercase tracking-widest text-crimson">Phụ kiện</span>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-extrabold text-warmwhite">Phụ kiện điện thoại</h1>
          <p className="text-sm text-steelgray">{filtered.length} sản phẩm</p>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setFilterOpen(true)}
          className="btn-secondary w-full justify-center"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 rounded-2xl border border-gunmetal/60 bg-graphite p-5">
            <Sidebar />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <LoadingSpinner label="Đang tải phụ kiện..." />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-16 text-center">
              <h3 className="text-xl font-bold text-warmwhite mb-2">Không có phụ kiện</h3>
              <p className="text-sm text-steelgray">Thử thay đổi bộ lọc.</p>
            </div>
          ) : (
            <>
              {/* Featured first */}
              {filtered[0] && (
                <div className="mb-5">
                  <ProductCard product={filtered[0]} variant="featured" />
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(1).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-charcoal border-l border-gunmetal/40 p-6 overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-warmwhite">Bộ lọc</h3>
              <button onClick={() => setFilterOpen(false)} className="btn-ghost p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Sidebar />
            <button onClick={() => setFilterOpen(false)} className="btn-primary mt-6 w-full">
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
