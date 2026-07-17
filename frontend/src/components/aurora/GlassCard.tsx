import { forwardRef, type HTMLAttributes, type ReactNode, type ElementType } from "react";

type Intensity = "low" | "med" | "high";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "aside" | "header" | "footer" | "nav";
  glow?: boolean;
  hoverable?: boolean;
  intensity?: Intensity;
  children?: ReactNode;
}

const intensityClass: Record<Intensity, string> = {
  low: "bg-white/[0.03] backdrop-blur-md",
  med: "bg-white/[0.05] backdrop-blur-xl",
  high: "bg-white/[0.07] backdrop-blur-2xl",
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  {
    as = "div",
    glow = false,
    hoverable = false,
    intensity = "med",
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const Tag: ElementType = as;
  return (
    <Tag
      ref={ref}
      className={[
        "rounded-aurora border border-white/10 text-warmwhite",
        intensityClass[intensity],
        glow ? "shadow-aurora-card" : "shadow-glow-soft",
        hoverable
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-aurora-card"
          : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default GlassCard;
