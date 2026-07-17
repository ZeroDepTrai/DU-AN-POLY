import { useState } from "react";

interface HeartButtonProps {
  liked: boolean;
  count?: number;
  loading?: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  labelActive?: string;
  labelInactive?: string;
}

const sizeMap = {
  sm: { btn: "h-8 w-8 px-2", icon: "h-4 w-4", count: "text-xs" },
  md: { btn: "h-10 w-10 px-2", icon: "h-5 w-5", count: "text-sm" },
  lg: { btn: "h-12 w-12 px-3", icon: "h-6 w-6", count: "text-base" },
};

export default function HeartButton({
  liked,
  count,
  loading = false,
  onToggle,
  size = "md",
  showLabel = false,
  labelActive = "Đã yêu thích",
  labelInactive = "Yêu thích",
}: HeartButtonProps) {
  const [burst, setBurst] = useState(0);
  // When showLabel is true we render an icon + label + count on a single row.
  // The fixed w-* in sizeMap would clip them onto two lines, so override the
  // width to auto and let the button grow horizontally to fit its content.
  const sz = sizeMap[size];
  const widthClass = showLabel ? "w-auto" : sz.btn.split(" ").find((c) => c.startsWith("w-")) ?? "w-auto";
  const heightClass = sz.btn.split(" ").find((c) => c.startsWith("h-")) ?? "";
  const horizPad = showLabel ? "px-4" : sz.btn.split(" ").find((c) => c.startsWith("px-")) ?? "px-2";

  const handleClick = () => {
    if (loading) return;
    setBurst((b) => b + 1);
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? labelActive : labelInactive}
      className={[
        // When showLabel is true this becomes a pill button — wrap content
        // with whitespace-nowrap so icon + label + count stay on one line
        // even when the button width is constrained by a flex parent.
        "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border transition-all focus-aurora",
        heightClass,
        widthClass,
        horizPad,
        liked
          ? "border-crimson/60 bg-crimson/15 text-crimson shadow-glow"
          : "border-white/10 bg-white/[0.04] text-warmwhite backdrop-blur-xl hover:border-crimson/40 hover:text-crimson",
        loading ? "opacity-60" : "",
      ].join(" ")}
    >
      <span key={burst} className="pointer-events-none absolute inset-0">
        {burst > 0 && (
          <span className="absolute inset-0 animate-[ping_700ms_ease-out] rounded-full bg-crimson/30" />
        )}
      </span>
      <svg
        viewBox="0 0 24 24"
        className={`${sz.icon} transition-transform ${liked ? "scale-110" : "group-hover:scale-110"}`}
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7.5-4.6-9.7-9.4C.6 7.5 3.4 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.6 0 6.4 3.5 4.7 7.6C19.5 16.4 12 21 12 21z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {liked ? labelActive : labelInactive}
        </span>
      )}
      {typeof count === "number" && (
        <span className={`${sz.count} font-semibold tabular-nums text-softgray group-hover:text-warmwhite`}>
          {count}
        </span>
      )}
    </button>
  );
}