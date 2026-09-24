import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeContext.jsx";

// Compact Sun / Moon switch for the header. Both icons stay visible so it is easy to
// discover; the raised knob marks the active theme. The accessible name describes the
// ACTION (what a click does), which is what assistive tech users need.
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
      className="relative flex h-[34px] w-[62px] shrink-0 items-center rounded-full border border-border bg-surface p-[2px] shadow-card transition-colors duration-200 hover:border-line"
    >
      <span
        aria-hidden="true"
        className={`absolute left-[2px] top-[2px] h-7 w-7 rounded-full border border-line bg-elevated transition-transform duration-200 ease-out motion-reduce:transition-none ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      />
      <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <Sun size={15} strokeWidth={2.25} className={isDark ? "text-muted" : "text-ink"} />
      </span>
      <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <Moon size={15} strokeWidth={2.25} className={isDark ? "text-ink" : "text-muted"} />
      </span>
    </button>
  );
}
