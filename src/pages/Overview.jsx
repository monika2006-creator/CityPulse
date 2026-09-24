import { Activity, AlertTriangle, Radio, MapPin, RefreshCw } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import SignalRow from "../components/SignalRow.jsx";
import SituationCard from "../components/SituationCard.jsx";
import SeverityCounts from "../components/SeverityCounts.jsx";
import { CATEGORY_LABELS } from "../utils/signalCorrelation.js";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

const CIVIC_PULSE_TONE = { NORMAL: "normal", ATTENTION: "attention", CRITICAL: "critical" };

export default function Overview() {
  const { loading, error, state, health, activeSignals, recentSignals, activeSituations, severityCounts, pulse, correlations, dataMode, refresh } = useCityPulseData();
  const monitoredAreas = new Set(activeSignals.map((signal) => signal.area)).size;

  if (loading && !state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">Loading CityPulse data from the backend…</p>;
  if (!state) return <section className="rounded-xl border border-border bg-surface p-6"><h2 className="text-lg font-bold text-ink">Backend data unavailable</h2><p className="mt-2 text-sm text-muted">{error}</p><button onClick={() => void refresh()} className="mt-4 rounded-lg border border-border px-3 py-2 text-sm text-ink">Retry</button></section>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">City Overview</h2>
          <p className="mt-1 text-sm text-muted">
            Backend snapshot of monitored signals, detected situations, and city activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{dataMode}</span>
          <span className="text-border">·</span>
          <span>
            As of <span className="font-mono text-ink">{new Date(state.updatedAt).toLocaleString()}</span>
          </span>
          <span className="text-border">·</span>
          <span>TomTom calls today: <span className="font-mono text-ink">{health?.tomtomCallsToday ?? "—"}</span></span>
          <button type="button" onClick={() => void refresh()} disabled={loading}
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-cyan-ink hover:bg-cyan/10 disabled:opacity-50"
            aria-label="Refresh backend snapshot">
            <RefreshCw size={12} aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Civic Pulse"
          value={pulse}
          tone={CIVIC_PULSE_TONE[pulse] ?? "normal"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Situations"
          value={String(activeSituations.length).padStart(2, "0")}
          tone="attention"
        >
          <SeverityCounts counts={severityCounts} hideEmptyCritical />
        </StatCard>
        <StatCard
          icon={Radio}
          label="Live Signals"
          value={String(activeSignals.length).padStart(2, "0")}
          tone="cyan"
        />
        <StatCard
          icon={MapPin}
          label="Monitored Areas"
          value={String(monitoredAreas).padStart(2, "0")}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card xl:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-ink">Live Signals</h3>
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-cyan-ink">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
              </span>
              BACKEND SNAPSHOT
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {recentSignals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card xl:col-span-2">
          <h3 className="text-base font-bold tracking-tight text-ink">Active Situations</h3>
          <div className="mt-4 space-y-2.5">
            {activeSituations.length > 0 ? (
              activeSituations.map((situation) => <SituationCard key={situation.id} situation={situation} />)
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
                No situations detected in the current signals.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-base font-bold tracking-tight text-ink">Civic Correlations</h3>
          <p className="font-mono text-xs text-muted">
            <span className="font-semibold text-ink">{String(correlations.length).padStart(2, "0")}</span> active
          </p>
        </div>
        {correlations.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {correlations.map((item) => (
              <li key={item.id} className="rounded-lg border border-border bg-inset px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">
                  {item.categories.map((type) => CATEGORY_LABELS[type] ?? type).join(" ↔ ")}
                </p>
                <p className="mt-0.5 text-xs text-muted">{item.area} · signals overlap in area and time</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">No overlapping signals detected in the current data.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-ink">Backend Data Source</h3>
          <span className="rounded-full border border-attention/25 bg-attention/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-attention-ink">{dataMode}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{state.summary?.text || "The backend has no civic summary for this snapshot."}</p>
        <p className="mt-2 text-xs text-muted">The current backend provides a deterministic scenario for signals and situations. TomTom live data is used for geocoding and route traffic when configured; no live weather or incident feed is connected.</p>
        {error && <p className="mt-3 text-xs text-attention-ink">Refresh failed: {error}</p>}
      </div>
    </div>
  );
}
