/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nook IP 提取色板
        nook: {
          coral: "#F26A55",       // T恤 NOOK 珊瑚红（主色）
          coralDeep: "#D94F3B",
          cream: "#FFF7EC",       // 暖奶油背景
          ink: "#4A3A2E",         // 描边深棕（主文字）
          inkSoft: "#8A7464",
          blonde: "#F2E2A0",      // 奶金
          mint: "#8FE3C1",
          sunny: "#FFD66B",
          lavender: "#C9B8FF",
          sky: "#A8D8FF",
          peach: "#FFD9C7",
        },
      },
      fontFamily: {
        display: ['Fredoka', '"Noto Sans SC"', "system-ui", "sans-serif"],
        body: ['Nunito', '"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        clay: "20px",
        "clay-lg": "28px",
      },
      boxShadow: {
        clay: "inset -3px -4px 0 rgba(74,58,46,0.08), 0 6px 0 rgba(74,58,46,0.10), 0 10px 24px rgba(74,58,46,0.10)",
        "clay-sm": "inset -2px -3px 0 rgba(74,58,46,0.07), 0 3px 0 rgba(74,58,46,0.10)",
        "clay-press": "inset -2px -3px 0 rgba(74,58,46,0.08), 0 1px 0 rgba(74,58,46,0.10)",
        "clay-coral": "inset -3px -4px 0 rgba(180,55,35,0.18), 0 6px 0 #C94733, 0 12px 24px rgba(217,79,59,0.30)",
      },
      keyframes: {
        "soft-bounce": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pop-in": {
          "0%": { transform: "scale(.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "soft-bounce": "soft-bounce 2.2s ease-in-out infinite",
        "pop-in": "pop-in .28s cubic-bezier(.34,1.56,.64,1) both",
        wiggle: "wiggle 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
