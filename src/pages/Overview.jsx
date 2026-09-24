import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, Radio, RefreshCw, Route as RouteIcon, TriangleAlert } from "lucide-react";
import MapView from "../components/MapView.jsx";
import MapLegend from "../components/MapLegend.jsx";
import SeverityBadge from "../components/SeverityBadge.jsx";
import { useCityPulseData, clock } from "../context/CityPulseDataContext.jsx";

const pulseTone = {
  NORMAL: "text-normal-ink bg-normal/10",
  ATTENTION: "text-attention-ink bg-attention/10",
  CRITICAL: "text-critical-ink bg-critical/10",
};

function Metric({ icon: Icon, label, value, detail, tone = "cyan" }) {
  const colors = {
    cyan: "text-cyan-ink bg-cyan/10",
    critical: "text-critical-ink bg-critical/10",
    violet: "text-violet-ink bg-violet/10",
    normal: "text-normal-ink bg-normal/10",
  };
  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${colors[tone]}`}><Icon size={15} /></span>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 truncate text-[10px] text-muted">{detail}</p>
    </article>
  );
}

function PanelTitle({ children, action }) {
  return <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-ink">{children}</h2>{action}</div>;
}

function BriefPanel({ state, routeResponse, dataMode }) {
  const [brief, setBrief] = useState(null);
  const [briefError, setBriefError] = useState("");
  const [loadingBrief, setLoadingBrief] = useState(false);

  useEffect(() => {
    if (!state?.sourceState) return undefined;
    const controller = new AbortController();
    setLoadingBrief(true);
    setBriefError("");
    fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: state.sourceState, routeData: routeResponse }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Brief request failed (${response.status}).`);
      return response.json();
    }).then((result) => setBrief(result)).catch((error) => {
      if (error.name !== "AbortError") setBriefError("Brief is unavailable for this snapshot.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingBrief(false);
    });
    return () => controller.abort();
  }, [state?.updatedAt, routeResponse]);

  const points = brief?.brief?.keyPoints ?? state?.signals?.slice(0, 3).map((signal) => `${signal.title} around ${signal.area}.`) ?? [];
  return (
    <aside className="flex min-h-[300px] min-w-0 flex-col rounded-xl border border-border bg-surface p-4 shadow-card xl:min-h-0">
      <PanelTitle action={<span className="rounded-md bg-violet/10 px-2 py-1 text-[9px] font-bold tracking-wider text-violet-ink">{brief?.generatedBy === "gemini" ? "GEMINI" : "BACKEND"}</span>}>CITYPULSE BRIEF</PanelTitle>
      <div className="flex-1">
        <h3 className="text-base font-bold leading-snug text-ink">{brief?.brief?.headline ?? "Civic conditions in the current snapshot"}</h3>
        <p className="mt-2 text-xs leading-5 text-muted">{loadingBrief ? "Preparing a summary from the current backend snapshot…" : brief?.brief?.summary ?? state?.summary?.text ?? "No summary is available for this snapshot."}</p>
        {briefError && <p role="status" className="mt-2 text-[11px] text-attention-ink">{briefError}</p>}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[9px] font-bold tracking-[0.14em] text-muted">KEY SIGNALS</p>
          <ul className="space-y-2">
            {points.length ? points.slice(0, 3).map((point, index) => <li key={`${index}-${point}`} className="flex gap-2 text-xs leading-4 text-ink"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />{point}</li>) : <li className="text-xs text-muted">No active signals in this snapshot.</li>}
          </ul>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2 text-[9px] text-muted flex items-center justify-between">
        <span>{dataMode === "LIVE" ? "LIVE OBSERVATION" : "SIMULATED SCENARIO"} · {dataMode === "LIVE" ? "Observed:" : "Scenario Time:"} <strong className="font-mono text-ink">{clock(state.updatedAt)} IST</strong></span>
        <span>Refreshed: <strong className="font-mono text-ink">{clock(state.refreshedAt)} IST</strong></span>
      </p>
    </aside>
  );
}

export default function Overview() {
  const { loading, error, state, health, activeSignals, activeSituations, pulse, routes, routeResponse, dataMode, refresh, selectedCity, settings } = useCityPulseData();
  const [selectedSignal, setSelectedSignal] = useState(null);
  const monitoredAreas = new Set((state?.zones ?? []).map((zone) => zone.zoneId)).size;
  const rankedSituations = useMemo(() => [...activeSituations].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")), [activeSituations]);
  const severityCounts = activeSituations.reduce((counts, item) => { counts[item.severity] = (counts[item.severity] || 0) + 1; return counts; }, {});

  if (loading && !state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">Loading CityPulse data from the backend…</p>;
  if (!state) return <section className="rounded-xl border border-border bg-surface p-6"><h2 className="text-lg font-bold text-ink">Backend data unavailable</h2><p className="mt-2 text-sm text-muted">{error}</p><button onClick={() => void refresh()} className="mt-4 rounded-lg border border-border px-3 py-2 text-sm text-ink">Retry</button></section>;

  const selectedId = activeSignals.some((signal) => signal.id === selectedSignal) ? selectedSignal : null;
  const feeds = state.feeds ?? [];
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto text-[10px] text-muted flex flex-wrap items-center gap-1.5">
          <span>{dataMode === "LIVE" ? "Live observation:" : "Scenario time:"} <strong className="font-mono text-ink">{clock(state.updatedAt)} IST</strong></span>
          <span className="text-border">·</span>
          <span>Last Refreshed: <strong className="font-mono text-ink">{clock(state.refreshedAt)} IST</strong></span>
          {dataMode !== "LIVE" && <span className="text-muted hidden sm:inline">(Advances +{settings.scenarioStepMin ?? 5}m every {settings.refreshIntervalMin ?? 5}m)</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider ${pulseTone[pulse] ?? "text-muted bg-elevated"}`}><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />{pulse}</span>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[9px] font-bold tracking-wider text-muted">{dataMode}</span>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[10px] font-bold text-ink hover:border-cyan/50 disabled:opacity-50" aria-label="Refresh backend scenario snapshot">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> REFRESH +5 MIN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Metric icon={Activity} label="Civic Pulse" value={pulse} detail={`${state.pulse?.situationCount ?? activeSituations.length} active situation${(state.pulse?.situationCount ?? activeSituations.length) === 1 ? "" : "s"}`} tone={pulse === "CRITICAL" ? "critical" : pulse === "ATTENTION" ? "violet" : "normal"} />
        <Metric icon={AlertTriangle} label="Active Situations" value={String(activeSituations.length).padStart(2, "0")} detail={`${severityCounts.critical ?? 0} critical · ${severityCounts.high ?? 0} high · ${severityCounts.medium ?? 0} medium · ${severityCounts.low ?? 0} low`} tone="critical" />
        <Metric icon={Radio} label="Signals" value={String(activeSignals.length).padStart(2, "0")} detail="Across traffic, weather, incidents" />
        <Metric icon={MapPin} label="Monitored Areas" value={String(monitoredAreas).padStart(2, "0")} detail={`Configured ${selectedCity} zones`} tone="violet" />
      </div>

      <div className="overview-feature-grid">
        <section className="min-w-0 rounded-xl border border-border bg-surface p-2.5 shadow-card">
          <div className="flex items-center justify-between px-1 pb-2"><PanelTitle>{selectedCity} signal map</PanelTitle><span className="text-[9px] font-bold tracking-wider text-muted">{activeSignals.length} SIGNALS · {dataMode}</span></div>
          <div className="h-[300px] overflow-hidden rounded-lg border border-border bg-sidebar sm:h-[350px]">
            <MapView signals={activeSignals} selectedId={selectedId} city={selectedCity} onSelect={setSelectedSignal} onDeselect={(id) => setSelectedSignal((current) => current === id ? null : current)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2"><MapLegend /><span className="text-[9px] text-muted">MAP © OPENSTREETMAP</span></div>
        </section>
          <BriefPanel state={state} routeResponse={routeResponse} dataMode={dataMode} />
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-border bg-surface p-3 shadow-card xl:col-span-5">
          <PanelTitle action={<span className="text-[9px] font-semibold text-muted">{routes.length} backend routes</span>}>Route intelligence</PanelTitle>
          <div className="space-y-2">
            {routes.slice(0, 3).map((route) => <div key={route.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-inset px-3 py-2"><div className="flex min-w-0 items-center gap-2"><RouteIcon size={15} className="shrink-0 text-cyan-ink" /><span className="truncate text-xs font-semibold text-ink">{route.name}</span></div><div className="shrink-0 text-right"><span className="font-mono text-sm font-bold text-ink">{route.currentTravelTime} min</span><span className="ml-2 text-[10px] text-muted">{route.delayMin > 0 ? `+${route.delayMin} min` : "on time"}</span></div></div>)}
          </div>
          <p className="mt-2 text-[9px] text-muted">ETA and delay calculated from {routeResponse?.source === "tomtom" ? "TomTom" : "simulated scenario"} route response.</p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-3 shadow-card xl:col-span-4">
          <PanelTitle action={<span className="text-[9px] font-semibold text-muted">{activeSituations.length} active</span>}>Active situations</PanelTitle>
          <div className="space-y-2">
            {rankedSituations.slice(0, 3).map((situation) => <article key={situation.id} className="flex items-start gap-2 rounded-lg border border-border bg-inset px-2.5 py-2"><TriangleAlert size={14} className="mt-0.5 shrink-0 text-attention-ink" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-ink">{situation.title}</p><p className="mt-0.5 truncate text-[10px] text-muted">{situation.area}</p></div><SeverityBadge severity={situation.severity} /></article>)}
            {!rankedSituations.length && <p className="py-4 text-center text-xs text-muted">No active situations in this scenario minute.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-3 shadow-card xl:col-span-3">
          <PanelTitle action={<span className="text-[9px] font-semibold text-muted">Scenario</span>}>Civic feeds</PanelTitle>
          <div className="space-y-2">
            {feeds.map((feed) => <div key={feed.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset px-2.5 py-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold capitalize text-ink">{feed.name ?? feed.id}</p><p className="text-[9px] text-muted">{feed.cadenceMin ? `Scenario cadence ${feed.cadenceMin} min` : "Scenario incident data"}</p></div><span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${feed.enabled ? "bg-attention/10 text-attention-ink" : "bg-elevated text-muted"}`}>{feed.enabled ? "SIMULATED" : "OFF"}</span></div>)}
          </div>
          <p className="mt-2 text-[9px] text-muted">{dataMode === "LIVE" ? "Live observation" : "Scenario time"}: {clock(state.updatedAt)} IST · Refreshed: {clock(state.refreshedAt)} IST</p>
        </section>
      </div>
      {error && <p role="status" className="text-xs text-attention-ink">Refresh failed: {error}</p>}
    </div>
  );
}
