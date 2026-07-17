/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface scale — CellZone brand palette from Figma
        charcoal: "#0D0B0C",
        graphite: "#100E0F",
        gunmetal: "#373435",
        cardglass: "rgba(55, 52, 53, 0.3)",
        cardoverlay: "rgba(64, 42, 52, 0.6)",
        // Accent ramp — Primary Brand Colors from Figma
        blushlight: "#DFBFC3",
        blush: "#A6415C",
        crimson: "#D94A70",
        // Text scale
        warmwhite: "#EEE7E8",
        softgray: "#C9C4C6",
        steelgray: "#8A858A",
        silvergray: "#BDB7BC",
        // Status colors
        emerald: "#34D399",
        amber: "#F59E0B",
        // Decorative
        gold: "#B88B52",
        bronze: "#8D683E",
        // Card surface tint
        cardtint: "#402A34",
        // Hero / accent gradient stops
        accentFrom: "#D94A70",
        accentTo: "#A6415C",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        bento: "0.75rem",
        showcase: "1rem",
        panel: "1.25rem",
        "panel-lg": "2rem",
      },
      boxShadow: {
        "card-hover": "0 12px 36px -12px rgba(217, 74, 112, 0.35)",
        "card-glow": "0 0 40px 0px rgba(166, 65, 92, 0.15), inset 0px 0px 0px 1px rgba(166, 65, 92, 0.2)",
        glow: "0 0 80px 20px rgba(217, 74, 112, 0.25)",
        "glow-soft": "0 8px 32px -8px rgba(217, 74, 112, 0.25)",
        "panel-card": "0 20px 60px -20px rgba(217, 74, 112, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        "panel-btn": "0 8px 24px -6px rgba(217, 74, 112, 0.55), inset 0 1px 0 rgba(255,255,255,0.20)",
      },
      keyframes: {
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
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      backgroundImage: {
        "rose-radial":
          "radial-gradient(ellipse at top, rgba(217,74,112,0.25), transparent 60%), radial-gradient(ellipse at bottom right, rgba(166,65,92,0.18), transparent 55%), radial-gradient(ellipse at bottom left, rgba(223,191,195,0.18), transparent 55%)",
        "rose-conic":
          "conic-gradient(from 180deg at 50% 50%, #D94A70 0deg, #A6415C 90deg, #DFBFC3 180deg, #A6415C 270deg, #D94A70 360deg)",
        "rose-mesh":
          "radial-gradient(at 20% 20%, rgba(217,74,112,0.30) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(223,191,195,0.30) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(166,65,92,0.25) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(217,74,112,0.25) 0px, transparent 50%)",
        "rose-gradient":
          "linear-gradient(135deg, #D94A70 0%, #A6415C 50%, #58202D 100%)",
        "rose-button":
          "linear-gradient(135deg, #D94A70 0%, #A6415C 100%)",
        "title-gradient":
          "linear-gradient(135deg, #D94A70 0%, #A6415C 50%, #DFBFC3 100%)",
        "subtitle-gradient":
          "linear-gradient(135deg, #EEE7E8 0%, #C9C4C6 50%, #DFBFC3 100%)",
      },
    },
  },
  plugins: [],
};