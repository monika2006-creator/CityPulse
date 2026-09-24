import { useState } from "react";
import { Lightbulb, Route as RouteIcon } from "lucide-react";
import MapView from "./MapView.jsx";
import SeverityGlyph from "./SeverityGlyph.jsx";
import { SEVERITY_STYLES } from "./SignalRow.jsx";
import { SEVERITY_MARKER } from "../data/mapConfig.js";
import {
  getDelaySeverity,
  getRouteSignals,
  formatMinutes,
  formatDelay,
  formatSignalCount,
} from "../utils/routeHelpers.js";

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold leading-none">{children}</p>
    </div>
  );
}

function SectionTitle({ children, icon: Icon, iconClass = "text-cyan" }) {
  return (
    <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-ink">
      {Icon && <Icon size={13} className={iconClass} />}
      {children}
    </h4>
  );
}

// One civic signal linked to the route. Shows the signal's OWN reading and change —
// signals explain the route's condition, they are not summed into its ETA.
function RouteSignalItem({ signal }) {
  const sev = SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.normal;
  const label = (SEVERITY_MARKER[signal.severity] ?? SEVERITY_MARKER.normal).label;

  return (
    <li className="rounded-lg border border-border bg-bg/40 p-3">
      <div className="flex items-start gap-3">
        <SeverityGlyph severity={signal.severity} size={13} className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{signal.title}</p>
            <span className={`shrink-0 font-mono text-sm font-semibold ${sev.text}`}>{signal.change}</span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {signal.area} · {signal.detectedAt.slice(0, 5)}
            <span className={`ml-2 rounded px-1 py-px text-[10px] font-semibold ${sev.chip} ${sev.text}`}>
              {label}
            </span>
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{signal.description}</p>
        </div>
      </div>
    </li>
  );
}

// Factual explanation built only from the route data and its linked signals.
function buildExplanation(route, fastest, routes, linked) {
  const parts = [];

  if (route.id === fastest.id) {
    const others = routes
      .filter((other) => other.id !== route.id)
      .map((other) => `${other.name} ${formatMinutes(other.currentTravelTime)}`);
    parts.push(
      `Current simulated ETA is ${formatMinutes(route.currentTravelTime)}, the lowest of the ${routes.length} available routes` +
        (others.length ? ` (${others.join(", ")}).` : ".")
    );
  } else {
    const gap = route.currentTravelTime - fastest.currentTravelTime;
    parts.push(
      `Current simulated ETA is ${formatMinutes(route.currentTravelTime)}, ${
        gap > 0 ? `${formatMinutes(gap)} slower than` : "the same as"
      } ${fastest.name}, the route with the lowest current ETA.`
    );
  }

  parts.push(
    route.delay > 0
      ? `It is running ${formatMinutes(route.delay)} over its normal ${formatMinutes(route.normalTravelTime)}.`
      : `It is running at its normal ${formatMinutes(route.normalTravelTime)}.`
  );

  if (linked.length === 0) {
    parts.push("No civic signals are linked to this route in the demo data.");
  } else {
    const counts = ["critical", "attention", "normal"]
      .map((key) => [key, linked.filter((signal) => signal.severity === key).length])
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${count} ${key}`);
    parts.push(`Linked civic conditions: ${counts.join(", ")}.`);
  }

  return parts.join(" ");
}

export default function RouteDetail({ route, routes, fastest, signals }) {
  const [selectedSignalId, setSelectedSignalId] = useState(null);
  const delay = SEVERITY_STYLES[getDelaySeverity(route)];
  const linked = getRouteSignals(route, signals);
  const isFastest = route.id === fastest.id;

  return (
    <section aria-label={`${route.name} details`} className="rounded-xl border border-cyan/30 bg-surface p-5 shadow-[0_12px_36px_-20px_rgba(34,211,238,0.3)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-cyan">SELECTED ROUTE</p>
          <h3 className="mt-1 text-lg font-bold uppercase tracking-tight text-ink">{route.name}</h3>
        </div>
        {isFastest && (
          <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-cyan">
            CURRENT FASTEST
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4 rounded-lg border border-border bg-bg/40 p-4">
        <Stat label="CURRENT ETA">
          <span className="text-xl text-ink">{formatMinutes(route.currentTravelTime)}</span>
        </Stat>
        <Stat label="NORMAL ETA">
          <span className="text-xl text-muted">{formatMinutes(route.normalTravelTime)}</span>
        </Stat>
        <Stat label="DELAY">
          <span className={`text-xl ${delay.text}`}>{formatDelay(route.delay)}</span>
        </Stat>
        <Stat label="DISTANCE">
          <span className="text-ink">{route.distance} km</span>
        </Stat>
        <Stat label="SIGNALS">
          <span className="text-ink">{route.signalCount}</span>
        </Stat>
      </div>

      <div className="mt-6">
        <SectionTitle>CIVIC CONDITIONS</SectionTitle>
        {linked.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {linked.map((signal) => (
              <RouteSignalItem key={signal.id} signal={signal} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">No civic signals are linked to this route in the demo data.</p>
        )}
        {linked.length > 0 && linked.length < route.signalCount && (
          <p className="mt-2 text-xs text-muted">
            {linked.length} of {formatSignalCount(route.signalCount)} are linked in the demo data.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <SectionTitle icon={Lightbulb} iconClass="text-violet">
          WHY THIS ROUTE?
        </SectionTitle>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          {buildExplanation(route, fastest, routes, linked)}
        </p>
        <p className="mt-2 text-xs text-muted/80">
          Signals explain the route's conditions. The ETA is the simulated current travel time, not a sum of signals.
        </p>
      </div>

      {linked.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <SectionTitle icon={RouteIcon}>SIGNALS ON THIS ROUTE</SectionTitle>
          <div className="relative isolate mt-3 h-[420px] overflow-hidden rounded-xl border border-border bg-sidebar">
            {/* key: re-frame the map whenever the selected route changes */}
            <MapView
              key={route.id}
              signals={linked}
              selectedId={selectedSignalId}
              focus={null}
              onSelect={setSelectedSignalId}
              onDeselect={(id) => setSelectedSignalId((current) => (current === id ? null : current))}
            />
          </div>
          <p className="mt-2 font-mono text-[10.5px] tracking-wide text-muted">
            SIMULATED DATA · ROUTE PATH NOT DRAWN · MAP © OPENSTREETMAP
          </p>
        </div>
      )}
    </section>
  );
}
