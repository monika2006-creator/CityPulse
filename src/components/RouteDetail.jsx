import { useState } from "react";
import { Lightbulb, Route as RouteIcon } from "lucide-react";
import MapView from "./MapView.jsx";
import SeverityGlyph from "./SeverityGlyph.jsx";
import { SEVERITY_STYLES } from "./SignalRow.jsx";
import RouteSituations from "./RouteSituations.jsx";
import RouteCorrelations from "./RouteCorrelations.jsx";
import RouteStatusBadge, { getDelayStyle } from "./RouteStatusBadge.jsx";
import { SEVERITY_MARKER } from "../data/mapConfig.js";
import { getRouteSignals, formatSignalCount } from "../utils/routeHelpers.js";
import {
  formatMinutes,
  formatDelay,
  formatDelayPercent,
  formatFasterNote,
} from "../utils/routeCalculations.js";

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 font-mono font-semibold leading-none">{children}</p>
    </div>
  );
}

function SectionTitle({ children, icon: Icon, iconClass = "text-cyan-ink" }) {
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
    <li className="rounded-lg border border-border bg-inset p-3">
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

// Factual summary built only from the route data and its linked signals.
function buildExplanation(route, lowest, routes, linked) {
  const parts = [];
  const etaSource = route.source === "tomtom" ? "current" : "simulated current";

  const isLowest = lowest.routes.some((low) => low.id === route.id);

  if (route.currentTravelTime === null) {
    parts.push(`${etaSource} ETA is unavailable for this route.`);
  } else if (isLowest) {
    const others = routes
      .filter((other) => other.id !== route.id && other.currentTravelTime !== null)
      .map((other) => `${other.name} ${formatMinutes(other.currentTravelTime)}`);
    parts.push(
      `${etaSource.charAt(0).toUpperCase()}${etaSource.slice(1)} ETA is ${formatMinutes(route.currentTravelTime)}, ${
        lowest.isTie ? "tied for the lowest" : "the lowest"
      } of the available routes` + (others.length ? ` (${others.join(", ")}).` : ".")
    );
  } else {
    const gap = route.currentTravelTime - lowest.minutes;
    parts.push(
      `${etaSource.charAt(0).toUpperCase()}${etaSource.slice(1)} ETA is ${formatMinutes(route.currentTravelTime)}, ${formatMinutes(gap)} higher than the lowest current ETA${
        lowest.isTie ? "" : ` (${lowest.routes[0].name})`
      }.`
    );
  }

  if (!route.hasDelayData) {
    parts.push("Delay could not be calculated because the route's travel-time data is incomplete.");
  } else if (route.delay > 0) {
    parts.push(
      `Delay is ${formatDelay(route)} (${formatDelayPercent(route)}) against a normal ${formatMinutes(route.normalTravelTime)}.`
    );
  } else {
    parts.push(`It is running at or under its normal ${formatMinutes(route.normalTravelTime)}.`);
  }

  if (linked.length === 0) {
    parts.push("No traffic signals were returned for this route.");
  } else {
    const counts = ["critical", "attention", "normal"]
      .map((key) => [key, linked.filter((signal) => signal.severity === key).length])
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${count} ${key}`);
    parts.push(`Signals observed along this route: ${counts.join(", ")}.`);
  }

  return parts.join(" ");
}

export default function RouteDetail({ route, routes, lowest, signals, situations, correlations }) {
  const [selectedSignalId, setSelectedSignalId] = useState(null);
  const delay = getDelayStyle(route);
  const linked = getRouteSignals(route, signals);
  const isLowest = lowest.routes.some((low) => low.id === route.id);

  return (
    <section aria-label={`${route.name} details`} className="rounded-xl border border-cyan/30 bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-cyan-ink">SELECTED ROUTE</p>
          <h3 className="mt-1 text-lg font-bold uppercase tracking-tight text-ink">{route.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {isLowest && (
            <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-cyan-ink">
              LOWEST CURRENT ETA{lowest.isTie && " — TIE"}
            </span>
          )}
          <RouteStatusBadge route={route} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-inset p-4">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">CURRENT ETA · {route.source === "tomtom" ? "TOMTOM LIVE" : "SIMULATED"}</p>
        <p className="mt-1.5 font-mono text-3xl font-semibold leading-none tracking-tight text-ink">
          {formatMinutes(route.currentTravelTime)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-border pt-4 sm:grid-cols-4">
          <Stat label="NORMAL">
            <span className="text-sm text-muted">{formatMinutes(route.normalTravelTime)}</span>
          </Stat>
          <Stat label="DELAY">
            {route.hasDelayData ? (
              <span className={`text-sm ${delay.text}`}>{formatDelay(route)}</span>
            ) : (
              <span className="font-sans text-xs font-medium text-muted">{formatDelay(route)}</span>
            )}
          </Stat>
          <Stat label="DELAY %">
            <span className={`text-sm ${route.hasDelayData ? delay.text : "text-muted"}`}>{formatDelayPercent(route)}</span>
          </Stat>
          <Stat label="SIGNALS">
            <span className="text-sm text-ink">{route.signalTotal}</span>
          </Stat>
        </div>
        {formatFasterNote(route) && <p className="mt-3 font-mono text-[11px] text-muted">{formatFasterNote(route)}</p>}
        <p className="mt-3 font-mono text-[10.5px] text-muted">
          DISTANCE <span className="ml-1 font-medium text-ink">{route.distance != null ? `${route.distance} km` : "—"}</span>
        </p>
      </div>

      <div className="mt-6">
        <SectionTitle>SUPPORTING CIVIC SIGNALS</SectionTitle>
        <p className="mt-1 text-xs text-muted">Signals observed along this route. They add context; they do not set the ETA.</p>
        {linked.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {linked.map((signal) => (
              <RouteSignalItem key={signal.id} signal={signal} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">No traffic signals were returned for this route.</p>
        )}
        <RouteSituations route={route} situations={situations} />
        <RouteCorrelations route={route} correlations={correlations} />
        {linked.length > 0 && linked.length < route.signalTotal && (
          <p className="mt-2 text-xs text-muted">
            {linked.length} of {formatSignalCount(route.signalTotal)} are available with map coordinates.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <SectionTitle icon={Lightbulb} iconClass="text-violet">
          ROUTE CONDITIONS
        </SectionTitle>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          {buildExplanation(route, lowest, routes, linked)}
        </p>
        <p className="mt-2 text-xs text-muted">
          Delay is calculated from the route response's current and normal travel times. Traffic signals provide context and are not added to the ETA.
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
            {route.source === "tomtom" ? "TOMTOM TRAFFIC SIGNALS · MAP © OPENSTREETMAP" : "SIMULATED ROUTE SIGNALS · MAP © OPENSTREETMAP"}
          </p>
        </div>
      )}
    </section>
  );
}
