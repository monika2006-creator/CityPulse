import { Radio } from "lucide-react";
import RouteStatusBadge, { getDelayStyle } from "./RouteStatusBadge.jsx";
import { getRouteSignals, formatSignalCount } from "../utils/routeHelpers.js";
import {
  DELAY_UNAVAILABLE_TEXT,
  formatMinutes,
  formatDelay,
  formatDelayPercent,
  formatFasterNote,
} from "../utils/routeCalculations.js";

function Metric({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// Hierarchy: CURRENT ETA is the primary number; normal, delay and signals are secondary.
export default function RouteCard({ route, signals, isLowestEta, isTie, isSelected, onSelect }) {
  const delayStyle = getDelayStyle(route);
  const linked = getRouteSignals(route, signals);
  const fasterNote = formatFasterNote(route);

  return (
    <button
      type="button"
      onClick={() => onSelect(route.id)}
      aria-pressed={isSelected}
      aria-label={`${route.name}, ${route.statusLabel.toLowerCase()}${isLowestEta ? (isTie ? ", tied for lowest current ETA" : ", lowest current ETA") : ""}. ${isSelected ? "Selected." : "Select for details."}`}
      className={`w-full rounded-xl border p-4 text-left transition-colors duration-200 sm:p-5 ${
        isSelected
          ? "border-cyan/50 bg-elevated shadow-selected"
          : isLowestEta
            ? "border-cyan/30 bg-cyan/5 hover:border-cyan/50"
            : "border-border bg-surface hover:border-line"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
              isSelected ? "border-cyan" : "border-line"
            }`}
          >
            {isSelected && <span className="h-2 w-2 rounded-full bg-cyan" />}
          </span>
          <h3 className="truncate text-[15px] font-bold uppercase tracking-tight text-ink">{route.name}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isLowestEta && (
            <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-cyan-ink">
              LOWEST CURRENT ETA{isTie && " — TIE"}
            </span>
          )}
          <RouteStatusBadge route={route} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-6 gap-y-3 sm:gap-x-10">
        <Metric label="CURRENT ETA">
          <p className="font-mono text-[32px] font-semibold leading-none tracking-tight text-ink">
            {formatMinutes(route.currentTravelTime)}
          </p>
        </Metric>

        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-6">
          <Metric label="NORMAL">
            <p className="font-mono text-sm font-medium leading-none text-muted">
              {formatMinutes(route.normalTravelTime)}
            </p>
          </Metric>
          <Metric label="DELAY">
            {route.hasDelayData ? (
              <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono leading-none ${delayStyle.text}`}>
                <span className="text-sm font-semibold">{formatDelay(route)}</span>
                <span className="text-xs font-medium">{formatDelayPercent(route)}</span>
              </p>
            ) : (
              <p className="text-xs font-medium leading-none text-muted">{DELAY_UNAVAILABLE_TEXT}</p>
            )}
          </Metric>
        </div>
      </div>

      {fasterNote && <p className="mt-2 font-mono text-[11px] text-muted">{fasterNote}</p>}

      <div className="mt-4 border-t border-border pt-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-[0.1em] text-muted">
          <Radio size={12} className="shrink-0 text-cyan-ink" aria-hidden="true" />
          SUPPORTING SIGNALS
          <span className="font-mono text-ink">{route.signalTotal}</span>
        </p>
        {linked.length > 0 ? (
          <p className="mt-1.5 text-[13px] leading-snug text-muted">{linked.map((s) => s.title).join(" · ")}</p>
        ) : (
          <p className="mt-1.5 text-[13px] text-muted">
            {route.signalTotal > 0 ? `${formatSignalCount(route.signalTotal)} observed; coordinates unavailable for display.` : "No signals observed."}
          </p>
        )}
        <p className="mt-2 font-mono text-[10.5px] text-muted">
          DISTANCE <span className="ml-1 font-medium text-ink">{route.distance ?? "—"}{route.distance != null && " km"}</span>
        </p>
      </div>
    </button>
  );
}
