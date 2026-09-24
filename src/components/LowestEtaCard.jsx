import { ArrowRight, Check, Info } from "lucide-react";
import RouteStatusBadge, { getDelayStyle } from "./RouteStatusBadge.jsx";
import RouteSituations from "./RouteSituations.jsx";
import { getRouteSignals } from "../utils/routeHelpers.js";
import { formatMinutes, formatDelay, formatDelayPercent, DELAY_UNAVAILABLE_TEXT } from "../utils/routeCalculations.js";

function Figure({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <div className="mt-1 font-mono text-sm font-semibold leading-none">{children}</div>
    </div>
  );
}

// Normal ETA / delay / delay % / supporting-signal count for one calculated route.
function RouteFigures({ route }) {
  const delay = getDelayStyle(route);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      <Figure label="NORMAL ETA">
        <span className="text-muted">{formatMinutes(route.normalTravelTime)}</span>
      </Figure>
      <Figure label="DELAY">
        {route.hasDelayData ? (
          <span className={delay.text}>{formatDelay(route)}</span>
        ) : (
          <span className="font-sans text-xs font-medium text-muted">{DELAY_UNAVAILABLE_TEXT}</span>
        )}
      </Figure>
      <Figure label="DELAY %">
        <span className={route.hasDelayData ? delay.text : "text-muted"}>{formatDelayPercent(route)}</span>
      </Figure>
      <Figure label="SUPPORTING SIGNALS">
        <span className="text-ink">{route.signalTotal}</span>
      </Figure>
    </div>
  );
}

function SelectButton({ route, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(route.id)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Selected" : "Select"} ${route.name} for details`}
      className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-bold tracking-wide transition-colors duration-200 ${
        isSelected
          ? "border-cyan/50 bg-cyan/10 text-cyan-ink"
          : "border-cyan/30 text-cyan-ink hover:border-cyan/60 hover:bg-cyan/10"
      }`}
    >
      {isSelected ? <Check size={15} strokeWidth={2.5} /> : <ArrowRight size={15} strokeWidth={2.5} />}
      {isSelected ? "ROUTE SELECTED" : "VIEW DETAILS"}
    </button>
  );
}

const Shell = ({ label, children }) => (
  <section
    aria-label={label}
    className="relative overflow-hidden rounded-2xl border border-cyan/25 bg-elevated p-5 shadow-card sm:p-6"
  >
    {children}
  </section>
);

// Explanation: which routes were compared and why this one is lowest. Uses only the
// calculated route objects — nothing here is hardcoded.
function buildExplanation(lowest, routes, isLive) {
  const others = routes
    .filter((route) => route.currentTravelTime !== null && !lowest.routes.some((low) => low.id === route.id))
    .sort((a, b) => a.currentTravelTime - b.currentTravelTime)
    .map((route) => `${formatMinutes(route.currentTravelTime)} on ${route.name}`);
  const names = lowest.routes.map((route) => route.name);

  if (lowest.isTie) {
    return `${names.join(" and ")} share the lowest ${isLive ? "current" : "simulated current"} ETA (${formatMinutes(lowest.minutes)}). The available data does not distinguish between them.`;
  }
  const base = `${names[0]} currently has the lowest ${isLive ? "live" : "simulated"} travel time among the available routes.`;
  return others.length
    ? `${base} ${formatMinutes(lowest.minutes)} current ETA, compared with ${others.join(" and ")}.`
    : `${base} It is the only route with a valid current ETA.`;
}

// The route(s) with the lowest CURRENT simulated ETA. Based on currentTravelTime only —
// a comparison of demo data, not a recommendation of real-world navigation.
export default function LowestEtaCard({ lowest, routes, signals, situations, selectedId, onSelect }) {
  const isLive = routes[0]?.source === "tomtom";
  if (lowest.routes.length === 0) {
    return (
      <Shell label="Route ETA unavailable">
        <p className="text-[11px] font-bold tracking-[0.14em] text-muted">CURRENT LOWEST ETA</p>
        <p className="mt-2 text-lg font-bold text-ink">Route ETA unavailable</p>
        <p className="mt-1 text-[13px] text-muted">No route response contains a valid ETA.</p>
      </Shell>
    );
  }

  const [first] = lowest.routes;
  const linked = lowest.isTie ? [] : getRouteSignals(first, signals);

  return (
    <Shell label={`Route with the lowest ${isLive ? "live" : "simulated"} current ETA`}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold tracking-[0.14em] text-cyan-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
        CURRENT LOWEST ETA{lowest.isTie && " — TIE"}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <h3 className="min-w-0 break-words text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
          {lowest.isTie ? lowest.routes.map((route) => route.name).join(" · ") : first.name}
        </h3>
        <p className="font-mono text-4xl font-semibold leading-none tracking-tight text-cyan-ink sm:text-5xl">
          {formatMinutes(lowest.minutes)}
        </p>
      </div>
      <p className="mt-1.5 text-[10px] font-semibold tracking-[0.1em] text-muted">
        CURRENT ETA{lowest.isTie && " · EACH"} · {isLive ? "TOMTOM LIVE" : "SIMULATED"}
      </p>

      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">{buildExplanation(lowest, routes, isLive)}</p>

      {lowest.isTie ? (
        <ul className="mt-4 space-y-3">
          {lowest.routes.map((route) => (
            <li key={route.id} className="rounded-lg border border-border bg-inset p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold uppercase text-ink">{route.name}</p>
                <RouteStatusBadge route={route} />
              </div>
              <div className="mt-3">
                <RouteFigures route={route} />
              </div>
              <div className="mt-3">
                <SelectButton route={route} isSelected={selectedId === route.id} onSelect={onSelect} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-inset p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">ROUTE CONDITIONS</p>
            <RouteStatusBadge route={first} />
          </div>
          <div className="mt-3">
            <RouteFigures route={first} />
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted">SUPPORTING CIVIC SIGNALS</p>
            {linked.length > 0 ? (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[13px] text-ink marker:text-muted">
                {linked.map((signal) => (
                  <li key={signal.id}>{signal.title}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[13px] text-muted">No traffic signals were returned for this route.</p>
            )}
            <p className="mt-1.5 text-xs text-muted">Signals observed along this route add context; they do not set the ETA.</p>
            <RouteSituations route={first} situations={situations} />
          </div>
        </div>
      )}

      {!lowest.isTie && (
        <div className="mt-4">
          <SelectButton route={first} isSelected={selectedId === first.id} onSelect={onSelect} />
        </div>
      )}

      <p className="mt-5 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted">
        <Info size={13} className="mt-px shrink-0" aria-hidden="true" />
        {isLive ? "TomTom traffic-aware routing response; not turn-by-turn navigation." : "Simulated scenario routes. Configure TomTom to request live routing."}
      </p>
    </Shell>
  );
}
