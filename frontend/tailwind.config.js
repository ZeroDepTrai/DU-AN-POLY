/** @type {import('tailwindcss).Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface scale (page → card → nested) — CellZone brand palette
        charcoal: "#181417",      // page background (Charcoal Black)
        graphite: "#232028",      // raised surface
        gunmetal: "#3A2F33",      // border / divider
        // Accent ramp
        lightpink: "#F4A2B7",
        sakura: "#F28CA6",        // Sakura Pink
        rose: "#E36A86",
        crimson: "#D94A63",       // Crimson primary CTA
        raspberry: "#C63D59",
        deeprose: "#A82F49",
        winered: "#7D2438",
        burgundy: "#58202D",
        // Text scale
        warmwhite: "#EEE7E8",     // Warm White
        softgray: "#C9C4C6",
        steelgray: "#8A858A",
        silvergray: "#BDB7BC",
        // Status colors (kept across palette revisions)
        emerald: "#34D399",       // Success
        amber: "#F59E0B",         // Warning
        // Decorative
        gold: "#B88B52",          // Antique Gold
        bronze: "#8D683E",
        // Card surface tint
        cardtint: "#402A34",
        // Hero / accent gradient stops
        accentFrom: "#D94A63",
        accentTo: "#A82F49",
        // Aurora UI palette — re-mapped to brand so existing utility
        // classes (bg-aurora-cyan, text-aurora-violet, …) all resolve
        // to the rose/sakura accents.
        aurora: {
          "bg-deep": "#181417",     // Charcoal Black
          "bg-mid": "#232028",      // graphite
          "bg-glass": "rgba(255,255,255,0.04)",
          indigo: "#D94A63",        // Crimson
          violet: "#E36A86",        // Rose
          cyan: "#F28CA6",          // Sakura (links / focus)
          mint: "#34D399",          // keep mint (status ok)
          pink: "#F28CA6",          // Sakura (heart/likes)
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      // Figma-derived typographic scale (display / heading / subheading / body / caption)
      fontSize: {
        "fig-display": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "fig-h1": ["clamp(2rem, 3.5vw, 2.75rem)", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
        "fig-h2": ["clamp(1.5rem, 2.5vw, 2rem)", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "fig-h3": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "fig-body": ["0.9375rem", { lineHeight: "1.55" }],
        "fig-caption": ["0.75rem", { lineHeight: "1.45", letterSpacing: "0.02em" }],
      },
      // Figma-derived spacing rhythm (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64)
      spacing: {
        "fig-1": "0.25rem",
        "fig-2": "0.5rem",
        "fig-3": "0.75rem",
        "fig-4": "1rem",
        "fig-6": "1.5rem",
        "fig-8": "2rem",
        "fig-12": "3rem",
        "fig-16": "4rem",
      },
      borderRadius: {
        card: "0.75rem",
        bento: "0.75rem",
        showcase: "1rem",
        aurora: "1.25rem",
        "aurora-lg": "2rem",
        // Figma-derived structural radii
        "fig-card": "1rem",          // 16px — content cards
        "fig-showcase": "1.25rem",   // 20px — product/bento cards
        "fig-pill": "9999px",        // pill controls
        "fig-modal": "1.5rem",       // 24px — modals & large surfaces
      },
      boxShadow: {
        "card-hover": "0 12px 36px -12px rgba(242, 140, 166, 0.35)",
        glow: "0 0 80px 20px rgba(242, 140, 166, 0.25)",
        "glow-violet": "0 0 60px 10px rgba(242, 140, 166, 0.35)",
        "glow-cyan": "0 0 60px 10px rgba(242, 140, 166, 0.30)",
        "glow-soft": "0 8px 32px -8px rgba(242, 140, 166, 0.25)",
        "aurora-card": "0 20px 60px -20px rgba(242, 140, 166, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        "aurora-btn": "0 8px 24px -6px rgba(242, 140, 166, 0.55), inset 0 1px 0 rgba(255,255,255,0.20)",
        // Figma-derived layered shadows (deep + soft)
        "fig-card": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "fig-card-hover": "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 16px 40px -16px rgba(217,74,99,0.35), 0 4px 12px -6px rgba(0,0,0,0.4)",
        "fig-pill": "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 4px 16px -8px rgba(0,0,0,0.5)",
        "fig-glow": "0 0 0 1px rgba(242,140,166,0.25), 0 10px 30px -10px rgba(242,140,166,0.45)",
      },
      keyframes: {
        "aurora-pan": {
          "0%": { transform: "translate3d(-10%, -10%, 0) scale(1)" },
          "50%": { transform: "translate3d(10%, 10%, 0) scale(1.1)" },
          "100%": { transform: "translate3d(-10%, -10%, 0) scale(1)" },
        },
        "aurora-tilt": {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "50%": { transform: "rotate(8deg) translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(242, 140, 166, 0.45)" },
          "50%": { boxShadow: "0 0 0 16px rgba(242, 140, 166, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "aurora-pan": "aurora-pan 24s ease-in-out infinite",
        "aurora-tilt": "aurora-tilt 16s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 6s linear infinite",
      },
      backgroundImage: {
        "aurora-radial":
          "radial-gradient(ellipse at top, rgba(242,140,166,0.25), transparent 60%), radial-gradient(ellipse at bottom right, rgba(242,140,166,0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(242,140,166,0.18), transparent 55%)",
        "aurora-conic":
          "conic-gradient(from 180deg at 50% 50%, #D94A63 0deg, #A82F49 90deg, #F28CA6 180deg, #E36A86 270deg, #D94A63 360deg)",
        "aurora-mesh":
          "radial-gradient(at 20% 20%, rgba(242,140,166,0.30) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(242,140,166,0.30) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(242,140,166,0.25) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(242,140,166,0.25) 0px, transparent 50%)",
        "aurora-gradient":
          "linear-gradient(135deg, #D94A63 0%, #A82F49 50%, #58202D 100%)",
        "rose-gradient":
          "linear-gradient(135deg, #D94A63 0%, #A82F49 100%)",
        "text-gradient-aurora":
          "linear-gradient(135deg, #EEE7E8 0%, #C9C4C6 50%, #F28CA6 100%)",
        "text-gradient-rose":
          "linear-gradient(135deg, #F28CA6 0%, #D94A63 60%, #A82F49 100%)",
      },
    },
  },
  plugins: [],
};
