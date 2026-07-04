/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface scale (page → card → nested) — Figma "Aurora" reference
        charcoal: "#1E1E1E",      // page background
        graphite: "#2A2024",      // raised surface (slightly warmer)
        gunmetal: "#3A2F33",      // border / divider
        // Accent ramp (rose)
        lightpink: "#F4A2B7",
        sakura: "#F28CA6",
        rose: "#E36A86",
        crimson: "#D94A63",       // primary CTA
        raspberry: "#C63D59",     // hover
        deeprose: "#A82F49",      // pressed / danger
        winered: "#7D2438",
        burgundy: "#58202D",
        // Text scale
        warmwhite: "#F4EFEC",
        softgray: "#C9C4C6",
        steelgray: "#8A858A",
        silvergray: "#BDB7BC",
        // Decorative
        gold: "#B88B52",
        bronze: "#8D683E",
        // Card surface tint extracted from Figma (0x40 0x2A 0x34)
        cardtint: "#402A34",
        // Hero / accent gradient stops
        accentFrom: "#D94A63",
        accentTo: "#A82F49",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        bento: "0.75rem",
        showcase: "1rem",
      },
      boxShadow: {
        "card-hover": "0 12px 36px -12px rgba(217, 74, 99, 0.35)",
        glow: "0 0 80px 20px rgba(217, 74, 99, 0.25)",
      },
    },
  },
  plugins: [],
};