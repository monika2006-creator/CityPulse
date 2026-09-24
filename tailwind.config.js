/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable holding "R G B" channels (defined in src/index.css,
// one set per theme). Tailwind fills in the alpha, so `bg-cyan/10` etc. keep working
// and the whole UI switches theme by changing the variables — no per-component work.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

// `ink` variants are the text-safe shade of an accent (darker in light mode so small
// text keeps its contrast). Use them for text; use the base colour for fills and icons.
const accent = (name) => ({ DEFAULT: token(name), ink: token(`${name}-ink`) });

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        sidebar: token("sidebar"),
        surface: token("surface"),
        elevated: token("elevated"),
        inset: token("inset"),
        border: token("border"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        cyan: accent("cyan"),
        primary: token("cyan"),
        action: token("action"),
        violet: accent("violet"),
        secondary: token("violet"),
        normal: accent("normal"),
        attention: accent("attention"),
        critical: accent("critical"),
        scrim: "var(--scrim)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        float: "var(--shadow-float)",
        selected: "var(--shadow-selected)",
        active: "var(--shadow-active)",
        focus: "var(--shadow-focus)",
        dot: "var(--shadow-dot)",
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
