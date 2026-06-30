import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import LoadingSpinner from "./LoadingSpinner";
import ProductCard from "./ProductCard";

const BRAND_FILTERS = [
  { label: "Tất cả", value: null },
  { label: "iPhone", value: "iphone" },
  { label: "Samsung", value: "samsung" },
  { label: "Xiaomi", value: "xiaomi" },
  { label: "Android", value: "android" },
  { label: "Flagship", value: "flagship" },
  { label: "Budget", value: "budget" },
  { label: "5G", value: "5g" },
  { label: "Gaming", value: "gaming" },
];

export default function ProductGrid() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await productsApi.list();
      return data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!selectedTag) return products;
    return products.filter((product) => product.tag === selectedTag);
  }, [products, selectedTag]);

  if (isLoading) {
    return <LoadingSpinner label="Đang tải sản phẩm..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-deeprose/30 bg-deeprose/10 p-6 text-center text-rose">
        Không thể tải sản phẩm. Vui lòng kiểm tra server.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-sm text-steelgray">Lọc:</span>
        <div className="flex items-center gap-1.5">
          {BRAND_FILTERS.map((f) => (
            <button
              key={f.value ?? "all"}
              onClick={() => setSelectedTag(f.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedTag === f.value
                  ? "bg-crimson text-white shadow-md shadow-crimson/30"
                  : "border border-gunmetal/60 bg-graphite text-softgray hover:border-silvergray hover:text-warmwhite"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-gunmetal/60 bg-graphite p-12 text-center">
          <div className="mb-3 text-4xl">
            <svg className="mx-auto h-12 w-12 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-steelgray">Chưa có sản phẩm nào. Vui lòng thêm từ dashboard.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
