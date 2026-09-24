// Route delay calculations — the single source of truth for delay, delay % and status.
//
// currentTravelTime is the authoritative SIMULATED current ETA. Delay is derived only
// from it and normalTravelTime; civic signals explain conditions and are never summed in.

// CityPulse demo thresholds on delayPercent (NOT official traffic standards).
// Each `max` is inclusive; the last band has no upper bound.
export const DELAY_THRESHOLDS = [
  { status: "normal", label: "NORMAL", severity: "normal", max: 5 },
  { status: "minor", label: "MINOR DELAY", severity: "attention", max: 15 },
  { status: "moderate", label: "MODERATE DELAY", severity: "attention", max: 30 },
  { status: "high", label: "HIGH DELAY", severity: "critical", max: Infinity },
];

const UNAVAILABLE_STATUS = { status: "unavailable", label: "DATA INCOMPLETE", severity: null };

export const DELAY_UNAVAILABLE_TEXT = "Delay unavailable";
const EMPTY = "—";

// Accepts finite numbers (and numeric strings). Anything else — null, undefined, NaN,
// Infinity, "", "abc", negatives — is treated as missing.
function toMinutes(value) {
  if (typeof value === "string" && value.trim() === "") return null;
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number >= 0 ? number : null;
}

const roundTo = (value, places) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function getDelayStatus(delayPercent) {
  return DELAY_THRESHOLDS.find((band) => delayPercent <= band.max) ?? DELAY_THRESHOLDS.at(-1);
}

// Returns a NEW route object (the input is never mutated) with:
//   currentTravelTime / normalTravelTime  cleaned minutes, or null when missing/invalid
//   hasDelayData   true when delay could be calculated (needs current AND normal > 0)
//   delay          minutes over normal, never negative (0 when faster than normal); null if unavailable
//   fasterBy       minutes under normal (0 unless the route is faster than normal); null if unavailable
//   delayPercent   delay / normal * 100 (unrounded, never negative); null if unavailable
//   status, statusLabel, severity   deterministic classification
//   signalTotal    signal count (signalCount, else signalIds.length)
export function calculateRouteDelay(route) {
  const current = toMinutes(route?.currentTravelTime);
  const normal = toMinutes(route?.normalTravelTime);
  const hasDelayData = current !== null && normal !== null && normal > 0;

  const difference = hasDelayData ? current - normal : null;
  const delay = hasDelayData ? Math.max(difference, 0) : null;
  const delayPercent = hasDelayData ? (delay / normal) * 100 : null;
  const band = hasDelayData ? getDelayStatus(delayPercent) : UNAVAILABLE_STATUS;

  const declared = toMinutes(route?.signalCount);
  const signalTotal = declared ?? (Array.isArray(route?.signalIds) ? route.signalIds.length : 0);

  return {
    ...route,
    currentTravelTime: current,
    normalTravelTime: normal > 0 ? normal : null, // 0 is not a usable normal time
    hasDelayData,
    delay,
    fasterBy: hasDelayData ? Math.max(-difference, 0) : null,
    delayPercent,
    status: band.status,
    statusLabel: band.label,
    severity: band.severity,
    signalTotal,
  };
}

export function calculateDelayPercent(route) {
  return calculateRouteDelay(route).delayPercent;
}

export const calculateRoutes = (list = []) => list.map(calculateRouteDelay);

// ---- Formatting (never returns NaN / undefined / Infinity) ----

export function formatMinutes(minutes) {
  const value = toMinutes(minutes);
  return value === null ? EMPTY : `${roundTo(value, 1)} min`;
}

// "+8 min", "0 min" or "Delay unavailable". Expects a calculated route.
export function formatDelay(route) {
  if (!route?.hasDelayData) return DELAY_UNAVAILABLE_TEXT;
  return route.delay > 0 ? `+${roundTo(route.delay, 1)} min` : "0 min";
}

// "+28.6%", "0.0%" or "—". Expects a calculated route.
export function formatDelayPercent(route) {
  if (!route?.hasDelayData) return EMPTY;
  const rounded = roundTo(route.delayPercent, 1);
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

// Optional note when a route is running under its normal time.
export function formatFasterNote(route) {
  return route?.hasDelayData && route.fasterBy > 0 ? `${roundTo(route.fasterBy, 1)} min faster than normal` : null;
}

// Routes sharing the lowest valid current simulated ETA. Selection metric is
// currentTravelTime ONLY — never delay, delay %, signals, distance or name.
// Returns { routes, minutes, isTie }; routes is [] when no route has a valid ETA.
// Equal ETAs are all returned (isTie) rather than picking an arbitrary winner.
export function getLowestEta(list = []) {
  const valid = list.filter((route) => toMinutes(route?.currentTravelTime) !== null);
  if (valid.length === 0) return { routes: [], minutes: null, isTie: false };
  const minutes = Math.min(...valid.map((route) => route.currentTravelTime));
  const routes = valid.filter((route) => route.currentTravelTime === minutes);
  return { routes, minutes, isTie: routes.length > 1 };
}
