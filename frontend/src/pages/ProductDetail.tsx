import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import type { Product } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";

const SPEC_LABELS: Record<string, string> = {
  "Hệ điều hành": "os",
  "Chipset": "chipset",
  "Bộ nhớ trong": "ram",
  "Loại CPU": "cpu_type",
  "GPU": "gpu",
  "Kích thước màn hình": "screen_size",
  "Công nghệ màn hình": "screen_tech",
  "Độ phân giải màn hình": "screen_res",
  "Camera Sau": "cam_back",
  "Camera trước": "cam_front",
  "Hỗ trợ mạng": "network",
  "Thẻ SIM": "sim",
  "Công nghệ NFC": "nfc",
  "Thời điểm ra mắt": "launch",
  "Pin": "pin",
  "Sạc": "sac",
  "Bảo mật": "bao_mat",
  "RAM": "ram",
  "Thẻ nhớ": "the_nho",
};

function parseSpecValue(specs: string, label: string): string {
  const lines = specs.split("\n").map((l) => l.trim()).filter(Boolean);
  const labelLower = label.toLowerCase();
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.startsWith(labelLower + ":") ||
      lower.startsWith(labelLower + " –") ||
      lower.startsWith(labelLower + " -")
    ) {
      const parts = line.split(/[:–—]/);
      if (parts.length >= 2) {
        return parts.slice(1).join(":").trim();
      }
    }
  }
  return "";
}

function SpecsTable({ specs }: { specs: string }) {
  if (!specs) return null;

  const rows = Object.entries(SPEC_LABELS).map(([label]) => {
    const value = parseSpecValue(specs, label);
    return { label, value };
  }).filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-extrabold text-warmwhite mb-4">Thông số kỹ thuật</h2>
      <div className="rounded-xl border border-gunmetal/60 bg-graphite overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={`border-t border-gunmetal/40 ${i % 2 === 0 ? "bg-charcoal/30" : ""}`}>
                <td className="px-4 py-3 text-steelgray font-medium w-1/2">{row.label}</td>
                <td className="px-4 py-3 text-warmwhite">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface GalleryItem {
  url: string;
  media_type: "image" | "video";
  is_cover: boolean;
  position: number;
}

function ProductGallery({ product }: { product: Product }) {
  // Build a stable ordered list: media if present, else [image_url]
  const items = useMemo<GalleryItem[]>(() => {
    const list: GalleryItem[] = [];
    const seen = new Set<string>();
    if (Array.isArray(product.media) && product.media.length > 0) {
      const sorted = [...product.media].sort(
        (a, b) =>
          (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) ||
          a.position - b.position ||
          a.id - b.id
      );
      for (const m of sorted) {
        if (!seen.has(m.url)) {
          list.push({
            url: m.url,
            media_type: m.media_type,
            is_cover: m.is_cover,
            position: m.position,
          });
          seen.add(m.url);
        }
      }
    }
    if (product.image_url && !seen.has(product.image_url)) {
      list.unshift({ url: product.image_url, media_type: "image", is_cover: true, position: -1 });
    }
    return list;
  }, [product]);

  const [active, setActive] = useState(0);
  if (items.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite text-steelgray">
        Chưa có hình ảnh
      </div>
    );
  }
  const current = items[Math.max(0, Math.min(active, items.length - 1))];

  return (
    <div>
      {/* Main viewer */}
      <div className="relative overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite">
        {current.media_type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            className="aspect-square w-full bg-charcoal object-contain"
          />
        ) : (
          <div className="aspect-square overflow-hidden">
            <img
              key={current.url}
              src={current.url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
        {current.media_type === "video" && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-crimson/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
            Video
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={it.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === active
                  ? "border-crimson ring-2 ring-crimson/30"
                  : "border-gunmetal/60 hover:border-silvergray/40"
              }`}
            >
              {it.media_type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-charcoal text-[10px] font-semibold text-steelgray">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await productsApi.get(Number(id));
      return data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải sản phẩm..." />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mb-4 text-5xl">
          <svg className="mx-auto h-16 w-16 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-warmwhite">Sản phẩm không tồn tại</h2>
        <p className="mt-2 text-steelgray">Sản phẩm này có thể đã bị xóa hoặc không còn bán.</p>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <a href="/" className="hover:text-crimson transition-colors">Trang chủ</a>
        <span>/</span>
        <a href="/" className="hover:text-crimson transition-colors capitalize">{product.tags}</a>
        <span>/</span>
        <span className="text-warmwhite">{product.name}</span>
      </div>

      {/* Top section: image gallery + info side by side */}
      <div className="grid gap-10 lg:grid-cols-2 mb-10">
        <ProductGallery product={product} />

        <div>
          <div className="mb-3">
            <span className="tag-badge">{product.tags}</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-warmwhite leading-tight">{product.name}</h1>

          <div className="mb-6 flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-crimson">
              {new Intl.NumberFormat("vi-VN").format(product.price)}
              <span className="text-lg font-normal text-steelgray"> VND</span>
            </p>
          </div>

          <div className="mb-6 flex items-center gap-2 rounded-lg border border-gunmetal/60 bg-graphite p-3">
            {inStock ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson/10">
                  <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-warmwhite">Còn hàng</p>
                  <p className="text-xs text-steelgray">{product.stock} sản phẩm sẵn sàng</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deeprose/10">
                  <svg className="h-4 w-4 text-deeprose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-deeprose">Hết hàng</p>
                  <p className="text-xs text-steelgray">Liên hệ để đặt trước</p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => addItem(product)}
              disabled={!inStock}
              className="btn-primary flex-1 py-3 text-base disabled:opacity-40"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </button>
            <button className="btn-secondary flex-1 py-3 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Yêu thích
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { text: "Bảo hành 12 tháng" },
              { text: "Đổi trả 7 ngày" },
              { text: "Giao hàng miễn phí" },
              { text: "Trả góp 0%" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-gunmetal/40 bg-charcoal px-3 py-2 text-xs text-steelgray">
                <svg className="h-3.5 w-3.5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Below-image section: Description + Specifications */}
      <div className="mt-4 space-y-8">
        {product.description && (
          <div>
            <h2 className="text-xl font-extrabold text-warmwhite mb-4">Mô tả sản phẩm</h2>
            <div
              className="prose-product max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        <SpecsTable specs={product.specifications || ""} />
      </div>

      {/* Blog content styles */}
      <style>{`
        .prose-product h2 { font-size: 1.5rem; font-weight: 700; color: #F4EFEC; margin: 1.5em 0 0.75em; }
        .prose-product h3 { font-size: 1.2rem; font-weight: 600; color: #F4EFEC; margin: 1.25em 0 0.5em; }
        .prose-product p { color: #C9C4C6; margin: 1em 0; line-height: 1.75; }
        .prose-product ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose-product ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose-product li { margin: 0.4em 0; }
        .prose-product blockquote {
          border-left: 4px solid #D94A63;
          padding-left: 1em;
          color: #C9C4C6;
          margin: 1.5em 0;
          font-style: italic;
        }
        .prose-product code {
          background: #3A2F33;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: monospace;
          color: #F28CA6;
        }
        .prose-product pre {
          background: #3A2F33;
          padding: 1.25em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose-product pre code { background: none; padding: 0; color: #C9C4C6; }
        .prose-product img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5em auto;
          display: block;
        }
        .prose-product video {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5em auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
