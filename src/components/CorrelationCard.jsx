import { MapPin, Check } from "lucide-react";
import SignalRow from "./SignalRow.jsx";
import CorrelationDiagram from "./CorrelationDiagram.jsx";
import { CORRELATION_TYPE_LABELS } from "../utils/signalCorrelation.js";

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold leading-none text-ink">{children}</p>
    </div>
  );
}

const pad = (n) => String(n).padStart(2, "0");

// One detected relationship. Layers are kept apart on purpose:
//   observed signals -> detected relationship (evidence) -> possible interpretation.
export default function CorrelationCard({ correlation, signals, routes, situations }) {
  const supporting = correlation.signalIds.map((id) => signals.find((s) => s.id === id)).filter(Boolean);
  const linkedSituations = correlation.situationIds.map((id) => situations.find((s) => s.id === id)).filter(Boolean);
  const window =
    correlation.windowStart === correlation.windowEnd
      ? correlation.windowStart
      : `${correlation.windowStart}–${correlation.windowEnd}`;

  return (
    <article
      aria-label={correlation.title}
      className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-cyan-ink">
          {CORRELATION_TYPE_LABELS[correlation.type]}
        </span>
        <span className="font-mono text-[10.5px] text-muted">{correlation.id}</span>
      </div>

      <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">{correlation.title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
        <MapPin size={13} className="shrink-0" aria-hidden="true" />
        {correlation.area}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Meta label="WHEN">{window}</Meta>
        <Meta label="SIGNALS">{pad(correlation.signalIds.length)}</Meta>
        <Meta label="SITUATIONS">{pad(correlation.situationIds.length)}</Meta>
        <Meta label="ROUTES">{pad(correlation.routeIds.length)}</Meta>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-muted">{correlation.description}</p>

      <div className="mt-4">
        <CorrelationDiagram correlation={correlation} signals={signals} routes={routes} situations={situations} />
      </div>

      <div className="mt-5">
        <h4 className="text-[11px] font-bold tracking-[0.12em] text-ink">WHY THIS WAS DETECTED</h4>
        <p className="mt-1 text-xs text-muted">{correlation.overlapLabel}</p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {correlation.evidence.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1.5 rounded-md border border-border bg-inset px-2 py-1 text-xs text-ink"
            >
              <Check size={12} className="shrink-0 text-cyan-ink" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <h4 className="text-[11px] font-bold tracking-[0.12em] text-ink">OBSERVED SIGNALS</h4>
        <div className="mt-2.5 space-y-2">
          {supporting.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      {linkedSituations.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-[11px] font-bold tracking-[0.12em] text-ink">POSSIBLE INTERPRETATION</h4>
          <ul className="mt-2 space-y-1 text-[13px] text-muted">
            {linkedSituations.map((situation) => (
              <li key={situation.id}>
                <span className="font-semibold text-ink">{situation.title}</span>
                {situation.impact ? ` — ${situation.impact.charAt(0).toLowerCase()}${situation.impact.slice(1)}.` : "."}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted">An interpretation of the existing situation, not a confirmed explanation.</p>
        </div>
      )}
    </article>
  );
}
