import { useMemo, useState } from "react";
import CorrelationCard from "../components/CorrelationCard.jsx";
import { CATEGORY_LABELS, filterCorrelations, getCorrelationCategories } from "../utils/signalCorrelation.js";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

function FilterChip({ label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors duration-200 ${
        isActive
          ? "border-cyan/40 bg-cyan/10 text-cyan-ink"
          : "border-border bg-surface text-muted hover:border-line hover:text-ink"
      }`}
    >
      {label}
      <span className="font-mono text-[11px]">{count}</span>
    </button>
  );
}

// Civic Correlations: where observed signals overlap in place and time.
export default function Insights() {
  const [category, setCategory] = useState("all");
  const { loading, state, error, routes, signals, situations, correlations, dataMode } = useCityPulseData();
  const categories = useMemo(() => getCorrelationCategories(correlations), [correlations]);
  const visible = filterCorrelations(correlations, category);
  if (loading && !state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">Loading civic relationships…</p>;
  if (!state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">Backend data unavailable: {error}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-ink">Civic Correlations</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Where observed signals overlap in place and time. Relationships show overlap, not cause.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{dataMode}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-3xl font-semibold leading-none text-ink">
          {String(correlations.length).padStart(2, "0")}
        </p>
        <p className="text-[11px] font-bold tracking-[0.12em] text-muted">
          ACTIVE RELATIONSHIP{correlations.length === 1 ? "" : "S"}
        </p>
      </div>

      {categories.length > 0 && (
        <div role="group" aria-label="Filter correlations by category" className="flex flex-wrap gap-2">
          <FilterChip label="ALL" count={correlations.length} isActive={category === "all"} onClick={() => setCategory("all")} />
          {categories.map((type) => (
            <FilterChip
              key={type}
              label={(CATEGORY_LABELS[type] ?? type).toUpperCase()}
              count={filterCorrelations(correlations, type).length}
              isActive={category === type}
              onClick={() => setCategory(type)}
            />
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visible.map((correlation) => (
            <CorrelationCard
              key={correlation.id}
              correlation={correlation}
              signals={signals}
              routes={routes}
              situations={situations}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted">
          No overlapping signals detected in the current data. Unrelated signals are not linked.
        </p>
      )}

      <p className="text-xs text-muted">
        {dataMode}. A correlation means backend signals overlap in time and place; the available data does
        not establish that one affects another.
      </p>
    </div>
  );
}
