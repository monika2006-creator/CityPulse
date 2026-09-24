import SeverityBadge, { getSituationSeverity } from "./SeverityBadge.jsx";

// Compact situation summary for the Overview. The full explanation lives on the Situations page.
export default function SituationCard({ situation }) {
  const sev = getSituationSeverity(situation.severity);

  return (
    <div
      className={`rounded-lg border border-border ${sev.edge} border-l-[3px] bg-inset p-3.5 transition-colors duration-200 hover:border-line`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-tight text-ink">{situation.title}</p>
        <SeverityBadge severity={situation.severity} />
      </div>

      <p className="mt-1.5 font-mono text-xs text-muted">
        {situation.area} · {situation.detectedAt.slice(0, 5)} · {situation.relatedSignalIds.length} signals
      </p>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">{situation.description}</p>

    </div>
  );
}
