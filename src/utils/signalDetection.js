// CityPulse signal detection engine — deterministic and rule-based.
//
// A SIGNAL is one observation (signals.js). A SITUATION is a meaningful
// combination of signals that appear close together in space and time.
//
// No AI, no machine learning, no network. The same input always gives the same
// output, and every number on a situation can be traced back to the constants
// and formulas in this file.
//
// Wording rule: the engine reports that signals occurred TOGETHER. It never
// claims that one signal caused another.

// ---------------------------------------------------------------------------
// Tunable settings
// ---------------------------------------------------------------------------

export const DETECTION_CONFIG = {
  // Signals further apart in time than this are never linked.
  windowMinutes: 30,
  // Signals further apart than this are never linked ("nearby").
  nearbyKm: 3,
  // AQI at or above this counts as elevated (US scale: 101+ is unhealthy for sensitive groups).
  aqiElevated: 100,
  // Rule 4 needs at least this many signals from at least this many categories.
  multiSignal: { minSignals: 3, minCategories: 2 },
  // Detection confidence = base + four capped components, never above `cap`.
  confidence: {
    base: 25, // a rule matched
    perSignal: 8, // up to `maxSignals` supporting signals
    maxSignals: 4,
    perCategory: 6, // up to `maxCategories` distinct categories
    maxCategories: 3,
    timeMax: 20, // full marks when all signals are at the same minute
    proximityMax: 15, // full marks when all signals are at the same spot
    cap: 95, // pattern matching is never certain
  },
};

const TRAFFIC_TYPES = ["traffic"];
const INCIDENT_TYPES = ["road_incident"];
const TRANSIT_TYPES = ["public_transport"];
const ENVIRONMENT_TYPES = ["weather", "air_quality", "noise"];

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const hasType = (signal, types) => types.includes(signal.type);

// "14:28:00" -> seconds since midnight. Returns null for anything unusable.
export function toSeconds(clock) {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(clock ?? "").trim());
  if (!match) return null;
  const [, h, m, s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function spreadMinutes(group) {
  const times = group.map((signal) => signal.seconds);
  return (Math.max(...times) - Math.min(...times)) / 60;
}

function maxDistanceKm(group) {
  let max = 0;
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      max = Math.max(max, distanceKm(group[i], group[j]));
    }
  }
  return max;
}

const distinct = (group, key) => [...new Set(group.map((signal) => signal[key]))];

const formatClock = (seconds) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};

// ---------------------------------------------------------------------------
// Step 1 — keep only usable, abnormal signals
// ---------------------------------------------------------------------------

// Normal-severity signals describe baseline conditions, so they never form a situation.
function collectEvidence(signals) {
  return signals
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

// ---------------------------------------------------------------------------
// Step 2 — group signals that are close in space AND time
// ---------------------------------------------------------------------------

// Two signals are linked when they are within `nearbyKm` and `windowMinutes` of each other.
// A cluster is a set of signals connected through such links.
function clusterSignals(evidence, config) {
  const parent = evidence.map((_, index) => index);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  for (let i = 0; i < evidence.length; i += 1) {
    for (let j = i + 1; j < evidence.length; j += 1) {
      const closeInTime = Math.abs(evidence[i].seconds - evidence[j].seconds) <= config.windowMinutes * 60;
      if (closeInTime && distanceKm(evidence[i], evidence[j]) <= config.nearbyKm) {
        parent[find(j)] = find(i);
      }
    }
  }

  const clusters = new Map();
  evidence.forEach((signal, index) => {
    const root = find(index);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(signal);
  });
  return [...clusters.values()];
}

// ---------------------------------------------------------------------------
// Step 3 — rules
// ---------------------------------------------------------------------------
// `title` is the rule's output statement; `reason` says what was observed, in hedged
// language (no causality). Each rule receives the signals of one cluster that no earlier rule has used,
// and returns the supporting signals, or null when the pattern is absent.
// Rules run in order; a signal supports at most one situation.

const RULES = [
  {
    id: "traffic-disruption",
    title: "Potential traffic disruption detected",
    impact: "Possible travel delays nearby",
    reason: "Traffic slowdown and an incident were detected in the same or nearby areas within a similar time window.",
    match(group) {
      const traffic = group.filter((s) => hasType(s, TRAFFIC_TYPES));
      const incidents = group.filter((s) => hasType(s, INCIDENT_TYPES));
      return traffic.length && incidents.length ? [...traffic, ...incidents] : null;
    },
  },
  {
    id: "air-quality-concern",
    title: "Elevated air-quality conditions detected",
    impact: "Possible advisory for sensitive groups",
    reason: "Elevated air-quality readings were detected alongside other environmental signals nearby.",
    match(group, config) {
      const environment = group.filter((s) => hasType(s, ENVIRONMENT_TYPES));
      const elevatedAqi = environment.filter((s) => s.type === "air_quality" && s.value >= config.aqiElevated);
      // Needs an elevated AQI reading plus at least one other environmental signal.
      return elevatedAqi.length && environment.length >= 2 ? environment : null;
    },
  },
  {
    id: "transit-disruption",
    title: "Potential transit disruption detected",
    impact: "Possible public transport delays",
    reason: "A transit delay and a traffic slowdown were detected near each other within a similar time window.",
    match(group) {
      const transit = group.filter((s) => hasType(s, TRANSIT_TYPES));
      const traffic = group.filter((s) => hasType(s, TRAFFIC_TYPES));
      return transit.length && traffic.length ? [...transit, ...traffic] : null;
    },
  },
  {
    id: "multi-signal-anomaly",
    title: "Multiple civic signals are occurring in the same area",
    impact: "Conditions worth monitoring",
    reason: "Signals from several different categories were detected close together at about the same time.",
    match(group, config) {
      const { minSignals, minCategories } = config.multiSignal;
      return group.length >= minSignals && distinct(group, "type").length >= minCategories ? group : null;
    },
  },
];

// Rule 1 is checked before Rule 3 (both use traffic), Rule 2 before Rule 4 (both use
// environmental signals), so the most specific explanation wins. Rule 4 is the fallback.
const RULE_ORDER = ["traffic-disruption", "air-quality-concern", "transit-disruption", "multi-signal-anomaly"];
const orderedRules = RULE_ORDER.map((id) => RULES.find((rule) => rule.id === id));

// ---------------------------------------------------------------------------
// Step 4 — confidence, severity, wording
// ---------------------------------------------------------------------------

// Simple, additive and fully shown to the user:
//   confidence = base + signals + categories + timing + proximity   (capped)
// This measures how well the signals fit the rule. It is NOT the probability that
// anything actually happened.
function scoreConfidence(group, config) {
  const c = config.confidence;
  const categories = distinct(group, "type").length;
  const spread = spreadMinutes(group);
  const farthest = maxDistanceKm(group);

  const factors = [
    {
      key: "rule",
      label: "Rule matched",
      points: c.base,
      max: c.base,
      detail: "The signals fit a predefined pattern.",
    },
    {
      key: "signals",
      label: "Supporting signals",
      points: Math.min(group.length, c.maxSignals) * c.perSignal,
      max: c.maxSignals * c.perSignal,
      detail: `${group.length} ${group.length === 1 ? "signal" : "signals"}`,
    },
    {
      key: "categories",
      label: "Signal categories",
      points: Math.min(categories, c.maxCategories) * c.perCategory,
      max: c.maxCategories * c.perCategory,
      detail: `${categories} ${categories === 1 ? "category" : "categories"}`,
    },
    {
      key: "timing",
      label: "Timing",
      points: c.timeMax * Math.max(0, 1 - spread / config.windowMinutes),
      max: c.timeMax,
      detail: `${Math.round(spread)} min apart`,
    },
    {
      key: "proximity",
      label: "Proximity",
      points: c.proximityMax * Math.max(0, 1 - farthest / config.nearbyKm),
      max: c.proximityMax,
      detail: `${farthest.toFixed(1)} km apart`,
    },
  ].map((factor) => ({ ...factor, points: Math.round(factor.points) }));

  const total = factors.reduce((sum, factor) => sum + factor.points, 0);
  return { confidence: Math.min(total, c.cap), factors };
}

// Severity comes from the signals' own severity plus how much evidence supports the pattern.
//   CRITICAL  3+ critical signals
//   HIGH      2+ critical signals, or 1 critical signal with 3+ signals in total
//   MEDIUM    1 critical signal, or 3+ signals
//   LOW       anything else (e.g. two attention-level signals)
function assignSeverity(group) {
  const critical = group.filter((s) => s.severity === "critical").length;
  if (critical >= 3) return "critical";
  if (critical >= 2 || (critical >= 1 && group.length >= 3)) return "high";
  if (critical >= 1 || group.length >= 3) return "medium";
  return "low";
}

const severityRank = (signal) => (signal.severity === "critical" ? 2 : signal.severity === "attention" ? 1 : 0);

// The area a situation is named after: worst severity first, then the area with
// the most supporting signals, then alphabetical so the result is stable.
function pickAnchorArea(group) {
  const byArea = new Map();
  group.forEach((signal) => {
    const entry = byArea.get(signal.area) ?? { area: signal.area, worst: 0, count: 0 };
    entry.worst = Math.max(entry.worst, severityRank(signal));
    entry.count += 1;
    byArea.set(signal.area, entry);
  });
  return [...byArea.values()].sort(
    (a, b) => b.worst - a.worst || b.count - a.count || a.area.localeCompare(b.area)
  )[0].area;
}

function buildWhy(group, area, areas, spread) {
  const nearby = areas.length > 1 ? ` (and ${areas.length - 1} nearby ${areas.length === 2 ? "area" : "areas"})` : "";
  const minutes = Math.round(spread);
  const timing =
    minutes >= 1
      ? `within ${minutes} ${minutes === 1 ? "minute" : "minutes"} of each other`
      : "at about the same time";
  return `${group.length} related signals were detected around ${area}${nearby} ${timing}.`;
}

function buildSituation(rule, group, config) {
  const area = pickAnchorArea(group);
  const areas = distinct(group, "area").sort((a, b) => (a === area ? -1 : b === area ? 1 : a.localeCompare(b)));
  const spread = spreadMinutes(group);
  const { confidence, factors } = scoreConfidence(group, config);
  const latest = Math.max(...group.map((s) => s.seconds));
  const whyDetected = buildWhy(group, area, areas, spread);

  return {
    id: "", // assigned after sorting
    ruleId: rule.id,
    title: rule.title,
    severity: assignSeverity(group),
    status: "active",
    area,
    areas,
    detectedAt: formatClock(latest),
    description: rule.reason,
    whyDetected,
    relatedSignalIds: group.map((s) => s.id).sort(),
    impact: rule.impact,
    confidence,
    confidenceFactors: factors,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detects situations from a list of signals.
 *
 * @param {Array} signals  signal objects shaped like signals.js
 * @param {Object} [overrides]  partial DETECTION_CONFIG overrides (used for tuning/tests)
 * @returns {Array} situations, most serious first, ids SIT-001, SIT-002, …
 */
export function detectSituations(signals, overrides = {}) {
  if (!Array.isArray(signals)) return [];
  const config = {
    ...DETECTION_CONFIG,
    ...overrides,
    multiSignal: { ...DETECTION_CONFIG.multiSignal, ...overrides.multiSignal },
    confidence: { ...DETECTION_CONFIG.confidence, ...overrides.confidence },
  };

  const found = [];

  clusterSignals(collectEvidence(signals), config).forEach((cluster) => {
    let remaining = cluster;

    orderedRules.forEach((rule) => {
      const supporting = rule.match(remaining, config);
      if (!supporting || supporting.length === 0) return;
      // A chain of nearby signals can stretch past the window; the pattern itself must not.
      if (spreadMinutes(supporting) > config.windowMinutes) return;

      found.push(buildSituation(rule, supporting, config));
      const used = new Set(supporting.map((s) => s.id));
      remaining = remaining.filter((s) => !used.has(s.id));
    });
  });

  return found
    .sort(
      (a, b) =>
        SEVERITY_LEVELS.indexOf(b.severity) - SEVERITY_LEVELS.indexOf(a.severity) ||
        b.confidence - a.confidence ||
        a.area.localeCompare(b.area)
    )
    .map((situation, index) => ({ ...situation, id: `SIT-${String(index + 1).padStart(3, "0")}` }));
}

// Counts per severity level, e.g. { low: 0, medium: 2, high: 1, critical: 0 }.
export function countBySeverity(situations) {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  situations.forEach((situation) => {
    if (situation.severity in counts) counts[situation.severity] += 1;
  });
  return counts;
}
