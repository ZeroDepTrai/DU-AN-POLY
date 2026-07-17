import type { ReactNode } from "react";

type Tone = "neutral" | "rose" | "indigo" | "cyan" | "mint" | "violet" | "amber";

interface AuroraBadgeProps {
  tone?: Tone;
  glow?: boolean;
  className?: string;
  children?: ReactNode;
}

const toneClass: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.05] text-warmwhite",
  rose: "border-rose/30 bg-rose/15 text-sakura",
  indigo: "border-aurora-indigo/40 bg-aurora-indigo/15 text-[#9AA6FF]",
  cyan: "border-aurora-cyan/40 bg-aurora-cyan/15 text-[#7DF0FF]",
  mint: "border-aurora-mint/40 bg-aurora-mint/15 text-[#7DEDB6]",
  violet: "border-aurora-violet/40 bg-aurora-violet/15 text-[#C2A8FF]",
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