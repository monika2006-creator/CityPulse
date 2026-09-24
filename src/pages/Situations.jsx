import { AlertTriangle, ShieldCheck } from "lucide-react";
import SituationDetailCard from "../components/SituationDetailCard.jsx";
import SeverityCounts from "../components/SeverityCounts.jsx";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

// Detected situations, most serious first (the engine already sorts them).
// Each card explains WHAT was detected, WHERE, HOW SERIOUS it is and WHY it was detected.
export default function Situations() {
  const { activeSituations: situations, severityCounts: counts, activeSignals, dataMode, loading, state, error } = useCityPulseData();
  const signalCount = activeSignals.length;
  if (loading && !state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">Loading detected situations…</p>;
  if (!state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">Backend data unavailable: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-ink">Situations</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            A situation is a pattern of related signals detected close together in place and time. Detection is
            rule-based and describes what appears together, not what caused it.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{dataMode}</span>
        </div>
      </div>

      <section
        aria-label="Situation summary"
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-xl border border-border bg-surface p-4 shadow-card sm:px-5"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-attention/10">
            <AlertTriangle size={18} className="text-attention-ink" />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.1em] text-muted">ACTIVE SITUATIONS</p>
            <p className="font-mono text-2xl font-semibold leading-tight text-ink" aria-live="polite">
              {String(situations.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <SeverityCounts counts={counts} />

        <p className="font-mono text-[11px] leading-relaxed text-muted">
          FROM {signalCount} {signalCount === 1 ? "SIGNAL" : "SIGNALS"} · RULE-BASED · NO AI
        </p>
      </section>

      {situations.length > 0 ? (
        <div className="space-y-5">
          {situations.map((situation) => (
            <SituationDetailCard key={situation.id} situation={situation} signals={activeSignals} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-normal/25 bg-normal/10">
            <ShieldCheck size={19} className="text-normal-ink" />
          </span>
          <p className="text-sm font-semibold text-ink">No situations detected</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">
            None of the current signals form a pattern that matches a detection rule.
          </p>
        </div>
      )}
    </div>
  );
}
