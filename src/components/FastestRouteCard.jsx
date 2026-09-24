import { ArrowRight, Check, Info } from "lucide-react";
import { SEVERITY_STYLES } from "./SignalRow.jsx";
import { getDelaySeverity, formatMinutes, formatDelay, formatSignalCount } from "../utils/routeHelpers.js";

// Summary of the route with the lowest CURRENT simulated ETA.
// Not a navigation recommendation — it simply reflects the mock currentTravelTime values.
export default function FastestRouteCard({ fastest, others, isSelected, onSelect }) {
  const delay = SEVERITY_STYLES[getDelaySeverity(fastest)];

  const comparisons = others
    .map((route) => ({
      id: route.id,
      name: route.name,
      minutes: route.currentTravelTime - fastest.currentTravelTime,
    }))
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <section
      aria-label="Route with the lowest current simulated ETA"
      className="relative overflow-hidden rounded-2xl border border-cyan/25 bg-elevated p-5 shadow-[0_16px_44px_-22px_rgba(34,211,238,0.35)] sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 12% 0%, rgba(34,211,238,0.10), transparent 55%)" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_1px_rgba(34,211,238,0.6)]" />
            CURRENT FASTEST
          </p>
          <h3 className="mt-2 text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
            {fastest.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className="font-mono text-4xl font-semibold leading-none tracking-tight text-cyan">
              {formatMinutes(fastest.currentTravelTime)}
            </p>
            <p className="pb-0.5 font-mono text-[13px] text-muted">
              <span className={`font-semibold ${delay.text}`}>{formatDelay(fastest.delay)}</span> current delay
              <span className="mx-2 text-border">·</span>
              {formatSignalCount(fastest.signalCount)}
            </p>
          </div>

          {comparisons.length > 0 && (
            <ul className="mt-3 space-y-0.5 text-[13px] text-muted">
              {comparisons.map((item) => (
                <li key={item.id}>
                  <span className="font-mono font-medium text-ink">{formatMinutes(item.minutes)}</span> faster than{" "}
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(fastest.id)}
          aria-pressed={isSelected}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-bold tracking-wide transition-all duration-200 ${
            isSelected
              ? "border-cyan/50 bg-cyan/10 text-cyan"
              : "border-cyan/30 text-cyan hover:border-cyan/60 hover:bg-cyan/10"
          }`}
        >
          {isSelected ? <Check size={15} strokeWidth={2.5} /> : <ArrowRight size={15} strokeWidth={2.5} />}
          {isSelected ? "ROUTE SELECTED" : "SELECT ROUTE"}
        </button>
      </div>

      <p className="relative mt-5 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted">
        <Info size={13} className="mt-px shrink-0" />
        Lowest current simulated ETA among the available routes. Demo data, not a navigation recommendation.
      </p>
    </section>
  );
}
