/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070B14",
        sidebar: "#0B1120",
        surface: "#0F172A",
        elevated: "#141E33",
        cyan: "#22D3EE",
        primary: "#22D3EE",
        action: "#3B82F6",
        violet: "#8B5CF6",
        secondary: "#8B5CF6",
        ink: "#F8FAFC",
        muted: "#94A3B8",
        border: "#1E293B",
        normal: "#34D399",
        attention: "#FBBF24",
        critical: "#FB7185",
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
