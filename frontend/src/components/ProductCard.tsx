import { Link } from "react-router-dom";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.stock < 5;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gunmetal/60 bg-graphite transition-all duration-200 hover:border-rose/50 hover:shadow-lg hover:shadow-rose/5"
    >
      <div className="relative aspect-square overflow-hidden bg-gunmetal/40">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount && (
          <div className="absolute left-3 top-3 rounded-sm bg-deeprose px-2 py-0.5 text-xs font-bold text-white">
            Hết sắp
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-warmwhite leading-tight line-clamp-2 group-hover:text-sakura">
            {product.name}
          </h3>
        </div>
        <span className="tag-badge mb-3 w-fit">{product.tag}</span>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-crimson">
              {new Intl.NumberFormat("vi-VN").format(product.price)}
              <span className="text-sm font-normal text-steelgray"> VND</span>
            </p>
            {product.stock > 0 && product.stock < 10 && (
              <p className="mt-0.5 text-xs text-gold">Còn {product.stock} sản phẩm</p>
            )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson/10 text-crimson transition-colors group-hover:bg-crimson group-hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
