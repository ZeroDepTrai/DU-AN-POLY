import type { CSSProperties, ReactNode } from "react";

// ── Props ──────────────────────────────────────────────────────────────────

interface LogoProps {
  /** Size of the logo (CSS value). Defaults to "auto". */
  size?: CSSProperties["width"];
  /** Extra CSS classes. */
  className?: string;
  /** Show the text beside the icon. Defaults to true. */
  showText?: boolean;
  /** Color of the text. Defaults to "currentColor". */
  textColor?: string;
  /** Wrap in a link? */
  asLink?: boolean;
  /** Children (only used when asLink=true). */
  children?: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────

/**
 * CellZone logo — renders the SVG icon + text in brand colors.
 *
 * Uses the same dark gradient as the Figma design:
 *   icon:   #0D0E26 → #191C3C (dark navy)
 *   accent:  #B02BCF → #B02BCF  (violet)
 *   text:    gradient #0D0E26 + #B02BCF
 */
export default function Logo({ size = "auto", className = "", showText = true }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ width: size, height: size === "auto" ? undefined : size }}
    >
      {/* Icon — SVG with brand gradient */}
      <svg
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0"
        aria-hidden="true"
        style={{ height: "1em", width: "1em" }}
      >
        <defs>
          <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D0E26" />
            <stop offset="100%" stopColor="#191C3C" />
          </linearGradient>
          <linearGradient id="logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B02BCF" />
            <stop offset="100%" stopColor="#7B2FBF" />
          </linearGradient>
          <linearGradient id="logo-text" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0C8FF" />
          </linearGradient>
        </defs>

        {/* Background rounded rect */}
        <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#logo-bg)" />

        {/* WiFi / signal wave arcs */}
        <path
          d="M20 32 Q28 26 34 28"
          stroke="url(#logo-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 32 Q24 24 30 24"
          stroke="url(#logo-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M20 32 Q22 20 26 20"
          stroke="url(#logo-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />

        {/* Phone body */}
        <rect x="14" y="12" width="12" height="22" rx="2.5" fill="url(#logo-text)" opacity="0.95" />

        {/* Phone screen */}
        <rect x="15.5" y="14.5" width="9" height="14" rx="1" fill="url(#logo-bg)" />

        {/* Screen inner glow (simulated app icon) */}
        <rect x="17" y="16" width="6" height="6" rx="1" fill="url(#logo-accent)" opacity="0.85" />
        <rect x="17" y="23.5" width="3" height="2" rx="0.5" fill="url(#logo-text)" opacity="0.5" />
        <rect x="21" y="23.5" width="2" height="2" rx="0.5" fill="url(#logo-text)" opacity="0.5" />
      </svg>

      {/* Brand text */}
      {showText && (
        <span
          className="whitespace-nowrap font-extrabold tracking-tight"
          style={{
            fontSize: "1.125rem",
            backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #E0C8FF 50%, #B02BCF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Cell
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #B02BCF 0%, #E0C8FF 60%, #7B2FBF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Zone
          </span>
        </span>
      )}
    </div>
  );
}
