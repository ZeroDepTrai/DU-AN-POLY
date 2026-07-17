import type { ReactNode } from "react";

type Tone = "neutral" | "rose" | "crimson" | "sakura" | "mint" | "amber";

interface AuroraBadgeProps {
  tone?: Tone;
  glow?: boolean;
  className?: string;
  children?: ReactNode;
}

const toneClass: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.05] text-warmwhite",
  rose: "border-rose/30 bg-rose/15 text-sakura",
  crimson: "border-crimson/40 bg-crimson/15 text-crimson",
  sakura: "border-sakura/40 bg-sakura/15 text-sakura",
  mint: "border-emerald/40 bg-emerald/15 text-emerald",
  amber: "border-amber-400/40 bg-amber-500/15 text-amber-200",
};

export default function AuroraBadge({
  tone = "neutral",
  glow = false,
  className = "",
  children,
}: AuroraBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-xl",
        toneClass[tone],
        glow ? "shadow-glow-soft" : "",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}