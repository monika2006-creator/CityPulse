import { Clock, Lightbulb, MapPin, Radio } from "lucide-react";
import SeverityBadge, { getSituationSeverity } from "./SeverityBadge.jsx";
import SeverityGlyph from "./SeverityGlyph.jsx";
import { TYPE_ICON, SEVERITY_STYLES } from "./SignalRow.jsx";
import { SEVERITY_MARKER } from "../data/mapConfig.js";

const Label = ({ children }) => (
  <h4 className="text-[10px] font-bold tracking-[0.12em] text-muted">{children}</h4>
);

// One supporting signal, so the person can see exactly what the situation is built from.
function SupportingSignal({ signal }) {
  const Icon = TYPE_ICON[signal.type] ?? Radio;
  const sev = SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.normal;
  const sevLabel = (SEVERITY_MARKER[signal.severity] ?? SEVERITY_MARKER.normal).label;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-inset px-3 py-2.5">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sev.chip}`}>
        <Icon size={14} className={sev.text} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{signal.title}</p>
        <p className="truncate font-mono text-[11px] text-muted">
          {signal.area} · {signal.detectedAt.slice(0, 5)} · {signal.id}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 font-mono text-[9.5px] font-semibold leading-none tracking-wide ${sev.chip} ${sev.text}`}
      >
        <SeverityGlyph severity={signal.severity} size={9} />
        <span className="hidden sm:inline">{sevLabel}</span>
        <span className="sr-only sm:hidden">{sevLabel}</span>
      </span>
    </li>
  );
}

// A detected situation, answering four questions in order:
//   WHAT (title + description) · WHERE (area, time) · HOW SERIOUS (severity, impact) · WHY (evidence).
export default function SituationDetailCard({ situation, signals = [] }) {
  const sev = getSituationSeverity(situation.severity);
  const signalsById = new Map(signals.map((signal) => [signal.id, signal]));
  const supporting = situation.relatedSignalIds
    .map((id) => signalsById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
  const nearbyCount = situation.areas.length - 1;
  const headingId = `${situation.id}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className={`overflow-hidden rounded-xl border border-border border-l-[3px] ${sev.edge} bg-surface shadow-card xl:grid xl:grid-cols-5`}
    >
      <div className="p-5 xl:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <h3 id={headingId} className="text-[15px] font-bold uppercase leading-snug tracking-tight text-ink">
            {situation.title}
          </h3>
          <SeverityBadge severity={situation.severity} className="mt-0.5" />
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0 text-violet" />
            <span className="font-medium text-ink">{situation.area}</span>
            {nearbyCount > 0 && <span>+ {nearbyCount} nearby</span>}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Clock size={12} className="shrink-0" />
            {situation.detectedAt.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Radio size={12} className="shrink-0" />
            {situation.relatedSignalIds.length} signals
          </span>
        </p>

        <p className="mt-3 text-[13px] leading-relaxed text-muted">{situation.description}</p>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">SUPPORTING EVIDENCE</p>
            <p className="mt-1.5 text-[13px] font-medium text-ink">
              {supporting.length} signals across {new Set(supporting.map((signal) => signal.type)).size} categories
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-elevated/50 p-5 xl:col-span-3 xl:border-l xl:border-t-0">
        <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-ink">
          <Lightbulb size={13} className="text-violet" />
          WHY THIS WAS DETECTED
        </h4>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{situation.whyDetected}</p>

        <div className="mt-4">
          <Label>SUPPORTING SIGNALS</Label>
          <ul className="mt-2 space-y-1.5">
            {supporting.map((signal) => (
              <SupportingSignal key={signal.id} signal={signal} />
            ))}
          </ul>
        </div>

      </div>
    </article>
  );
}
