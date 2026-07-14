import { Link } from "react-router-dom";
import { memo } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  variant?: "small" | "featured" | "bento";
}

/**
 * Memoised so adding an item to the cart (which causes CartContext to
 * re-render the page) does NOT re-render every visible card. Images below
 * the fold get loading="lazy" + decoding="async" so the initial paint
 * only downloads above-the-fold images.
 */
function ProductCardBase({ product, variant = "small" }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  // Above-the-fold (bento + featured) gets eager loading so it doesn't flash;
  // the small grid cards load lazily.
  const aboveFold = variant === "bento" || variant === "featured";
  const imgLoading: "eager" | "lazy" = aboveFold ? "eager" : "lazy";

  // ── Bento: tall hero card (matches Figma "Premium Case" featured span)
  if (variant === "bento") {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-bento border border-rose/20 bg-cardtint transition-all hover:border-rose/40 hover:shadow-card-hover"
      >
        <div className="relative flex-1 overflow-hidden bg-graphite">
          <div className="absolute inset-0 bg-gradient-to-br from-accentFrom/20 via-transparent to-accentTo/30" />
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
          {product.tags && (
            <div className="absolute left-5 top-5 z-20">
              <span className="product-tag">{product.tags}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-rose/15 p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-2">
              {product.name}
            </h3>
            <p className="shrink-0 text-2xl font-extrabold text-crimson">{formattedPrice}₫</p>
          </div>
          {plainDescription && (
            <p className="text-sm leading-relaxed text-softgray line-clamp-2">
              {plainDescription}
            </p>
          )}
          <button
            onClick={handleAddToCart}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-crimson text-sm font-semibold text-white transition-colors hover:bg-raspberry"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm vào giỏ
          </button>
        </div>
      </Link>
    );
  }

  // ── Featured: wider showcase card
  if (variant === "featured") {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group flex flex-col overflow-hidden rounded-showcase border border-rose/20 bg-cardtint transition-all hover:border-rose/40 hover:shadow-card-hover"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
          <div className="absolute inset-0 bg-gradient-to-br from-accentFrom/15 via-transparent to-accentTo/25" />
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
          {product.tags && (
            <div className="absolute left-4 top-4 z-20">
              <span className="product-tag">{product.tags}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-xl font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-2">
            {product.name}
          </h3>
          {plainDescription && (
            <p className="text-sm text-softgray line-clamp-2">{plainDescription}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-xl font-bold text-crimson">{formattedPrice}₫</p>
            <button
              onClick={handleAddToCart}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-crimson text-white transition-colors hover:bg-raspberry"
              aria-label="Thêm vào giỏ"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // ── Small: standard grid card
  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-rose/20 bg-cardtint transition-all hover:border-rose/40 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-graphite">
        <div className="absolute inset-0 bg-gradient-to-br from-accentFrom/15 via-transparent to-accentTo/25" />
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
        {product.tags && (
          <div className="absolute left-3 top-3 z-20">
            <span className="product-tag">{product.tags}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-base font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-crimson">{formattedPrice}₫</p>
        <button
          onClick={handleAddToCart}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-crimson text-sm font-semibold text-white transition-colors hover:bg-raspberry"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm vào giỏ
        </button>
      </div>
    </Link>
  );
}

export default memo(ProductCardBase);