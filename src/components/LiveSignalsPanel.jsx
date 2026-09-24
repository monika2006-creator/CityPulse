import SeverityGlyph from "./SeverityGlyph.jsx";
import { SEVERITY_STYLES } from "./SignalRow.jsx";

// Floating (wide screens) / stacked (smaller screens) list of the most relevant signals.
export default function LiveSignalsPanel({ signals, total, selectedId, onSelect, className = "" }) {
  return (
    <section
      aria-label="Live signals"
      className={`rounded-xl border border-border bg-surface shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_1px_rgba(34,211,238,0.6)]" />
          LIVE SIGNALS
        </h3>
        <span className="font-mono text-[10.5px] text-muted">
          <span className="text-cyan">{signals.length}</span> of {total}
        </span>
      </div>

      {signals.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">No signals to show.</p>
      ) : (
        <ul className="space-y-0.5 p-1.5">
          {signals.map((signal) => {
            const sev = SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.normal;
            const isSelected = signal.id === selectedId;
            return (
              <li key={signal.id}>
                <button
                  type="button"
                  onClick={() => onSelect(signal.id)}
                  aria-pressed={isSelected}
                  aria-label={`${signal.title}, ${signal.area}, ${signal.change}. Show on map`}
                  className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors duration-200 ${
                    isSelected
                      ? "border-cyan/40 bg-cyan/[0.07]"
                      : "border-transparent hover:bg-white/[0.05]"
                  }`}
                >
                  <SeverityGlyph severity={signal.severity} size={13} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {signal.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {signal.area}
                      <span className="font-mono"> · {signal.detectedAt.slice(0, 5)}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 font-mono text-[13px] font-semibold ${sev.text}`}>
                    {signal.change}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
