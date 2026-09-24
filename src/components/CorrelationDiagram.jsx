import { MapPin, Route as RouteIcon, Layers, Radio } from "lucide-react";
import { TYPE_ICON } from "./SignalRow.jsx";
import { CATEGORY_LABELS } from "../utils/signalCorrelation.js";
import { formatDelay, formatDelayPercent } from "../utils/routeCalculations.js";

const Connector = () => <div className="mx-auto h-4 w-px bg-line" aria-hidden="true" />;

function Node({ icon: Icon, iconClass = "text-cyan-ink", label, detail, className = "" }) {
  return (
    <div className={`flex min-w-0 max-w-full items-center gap-2 rounded-lg border bg-surface px-3 py-2 ${className || "border-border"}`}>
      <Icon size={14} className={`shrink-0 ${iconClass}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-ink">{label}</p>
        {detail && <div className="font-mono text-[10.5px] text-muted">{detail}</div>}
      </div>
    </div>
  );
}

// Compact relationship view built from simple nodes:
//   observed signals  ->  shared area  ->  related routes / situations.
// Every node carries visible text, so meaning never depends on the icons or connectors.
export default function CorrelationDiagram({ correlation, signals, routes, situations }) {
  const linkedSignals = correlation.signalIds.map((id) => signals.find((s) => s.id === id)).filter(Boolean);
  const linkedRoutes = correlation.routeIds.map((id) => routes.find((r) => r.id === id)).filter(Boolean);
  const linkedSituations = correlation.situationIds.map((id) => situations.find((s) => s.id === id)).filter(Boolean);
  const hasOutcomes = linkedRoutes.length > 0 || linkedSituations.length > 0;

  return (
    <figure
      aria-label={`Relationship: ${linkedSignals.length} signals around ${correlation.area}${
        linkedRoutes.length ? `, related to ${linkedRoutes.map((r) => r.name).join(", ")}` : ""
      }`}
      className="rounded-lg border border-border bg-inset p-3.5"
    >
      <div className="flex flex-wrap justify-center gap-2">
        {linkedSignals.map((signal) => (
          <Node
            key={signal.id}
            icon={TYPE_ICON[signal.type] ?? Radio}
            label={CATEGORY_LABELS[signal.type] ?? signal.type}
            detail={signal.detectedAt.slice(0, 5)}
          />
        ))}
      </div>
      <Connector />
      <div className="flex justify-center">
        <Node icon={MapPin} label={correlation.area} detail="SHARED AREA" className="border-cyan/40" />
      </div>
      {hasOutcomes && (
        <>
          <Connector />
          <div className="flex flex-wrap justify-center gap-2">
            {linkedRoutes.map((route) => (
              <Node
                key={route.id}
                icon={RouteIcon}
                iconClass="text-violet"
                label={`Route: ${route.name}`}
                detail={route.hasDelayData ? `${formatDelay(route)} · ${formatDelayPercent(route)}` : "Delay unavailable"}
              />
            ))}
            {linkedSituations.map((situation) => (
              <Node key={situation.id} icon={Layers} iconClass="text-violet" label={`Situation: ${situation.title}`} detail={situation.id} />
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
