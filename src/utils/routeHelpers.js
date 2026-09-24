import { SEVERITY_RANK } from "../data/mapConfig.js";

// Resolve a route's signalIds against the signals list (signals.js), worst first.
// Ids that don't exist in signals.js are skipped. Signals only EXPLAIN a route's
// condition; they are never used to calculate its ETA.
export function getRouteSignals(route, signals) {
  return (route.signalIds ?? [])
    .map((id) => signals.find((signal) => signal.id === id))
    .filter(Boolean)
    .sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
        b.detectedAt.localeCompare(a.detectedAt)
    );
}

// Active situations (Step 8 engine output) that were detected from at least one of the
// route's signals. Purely a lookup — no new detection, and no claim of causality.
export function getRouteSituations(route, situations) {
  const ids = new Set(route.signalIds ?? []);
  return situations.filter(
    (situation) => situation.status === "active" && (situation.relatedSignalIds ?? []).some((id) => ids.has(id))
  );
}

export const formatSignalCount = (count) => `${count} ${count === 1 ? "signal" : "signals"}`;

export const normalizeLocation = (text) => text.trim().toLowerCase().replace(/\s+/g, " ");
