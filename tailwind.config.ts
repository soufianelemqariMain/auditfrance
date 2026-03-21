import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0a0a0a",
        "bg-secondary": "#111111",
        "bg-panel": "#0d0d0d",
        border: "#1f1f1f",
        "accent-green": "#00ff41",
        "accent-red": "#ff2020",
        "accent-yellow": "#ffcc00",
        "accent-blue": "#0088ff",
        "text-primary": "#e0e0e0",
        "text-secondary": "#666666",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "DM Mono", "Courier New", "monospace"],
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
