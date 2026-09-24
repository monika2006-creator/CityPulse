import { formatMinutes, formatDelay, formatDelayPercent } from "../utils/routeCalculations.js";
import { formatSignalCount } from "../utils/routeHelpers.js";

const DELAY_TEXT = {
  normal: "text-normal-ink",
  attention: "text-attention-ink",
  critical: "text-critical-ink",
};

const DELAY_BAR = {
  normal: "bg-normal",
  attention: "bg-attention",
  critical: "bg-critical",
};

function LegendItem({ className, label }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${className}`} aria-hidden="true" />
      <span className="font-mono text-[10.5px] tracking-wide text-muted">{label}</span>
    </li>
  );
}

// Simple comparison of current simulated ETAs. Bar length is proportional to minutes
// (starting from zero), split into normal time and delay. Longer bar = longer trip.
export default function EtaComparison({ routes, lowestIds }) {
  const maxEta = Math.max(1, ...routes.map((route) => route.currentTravelTime ?? 0));

  return (
    <section aria-label="Current ETA comparison" className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-[12px] font-bold tracking-[0.12em] text-ink">CURRENT ETA</h3>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Bar legend">
          <LegendItem className="bg-line" label="NORMAL TIME" />
          <LegendItem className="bg-attention" label="DELAY" />
          <LegendItem className="bg-cyan" label="LOWEST CURRENT ETA" />
        </ul>
      </div>

      <ul className="mt-4 space-y-3.5">
        {routes.map((route) => {
          const isFastest = lowestIds.has(route.id);
          const current = route.currentTravelTime ?? 0;
          const delayPart = route.hasDelayData ? route.delay : 0;
          const normalPart = Math.max(current - delayPart, 0);
          const severity = route.severity ?? "normal";

          return (
            <li
              key={route.id}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_6.5rem]"
            >
              <div className="min-w-0">
                <p className={`truncate text-[13px] font-semibold ${isFastest ? "text-ink" : "text-muted"}`}>{route.name}</p>
                <p className="truncate font-mono text-[10.5px] text-muted">{formatSignalCount(route.signalTotal)}</p>
              </div>

              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-inset"
                role="img"
                aria-label={`${route.name}: ${formatMinutes(route.currentTravelTime)} current, ${formatDelay(route)}, ${route.statusLabel.toLowerCase()}`}
              >
                <div
                  className={`h-full ${isFastest ? "bg-cyan" : "bg-line"}`}
                  style={{ width: `${(normalPart / maxEta) * 100}%` }}
                />
                <div
                  className={`h-full ${DELAY_BAR[severity]}`}
                  style={{ width: `${(delayPart / maxEta) * 100}%` }}
                />
              </div>

              <div className="text-right font-mono">
                <p className={`text-[13px] font-semibold ${isFastest ? "text-cyan-ink" : "text-ink"}`}>
                  {formatMinutes(route.currentTravelTime)}
                </p>
                <p className={`text-[10.5px] ${route.hasDelayData ? DELAY_TEXT[severity] : "text-muted"}`}>
                  {route.hasDelayData ? `${formatDelay(route)} · ${formatDelayPercent(route)}` : "Delay unavailable"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        Simulated data on one scale. A side-by-side comparison, not a ranking.
      </p>
    </section>
  );
}
