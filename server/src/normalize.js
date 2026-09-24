// Common event schema + severity rules. Every feed adapter (sim, Open-Meteo, TomTom...)
// must output events through makeEvent() so the engine only ever sees ONE shape.
import { zoneById } from './zones.js';

export const RULES = {
  windowMin: 30,                                       // "same time window" used in wording
  rainfall: { attention: 2.5, critical: 7.5 },         // mm/h
  congestionRatio: { attention: 1.3, critical: 2.0 },  // current % / typical %
};

const SEV = ['normal', 'attention', 'critical'];
export const sevRank = (s) => SEV.indexOf(s);
export const worstOf = (a, b) => (sevRank(a) >= sevRank(b) ? a : b);
export const round1 = (n) => Math.round(n * 10) / 10;
export const round2 = (n) => Math.round(n * 100) / 100;

// Average speed implied by a congestion %, used by the simulator AND scenario route ETAs.
export const FREE_FLOW_KMH = 40;
export const speedAt = (pct) => round1(FREE_FLOW_KMH * (1 - 0.85 * (pct / 100)));

export const conditionOf = (mmh) =>
  mmh < 0.1 ? 'Clear' : mmh < 2.5 ? 'Light rain' : mmh < 7.5 ? 'Rain' : 'Heavy rain';

export function severityOf(category, value, baseline) {
  if (category === 'rainfall') {
    return value >= RULES.rainfall.critical ? 'critical' : value >= RULES.rainfall.attention ? 'attention' : 'normal';
  }
  if (category === 'congestion') {
    const r = value / (baseline || 1);
    return r >= RULES.congestionRatio.critical ? 'critical' : r >= RULES.congestionRatio.attention ? 'attention' : 'normal';
  }
  return 'normal';
}

let seq = 0;
export function makeEvent(o) {
  const z = zoneById[o.zoneId];
  return {
    id: `evt_${String(++seq).padStart(5, '0')}`,
    source: o.source,                       // weather | traffic | incident
    feed: o.feed,                           // sim | open-meteo | tomtom
    category: o.category,                   // rainfall | congestion | accident | closure | construction | obstruction
    zoneId: o.zoneId,
    lat: o.lat ?? z.lat,
    lng: o.lng ?? z.lng,
    timestamp: new Date(o.ts).toISOString(), // always UTC ISO
    value: round1(o.value),
    unit: o.unit,
    baseline: o.baseline ?? null,
    severity: o.severity ?? severityOf(o.category, o.value, o.baseline),
    durationMin: o.durationMin ?? null,     // incidents only: how long it stays active
    label: o.label ?? null,
    extra: o.extra ?? null,                 // tempC, avgSpeedKmh, ...
    simulated: !!o.simulated,
  };
}
