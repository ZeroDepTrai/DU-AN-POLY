import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useCartFly } from "../context/CartFlyContext";
import { useAuth } from "../context/AuthContext";
import OptimizedImage from "../components/OptimizedImage";

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

type Tab = "mota" | "thongso" | "danhgia";
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

  useEffect(() => {
    if (items.length <= 1) return;
    if (reducedMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (lightboxOpen) return;
      if (isHovered) return;
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
      <GlassCard className="mx-auto flex aspect-[4/3] w-full max-w-[560px] items-center justify-center lg:mx-0" intensity="med">
        <p className="text-softgray">Chưa có hình ảnh</p>
      </GlassCard>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] lg:mx-0">
      {/* Main stage — clickable for lightbox */}
      <div
        ref={stageRef}
        className="group relative aspect-[4/3] max-h-[480px] w-full cursor-zoom-in overflow-hidden rounded-aurora border border-white/[0.06] bg-aurora-bg-mid shadow-glow-soft"
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
            className="absolute inset-0 h-full w-full object-contain"
            style={{ pointerEvents: "none" }}
          />
        ) : (
          <OptimizedImage
            key={current?.url}
            src={current?.url ?? product.image_url}
            alt={product.name}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            width={1200}
            height={1200}
            className="absolute inset-0 h-full w-full object-contain p-5 transition-opacity duration-500 sm:p-7"
          />
        )}

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

        {current?.media_type === "video" && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
            <span className="rounded-full border border-white/20 bg-charcoal/70 px-3 py-1 text-[11px] font-medium text-warmwhite backdrop-blur-md">
              ▶ Click để xem toàn màn hình
            </span>
          </div>
        )}

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

      {/* Thumbnail strip */}
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
                  : "border-white/[0.06] hover:border-white/30"
              }`}
            >
              {it.media_type === "video" ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-aurora-bg-mid">
                  <svg className="h-5 w-5 text-sakura" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-[9px] text-softgray">Video</span>
                </div>
              ) : (
                <OptimizedImage src={it.url} alt="" sizes="80px" width={80} height={80} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
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

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.06] bg-aurora-bg-mid">
          <svg className="h-8 w-8 text-softgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-softgray">Chưa có thông số kỹ thuật cho sản phẩm này.</p>
      </div>
    );
  }

  return (
    <GlassCard intensity="low" className="overflow-hidden p-0">
      <table className="w-full">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={`flex items-center justify-between transition-colors ${
                i % 2 === 0
                  ? "bg-white/[0.02]"
                  : "bg-transparent"
              }`}
            >
              <td className="w-1/2 px-5 py-3.5 text-sm text-softgray">{row.label}</td>
              <td className="w-1/2 px-5 py-3.5 text-right text-sm font-medium text-warmwhite">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

// ── Inventory Status Badge ────────────────────────────────────────
function StockStatusBadge({ stock }: { stock: number }) {
  const inStock = stock > 0;
  const isLowStock = stock > 0 && stock <= 10;

  if (!inStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-lightpink/30 bg-lightpink/10 px-3.5 py-1.5 text-xs font-semibold text-lightpink backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-lightpink" />
        Hết hàng
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Chỉ còn {stock} sản phẩm
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-aurora-mint/30 bg-aurora-mint/10 px-3.5 py-1.5 text-xs font-semibold text-aurora-mint backdrop-blur-md">
      <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-aurora-mint" />
      Còn hàng
    </span>
  );
}

// ── Rating Breakdown Bar Chart ─────────────────────────────────────
type RatingBarProps = { stars: number; count: number; total: number };
function RatingBar({ stars, count, total }: RatingBarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 shrink-0 text-right text-sm font-medium text-warmwhite">{stars}</span>
      <svg className="h-3.5 w-3.5 shrink-0 text-sakura" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.5l2.95 6.32 6.55.78-4.85 4.55 1.3 6.55L12 17.5l-5.95 3.2 1.3-6.55L2.5 9.6l6.55-.78L12 2.5z" />
      </svg>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sakura to-lightpink transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-softgray">{count}</span>
    </div>
  );
}

// ── Customer Reviews Section ─────────────────────────────────────
type ReviewItem = {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  stars: number;
  review: string;
  created_at: string;
};

function ReviewsSection({ product, onWriteReview }: { product: Product; onWriteReview: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", product.id],
    queryFn: async () => {
      const { data: res } = await ratingsApi.list(product.id, { page: 1, limit: 10 });
      return res as { items: ReviewItem[]; total: number; page: number; limit: number };
    },
  });

  const ratingQuery = useQuery({
    queryKey: ["product-rating", product.id],
    queryFn: async () => {
      const { data } = await ratingsApi.get(product.id);
      return data as RatingSummary;
    },
  });

  const summary = ratingQuery.data;
  const avg = summary?.avg ?? product.avg_rating ?? 0;
  const totalCount = summary?.count ?? product.rating_count ?? 0;
  const items = data?.items ?? [];

  // Derive breakdown from the list of items.
  const breakdown = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const item of items) {
      const s = Math.round(item.stars);
      if (s >= 1 && s <= 5) counts[s]++;
    }
    return counts;
  }, [items]);

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <GlassCard intensity="med" className="overflow-hidden p-0">
      {/* Section header */}
      <div className="border-b border-white/[0.06] p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-bold text-warmwhite">Đánh giá từ khách hàng</h2>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Overall score */}
          <div className="flex flex-col items-center sm:min-w-[140px]">
            <span className="aurora-text-gradient text-5xl font-black leading-none">
              {avg.toFixed(1)}
            </span>
            <div className="mt-2">
              <StarRating value={avg} readonly size="md" />
            </div>
            <span className="mt-1 text-sm text-softgray">{totalCount} đánh giá</span>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <RatingBar
                key={stars}
                stars={stars}
                count={breakdown[stars] ?? 0}
                total={totalCount}
              />
            ))}
          </div>
        </div>

        {/* Write review CTA */}
        <div className="mt-6">
          <GlowButton
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            onClick={onWriteReview}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Viết đánh giá
          </GlowButton>
        </div>
      </div>

      {/* Review list */}
      <div className="divide-y divide-white/[0.04]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-sakura/40 border-t-sakura" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-aurora-bg-mid">
              <svg className="h-7 w-7 text-softgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium text-warmwhite">Chưa có đánh giá nào</p>
            <p className="mt-1 text-sm text-softgray">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-aurora-bg-mid text-sm font-bold text-sakura shadow-[0_0_12px_rgba(242,140,166,0.2)]">
                  {getInitials(item.user_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-warmwhite">{item.user_name}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={item.stars} readonly size="sm" />
                      <span className="text-xs text-softgray">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  {item.review && (
                    <p className="mt-2 text-sm leading-relaxed text-softgray">{item.review}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

// ── Review Write Modal ─────────────────────────────────────────────
function WriteReviewModal({
  open,
  onClose,
  productId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  productId: number;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: () => ratingsApi.upsert(productId, { stars, review }),
    onSuccess: (res) => {
      queryClient.setQueryData(["product-rating", productId], res.data);
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      setStars(0);
      setReview("");
      setSubmitting(false);
      onSuccess();
    },
    onError: () => setSubmitting(false),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/login"; return; }
    if (stars === 0) return;
    setSubmitting(true);
    mutation.mutate();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-aurora-bg-deep/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <GlassCard
        intensity="high"
        glow
        className="mx-4 w-full max-w-md p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-warmwhite">Viết đánh giá</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-softgray transition hover:bg-white/10 hover:text-warmwhite"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-softgray">Chọn số sao</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-8 w-8 transition-colors ${(hover || stars) >= s ? "text-sakura" : "text-[#3A2F33]"}`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2.5l2.95 6.32 6.55.78-4.85 4.55 1.3 6.55L12 17.5l-5.95 3.2 1.3-6.55L2.5 9.6l6.55-.78L12 2.5z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-softgray">
                {stars === 1 ? "Rất không hài lòng" :
                 stars === 2 ? "Không hài lòng" :
                 stars === 3 ? "Bình thường" :
                 stars === 4 ? "Hài lòng" :
                 stars === 5 ? "Rất hài lòng" : ""}
              </span>
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="mb-2 block text-sm font-medium text-softgray">
              Nhận xét của bạn <span className="font-normal text-softgray/60">(không bắt buộc)</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder-softgray/40 backdrop-blur-md transition-colors focus:border-sakura/40 focus:outline-none focus:ring-1 focus:ring-sakura/20"
            />
            <p className="mt-1 text-right text-xs text-softgray/50">{review.length}/1000</p>
          </div>

          <GlowButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={stars === 0}
          >
            Gửi đánh giá
          </GlowButton>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Related Products Section ───────────────────────────────────────
function RelatedProducts({ product }: { product: Product }) {
  const { data: related } = useQuery({
    queryKey: ["related-products", product.id],
    queryFn: async () => {
      const search = product.tags
        ? product.tags.split(",")[0].trim()
        : product.name.split(" ")[0] ?? "";
      const { data } = await productsApi.search({ search, limit: 8 });
      return (data as { products: Product[] }).products.filter((p) => p.id !== product.id).slice(0, 4);
    },
  });

  if (!related || related.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-warmwhite">
          Sản phẩm liên quan
        </h2>
        <button
          onClick={() => window.location.href = `/products?search=${encodeURIComponent(product.tags?.split(",")[0] ?? "")}`}
          className="text-sm text-sakura transition-colors hover:text-lightpink"
        >
          Xem tất cả
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} variant="small" requireAuth={false} />
        ))}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { flyToCart } = useCartFly();
  const [activeTab, setActiveTab] = useState<Tab>("mota");
  const [quantity, setQuantity] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const addToCartBtnRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await productsApi.get(Number(id));
      return data;
    },
    enabled: Boolean(id),
    placeholderData: () => queryClient.getQueryData<Product>(["product-preview", id]),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải sản phẩm..." />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <GlassCard intensity="high" className="mx-auto max-w-md p-12" glow>
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.06] bg-aurora-bg-mid">
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

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${product.id}` } });
      return;
    }
    flyToCart(addToCartBtnRef.current, product.image_url);
    addItem(product.id, quantity);
    navigate("/cart");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-softgray scrollbar-none">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 shrink-0 transition-colors hover:text-sakura"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Trang chủ
        </button>
        <svg className="h-4 w-4 shrink-0 text-softgray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <button
          onClick={() => navigate("/")}
          className="shrink-0 capitalize transition-colors hover:text-sakura"
        >
          Sản phẩm
        </button>
        {product.tags && (
          <>
            <svg className="h-4 w-4 shrink-0 text-softgray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <button
              onClick={() => navigate("/")}
              className="shrink-0 capitalize transition-colors hover:text-sakura"
            >
              {product.tags.split(",")[0].trim()}
            </button>
          </>
        )}
        <svg className="h-4 w-4 shrink-0 text-softgray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="shrink-0 font-medium text-warmwhite">{product.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="mb-16 grid items-start gap-8 lg:grid-cols-[minmax(0,560px)_minmax(380px,480px)] lg:justify-center lg:gap-10">
        {/* Left: Gallery */}
        <div>
          <ProductGallery product={product} />
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {/* Header */}
          <div>
            {/* Tags + Stock Badge row */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.tags && (
                <AuroraBadge tone="rose" glow>{product.tags}</AuroraBadge>
              )}
              <StockStatusBadge stock={product.stock} />
              <span className="ml-auto text-xs text-softgray">
                / Mã: #{product.id.toString().padStart(4, "0")}
              </span>
            </div>

            <h1 className="aurora-text-gradient mb-4 text-3xl font-extrabold leading-tight lg:text-4xl">
              {product.name}
            </h1>

            <div className="mb-5 flex items-center gap-3">
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

            {/* Stock bar */}
            <GlassCard intensity="low" className="mb-5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-softgray">Tồn kho</span>
                <span className="text-sm font-medium text-warmwhite">{product.stock} sản phẩm</span>
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
                <div className="flex items-center overflow-hidden rounded-aurora border border-white/[0.06] bg-aurora-bg-deep">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-lg font-light text-warmwhite transition-colors hover:bg-white/10"
                  >
                    −
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
              className="aurora-glow-btn w-full"
              disabled={!inStock || authLoading}
              onClick={handleAddToCart}
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
      <GlassCard intensity="med" className="mb-16 overflow-hidden p-0">
        <div className="flex border-b border-white/[0.06]">
          {(["mota", "thongso", "danhgia"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 px-4 py-4 text-sm font-semibold transition-colors sm:flex-none sm:px-8 ${
                activeTab === tab ? "text-warmwhite" : "text-softgray hover:text-warmwhite"
              }`}
            >
              {tab === "mota" ? "Mô tả sản phẩm" : tab === "thongso" ? "Thông số kỹ thuật" : "Đánh giá"}
              {activeTab === tab && (
                <span className="aurora-shimmer absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
              )}
            </button>
          ))}
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
          ) : activeTab === "thongso" ? (
            <SpecsTable specs={product.specifications ?? ""} />
          ) : (
            <ReviewsSection
              product={product}
              onWriteReview={() => {
                if (!user) { window.location.href = "/login"; return; }
                setReviewModalOpen(true);
              }}
            />
          )}
        </div>
      </GlassCard>

      {/* Related Products */}
      <RelatedProducts product={product} />

      {/* Floating Action Bar — mobile sticky bottom */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-aurora-bg-deep/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs text-softgray">Giá chỉ từ</p>
            <p className="aurora-text-rainbow text-lg font-bold">
              {new Intl.NumberFormat("vi-VN").format(product.price)} ₫
            </p>
          </div>
          <GlowButton
            ref={addToCartBtnRef}
            variant="primary"
            size="md"
            className="aurora-glow-btn shrink-0"
            disabled={!inStock || authLoading}
            onClick={handleAddToCart}
          >
            {inStock ? "Thêm vào giỏ" : "Hết hàng"}
          </GlowButton>
        </div>
      </div>

      {/* Spacer for mobile FAB */}
      <div className="h-20 lg:hidden" aria-hidden />

      {/* Write Review Modal */}
      <WriteReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={product.id}
        onSuccess={() => {
          setReviewModalOpen(false);
          setActiveTab("danhgia");
        }}
      />
    </div>
  );
}
