import { SEVERITY_RANK } from "../data/mapConfig.js";

// Delay thresholds for colouring. A route is "normal" when it is at most 2 minutes
// (or under 10%) over its normal time, "attention" under 25%, otherwise "critical".
const MINOR_DELAY_MINUTES = 2;
const MINOR_DELAY_RATIO = 0.1;
const MODERATE_DELAY_RATIO = 0.25;

// Severity key ("normal" | "attention" | "critical") used only for colouring delay values.
export function getDelaySeverity(route) {
  const ratio = route.normalTravelTime > 0 ? route.delay / route.normalTravelTime : 0;
  if (route.delay <= MINOR_DELAY_MINUTES || ratio < MINOR_DELAY_RATIO) return "normal";
  if (ratio < MODERATE_DELAY_RATIO) return "attention";
  return "critical";
}

// Resolve a route's signalIds against the signals list (signals.js), worst first.
// Ids that don't exist in signals.js are skipped. Signals only EXPLAIN a route's
// condition; they are never used to calculate its ETA.
export function getRouteSignals(route, signals) {
  return route.signalIds
    .map((id) => signals.find((signal) => signal.id === id))
    .filter(Boolean)
    .sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
        b.detectedAt.localeCompare(a.detectedAt)
    );
}

export const formatMinutes = (minutes) => `${minutes} min`;

export const formatDelay = (minutes) => (minutes > 0 ? `+${minutes} min` : `${minutes} min`);

export const formatSignalCount = (count) => `${count} ${count === 1 ? "signal" : "signals"}`;

export const normalizeLocation = (text) => text.trim().toLowerCase().replace(/\s+/g, " ");
