// Signal correlation — deterministic, evidence-based, and deliberately modest.
//
// A correlation says "these observed signals overlap in place and time". It NEVER says one
// signal caused another, and it carries no confidence percentage: strength is described by
// the evidence itself (signal count, area, time spread, categories, situations, routes).
//
// Reuses the Step 8 signal rules (active, non-normal, valid time + coordinates) and the same
// distance / time helpers, but is stricter about proximity than situation detection so that
// signals from unrelated places (e.g. traffic on one road, AQI across town) are not linked.
// It never creates situations; it only points at the ones that already exist.

import { toSeconds, distanceKm } from "./signalDetection.js";

export const CORRELATION_CONFIG = {
  // Two signals are linked only when BOTH hold: close in time AND in the same/adjacent place.
  windowMinutes: 15,
  nearbyKm: 1,
  // A correlation is described as "strong" overlap when all signals share one area and were
  // detected within this many minutes of each other.
  strongSpreadMinutes: 5,
  minSignals: 2,
};

export const CATEGORY_LABELS = {
  traffic: "Traffic",
  weather: "Weather",
  road_incident: "Incident",
  air_quality: "Air quality",
  public_transport: "Transit",
  power: "Power",
  noise: "Noise",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export const CORRELATION_TYPE_LABELS = {
  "cross-domain": "CROSS-DOMAIN OVERLAP",
  temporal: "TEMPORAL OVERLAP",
  geographic: "GEOGRAPHIC OVERLAP",
};

const SEVERITY_ORDER = { normal: 0, attention: 1, critical: 2 };

const categoryLabel = (type) => CATEGORY_LABELS[type] ?? String(type).replace(/_/g, " ");
const unique = (list) => [...new Set(list)];
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const pad = (n) => String(n).padStart(2, "0");
const clock = (seconds) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}`;

// "Traffic, incident and transit" — first word capitalised, the rest lower-case.
const categoryPhrase = (categories) => {
  const cats = categories.map((type) => categoryLabel(type).toLowerCase());
  const text = joinList(cats);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Same evidence filter as situation detection: active, abnormal, valid time and location.
function collectCandidates(signals) {
  return (signals ?? [])
    .filter(
      (signal) =>
        signal &&
        signal.status === "active" &&
        signal.severity !== "normal" &&
        Number.isFinite(signal.latitude) &&
        Number.isFinite(signal.longitude)
    )
    .map((signal) => ({ ...signal, seconds: toSeconds(signal.detectedAt) }))
    .filter((signal) => signal.seconds !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function areLinked(a, b, config) {
  const closeInTime = Math.abs(a.seconds - b.seconds) <= config.windowMinutes * 60;
  const closeInSpace = a.area === b.area || distanceKm(a, b) <= config.nearbyKm;
  return closeInTime && closeInSpace;
}

// Connected groups of signals linked through areLinked().
function groupSignals(candidates, config) {
  const parent = candidates.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      if (areLinked(candidates[i], candidates[j], config)) parent[find(j)] = find(i);
    }
  }
  const groups = new Map();
  candidates.forEach((signal, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(signal);
  });
  return [...groups.values()];
}

function describe(group, areas, categories, spreadMinutes) {
  const cats = categories.map(categoryLabel);
  const phrase = categoryPhrase(categories);
  const place = areas.length === 1 ? areas[0] : joinList(areas);
  if (categories.length > 1) {
    return `${phrase} signals were detected around ${place} within a similar time window. These signals may be related, but the available data does not establish causation.`;
  }
  return areas.length === 1
    ? `${plural(group.length, `${cats[0].toLowerCase()} signal`)} were detected around ${place} within ${Math.max(1, Math.round(spreadMinutes))} min of each other. The available data does not establish causation.`
    : `${cats[0]} signals were detected in nearby areas (${place}) within a similar time window. The available data does not establish causation.`;
}

function buildTitle(categories) {
  return categories.length > 1
    ? `${categoryPhrase(categories)} signal overlap`
    : `${categoryLabel(categories[0])} signals in the same place`;
}

// correlateSignals(signals, situations, routes) -> correlation[]
//   signals    signals.js records
//   situations output of detectSituations() (only READ, to link ids)
//   routes     route records with signalIds (only READ, to link ids)
export function correlateSignals(signals, situations = [], routes = [], overrides = {}) {
  const config = { ...CORRELATION_CONFIG, ...overrides };

  const built = groupSignals(collectCandidates(signals), config)
    .filter((group) => group.length >= config.minSignals)
    .map((group) => {
      const signalIds = group.map((s) => s.id);
      const categories = unique(group.map((s) => s.type)).sort(
        (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b) || a.localeCompare(b)
      );
      const areas = unique(group.map((s) => s.area));
      const times = group.map((s) => s.seconds);
      const spreadMinutes = (Math.max(...times) - Math.min(...times)) / 60;
      const sameArea = areas.length === 1;

      const situationIds = (situations ?? [])
        .filter((sit) => (sit.relatedSignalIds ?? []).some((id) => signalIds.includes(id)))
        .map((sit) => sit.id);
      const routeIds = (routes ?? [])
        .filter((route) => (route.signalIds ?? []).some((id) => signalIds.includes(id)))
        .map((route) => route.id);

      // Cross-domain wins when categories differ; otherwise it is a repeat in one place
      // (temporal) or the same category in adjacent areas (geographic).
      const type = categories.length > 1 ? "cross-domain" : sameArea ? "temporal" : "geographic";
      const strong = sameArea && spreadMinutes <= config.strongSpreadMinutes;

      const evidence = [
        sameArea ? `Same area: ${areas[0]}` : `Adjacent areas: ${joinList(areas)}`,
        spreadMinutes < 1
          ? `Detected at the same time (${clock(Math.min(...times))})`
          : `Similar detection time: ${clock(Math.min(...times))}–${clock(Math.max(...times))}`,
        ...(categories.length > 1 ? [`${categories.length} civic categories`] : []),
        `${plural(group.length, "related signal")}`,
        ...(situationIds.length ? [`${plural(situationIds.length, "related situation")}`] : []),
        ...(routeIds.length ? [`${plural(routeIds.length, "related route")}`] : []),
      ];

      return {
        type,
        title: buildTitle(categories),
        area: sameArea ? areas[0] : joinList(areas),
        areas,
        categories,
        windowStart: clock(Math.min(...times)),
        windowEnd: clock(Math.max(...times)),
        detectedAt: group.reduce((latest, s) => (s.seconds > latest.seconds ? s : latest)).detectedAt,
        signalIds,
        situationIds,
        routeIds,
        severity: group.reduce((worst, s) => (SEVERITY_ORDER[s.severity] > SEVERITY_ORDER[worst] ? s.severity : worst), "attention"),
        overlap: strong ? "strong" : "moderate",
        overlapLabel: strong ? "Strong temporal and geographic overlap" : "Moderate temporal and geographic overlap",
        description: describe(group, areas, categories, spreadMinutes),
        evidence,
      };
    });

  // Most severe first, then most recent; ids follow that order so they are stable.
  return built
    .sort(
      (a, b) =>
        SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
        b.detectedAt.localeCompare(a.detectedAt) ||
        a.signalIds[0].localeCompare(b.signalIds[0])
    )
    .map((item, index) => ({ id: `COR-${String(index + 1).padStart(3, "0")}`, ...item }));
}

// Category types that actually occur across a set of correlations (for filter chips).
export const getCorrelationCategories = (correlations) => unique(correlations.flatMap((c) => c.categories));

export const filterCorrelations = (correlations, category) =>
  category === "all" ? correlations : correlations.filter((c) => c.categories.includes(category));

// Correlations that point at a given route (through the route's signalIds).
export const getRouteCorrelations = (route, correlations) =>
  correlations.filter((c) => c.routeIds.includes(route.id));
