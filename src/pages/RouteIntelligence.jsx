import { useEffect, useRef, useState } from "react";
import { Route as RouteIcon } from "lucide-react";
import JourneyForm from "../components/JourneyForm.jsx";
import FastestRouteCard from "../components/FastestRouteCard.jsx";
import RouteCard from "../components/RouteCard.jsx";
import EtaComparison from "../components/EtaComparison.jsx";
import RouteDetail from "../components/RouteDetail.jsx";
import useMediaQuery from "../hooks/useMediaQuery.js";
import { cityData } from "../data/cityData.js";
import { routes, routeQuery, getFastestRoute } from "../data/routes.js";
import { signals } from "../data/signals.js";
import { normalizeLocation } from "../utils/routeHelpers.js";

const demoJourneyLabel = `${routeQuery.from} → ${routeQuery.to}`;

// Demo mode: only the journey that routes.js describes is supported.
function isSupportedJourney(from, to) {
  return (
    normalizeLocation(from) === normalizeLocation(routeQuery.from) &&
    normalizeLocation(to) === normalizeLocation(routeQuery.to)
  );
}

export default function RouteIntelligence() {
  const [fromInput, setFromInput] = useState(routeQuery.from);
  const [toInput, setToInput] = useState(routeQuery.to);
  // "ready" shows the routes, "unsupported" / "incomplete" show a message instead.
  // Starts ready for the default journey so the page is not empty on arrival.
  const [analysis, setAnalysis] = useState("ready");
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const detailRef = useRef(null);
  const isTwoColumn = useMediaQuery("(min-width: 1280px)");

  // The lowest CURRENT ETA is always calculated from currentTravelTime, never hardcoded.
  const fastestRoute = getFastestRoute(routes);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;

  // When columns are stacked, bring the details into view after selecting a route.
  useEffect(() => {
    if (!selectedRouteId || isTwoColumn) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, [selectedRouteId, isTwoColumn]);

  const handleAnalyze = (event) => {
    event.preventDefault();
    if (!fromInput.trim() || !toInput.trim()) {
      setAnalysis("incomplete");
      setSelectedRouteId(null);
    } else if (isSupportedJourney(fromInput, toInput)) {
      setAnalysis("ready");
    } else {
      setAnalysis("unsupported");
      setSelectedRouteId(null);
    }
  };

  const handleUseDemo = () => {
    setFromInput(routeQuery.from);
    setToInput(routeQuery.to);
    setAnalysis("ready");
  };

  const feedback =
    analysis === "incomplete"
      ? "Enter both an origin and a destination."
      : analysis === "unsupported"
        ? "Route data for this journey is not available in demo mode."
        : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-ink">Route Intelligence</h2>
          <p className="mt-1 text-sm text-muted">Compare current travel conditions across available routes.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{cityData.dataMode} DATA</span>
        </div>
      </div>

      <JourneyForm
        from={fromInput}
        to={toInput}
        onFromChange={setFromInput}
        onToChange={setToInput}
        onSubmit={handleAnalyze}
        feedback={feedback}
        onUseDemo={analysis === "unsupported" ? handleUseDemo : null}
        demoJourneyLabel={demoJourneyLabel}
      />

      {analysis === "ready" && fastestRoute && (
        <>
          <FastestRouteCard
            fastest={fastestRoute}
            others={routes.filter((route) => route.id !== fastestRoute.id)}
            isSelected={selectedRouteId === fastestRoute.id}
            onSelect={setSelectedRouteId}
          />

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
            <div className="space-y-5 xl:col-span-3">
              <section aria-label="Available routes">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[12px] font-bold tracking-[0.12em] text-ink">AVAILABLE ROUTES</h3>
                  <p className="font-mono text-[11px] text-muted">{demoJourneyLabel}</p>
                </div>
                <div className="space-y-3">
                  {routes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isFastest={route.id === fastestRoute.id}
                      isSelected={route.id === selectedRouteId}
                      onSelect={setSelectedRouteId}
                    />
                  ))}
                </div>
              </section>

              <EtaComparison routes={routes} fastestId={fastestRoute.id} />
            </div>

            <div ref={detailRef} className="scroll-mt-44 xl:col-span-2">
              {selectedRoute ? (
                <RouteDetail key={selectedRoute.id} route={selectedRoute} routes={routes} fastest={fastestRoute} signals={signals} />
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-cyan/25 bg-cyan/10">
                    <RouteIcon size={19} className="text-cyan" />
                  </span>
                  <p className="text-sm font-semibold text-ink">Civic conditions</p>
                  <p className="mt-1 max-w-xs text-[13px] text-muted">
                    Select a route to see the civic signals linked to it and how they relate to its current ETA.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
