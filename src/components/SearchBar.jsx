import { useState, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";

export default function SearchBar({
  placeholder = "Search an area, landmark, or situation…",
  className = "",
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={`group relative flex w-full items-center ${className}`}
    >
      <Search
        size={16}
        className={`pointer-events-none absolute left-3.5 shrink-0 transition-colors duration-200 ${
          focused ? "text-cyan" : "text-muted"
        }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label="Search CityPulse"
        className={`w-full rounded-lg border bg-surface py-2.5 pl-10 pr-16 text-sm text-ink placeholder:text-muted outline-none transition-all duration-200 ${
          focused
            ? "border-cyan/50 shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
            : "border-border hover:border-[#2a3a55]"
        }`}
      />

      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-11 rounded-md p-1 text-muted transition-colors duration-200 hover:text-ink"
        >
          <X size={14} />
        </button>
      )}

      {value ? (
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md bg-cyan text-bg transition-colors duration-200 hover:bg-cyan/90"
        >
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3 hidden items-center gap-0.5 rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted sm:flex">
          ⌘K
        </kbd>
      )}
    </form>
  );
}
