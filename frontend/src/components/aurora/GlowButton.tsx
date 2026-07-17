import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "aurora" | "danger";
type Size = "sm" | "md" | "lg";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    "aurora-glow-btn text-white",
  aurora:
    "aurora-glow-btn text-white",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 font-semibold text-warmwhite backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/[0.08]",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white transition-all",
};

const dangerStyle: React.CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #A82F49 0%, #58202D 100%)",
  boxShadow: "0 10px 28px -10px rgba(168, 47, 73, 0.7), inset 0 1px 0 rgba(255,255,255,0.15)",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className = "",
    disabled,
    ...rest
  },
  ref,
) {
  const sizing = variant === "ghost" ? "" : sizeClass[size];
  const isDanger = variant === "danger";
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        variantClass[variant],
        sizing,
        "focus-aurora disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      style={isDanger ? dangerStyle : undefined}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});

export default GlowButton;