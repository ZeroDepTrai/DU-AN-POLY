/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#181417",
        graphite: "#262127",
        gunmetal: "#353039",
        warmwhite: "#EEE7E8",
        softgray: "#C9C4C6",
        lightpink: "#F4A2B7",
        sakura: "#F28CA6",
        rose: "#E36A86",
        crimson: "#D94A63",
        raspberry: "#C63D59",
        deeprose: "#A82F49",
        winered: "#7D2438",
        burgundy: "#58202D",
        steelgray: "#8A858A",
        silvergray: "#BDB7BC",
        gold: "#B88B52",
        bronze: "#8D683E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
