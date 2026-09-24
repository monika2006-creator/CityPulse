import { MapPin, Radio } from "lucide-react";
import SeverityGlyph from "./SeverityGlyph.jsx";
import { TYPE_ICON, SEVERITY_STYLES } from "./SignalRow.jsx";
import { SEVERITY_MARKER } from "../data/mapConfig.js";

function formatReading(value, unit) {
  if (value === undefined || value === null) return "—";
  if (!unit) return String(value);
  return unit === "%" ? `${value}%` : `${value} ${unit}`;
}

// Popup body for a signal marker. Rendered inside a Leaflet popup,
// styled with the CityPulse tokens (see MapView.css for the popup shell).
export default function SignalPopup({ signal }) {
  const Icon = TYPE_ICON[signal.type] ?? Radio;
  const sev = SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.normal;
  const markerLabel = (SEVERITY_MARKER[signal.severity] ?? SEVERITY_MARKER.normal).label;

  return (
    <article className="w-[264px] p-4" aria-label={`${signal.title}, ${signal.area}`}>
      <div className="flex items-center gap-2 pr-7">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${sev.chip}`}>
          <Icon size={13} className={sev.text} />
        </span>
        <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          {signal.category}
        </span>
      </div>

      <h3 className="mt-2.5 text-[15px] font-bold uppercase leading-snug tracking-tight text-ink">
        {signal.title}
      </h3>
      <p className="flex items-center gap-1.5 pt-1 text-xs text-muted">
        <MapPin size={12} className="shrink-0 text-violet" />
        <span className="truncate">{signal.area}</span>
      </p>

      <div className="mt-3.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">CHANGE</p>
          <p className={`font-mono text-[26px] font-semibold leading-tight tracking-tight ${sev.text}`}>
            {signal.change}
          </p>
        </div>
        <span
          className={`mb-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold tracking-wide ${sev.chip} ${sev.text}`}
        >
          <SeverityGlyph severity={signal.severity} size={10} />
          {markerLabel}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted">READING</dt>
          <dd className="mt-0.5 break-words font-mono text-[13px] font-medium text-ink">
            {formatReading(signal.value, signal.unit)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted">DETECTED</dt>
          <dd className="mt-0.5 font-mono text-[13px] font-medium text-ink">
            {signal.detectedAt.slice(0, 5)}
          </dd>
        </div>
      </dl>

      <p className="pt-3 text-[13px] leading-relaxed text-muted">{signal.description}</p>

      <p className="pt-3 font-mono text-[10px] tracking-wide text-muted/80">
        {signal.id} · SIMULATED SIGNAL
      </p>
    </article>
  );
}
