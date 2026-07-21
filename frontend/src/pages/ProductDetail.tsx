import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi, ratingsApi, likesApi } from "../api/client";
import type { Product, RatingSummary, LikeStatus } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";
import StarRating from "../components/aurora/StarRating";
import HeartButton from "../components/aurora/HeartButton";
import { useCart } from "../context/CartContext";
import { useCartFly } from "../context/CartFlyContext";
import { useAuth } from "../context/AuthContext";

const SPEC_LABELS: Record<string, string> = {
  "Hệ điều hành": "os",
  Chipset: "chipset",
  "Bộ nhớ trong": "ram",
  "Loại CPU": "cpu_type",
  GPU: "gpu",
  "Kích thước màn hình": "screen_size",
  "Công nghệ màn hình": "screen_tech",
  "Độ phân giải màn hình": "screen_res",
  "Camera Sau": "cam_back",
  "Camera trước": "cam_front",
  "Hỗ trợ mạng": "network",
  "Thẻ SIM": "sim",
  "Công nghệ NFC": "nfc",
  "Thời điểm ra mắt": "launch",
  Pin: "pin",
  Sạc: "sac",
  "Bảo mật": "bao_mat",
  RAM: "ram",
  "Thẻ nhớ": "the_nho",
};

function parseSpecValue(specs: string, label: string): string {
  const lines = specs.split("\n").map((l) => l.trim()).filter(Boolean);
  const labelLower = label.toLowerCase();
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith(labelLower + ":") || lower.startsWith(labelLower + " -")) {
      const parts = line.split(/[:]/);
      if (parts.length >= 2) {
        return parts.slice(1).join(":").trim();
      }
    }
  }
  return "";
}

type Tab = "mota" | "thongso";
type GalleryItem = { url: string; media_type: "image" | "video" };

// ── Product Gallery ──────────────────────────────────────────────
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function ProductGallery({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxActive, setLightboxActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

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
          list.push({ url: m.url, media_type: m.media_type });
          seen.add(m.url);
        }
      }
    }
    if (product.image_url && !seen.has(product.image_url)) {
      list.unshift({ url: product.image_url, media_type: "image" });
    }
    return list;
  }, [product]);

  const safeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
  const current = items[safeIndex] ?? null;

  // Auto-redirect: advance every 4500ms unless paused.
  useEffect(() => {
    if (items.length <= 1) return;
    if (reducedMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (lightboxOpen) return;
      if (isHovered) return;
      // If the active item is a video, don't skip away from it.
      const it = items[safeIndex];
      if (it && it.media_type === "video") return;
      setActiveIndex((i) => (i + 1) % items.length);
    };

    timer = setInterval(tick, 4500);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [items, safeIndex, isHovered, lightboxOpen, reducedMotion]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight")
        setLightboxActive((i) => (i + 1) % items.length);
      else if (e.key === "ArrowLeft")
        setLightboxActive((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, items.length]);

  const onStageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || !current || current.media_type !== "image") return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleThumbClick = (i: number) => {
    setActiveIndex(i);
    setZoomPos(null);
  };

  if (items.length === 0) {
    return (
      <GlassCard className="flex aspect-square items-center justify-center" intensity="med">
        <p className="text-softgray">Chưa có hình ảnh</p>
      </GlassCard>
    );
  }

  return (
    <div>
      {/* Main stage */}
      <div
        ref={stageRef}
        className="group relative w-full overflow-hidden rounded-aurora border border-white/10 bg-aurora-bg-mid shadow-glow-soft aspect-square"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setZoomPos(null);
        }}
        onMouseMove={onStageMove}
        onClick={() => {
          setLightboxActive(safeIndex);
          setLightboxOpen(true);
        }}
      >
        {current?.media_type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ pointerEvents: "none" }}
          />
        ) : (
          <img
            key={current?.url}
            src={current?.url}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          />
        )}

        {/* Zoom overlay — only when on an image. z-20 keeps it above the video element. */}
        {current?.media_type === "image" && zoomPos && (
          <div
            aria-hidden
            className="gallery-zoom-layer pointer-events-none absolute inset-0 z-20"
            style={{
              backgroundImage: `url(${current.url})`,
              backgroundSize: "200%",
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: "no-repeat",
              transition: "opacity 200ms ease",
            }}
          />
        )}

        {/* Bottom-center pill for video (click-to-unmute hint, not a native control). */}
        {current?.media_type === "video" && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
            <span className="rounded-full border border-white/20 bg-charcoal/70 px-3 py-1 text-[11px] font-medium text-warmwhite backdrop-blur-md">
              ▶ Click để xem toàn màn hình
            </span>
          </div>
        )}

        {/* Image-mode hint */}
        {current?.media_type === "image" && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full border border-white/20 bg-charcoal/70 px-3 py-1 text-[11px] font-medium text-warmwhite backdrop-blur-md">
              🔍 Hover để phóng to · Click để xem toàn màn hình
            </span>
          </div>
        )}

        {current?.media_type === "video" && (
          <div className="absolute left-4 top-4 z-30">
            <AuroraBadge tone="rose" glow>
              Video
            </AuroraBadge>
          </div>
        )}

        {product.tags && (
          <div className="absolute right-4 top-4 z-30">
            <AuroraBadge tone="rose" glow>
              {product.tags}
            </AuroraBadge>
          </div>
        )}

        {/* Dots pagination */}
        {items.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 z-30 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThumbClick(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {items.map((it, i) => (
            <button
              key={it.url + i}
              type="button"
              onClick={() => handleThumbClick(i)}
              aria-label={`Xem ${it.media_type === "video" ? "video" : "ảnh"} ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 ${
                i === safeIndex
                  ? "border-sakura shadow-[0_0_0_1px_rgba(242,140,166,0.4),0_10px_24px_-10px_rgba(242,140,166,0.5)]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {it.media_type === "video" ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-aurora-bg-mid gap-1">
                  <svg className="h-5 w-5 text-sakura" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-[9px] text-softgray">Video</span>
                </div>
              ) : (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && items[lightboxActive] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-aurora-bg-deep/90 backdrop-blur-2xl"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng"
            className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-warmwhite transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxActive((i) => (i - 1 + items.length) % items.length);
                }}
                aria-label="Ảnh trước"
                className="absolute left-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-warmwhite transition hover:bg-white/20"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxActive((i) => (i + 1) % items.length);
                }}
                aria-label="Ảnh sau"
                className="absolute right-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-warmwhite transition hover:bg-white/20"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          {items[lightboxActive].media_type === "video" ? (
            <video
              key={items[lightboxActive].url}
              src={items[lightboxActive].url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              className="max-h-[85vh] max-w-[90vw] rounded-aurora object-contain"
              style={{ pointerEvents: "none" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={items[lightboxActive].url}
              alt={product.name}
              className="max-h-[85vh] max-w-[90vw] rounded-aurora object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxActive(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === lightboxActive ? "w-6 bg-sakura" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rating + Like panel ───────────────────────────────────────────
function RatingAndLike({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const ratingQuery = useQuery({
    queryKey: ["product-rating", product.id],
    queryFn: async () => {
      const { data } = await ratingsApi.get(product.id);
      return data as RatingSummary;
    },
  });

  const likeQuery = useQuery({
    queryKey: ["product-like", product.id],
    queryFn: async () => {
      const { data } = await likesApi.get(product.id);
      return data as LikeStatus;
    },
  });

  const ratingMutation = useMutation({
    mutationFn: (stars: number) => ratingsApi.upsert(product.id, { stars }),
    onSuccess: (res) => {
      queryClient.setQueryData(["product-rating", product.id], res.data);
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      setToast("Đã lưu đánh giá của bạn");
      setTimeout(() => setToast(null), 2200);
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => likesApi.toggle(product.id),
    onMutate: async () => {
      const prev = queryClient.getQueryData<LikeStatus>(["product-like", product.id]);
      if (prev) {
        const next: LikeStatus = {
          liked: !prev.liked,
          count: prev.count + (prev.liked ? -1 : 1),
        };
        queryClient.setQueryData(["product-like", product.id], next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["product-like", product.id], ctx.prev);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["product-like", product.id], res.data);
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    },
  });

  const handleRate = (stars: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    ratingMutation.mutate(stars);
  };

  const handleLike = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    likeMutation.mutate();
  };

  const summary = ratingQuery.data;
  const likeStatus = likeQuery.data;

  return (
    <GlassCard intensity="med" className="space-y-4 p-5">
      <div>
        <div className="flex items-center gap-2">
          <StarRating
            value={summary?.avg ?? product.avg_rating ?? 0}
            readonly
            size="md"
          />
          <span className="text-sm text-softgray">
            {(summary?.avg ?? product.avg_rating ?? 0).toFixed(1)} ·{" "}
            {summary?.count ?? product.rating_count ?? 0} đánh giá
          </span>
        </div>
      </div>

      <div className="aurora-divider" />

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-softgray">
          Đánh giá của bạn
        </p>
        {user ? (
          <StarRating
            value={summary?.my_rating ?? 0}
            onChange={handleRate}
            size="lg"
          />
        ) : (
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-sm aurora-text-rainbow underline-offset-2 hover:underline"
          >
            Đăng nhập để đánh giá
          </button>
        )}
      </div>

      <div className="aurora-divider" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-warmwhite">Yêu thích</p>
          <p className="text-xs text-softgray">
            Lưu sản phẩm để mua sau
          </p>
        </div>
        <HeartButton
          liked={likeStatus?.liked ?? false}
          count={likeStatus?.count ?? product.like_count ?? 0}
          loading={likeMutation.isPending}
          onToggle={handleLike}
          size="lg"
          showLabel
        />
      </div>

      {toast && (
        <div className="rounded-xl border border-aurora-mint/30 bg-aurora-mint/10 px-3 py-2 text-sm text-aurora-mint">
          {toast}
        </div>
      )}
    </GlassCard>
  );
}

// ── Specs table ───────────────────────────────────────────────────
function SpecsTable({ specs }: { specs: string }) {
  const rows = Object.entries(SPEC_LABELS)
    .map(([label]) => ({ label, value: parseSpecValue(specs, label) }))
    .filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="divide-y divide-white/5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-3.5">
          <span className="text-sm text-softgray">{row.label}</span>
          <span className="max-w-[60%] text-right text-sm font-medium text-warmwhite">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { flyToCart } = useCartFly();
  const [activeTab, setActiveTab] = useState<Tab>("mota");
  const [quantity, setQuantity] = useState(1);
  const addToCartBtnRef = useRef<HTMLButtonElement | null>(null);

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
        <GlassCard intensity="high" className="mx-auto max-w-md p-12" glow>
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-aurora-bg-mid">
              <svg className="h-12 w-12 text-softgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="aurora-text-gradient mb-2 text-2xl font-extrabold">
            Sản phẩm không tồn tại
          </h2>
          <p className="mb-8 text-softgray">
            Sản phẩm này có thể đã bị xóa hoặc không còn bán.
          </p>
          <GlowButton variant="primary" onClick={() => navigate("/")}>
            Quay lại trang chủ
          </GlowButton>
        </GlassCard>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const stockPercent = inStock ? Math.min((product.stock / 50) * 100, 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-softgray">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 transition-colors hover:text-sakura">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Trang chủ
        </button>
        <svg className="h-4 w-4 text-softgray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <button onClick={() => navigate("/")} className="capitalize transition-colors hover:text-sakura">
          {product.tags}
        </button>
        <svg className="h-4 w-4 text-softgray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="max-w-[200px] truncate font-medium text-softgray">{product.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="mb-16 grid items-start gap-10 lg:grid-cols-[1fr_480px]">
        {/* Left: Gallery */}
        <div>
          <ProductGallery product={product} />
        </div>

        {/* Right: Product Info */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Header */}
          <div>
            {product.tags && (
              <div className="mb-3 flex items-center gap-2">
                <AuroraBadge tone="rose" glow>{product.tags}</AuroraBadge>
                <span className="text-xs text-softgray">
                  / Mã: #{product.id.toString().padStart(4, "0")}
                </span>
              </div>
            )}
            <h1 className="aurora-text-gradient mb-5 text-3xl font-extrabold leading-tight lg:text-4xl">
              {product.name}
            </h1>

            <div className="mb-6 flex items-center gap-3">
              <StarRating value={product.avg_rating ?? 0} readonly size="sm" />
              <span className="text-sm text-softgray">
                {(product.avg_rating ?? 0).toFixed(1)} ·{" "}
                {product.rating_count ?? 0} đánh giá
              </span>
            </div>

            {/* Price */}
            <GlassCard intensity="med" className="mb-5 p-5">
              <div className="flex items-baseline gap-3">
                <span className="aurora-text-rainbow text-4xl font-black">
                  {new Intl.NumberFormat("vi-VN").format(product.price)}
                </span>
                <span className="text-base font-medium text-softgray">VND</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-softgray">
                <svg className="h-4 w-4 text-aurora-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đã bao gồm VAT
              </div>
            </GlassCard>

            {/* Stock */}
            <GlassCard intensity="low" className="mb-5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      inStock ? "bg-aurora-mint animate-pulse-glow" : "bg-lightpink"
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      inStock ? "text-aurora-mint" : "text-lightpink"
                    }`}
                  >
                    {inStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>
                <span className="text-sm text-softgray">{product.stock} sản phẩm</span>
              </div>
              {inStock && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-aurora-bg-deep">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-lightpink to-rose transition-all duration-500"
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              )}
            </GlassCard>
          </div>

          {/* Rating + Like */}
          <RatingAndLike product={product} />

          {/* Quantity + Add to Cart */}
          <GlassCard intensity="med" className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-softgray">Số lượng</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-aurora border border-white/10 bg-aurora-bg-deep">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-lg font-light text-warmwhite transition-colors hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-base font-semibold text-warmwhite">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="flex h-11 w-11 items-center justify-center text-lg font-light text-warmwhite transition-colors hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-softgray">
                  Tổng:{" "}
                  <span className="aurora-text-rainbow font-semibold">
                    {new Intl.NumberFormat("vi-VN").format(product.price * quantity)}
                  </span>{" "}
                  ₫
                </span>
              </div>
            </div>

            <GlowButton
              ref={addToCartBtnRef}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!inStock}
              onClick={() => {
                // Launch the flying icon BEFORE navigating so the source
                // rect (the button) is still mounted and the animation
                // has somewhere to start from. The flight portal lives
                // at document.body so it survives the route change.
                flyToCart(addToCartBtnRef.current, product.image_url);
                addItem(product.id, quantity);
                navigate("/cart");
              }}
              leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            >
              {inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </GlowButton>

            <div className="grid grid-cols-2 gap-2 text-xs text-softgray">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <svg className="h-4 w-4 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0 0h-3.75m3.75 0h3.75M16.5 18.75V9M3.375 14.25h.007m12.993 0h.007" />
                </svg>
                Giao hàng nhanh
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <svg className="h-4 w-4 text-aurora-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                Bảo hành chính hãng
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Tabs */}
      <GlassCard intensity="med" className="overflow-hidden p-0">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("mota")}
            className={`relative flex-1 px-6 py-4 text-sm font-semibold transition-colors sm:flex-none sm:px-8 ${
              activeTab === "mota" ? "text-warmwhite" : "text-softgray hover:text-warmwhite"
            }`}
          >
            Mô tả sản phẩm
            {activeTab === "mota" && (
              <span className="aurora-shimmer absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("thongso")}
            className={`relative flex-1 px-6 py-4 text-sm font-semibold transition-colors sm:flex-none sm:px-8 ${
              activeTab === "thongso" ? "text-warmwhite" : "text-softgray hover:text-warmwhite"
            }`}
          >
            Thông số kỹ thuật
            {activeTab === "thongso" && (
              <span className="aurora-shimmer absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
            )}
          </button>
        </div>
        <div className="p-6 sm:p-8">
          {activeTab === "mota" ? (
            product.description ? (
              <div
                className="prose-aurora product-description"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-softgray">Chưa có mô tả chi tiết.</p>
            )
          ) : (
            <SpecsTable specs={product.specifications ?? ""} />
          )}
        </div>
      </GlassCard>
    </div>
  );
}
