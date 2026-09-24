const SEVERITY_STYLES = {
  attention: { text: "text-attention", border: "border-l-attention", chip: "bg-attention/10" },
  critical: { text: "text-critical", border: "border-l-critical", chip: "bg-critical/10" },
  normal: { text: "text-normal", border: "border-l-normal", chip: "bg-normal/10" },
};

export default function SituationCard({ situation }) {
  const sev = SEVERITY_STYLES[situation.severity] ?? SEVERITY_STYLES.attention;

  return (
    <div
      className={`rounded-lg border border-border ${sev.border} border-l-2 bg-bg/40 p-3.5 transition-colors duration-200 hover:border-[#2a3a55]`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-tight text-ink">
          {situation.title}
        </p>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${sev.chip} ${sev.text}`}
        >
          {situation.severity.toUpperCase()}
        </span>
      </div>

      <p className="mt-1 font-mono text-xs text-muted">
        {situation.area} · {situation.detectedAt.slice(0, 5)}
        <span className={`ml-2 font-sans font-medium ${sev.text}`}>
          {situation.confidence}% confidence
        </span>
      </p>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">{situation.description}</p>
    </div>
  );
}
