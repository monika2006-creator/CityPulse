import { Radio } from "lucide-react";
import { SEVERITY_STYLES } from "./SignalRow.jsx";
import { getDelaySeverity, formatMinutes, formatDelay, formatSignalCount } from "../utils/routeHelpers.js";

function Metric({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function RouteCard({ route, isFastest, isSelected, onSelect }) {
  const delay = SEVERITY_STYLES[getDelaySeverity(route)];

  return (
    <button
      type="button"
      onClick={() => onSelect(route.id)}
      aria-pressed={isSelected}
      className={`w-full rounded-xl border p-4 text-left transition-all duration-200 sm:p-5 ${
        isSelected
          ? "border-cyan/50 bg-elevated shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_12px_32px_-16px_rgba(34,211,238,0.35)]"
          : "border-border bg-surface hover:-translate-y-0.5 hover:border-[#2a3a55] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
              isSelected ? "border-cyan" : "border-[#2a3a55]"
            }`}
          >
            {isSelected && <span className="h-2 w-2 rounded-full bg-cyan" />}
          </span>
          <h3 className="text-[15px] font-bold uppercase tracking-tight text-ink">{route.name}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isFastest && (
            <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-cyan">
              CURRENT FASTEST
            </span>
          )}
          <span
            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${delay.chip} ${delay.text}`}
          >
            {route.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        <Metric label="CURRENT ETA">
          <p className="font-mono text-[26px] font-semibold leading-none tracking-tight text-ink">
            {formatMinutes(route.currentTravelTime)}
          </p>
        </Metric>
        <Metric label="DELAY">
          <p className={`font-mono text-lg font-semibold leading-none ${delay.text}`}>
            {formatDelay(route.delay)}
          </p>
        </Metric>
        <Metric label="CIVIC SIGNALS">
          <p className="flex items-center gap-1.5 font-mono text-sm font-semibold leading-none text-ink sm:text-[15px]">
            <Radio size={14} className="hidden shrink-0 text-cyan sm:block" />
            <span className="whitespace-nowrap">{formatSignalCount(route.signalCount)}</span>
          </p>
        </Metric>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 font-mono text-xs text-muted">
        <span>
          NORMAL <span className="ml-1 font-medium text-ink">{formatMinutes(route.normalTravelTime)}</span>
        </span>
        <span>
          DISTANCE <span className="ml-1 font-medium text-ink">{route.distance} km</span>
        </span>
      </div>
    </button>
  );
}
