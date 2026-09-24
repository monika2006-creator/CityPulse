import SeverityGlyph from "./SeverityGlyph.jsx";

// Situation severity (LOW | MEDIUM | HIGH | CRITICAL) → theme classes and glyph.
//   LOW → green   MEDIUM → amber   HIGH / CRITICAL → pink/red
// Colours are only ever used for severity here. Shape + label carry the meaning too, so it
// never relies on colour alone; CRITICAL is set apart from HIGH by a stronger chip.
// Class names are written out in full so Tailwind can see them.
export const SITUATION_SEVERITY = {
  low: {
    label: "LOW",
    glyph: "normal",
    text: "text-normal-ink",
    chip: "bg-normal/10",
    edge: "border-l-normal",
  },
  medium: {
    label: "MEDIUM",
    glyph: "attention",
    text: "text-attention-ink",
    chip: "bg-attention/10",
    edge: "border-l-attention",
  },
  high: {
    label: "HIGH",
    glyph: "critical",
    text: "text-critical-ink",
    chip: "bg-critical/10",
    edge: "border-l-critical",
  },
  critical: {
    label: "CRITICAL",
    glyph: "critical",
    text: "text-critical-ink",
    chip: "bg-critical/15 ring-1 ring-inset ring-critical/40",
    edge: "border-l-critical",
  },
};

export const getSituationSeverity = (severity) => SITUATION_SEVERITY[severity] ?? SITUATION_SEVERITY.medium;

export default function SeverityBadge({ severity, className = "" }) {
  const sev = getSituationSeverity(severity);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold leading-none tracking-wide ${sev.chip} ${sev.text} ${className}`}
    >
      <SeverityGlyph severity={sev.glyph} size={10} />
      {sev.label}
    </span>
  );
}
