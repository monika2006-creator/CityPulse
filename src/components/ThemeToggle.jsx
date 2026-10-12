import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeContext.jsx";

// Compact icon button for changing the display theme.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-line hover:text-ink"
    >
      {isDark ? <Sun size={17} strokeWidth={2} aria-hidden="true" /> : <Moon size={17} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}
