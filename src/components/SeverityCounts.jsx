import SeverityGlyph from "./SeverityGlyph.jsx";
import { SITUATION_SEVERITY } from "./SeverityBadge.jsx";

const ORDER = ["critical", "high", "medium", "low"];

// Situation counts per severity, e.g. HIGH 01  MEDIUM 02  LOW 00.
// Zero counts are kept with a muted number and glyph. `hideEmptyCritical`
// drops CRITICAL when there are none, to keep small cards tidy.
export default function SeverityCounts({ counts, hideEmptyCritical = false, className = "" }) {
  const levels = ORDER.filter((level) => !(hideEmptyCritical && level === "critical" && counts[level] === 0));

  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`} aria-label="Situations by severity">
      {levels.map((level) => {
        const sev = SITUATION_SEVERITY[level];
        const count = counts[level] ?? 0;
        return (
          <li key={level} className="flex items-center gap-1.5">
            <SeverityGlyph severity={sev.glyph} size={11} className={count === 0 ? "opacity-40" : ""} />
            <span className="font-mono text-[10.5px] font-medium tracking-wide text-muted">{sev.label}</span>
            <span className={`font-mono text-[12px] font-semibold ${count > 0 ? sev.text : "text-muted"}`}>
              {String(count).padStart(2, "0")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
