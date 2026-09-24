import { getDelaySeverity, formatMinutes } from "../utils/routeHelpers.js";

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
export default function EtaComparison({ routes, fastestId }) {
  const maxEta = Math.max(...routes.map((route) => route.currentTravelTime));

  return (
    <section aria-label="Current ETA comparison" className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-[12px] font-bold tracking-[0.12em] text-ink">CURRENT ETA</h3>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Bar legend">
          <LegendItem className="bg-[#2a3a55]" label="NORMAL TIME" />
          <LegendItem className="bg-attention" label="DELAY" />
          <LegendItem className="bg-cyan" label="LOWEST CURRENT ETA" />
        </ul>
      </div>

      <ul className="mt-4 space-y-3.5">
        {routes.map((route) => {
          const isFastest = route.id === fastestId;
          const normalPart = Math.min(route.normalTravelTime, route.currentTravelTime);
          const delayPart = Math.max(route.currentTravelTime - route.normalTravelTime, 0);
          const severity = getDelaySeverity(route);

          return (
            <li
              key={route.id}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_4rem]"
            >
              <span className={`truncate text-[13px] font-semibold ${isFastest ? "text-ink" : "text-muted"}`}>
                {route.name}
              </span>

              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-bg/70"
                role="img"
                aria-label={`${route.name}: ${route.normalTravelTime} minutes normal plus ${delayPart} minutes delay`}
              >
                <div
                  className={`h-full ${isFastest ? "bg-cyan" : "bg-[#2a3a55]"}`}
                  style={{ width: `${(normalPart / maxEta) * 100}%` }}
                />
                <div
                  className={`h-full ${DELAY_BAR[severity]}`}
                  style={{ width: `${(delayPart / maxEta) * 100}%` }}
                />
              </div>

              <span
                className={`text-right font-mono text-[13px] font-semibold ${
                  isFastest ? "text-cyan" : "text-ink"
                }`}
              >
                {formatMinutes(route.currentTravelTime)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        Simulated current ETAs on one scale; delay colour shows severity. A comparison, not a ranking.
      </p>
    </section>
  );
}
