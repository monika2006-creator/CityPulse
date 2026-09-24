import { useEffect, useMemo, useRef, useState } from "react";
import { Route as RouteIcon } from "lucide-react";
import JourneyForm from "../components/JourneyForm.jsx";
import LowestEtaCard from "../components/LowestEtaCard.jsx";
import RouteCard from "../components/RouteCard.jsx";
import EtaComparison from "../components/EtaComparison.jsx";
import RouteDetail from "../components/RouteDetail.jsx";
import useMediaQuery from "../hooks/useMediaQuery.js";
import { useCityPulseData, adaptRoutes, clock } from "../context/CityPulseDataContext.jsx";

function mapRouteSignals(routeResult) {
  return (routeResult?.routes ?? []).flatMap((route) => (route.signals ?? []).map((signal) => ({
    id: signal.id, type: signal.type === "road_incident" ? "road_incident" : "traffic",
    category: signal.type, title: signal.label, severity: signal.severity || "attention",
    location: route.name, area: route.name, latitude: signal.lat, longitude: signal.lng,
    value: signal.delayMin ?? null, unit: signal.delayMin == null ? "" : "min delay",
    change: signal.delayMin == null ? "Observed" : `+${signal.delayMin} min`,
    detectedAt: clock(routeResult.now), status: "active", description: signal.label, source: "tomtom",
  }))).filter((signal) => Number.isFinite(signal.latitude) && Number.isFinite(signal.longitude));
}

function savedJourneyValue(key) {
  try { return localStorage.getItem(`citypulse.route.${key}`) ?? ""; }
  catch { return ""; }
}

export default function RouteIntelligence() {
  const { loading, state, error, routeResponse, routes: scenarioRoutes, signals: stateSignals, situations, correlations, dataMode } = useCityPulseData();
  const [fromInput, setFromInput] = useState(savedJourneyValue("from"));
  const [toInput, setToInput] = useState(savedJourneyValue("to"));
  const [routeResult, setRouteResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const detailRef = useRef(null);
  const routeInputsInitialized = useRef(false);
  const isTwoColumn = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (routeInputsInitialized.current || !routeResponse?.journey) return;
    const from = fromInput || routeResponse.journey.from?.name || "";
    const to = toInput || routeResponse.journey.to?.name || "";
    setFromInput(from);
    setToInput(to);
    try {
      localStorage.setItem("citypulse.route.from", from);
      localStorage.setItem("citypulse.route.to", to);
    } catch { /* The form still works when browser storage is unavailable. */ }
    routeInputsInitialized.current = true;
  }, [routeResponse]);

  const updateFrom = (value) => {
    setFromInput(value);
    try { localStorage.setItem("citypulse.route.from", value); } catch { /* Optional persistence. */ }
  };
  const updateTo = (value) => {
    setToInput(value);
    try { localStorage.setItem("citypulse.route.to", value); } catch { /* Optional persistence. */ }
  };

  const routeData = routeResult ?? routeResponse;
  const routes = routeResult ? adaptRoutes(routeResult) : scenarioRoutes;
  const lowestEta = useMemo(() => {
    const valid = routes.filter((route) => Number.isFinite(route.currentTravelTime));
    const minutes = valid.length ? Math.min(...valid.map((route) => route.currentTravelTime)) : null;
    const fastest = minutes == null ? [] : valid.filter((route) => route.currentTravelTime === minutes);
    return { routes: fastest, minutes, isTie: fastest.length > 1 };
  }, [routes]);
  const lowestIds = useMemo(() => new Set(lowestEta.routes.map((route) => route.id)), [lowestEta]);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;
  const liveSignals = useMemo(() => mapRouteSignals(routeResult), [routeResult]);
  const routeSignals = [...stateSignals, ...liveSignals];
  const routeCorrelations = routeResult?.source === "tomtom" ? [] : correlations;
  const journeyLabel = `${routeData?.journey?.from?.name ?? fromInput} → ${routeData?.journey?.to?.name ?? toInput}`;

  useEffect(() => {
    if (!selectedRouteId || isTwoColumn) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, [selectedRouteId, isTwoColumn]);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setNotice("");
    setSelectedRouteId(null);
    if (!fromInput.trim() || !toInput.trim()) { setNotice("Enter both an origin and destination."); return; }
    setRequesting(true);
    try {
      const geocode = async (query) => {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(9000) });
        if (!response.ok) throw new Error("Place search failed.");
        return response.json();
      };
      const [fromData, toData] = await Promise.all([geocode(fromInput), geocode(toInput)]);
      const from = fromData.results?.[0], to = toData.results?.[0];
      if (!from || !to) {
        setRouteResult(null);
        setNotice([...(fromData.warnings ?? []), ...(toData.warnings ?? []), "Could not geocode both places. Showing the backend's simulated scenario routes."].join(" "));
        return;
      }
      const params = new URLSearchParams({ mode: "live", from: `${from.lat},${from.lng}`, to: `${to.lat},${to.lng}`, fromName: from.name, toName: to.name });
      const response = await fetch(`/api/routes?${params}`, { signal: AbortSignal.timeout(16000) });
      if (!response.ok) throw new Error("Live route request failed.");
      const result = await response.json();
      setRouteResult(result);
      setNotice((result.warnings ?? []).join(" "));
      if (!result.warnings?.length) { setFromInput(from.name); setToInput(to.name); }
    } catch {
      setRouteResult(null);
      setNotice("Live routing is unavailable right now. Showing the backend's simulated scenario routes.");
    } finally { setRequesting(false); }
  };

  if (loading && !state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">Loading route data…</p>;
  if (!state) return <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">Backend data unavailable: {error}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-ink">Route Intelligence</h2>
          <p className="mt-1 text-sm text-muted">TomTom live routes when place search and routing are available; otherwise the backend scenario is shown.</p>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
          {routeData?.source === "tomtom" ? "TOMTOM LIVE ROUTES" : dataMode}
        </div>
      </div>

      <JourneyForm from={fromInput} to={toInput} onFromChange={updateFrom} onToChange={updateTo}
        onSubmit={handleAnalyze} feedback={requesting ? "Searching places and calculating routes…" : notice}
        loading={requesting} sourceHint="TomTom geocodes both places. Live routing requires a configured TomTom key; fallback is labeled." />

      {routes.length > 0 && (
        <>
          <LowestEtaCard lowest={lowestEta} routes={routes} signals={routeSignals} situations={situations}
            selectedId={selectedRouteId} onSelect={setSelectedRouteId} />
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
            <div className="space-y-5 xl:col-span-3">
              <section aria-label="Available routes">
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[12px] font-bold tracking-[0.12em] text-ink">AVAILABLE ROUTES</h3>
                  <p className="font-mono text-[11px] text-muted">{journeyLabel}</p>
                </div>
                <p className="mb-3 text-xs text-muted">ETA, delay, and fastest route are calculated from this route response.</p>
                <div className="space-y-3">{routes.map((route) => (
                  <RouteCard key={route.id} route={route} signals={routeSignals} isLowestEta={lowestIds.has(route.id)}
                    isTie={lowestEta.isTie} isSelected={route.id === selectedRouteId} onSelect={setSelectedRouteId} />
                ))}</div>
              </section>
              <EtaComparison routes={routes} lowestIds={lowestIds} />
            </div>
            <div ref={detailRef} className="scroll-mt-44 xl:col-span-2">
              {selectedRoute ? <RouteDetail key={selectedRoute.id} route={selectedRoute} routes={routes} lowest={lowestEta}
                signals={routeSignals} situations={situations} correlations={routeCorrelations} /> : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center">
                  <RouteIcon size={19} className="mb-3 text-cyan-ink" aria-hidden="true" />
                  <p className="text-sm font-semibold text-ink">Route conditions</p>
                  <p className="mt-1 max-w-xs text-[13px] text-muted">Select a route to inspect its ETA and returned traffic signals.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
