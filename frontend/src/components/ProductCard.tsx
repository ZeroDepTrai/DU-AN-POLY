import { Link, useLocation, useNavigate } from "react-router-dom";
import { memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCartFly } from "../context/CartFlyContext";
import type { Product } from "../types";
import GlassCard from "./aurora/GlassCard";
import StarRating from "./aurora/StarRating";
import OptimizedImage from "./OptimizedImage";

interface ProductCardProps {
  product: Product;
  variant?: "small" | "featured" | "bento";
  requireAuth?: boolean;
}

function ProductCardBase({ product, variant = "small", requireAuth = true }: ProductCardProps) {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { flyToCart } = useCartFly();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const prepareProductDetail = () => {
    const productId = String(product.id);
    queryClient.setQueryData(["product-preview", productId], product);
    void queryClient.prefetchQuery({
      queryKey: ["product", productId],
      queryFn: async () => {
        const { data } = await productsApi.get(product.id);
        return data;
      },
      staleTime: 5 * 60_000,
    });
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (requireAuth && authLoading) return;
    if (requireAuth && !user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    // Launch the flying icon from the button the user clicked so the
    // animation feels attached to the action (rather than spawning from
    // the card center).
    flyToCart(e.currentTarget, product.image_url);
    addItem(product.id, 1);
  };

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  const ratingAvg = product.avg_rating ?? 0;
  const ratingCount = product.rating_count ?? 0;
  const likeCount = product.like_count ?? 0;
  const tags = product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // ── Bento: tall hero card ─────────────────────────────────────────────
  if (variant === "bento") {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group block mx-auto w-full max-w-3xl"
        onPointerEnter={prepareProductDetail}
        onFocus={prepareProductDetail}
        onTouchStart={prepareProductDetail}
        onClick={prepareProductDetail}
      >
        <GlassCard intensity="low" hoverable glow className="flex flex-col overflow-hidden p-0 md:flex-row">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-aurora-bg-mid md:w-1/2">
            <div className="absolute inset-0 bg-aurora-mesh opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-crimson/15 via-transparent to-lightpink/15" />
            {product.image_url && (
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                priority={variant === "bento" || variant === "featured"}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="relative z-10 h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {tags[0] && (
              <div className="absolute left-5 top-5 z-20">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose/40 bg-rose/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose backdrop-blur-xl">
                  {tags[0]}
                </span>
              </div>
            )}
            {(ratingCount > 0 || likeCount > 0) && (
              <div className="absolute right-5 top-5 z-20 flex flex-col items-end gap-1.5">
                {ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur-xl">
                    ★ {ratingAvg.toFixed(1)}
                  </span>
                )}
                {likeCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-lightpink/40 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-lightpink backdrop-blur-xl">
                    ♥ {likeCount}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* min-w-0 lets this flex item shrink below its content's intrinsic
              min size, so the right pane respects max-w-3xl even when the
              title contains long unbroken strings (emoji runs, long URLs, etc). */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 border-t border-white/10 p-6 md:border-l md:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 min-h-[3.5rem] min-w-0 flex-1 break-words text-2xl font-bold text-warmwhite group-hover:text-sakura transition-colors">
                {product.name}
              </h3>
              <p className="shrink-0 aurora-text-rainbow text-2xl font-extrabold">{formattedPrice}₫</p>
            </div>
            {ratingCount > 0 && (
              <StarRating value={ratingAvg} readonly showCount={ratingCount} size="sm" />
            )}
            {plainDescription && (
              <p className="line-clamp-2 min-w-0 break-words text-sm leading-relaxed text-softgray">
                {plainDescription}
              </p>
            )}
            <button
              onClick={handleAddToCart}
              disabled={requireAuth && authLoading}
              className="aurora-glow-btn mt-auto w-full justify-center px-5 py-3 text-base disabled:cursor-wait disabled:opacity-60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Thêm vào giỏ
            </button>
          </div>
        </GlassCard>
      </Link>
    );
  }

  // ── Featured: wider showcase card ─────────────────────────────────────
  if (variant === "featured") {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group block h-full"
        onPointerEnter={prepareProductDetail}
        onFocus={prepareProductDetail}
        onTouchStart={prepareProductDetail}
        onClick={prepareProductDetail}
      >
        <GlassCard intensity="low" hoverable className="flex h-full flex-col overflow-hidden p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-aurora-bg-mid">
            <div className="absolute inset-0 bg-gradient-to-br from-crimson/15 via-transparent to-lightpink/15" />
            {product.image_url && (
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                priority={variant === "featured"}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="relative z-10 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {tags[0] && (
              <div className="absolute left-4 top-4 z-20">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose/40 bg-rose/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose backdrop-blur-xl">
                  {tags[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="line-clamp-2 min-h-[3rem] text-xl font-bold text-warmwhite group-hover:text-sakura transition-colors">
              {product.name}
            </h3>
            {ratingCount > 0 && (
              <StarRating value={ratingAvg} readonly showCount={ratingCount} size="sm" />
            )}
            {plainDescription && (
              <p className="line-clamp-2 text-sm text-softgray">{plainDescription}</p>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <p className="aurora-text-rainbow text-xl font-bold">{formattedPrice}₫</p>
              <button
                onClick={handleAddToCart}
                disabled={requireAuth && authLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl aurora-glow-btn disabled:cursor-wait disabled:opacity-60"
                aria-label="Thêm vào giỏ"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </GlassCard>
      </Link>
    );
  }

  // ── Small: standard grid card ─────────────────────────────────────────
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block h-full"
      onPointerEnter={prepareProductDetail}
      onFocus={prepareProductDetail}
      onTouchStart={prepareProductDetail}
      onClick={prepareProductDetail}
    >
      <GlassCard intensity="low" hoverable className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-square overflow-hidden bg-aurora-bg-mid">
          <div className="absolute inset-0 bg-gradient-to-br from-crimson/15 via-transparent to-lightpink/15" />
          {product.image_url && (
            <OptimizedImage
              src={product.image_url}
              alt={product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="relative z-10 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {tags[0] && (
            <div className="absolute left-3 top-3 z-20">
              <span className="inline-flex items-center gap-1 rounded-full border border-rose/40 bg-rose/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose backdrop-blur-xl">
                {tags[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 min-h-[1.5rem] text-base font-bold text-warmwhite group-hover:text-sakura transition-colors">
            {product.name}
          </h3>
          {ratingCount > 0 ? (
            <StarRating value={ratingAvg} readonly showCount={ratingCount} size="sm" />
          ) : (
            <span className="text-xs text-steelgray">Chưa có đánh giá</span>
          )}
          <div className="mt-auto flex items-baseline justify-between">
            <p className="aurora-text-rainbow text-lg font-bold">{formattedPrice}₫</p>
            {likeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-lightpink">
                ♥ {likeCount}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={requireAuth && authLoading}
            className="aurora-glow-btn mt-3 w-full justify-center px-5 py-3 text-base disabled:cursor-wait disabled:opacity-60"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm vào giỏ
          </button>
        </div>
      </GlassCard>
    </Link>
  );
}

export default memo(ProductCardBase);
