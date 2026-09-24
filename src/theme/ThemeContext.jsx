import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// One centralized theme mechanism.
//  - The theme lives on <html data-theme="dark|light">; index.css maps it to colour tokens.
//  - The choice is saved in localStorage under `citypulse-theme`.
//  - Dark is the default when nothing valid is saved.
//  - index.html applies the saved theme before first paint (no flash); this provider only
//    reads that attribute once on startup, so localStorage is not re-read on every render.

export const THEME_STORAGE_KEY = "citypulse-theme";
export const THEMES = ["dark", "light"];
export const DEFAULT_THEME = "dark";

// How long the colour-easing attribute stays on <html> after a toggle (see index.css).
const SWITCH_MS = 250;

const isTheme = (value) => THEMES.includes(value);

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : null;
  } catch {
    return null; // storage blocked (private mode, policy) — fall back to the default
  }
}

function getInitialTheme() {
  const applied = document.documentElement.getAttribute("data-theme");
  if (isTheme(applied)) return applied;
  return readStoredTheme() ?? DEFAULT_THEME;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const switchTimer = useRef(null);

  // Keep <html> in sync with state (also covers the case where index.html's script did not run).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => () => window.clearTimeout(switchTimer.current), []);

  const setTheme = useCallback((next) => {
    if (!isTheme(next)) return;
    const root = document.documentElement;

    // Ease the colour change for a moment; skipped for reduced-motion users.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-theme-switching", "");
      window.clearTimeout(switchTimer.current);
      switchTimer.current = window.setTimeout(() => root.removeAttribute("data-theme-switching"), SWITCH_MS);
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* the theme still changes for this session */
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
