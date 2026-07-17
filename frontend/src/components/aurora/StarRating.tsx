import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (next: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showCount?: number;
  countLabel?: string;
  ariaLabel?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

function Star({ filled, half, className }: { filled: boolean; half: boolean; className: string }) {
  const id = `g-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#3A2F33" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 6.32 6.55.78-4.85 4.55 1.3 6.55L12 17.5l-5.95 3.2 1.3-6.55L2.5 9.6l6.55-.78L12 2.5z"
        fill={filled ? "#F28CA6" : half ? `url(#${id})` : "#3A2F33"}
        stroke={filled ? "#F28CA6" : "#3A2F33"}
        strokeWidth={0.6}
      />
    </svg>
  );
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showCount,
  countLabel,
  ariaLabel,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const sz = sizeMap[size];

  return (
    <div
      className="inline-flex items-center gap-2"
      role={readonly ? "img" : "radiogroup"}
      aria-label={ariaLabel ?? "Đánh giá sản phẩm"}
    >
      <div
        className="inline-flex items-center"
        onMouseLeave={() => !readonly && setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = display >= i;
          const half = !filled && display >= i - 0.5;
          return (
            <button
              key={i}
              type="button"
              role={readonly ? undefined : "radio"}
              aria-checked={readonly ? undefined : Math.round(display) === i}
              aria-label={`${i} sao`}
              tabIndex={readonly ? -1 : 0}
              disabled={readonly}
              onMouseEnter={() => !readonly && setHover(i)}
              onFocus={() => !readonly && setHover(i)}
              onBlur={() => !readonly && setHover(null)}
              onClick={() => !readonly && onChange?.(i)}
              className={`p-0.5 ${readonly ? "cursor-default" : "cursor-pointer"}`}
            >
              <Star filled={filled} half={half} className={sz} />
            </button>
          );
        })}
      </div>
      {typeof showCount === "number" && (
        <span className="text-xs text-softgray">
          <span className="font-semibold text-warmwhite">{display.toFixed(1)}</span>
          <span className="text-steelgray">
            {countLabel ?? `· ${showCount} đánh giá`}
          </span>
        </span>
      )}
    </div>
  );
}