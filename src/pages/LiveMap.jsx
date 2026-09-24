import { useState } from "react";
import MapView from "../components/MapView.jsx";
import LiveSignalsPanel from "../components/LiveSignalsPanel.jsx";
import MapLegend from "../components/MapLegend.jsx";
import useMediaQuery from "../hooks/useMediaQuery.js";
import { cityData } from "../data/cityData.js";
import { getActiveSignals } from "../data/signals.js";
import { CATEGORY_FILTERS, SEVERITY_RANK } from "../data/mapConfig.js";

const PANEL_SIZE = 5;
// Width of the floating panel plus its margin, so popups pan clear of it.
const PANEL_INSET = 332;

function FilterChip({ label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
        isActive
          ? "border-cyan/40 bg-cyan/10 text-cyan shadow-[0_0_14px_-6px_rgba(34,211,238,0.6)]"
          : "border-border bg-surface text-muted hover:border-[#2a3a55] hover:text-ink"
      }`}
    >
      {label}
      <span className={`font-mono text-[11px] ${isActive ? "text-cyan" : "text-muted/80"}`}>
        {count}
      </span>
    </button>
  );
}

export default function LiveMap() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const isOverlayLayout = useMediaQuery("(min-width: 1280px)");

  // Single source of truth: signals.js. Nothing below invents or copies signal data.
  const activeSignals = getActiveSignals();

  // Only offer filters for categories that exist in the data (in the preferred order).
  const presentTypes = new Set(activeSignals.map((signal) => signal.type));
  const filters = CATEGORY_FILTERS.filter((filter) => presentTypes.has(filter.type));
  const knownTypes = new Set(CATEGORY_FILTERS.map((filter) => filter.type));
  activeSignals.forEach((signal) => {
    if (!knownTypes.has(signal.type) && !filters.some((filter) => filter.type === signal.type)) {
      const name = String(signal.category ?? signal.type).toUpperCase();
      filters.push({ type: signal.type, label: name, noun: name });
    }
  });

  const visibleSignals =
    activeFilter === "all"
      ? activeSignals
      : activeSignals.filter((signal) => signal.type === activeFilter);

  const panelSignals = [...visibleSignals]
    .sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
        b.detectedAt.localeCompare(a.detectedAt)
    )
    .slice(0, PANEL_SIZE);

  const activeNoun = filters.find((filter) => filter.type === activeFilter)?.noun;
  const countLabel =
    activeFilter === "all"
      ? `ACTIVE SIGNAL${visibleSignals.length === 1 ? "" : "S"}`
      : `${activeNoun} SIGNAL${visibleSignals.length === 1 ? "" : "S"}`;

  const handleFilter = (type) => setActiveFilter(type);

  // A selection only counts while its marker is still visible under the current filter.
  const visibleSelectedId = visibleSignals.some((signal) => signal.id === selectedId)
    ? selectedId
    : null;

  const handleListSelect = (id) => {
    setSelectedId(id);
    setFocus({ id });
  };

  // A closing popup only clears the selection if it is still that signal's popup.
  const handleDeselect = (id) => setSelectedId((current) => (current === id ? null : current));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-ink">Live City Map</h2>
          <p className="mt-1 text-sm text-muted">Monitor simulated civic signals across Jaipur.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{cityData.dataMode} DATA</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter signals by category"
          className="flex gap-2 overflow-x-auto pb-1 lg:pb-0"
        >
          <FilterChip
            label="ALL"
            count={activeSignals.length}
            isActive={activeFilter === "all"}
            onClick={() => handleFilter("all")}
          />
          {filters.map((filter) => (
            <FilterChip
              key={filter.type}
              label={filter.label}
              count={activeSignals.filter((signal) => signal.type === filter.type).length}
              isActive={activeFilter === filter.type}
              onClick={() => handleFilter(filter.type)}
            />
          ))}
        </div>

        <p
          className="shrink-0 text-xs font-semibold tracking-[0.1em] text-muted"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="font-mono text-base text-cyan">{visibleSignals.length}</span> {countLabel}
        </p>
      </div>

      <div className="relative isolate rounded-2xl border border-border bg-surface p-1.5 shadow-[0_16px_44px_-18px_rgba(0,0,0,0.75)]">
        <div className="relative isolate h-[60vh] min-h-[420px] overflow-hidden rounded-xl border border-border bg-sidebar lg:h-[calc(100vh-25rem)] lg:min-h-[480px]">
          <MapView
            signals={visibleSignals}
            selectedId={visibleSelectedId}
            focus={focus}
            onSelect={setSelectedId}
            onDeselect={handleDeselect}
            rightInset={isOverlayLayout ? PANEL_INSET : 0}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-3 py-2.5">
          <MapLegend />
          <p className="font-mono text-[10.5px] tracking-wide text-muted">
            SIMULATED DATA · MAP © OPENSTREETMAP
          </p>
        </div>

        <LiveSignalsPanel
          signals={panelSignals}
          total={visibleSignals.length}
          selectedId={visibleSelectedId}
          onSelect={handleListSelect}
          className="mx-1.5 mb-1.5 xl:absolute xl:right-4 xl:top-4 xl:z-10 xl:m-0 xl:w-[300px] xl:bg-surface/95 xl:backdrop-blur"
        />
      </div>
    </div>
  );
}
