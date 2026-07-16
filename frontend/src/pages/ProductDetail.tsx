import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      lower.startsWith(labelLower + " -")
    ) {
      const parts = line.split(/[:]/);
      if (parts.length >= 2) {
        return parts.slice(1).join(":").trim();
      }
    }
  }
  return "";
}

type Tab = "mota" | "thongso";

function SpecsTable({ specs }: { specs: string }) {
  const rows = Object.entries(SPEC_LABELS).map(([label]) => {
    const value = parseSpecValue(specs, label);
    return { label, value };
  }).filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="divide-y divide-gunmetal/50">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-3.5">
          <span className="text-sm text-steelgray">{row.label}</span>
          <span className="text-sm font-medium text-warmwhite">{row.value}</span>
        </div>
      ))}
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [active, setActive] = useState(0);

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
          list.push({ url: m.url, media_type: m.media_type, is_cover: m.is_cover, position: m.position });
          seen.add(m.url);
        }
      }
    }
    if (product.image_url && !seen.has(product.image_url)) {
      list.unshift({ url: product.image_url, media_type: "image", is_cover: true, position: -1 });
    }
    return list;
  }, [product]);

  if (items.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-graphite border border-gunmetal/40 text-steelgray text-sm">
        Chưa có hình ảnh
      </div>
    );
  }

  const current = items[Math.max(0, Math.min(active, items.length - 1))];

  return (
    <>
      {/* Main image */}
      <div className="relative group">
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative w-full overflow-hidden rounded-2xl bg-graphite border border-gunmetal/40 aspect-square block cursor-zoom-in"
        >
          {current.media_type === "video" ? (
            <video
              key={current.url}
              src={current.url}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              key={current.url}
              src={current.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
            <span className="text-white text-sm font-medium flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6" />
                <path d="M8 11h6" />
              </svg>
              Phóng to
            </span>
          </div>
          {current.media_type === "video" && (
            <div className="absolute top-4 left-4 z-10 rounded-full bg-crimson/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white shadow-lg flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Video
            </div>
          )}
          {product.tags && (
            <div className="absolute top-4 right-4 z-10">
              <span className="product-tag">{product.tags}</span>
            </div>
          )}
        </button>
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {items.map((it, i) => (
            <button
              key={it.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === active
                  ? "border-crimson shadow-lg shadow-crimson/30"
                  : "border-gunmetal/40 hover:border-silvergray/60"
              }`}
            >
              {it.media_type === "video" ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-charcoal gap-1">
                  <svg className="h-5 w-5 text-steelgray" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-[9px] text-steelgray">Video</span>
                </div>
              ) : (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              )}
              {i === active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimson" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-graphite/80 border border-gunmetal/60 text-steelgray hover:text-warmwhite transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev - 1 + items.length) % items.length); }}
                className="absolute left-5 flex h-12 w-12 items-center justify-center rounded-full bg-graphite/80 border border-gunmetal/60 text-steelgray hover:text-warmwhite transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev + 1) % items.length); }}
                className="absolute right-5 flex h-12 w-12 items-center justify-center rounded-full bg-graphite/80 border border-gunmetal/60 text-steelgray hover:text-warmwhite transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <img
            src={items[active].url}
            alt={product.name}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-crimson" : "w-2 bg-steelgray/50"}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>("mota");
  const [quantity, setQuantity] = useState(1);

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
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-graphite border border-gunmetal/40">
            <svg className="h-12 w-12 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-warmwhite mb-2">Sản phẩm không tồn tại</h2>
        <p className="text-steelgray mb-8">Sản phẩm này có thể đã bị xóa hoặc không còn bán.</p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const stockPercent = inStock ? Math.min((product.stock / 50) * 100, 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-steelgray mb-8">
        <button onClick={() => navigate("/")} className="hover:text-crimson transition-colors flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Trang chủ
        </button>
        <svg className="h-4 w-4 text-gunmetal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <button onClick={() => navigate("/")} className="hover:text-crimson transition-colors capitalize">
          {product.tags}
        </button>
        <svg className="h-4 w-4 text-gunmetal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-softgray font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="grid gap-10 lg:grid-cols-[1fr_480px] items-start mb-16">
        {/* Left: Gallery */}
        <div>
          <ProductGallery product={product} />
        </div>

        {/* Right: Product Info — sticky on desktop */}
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Header */}
          <div>
            {product.tags && (
              <div className="flex items-center gap-2 mb-3">
                <span className="tag-badge">{product.tags}</span>
                <span className="text-xs text-steelgray">/ Mã: #{product.id.toString().padStart(4, "0")}</span>
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-warmwhite leading-tight mb-5">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-steelgray">5.0 · 0 đánh giá</span>
            </div>

            {/* Price */}
            <div className="bg-graphite/60 rounded-2xl border border-gunmetal/40 p-5 mb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-crimson">
                  {new Intl.NumberFormat("vi-VN").format(product.price)}
                </span>
                <span className="text-base text-steelgray font-medium">VND</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-steelgray">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đã bao gồm VAT
              </div>
            </div>

            {/* Stock */}
            <div className="bg-graphite/40 rounded-xl border border-gunmetal/40 p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${inStock ? "bg-emerald-400 animate-pulse" : "bg-deeprose"}`} />
                  <span className={`text-sm font-semibold ${inStock ? "text-emerald-400" : "text-deeprose"}`}>
                    {inStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>
                <span className="text-sm text-steelgray">{product.stock} sản phẩm</span>
              </div>
              {inStock && (
                <div className="w-full bg-charcoal rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-crimson to-rose"
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="bg-graphite/60 rounded-2xl border border-gunmetal/40 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-softgray mb-2">Số lượng</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gunmetal/60 bg-charcoal rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-11 w-11 flex items-center justify-center text-warmwhite hover:bg-gunmetal transition-colors text-lg font-light"
                  >
                    -
                  </button>
                  <span className="h-11 w-14 flex items-center justify-center text-base font-semibold text-warmwhite border-x border-gunmetal/40">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="h-11 w-11 flex items-center justify-center text-warmwhite hover:bg-gunmetal transition-colors text-lg font-light"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-steelgray">
                  Còn {product.stock} sản phẩm
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => addItem(product.id, quantity)}
                disabled={!inStock}
                className="btn-primary flex-1 py-3.5 text-base disabled:opacity-50 shadow-lg shadow-crimson/20 hover:shadow-crimson/40 transition-shadow"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
              </button>
              <button
                onClick={() => navigate("/checkout")}
                disabled={!inStock}
                className="btn-primary flex-1 py-3.5 text-base disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #D94A63 0%, #A82F49 100%)" }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Mua ngay
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-1">
              <button className="flex items-center gap-1.5 text-sm text-steelgray hover:text-sakura transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Yêu thích
              </button>
              <div className="h-4 w-px bg-gunmetal/60" />
              <button className="flex items-center gap-1.5 text-sm text-steelgray hover:text-sakura transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Chia sẻ
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "12T", text: "Bảo hành 12 tháng" },
              { icon: "7N", text: "Đổi trả 7 ngày" },
              { icon: "FT", text: "Giao hàng miễn phí" },
              { icon: "0%", text: "Trả góp 0%" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2.5 rounded-xl border border-gunmetal/40 bg-graphite/40 px-3.5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-crimson/10 text-xs font-bold text-crimson">
                  {b.icon}
                </span>
                <span className="text-xs text-softgray font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Delivery Info */}
          <div className="rounded-2xl border border-gunmetal/40 bg-graphite/40 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-warmwhite mb-1">Thông tin giao hàng</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-warmwhite">Giao hàng toàn quốc</p>
                  <p className="text-xs text-steelgray">2-5 ngày làm việc</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-gold mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm text-warmwhite">Cam kết chính hãng 100%</p>
                  <p className="text-xs text-steelgray">Hàng mới, nguyên seal</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-crimson mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="text-sm text-warmwhite">Giao nhanh 2h trong nội thành</p>
                  <p className="text-xs text-steelgray">Áp dụng TP.HCM, Hà Nội</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description / Specs */}
      <div className="border-t border-gunmetal/40 pt-8 mb-8">
        <div className="flex gap-1 bg-graphite/60 rounded-xl p-1 border border-gunmetal/40 w-fit mb-8">
          {[
            { key: "mota", label: "Mô tả sản phẩm" },
            { key: "thongso", label: "Thông số kỹ thuật" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-crimson text-white shadow-lg shadow-crimson/30"
                  : "text-steelgray hover:text-warmwhite hover:bg-gunmetal/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "mota" && product.description && (
          <div className="max-w-4xl">
            <div
              className="prose-product"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {activeTab === "thongso" && (
          <div className="max-w-3xl">
            <SpecsTable specs={product.specifications || ""} />
          </div>
        )}

        {activeTab === "mota" && !product.description && (
          <p className="text-steelgray text-sm">Sản phẩm này chưa có mô tả.</p>
        )}
      </div>

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
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #2A2024; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #8A858A; border-radius: 2px; }
      `}</style>
    </div>
  );
}
