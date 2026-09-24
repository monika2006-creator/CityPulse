import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { calculateRoutes } from "../utils/routeCalculations.js";
import { correlateSignals } from "../utils/signalCorrelation.js";
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredCity,
  saveStoredCity,
  getStoredNotifications,
  saveStoredNotifications,
} from "../services/notificationStore.js";
import { detectSmartNotifications } from "../services/notificationEngine.js";

const DataContext = createContext(null);
const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const clock = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
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
      zoneId: zone.zoneId,
      location: zone.name, area: zone.name, latitude: item.lat ?? zone.lat, longitude: item.lng ?? zone.lng,
      tempC: zone.weather?.tempC ?? null, dataMode: raw.mode === "live" ? "live" : "scenario",
      value, unit, change: value == null ? "Observed" : `${value} ${unit}`.trim(),
      detectedAt: clock(timestamp), timestamp, status: "active", description: item.label, source: raw.mode === "live" ? (item.source || "live") : "scenario",
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
  return { ...raw, signals, situations, updatedAt: raw.now, refreshedAt: raw.snapshotAt, mode: raw.mode || "scenario" };
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
    throw new Error("Unable to update civic data. CityPulse backend is unavailable.");
  }
  if (!response.ok && response.status === 500 && API === "/api") {
    throw new Error("The frontend proxy cannot reach the backend at 127.0.0.1:8787. Start both services with `npm run dev:all` from the project root.");
  }
  if (!response.ok) throw new Error(`Backend request failed (${response.status}).`);
  return response.json();
}

export function CityPulseDataProvider({ children }) {
  const [snapshot, setSnapshot] = useState({ loading: true, error: "", state: null, routeResponse: null, health: null });
  const [settings, setSettings] = useState(getStoredSettings);
  const [selectedCity, setSelectedCityState] = useState(getStoredCity);
  const [notifications, setNotifications] = useState(getStoredNotifications);
  const [scenarioMin, setScenarioMinState] = useState(235);
  const activeDataMode = settings.dataMode === "live" ? "live" : "scenario";
  const scenarioMinRef = useRef(235);
  const settingsRef = useRef(settings);
  const notificationsRef = useRef(notifications);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  const previousSnapshotRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const lastFetchedCityRef = useRef(null);
  const fetchGenerationRef = useRef(0);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const merged = typeof newSettings === "function" ? newSettings(prev) : { ...prev, ...newSettings };
      saveStoredSettings(merged);
      return merged;
    });
  }, []);

  const setSelectedCity = useCallback((city) => {
    setSelectedCityState(city);
    saveStoredCity(city);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
      saveStoredNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      saveStoredNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotificationHistory = useCallback(() => {
    setNotifications([]);
    saveStoredNotifications([]);
  }, []);

  const refresh = useCallback(async (customMin, advance = true) => {
    const fetchGeneration = ++fetchGenerationRef.current;
    setSnapshot((old) => ({ ...old, loading: !old.state, error: "" }));
    try {
      const sameCity = lastFetchedCityRef.current === selectedCity;
      const stepMinutes = Number(settingsRef.current.scenarioStepMin) || 5;
      const activeMin = customMin !== undefined ? customMin : hasLoadedRef.current && sameCity && advance ? (scenarioMinRef.current + stepMinutes > 480 ? 0 : scenarioMinRef.current + stepMinutes) : scenarioMinRef.current;
      scenarioMinRef.current = activeMin;
      setScenarioMinState(activeMin);
      const params = `?min=${activeMin}&city=${encodeURIComponent(selectedCity)}&mode=${activeDataMode}`;
      const [stateRaw, routeResponse, health] = await Promise.all([
        jsonRequest(`/state${params}`),
        jsonRequest(`/routes${params}`),
        jsonRequest("/health"),
      ]);
      if (fetchGeneration !== fetchGenerationRef.current) return;

      const adaptedStateData = adaptState(stateRaw);
      const adaptedRoutesData = adaptRoutes(routeResponse ?? {});

      const currentSnapshot = {
        state: adaptedStateData,
        routes: adaptedRoutesData,
        routeResponse,
        health,
        city: selectedCity,
      };

      // Smart Notification Engine check
      if (previousSnapshotRef.current && !isInitialLoadRef.current) {
        const detected = detectSmartNotifications(
          previousSnapshotRef.current,
          currentSnapshot,
          settingsRef.current,
          notificationsRef.current,
          selectedCity
        );

        if (detected.length > 0) {
          setNotifications((prev) => {
            const combined = [...detected, ...prev];
            saveStoredNotifications(combined);
            return combined;
          });
        }
      }

      previousSnapshotRef.current = currentSnapshot;
      lastFetchedCityRef.current = selectedCity;
      isInitialLoadRef.current = false;
      hasLoadedRef.current = true;

      setSnapshot({
        loading: false,
        error: "",
        state: adaptedStateData,
        routeResponse,
        health,
      });
    } catch (error) {
      if (fetchGeneration !== fetchGenerationRef.current) return;
      setSnapshot((old) => ({
        ...old,
        loading: false,
        error: error.message || "Unable to update civic data.",
      }));
    }
  }, [selectedCity, activeDataMode]);

  // Initial fetch
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Periodic polling (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh(undefined, true);
      }
    }, Math.max(1, Number(settings.refreshIntervalMin) || 5) * 60_000);
    return () => clearInterval(timer);
  }, [refresh, settings.refreshIntervalMin]);

  const setScenarioMin = useCallback((min) => {
    scenarioMinRef.current = min;
    setScenarioMinState(min);
    void refresh(min, false);
  }, [refresh]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

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
    const pulse = state?.pulse?.level === "critical" ? "CRITICAL" : state?.pulse?.level === "attention" ? "ATTENTION" : state ? "NORMAL" : "—";

    return {
      ...snapshot,
      state,
      routes,
      signals: state?.signals ?? [],
      situations,
      correlations,
      activeSignals: (state?.signals ?? []).filter((s) => s.status === "active"),
      recentSignals: [...(state?.signals ?? [])].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")).slice(0, 8),
      activeSituations: situations.filter((s) => s.status === "active"),
      severityCounts,
      pulse,
      summary: state?.summary,
      dataMode: state?.mode === "scenario" ? "SIMULATED SCENARIO" : String(state?.mode || "UNAVAILABLE").toUpperCase(),
      refresh,
      // Settings & Notifications
      settings,
      updateSettings,
      selectedCity,
      setSelectedCity,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotificationHistory,
      scenarioMin,
      setScenarioMin,
    };
  }, [
    snapshot,
    refresh,
    settings,
    updateSettings,
    selectedCity,
    setSelectedCity,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotificationHistory,
    scenarioMin,
    setScenarioMin,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCityPulseData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useCityPulseData must be used inside CityPulseDataProvider");
  return value;
}

export { jsonRequest, adaptRoutes, clock };
