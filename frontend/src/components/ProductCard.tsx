import { Link } from "react-router-dom";
import { memo } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import GlassCard from "./aurora/GlassCard";
import StarRating from "./aurora/StarRating";

interface ProductCardProps {
  product: Product;
  variant?: "small" | "featured" | "bento";
}

function ProductCardBase({ product, variant = "small" }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1);
  };

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  const aboveFold = variant === "bento" || variant === "featured";
  const imgLoading: "eager" | "lazy" = aboveFold ? "eager" : "lazy";

  const ratingAvg = product.avg_rating ?? 0;
  const ratingCount = product.rating_count ?? 0;
  const likeCount = product.like_count ?? 0;
  const tags = product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // ── Bento: tall hero card ─────────────────────────────────────────────
  if (variant === "bento") {
    return (
      <Link to={`/products/${product.id}`} className="group block h-full">
        <GlassCard intensity="low" hoverable glow className="flex h-full flex-col overflow-hidden p-0">
          <div className="relative flex-1 overflow-hidden bg-aurora-bg-mid">
            <div className="absolute inset-0 bg-aurora-mesh opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-indigo/15 via-transparent to-aurora-pink/15" />
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                loading={imgLoading}
                decoding="async"
                fetchPriority={aboveFold ? "high" : "auto"}
                className="relative z-10 h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {tags[0] && (
              <div className="absolute left-5 top-5 z-20">
                <span className="inline-flex items-center gap-1 rounded-full border border-aurora-violet/40 bg-aurora-violet/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#C2A8FF] backdrop-blur-xl">
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
                  <span className="inline-flex items-center gap-1 rounded-full border border-aurora-pink/40 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-aurora-pink backdrop-blur-xl">
                    ♥ {likeCount}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-2xl font-bold text-warmwhite group-hover:text-aurora-cyan transition-colors">
                {product.name}
              </h3>
              <p className="shrink-0 aurora-text-rainbow text-2xl font-extrabold">{formattedPrice}₫</p>
            </div>
            {ratingCount > 0 && (
              <StarRating value={ratingAvg} readonly showCount={ratingCount} size="sm" />
            )}
            {plainDescription && (
              <p className="line-clamp-2 text-sm leading-relaxed text-softgray">
                {plainDescription}
              </p>
            )}
            <button
              onClick={handleAddToCart}
              className="aurora-glow-btn mt-2 w-full justify-center text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <Link to={`/products/${product.id}`} className="group block">
        <GlassCard intensity="low" hoverable className="flex flex-col overflow-hidden p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-aurora-bg-mid">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-indigo/15 via-transparent to-aurora-pink/15" />
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                loading={imgLoading}
                decoding="async"
                fetchPriority={aboveFold ? "high" : "auto"}
                className="relative z-10 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {tags[0] && (
              <div className="absolute left-4 top-4 z-20">
                <span className="inline-flex items-center gap-1 rounded-full border border-aurora-violet/40 bg-aurora-violet/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C2A8FF] backdrop-blur-xl">
                  {tags[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="line-clamp-2 text-xl font-bold text-warmwhite group-hover:text-aurora-cyan transition-colors">
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
                className="flex h-10 w-10 items-center justify-center rounded-xl aurora-glow-btn"
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
    <Link to={`/products/${product.id}`} className="group block">
      <GlassCard intensity="low" hoverable className="flex flex-col overflow-hidden p-0">
        <div className="relative aspect-square overflow-hidden bg-aurora-bg-mid">
          <div className="absolute inset-0 bg-gradient-to-br from-aurora-indigo/15 via-transparent to-aurora-pink/15" />
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              loading={imgLoading}
              decoding="async"
              fetchPriority={aboveFold ? "high" : "auto"}
              className="relative z-10 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {tags[0] && (
            <div className="absolute left-3 top-3 z-20">
              <span className="inline-flex items-center gap-1 rounded-full border border-aurora-violet/40 bg-aurora-violet/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C2A8FF] backdrop-blur-xl">
                {tags[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-base font-bold text-warmwhite group-hover:text-aurora-cyan transition-colors">
            {product.name}
          </h3>
          {ratingCount > 0 ? (
            <StarRating value={ratingAvg} readonly showCount={ratingCount} size="sm" />
          ) : (
            <span className="text-xs text-steelgray">Chưa có đánh giá</span>
          )}
          <div className="flex items-baseline justify-between">
            <p className="aurora-text-rainbow text-lg font-bold">{formattedPrice}₫</p>
            {likeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-aurora-pink">
                ♥ {likeCount}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="aurora-glow-btn mt-2 w-full justify-center text-xs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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