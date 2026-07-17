import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  rightSlot?: ReactNode;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  rightSlot,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-4 ${
        isCenter ? "flex-col items-center text-center" : ""
      }`}
    >
      <div className={isCenter ? "max-w-2xl" : ""}>
        {eyebrow && (
          <div className={`mb-3 flex items-center gap-2 ${isCenter ? "justify-center" : ""}`}>
            <span className="h-px w-10 bg-crimson/70" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sakura">
              {eyebrow}
            </span>
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-warmwhite sm:text-4xl aurora-text-gradient">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-softgray">{subtitle}</p>
        )}
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}