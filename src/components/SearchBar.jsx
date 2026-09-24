import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

export default function SearchBar({
  placeholder = "Search an area, landmark, or situation…",
  className = "",
  onPlaceSelect,
}) {
  const { selectedCity } = useCityPulseData();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsFor, setResultsFor] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setResults([]);
    setResultsFor("");
    setSearchError("");
  }, [selectedCity]);

  const choosePlace = (place) => {
    setValue(place.name);
    setResults([]);
    setResultsFor("");
    setFocused(false);
    onPlaceSelect?.(place);
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    const query = value.trim();
    if (results.length && resultsFor === query) { choosePlace(results[0]); return; }
    if (query.length < 3) { setSearchError("Enter at least 3 characters to search for a place."); setFocused(true); return; }
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&city=${encodeURIComponent(selectedCity)}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Place search unavailable");
      const data = await response.json();
      const place = data.results?.[0];
      setResultsFor(query);
      if (place) { setResults(data.results); choosePlace(place); }
      else { setResults([]); setSearchError(data.warnings?.[0] || "No matching place found. Try a more specific name."); setFocused(true); }
    } catch {
      setSearchError("Place search failed. Check that the backend is running and TomTom is configured.");
      setFocused(true);
    } finally { setSearching(false); }
  };

  useEffect(() => {
    if (value.trim().length < 3) { setResults([]); setResultsFor(""); setSearchError(""); return undefined; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(value.trim())}&city=${encodeURIComponent(selectedCity)}`, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error("Place search unavailable");
        const data = await response.json();
        if (!cancelled) { setResults(data.results ?? []); setResultsFor(value.trim()); setSearchError(data.warnings?.[0] ?? ""); }
      } catch {
        if (!cancelled) { setResults([]); setResultsFor(value.trim()); setSearchError("Place search is unavailable. Check backend and TomTom setup."); }
      } finally { if (!cancelled) setSearching(false); }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value, selectedCity]);

  const clear = () => {
    setValue("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={submitSearch}
      className={`group relative flex w-full items-center ${className}`}
    >
      <Search
        size={16}
        className={`pointer-events-none absolute left-3.5 shrink-0 transition-colors duration-200 ${
          focused ? "text-cyan-ink" : "text-muted"
        }`}
      />

      {(searching || searchError || results.length > 0) && focused && (
        <div role="listbox" aria-label="Place search results" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-float">
          {searching && <p className="px-3 py-2 text-xs text-muted" role="status">Searching places…</p>}
          {searchError && <p className="px-3 py-2 text-xs text-muted">{searchError}</p>}
          {resultsFor === value.trim() && results.map((place) => (
            <button key={place.id} type="button" role="option" aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choosePlace(place)}
              className="block w-full px-3 py-2 text-left hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
              <span className="block text-sm font-medium text-ink">{place.name}</span>
              {place.address && <span className="block text-xs text-muted">{place.address}</span>}
            </button>
          ))}
        </div>
      )}
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
            ? "border-cyan/50 shadow-focus"
            : "border-border hover:border-line"
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
