/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface scale — CellZone brand palette from Figma
        charcoal: "#0D0B0C",      // page background (Deep Black)
        graphite: "#100E0F",      // raised surface
        gunmetal: "#373435",      // border / divider
        cardglass: "rgba(55, 52, 53, 0.3)",
        cardoverlay: "rgba(64, 42, 52, 0.6)",
        // Accent ramp — Primary Brand Colors from Figma
        blush: "#A6415C",         // Blush Pink
        rose: "#A6415C",          // Rose (consolidated)
        crimson: "#D94A70",        // Crimson Primary CTA
        blushlight: "#DFBFC3",    // Blush Light
        // Text scale
        warmwhite: "#EEE7E8",     // Warm White
        softgray: "#C9C4C6",
        steelgray: "#8A858A",
        silvergray: "#BDB7BC",
        // Decorative
        gold: "#B88B52",          // Antique Gold
        bronze: "#8D683E",
        // Card surface tint
        cardtint: "#402A34",
        // Hero / accent gradient stops
        accentFrom: "#D94A70",
        accentTo: "#A6415C",
        // Aurora UI palette — re-mapped to brand
        aurora: {
          "bg-deep": "#0D0B0C",     // Deep Black
          "bg-mid": "#100E0F",      // graphite
          "bg-glass": "rgba(55,52,53,0.3)",
          "bg-overlay": "rgba(64,42,52,0.6)",
          blush: "#DFBFC3",         // Blush Light (text/icons)
          rose: "#A6415C",          // Rose
          crimson: "#D94A70",       // Crimson
          pink: "#DFBFC3",          // Pink (heart/likes)
          warmwhite: "#EEE7E8",     // Warm White
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        bento: "0.75rem",
        showcase: "1rem",
        aurora: "1.25rem",
        "aurora-lg": "2rem",
      },
      boxShadow: {
        "card-hover": "0 12px 36px -12px rgba(217, 74, 112, 0.35)",
        "card-glow": "0 0 40px 0px rgba(166, 65, 92, 0.15), inset 0px 0px 0px 1px rgba(166, 65, 92, 0.2)",
        glow: "0 0 80px 20px rgba(217, 74, 112, 0.25)",
        "glow-violet": "0 0 60px 10px rgba(163, 63, 252, 0.35)",
        "glow-cyan": "0 0 60px 10px rgba(217, 74, 112, 0.30)",
        "glow-soft": "0 8px 32px -8px rgba(217, 74, 112, 0.25)",
        "aurora-card": "0 20px 60px -20px rgba(217, 74, 112, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        "aurora-btn": "0 8px 24px -6px rgba(217, 74, 112, 0.55), inset 0 1px 0 rgba(255,255,255,0.20)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(217, 74, 112, 0.45)" },
          "50%": { boxShadow: "0 0 0 16px rgba(217, 74, 112, 0)" },
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
          "radial-gradient(ellipse at top, rgba(217,74,112,0.25), transparent 60%), radial-gradient(ellipse at bottom right, rgba(166,65,92,0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(223,191,195,0.18), transparent 55%)",
        "aurora-conic":
          "conic-gradient(from 180deg at 50% 50%, #D94A70 0deg, #A6415C 90deg, #DFBFC3 180deg, #A6415C 270deg, #D94A70 360deg)",
        "aurora-mesh":
          "radial-gradient(at 20% 20%, rgba(217,74,112,0.30) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(223,191,195,0.30) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(166,65,92,0.25) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(217,74,112,0.25) 0px, transparent 50%)",
        "aurora-gradient":
          "linear-gradient(135deg, #D94A70 0%, #A6415C 50%, #58202D 100%)",
        "rose-gradient":
          "linear-gradient(135deg, #D94A70 0%, #A6415C 100%)",
        "text-gradient-aurora":
          "linear-gradient(135deg, #EEE7E8 0%, #C9C4C6 50%, #DFBFC3 70%, #D94A70 100%)",
        "text-gradient-rose":
          "linear-gradient(135deg, #DFBFC3 0%, #D94A70 60%, #A6415C 100%)",
      },
    },
  },
  plugins: [],
};
