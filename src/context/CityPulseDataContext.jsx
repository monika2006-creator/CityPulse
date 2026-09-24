import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { calculateRoutes } from "../utils/routeCalculations.js";
import { correlateSignals } from "../utils/signalCorrelation.js";

const DataContext = createContext(null);
const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const clock = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};
const signalId = (zone, signal) => `${zone.zoneId}:${signal.key === "rainfall" ? "weather" : signal.key === "traffic" ? "traffic" : signal.key.replace(/^incident:/, "")}`;

function adaptState(raw) {
  const signals = (raw.zones ?? []).flatMap((zone) => (zone.signals ?? []).map((item) => {
    const type = item.type === "rainfall" ? "weather" : item.type === "incident" ? "road_incident" : "traffic";
    const timestamp = item.since || (type === "weather" ? zone.weather?.timestamp : type === "traffic" ? zone.traffic?.timestamp : null);
    const value = item.value;
    const unit = item.unit || (type === "traffic" ? "%" : "");
    return {
      id: signalId(zone, item), type, category: type, title: item.label, severity: item.severity,
      location: zone.name, area: zone.name, latitude: item.lat ?? zone.lat, longitude: item.lng ?? zone.lng,
      value, unit, change: value == null ? "Observed" : `${value} ${unit}`.trim(),
      detectedAt: clock(timestamp), timestamp, status: "active", description: item.label, source: "scenario",
    };
  }));
  const situations = (raw.situations ?? []).map((item) => {
    const location = item.location || item.zoneId || "Unknown area";
    return {
      id: item.id, ruleId: item.id, title: item.title, severity: item.severity === "attention" ? "medium" : item.severity === "normal" ? "low" : item.severity,
      status: item.status, area: location, areas: [location], detectedAt: clock(item.detectedAt), timestamp: item.detectedAt,
      description: item.summary || item.why || "Detected by the backend scenario rules.", whyDetected: item.why || item.summary || "",
      impact: "Based on the signals listed below.", relatedSignalIds: (item.signals ?? []).map((s) => {
        const zone = (raw.zones ?? []).find((z) => z.zoneId === item.zoneId);
        return zone ? signalId(zone, s) : null;
      }).filter(Boolean),
      correlation: item.correlation,
    };
  });
  return { ...raw, signals, situations, updatedAt: raw.now, mode: raw.mode || "scenario" };
}

function adaptRoutes(raw) {
  return calculateRoutes((raw.routes ?? []).map((route) => ({
    id: route.id, name: route.name, source: route.source || raw.source,
    normalTravelTime: route.normalMin, currentTravelTime: route.currentMin,
    distance: route.distanceKm, signalCount: route.signalCount,
    signalIds: (route.signals ?? []).map((signal) => signal.id),
    path: route.path, rawSignals: route.signals ?? [],
  })));
}

async function jsonRequest(path, init) {
  let response;
  try {
    response = await fetch(`${API}${path}`, init);
  } catch {
    throw new Error("Can't reach the CityPulse API. Start the backend on port 8787, or set VITE_API_BASE_URL to your deployed backend URL.");
  }
  if (!response.ok && response.status === 500 && API === "/api") {
    throw new Error("The frontend proxy cannot reach the backend at 127.0.0.1:8787. Start both services with `npm run dev:all` from the project root.");
  }
  if (!response.ok) throw new Error(`Backend request failed (${response.status}).`);
  return response.json();
}

export function CityPulseDataProvider({ children }) {
  const [snapshot, setSnapshot] = useState({ loading: true, error: "", state: null, routeResponse: null, health: null });
  const refresh = useCallback(async () => {
    setSnapshot((old) => ({ ...old, loading: !old.state, error: "" }));
    try {
      const [stateRaw, routeResponse, health] = await Promise.all([
        jsonRequest("/state"), jsonRequest("/routes"), jsonRequest("/health"),
      ]);
      setSnapshot({ loading: false, error: "", state: adaptState(stateRaw), routeResponse, health });
    } catch (error) {
      setSnapshot((old) => ({ ...old, loading: false, error: error.message || "CityPulse backend is unavailable." }));
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo(() => {
    const state = snapshot.state;
    const routes = adaptRoutes(snapshot.routeResponse ?? {});
    const situations = state?.situations ?? [];
    const correlations = state ? correlateSignals(state.signals, situations, routes) : [];
    const severityCounts = situations.filter((s) => s.status === "active").reduce((counts, s) => {
      const key = s.severity;
      if (key in counts) counts[key] += 1;
      return counts;
    }, { low: 0, medium: 0, high: 0, critical: 0 });
    const pulse = state?.pulse?.level === "Heavy" ? "CRITICAL" : state?.pulse?.level === "Elevated" ? "ATTENTION" : state ? "NORMAL" : "—";
    return {
      ...snapshot, state, routes, signals: state?.signals ?? [], situations, correlations,
      activeSignals: (state?.signals ?? []).filter((s) => s.status === "active"),
      recentSignals: [...(state?.signals ?? [])].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")).slice(0, 8),
      activeSituations: situations.filter((s) => s.status === "active"), severityCounts, pulse,
      summary: state?.summary,
      dataMode: state?.mode === "scenario" ? "SIMULATED SCENARIO" : String(state?.mode || "UNAVAILABLE").toUpperCase(),
      refresh,
    };
  }, [snapshot, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCityPulseData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useCityPulseData must be used inside CityPulseDataProvider");
  return value;
}

export { jsonRequest, adaptRoutes, clock };
