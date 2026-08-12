import type { CSSProperties } from "react";
import logoImg from "../assets/cellzone-logo.png";

// ── Props ──────────────────────────────────────────────────────────────────

interface LogoProps {
  /** Size of the logo icon (CSS value). Defaults to 36px. */
  size?: CSSProperties["width"];
  /** Extra CSS classes. */
  className?: string;
  /** Show the text beside the icon. Defaults to true. */
  showText?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

/**
 * CellZone logo — renders the actual logo PNG from Figma + brand text.
 */
export default function Logo({ size = 36, className = "", showText = true }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
    >
      <img
        src={logoImg}
        alt="CellZone"
        width={size}
        height={size}
        className="h-auto w-auto shrink-0 rounded-fig-card"
        style={{ width: size, height: "auto" }}
      />

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
