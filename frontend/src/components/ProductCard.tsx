import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  variant?: "featured" | "small";
}

export default function ProductCard({ product, variant = "small" }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);

  if (variant === "featured") {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/30"
      >
        <div className="relative aspect-square overflow-hidden bg-charcoal">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {product.tag && (
            <div className="absolute left-4 top-4">
              <span className="product-tag">{product.tag}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-steelgray">{product.tag}</p>
            <h3 className="mt-1 text-xl font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>
          <p className="text-sm text-steelgray line-clamp-2 flex-1">{product.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-crimson">{formattedPrice}₫</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson text-white transition-colors hover:bg-raspberry"
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

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/30"
    >
      <div className="relative aspect-square overflow-hidden bg-charcoal">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-steelgray">{product.tag}</p>
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
