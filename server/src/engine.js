// Rule-based detection on a rolling window. No ML. Pure functions: (events, time) -> state.
import { CITY_ZONES } from './zones.js';
import { RULES, worstOf, conditionOf, round1, round2 } from './normalize.js';

const MIN = 60000, STEP = 5 * MIN, LOOKBACK = 6 * 60 * MIN, MERGE_GAP = 15 * MIN;
const LEVEL = { normal: 'Normal', attention: 'Elevated', critical: 'Heavy' };
const FEEDS = { weather: { name: 'Weather', cadenceMin: 15 }, traffic: { name: 'Traffic', cadenceMin: 5 }, incident: { name: 'Incidents', cadenceMin: null } };
const TYPE_ORDER = ['rainfall', 'traffic', 'incident'];
const mean = (a) => (a.length ? round1(a.reduce((x, y) => x + y, 0) / a.length) : null);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function buildIndex(events, zones = CITY_ZONES.jaipur) {
  const idx = {};
  for (const z of zones) idx[z.id] = { weather: [], traffic: [], incident: [] };
  for (const e of events) idx[e.zoneId][e.source].push({ ...e, t: Date.parse(e.timestamp) });
  return { byZone: idx, all: events, zones };
}
const latest = (arr, t, maxAge) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].t <= t) return t - arr[i].t <= maxAge ? arr[i] : null; return null; };

function zoneState(idx, z, t, off) {
  const d = idx.byZone[z.id];
  const w = off.has('weather') ? null : latest(d.weather, t, 45 * MIN);
  const c = off.has('traffic') ? null : latest(d.traffic, t, 15 * MIN);
  const inc = off.has('incident') ? [] : d.incident.filter((e) => e.t <= t && t < e.t + e.durationMin * MIN);
  const signals = [];
  if (w && w.severity !== 'normal') signals.push({ key: 'rainfall', type: 'rainfall', source: 'weather', label: `${conditionOf(w.value)} (${w.value} mm/h)`, severity: w.severity, value: w.value, unit: 'mm/h' });
  if (c && c.severity !== 'normal') signals.push({ key: 'traffic', type: 'traffic', source: 'traffic', label: `Traffic at ${c.value}% vs ${c.baseline}% typical`, severity: c.severity, value: c.value, unit: '%', baseline: c.baseline, ratio: round2(c.value / c.baseline) });
  for (const e of inc) if (e.severity !== 'normal') signals.push({ key: `incident:${e.id}`, type: 'incident', source: 'incident', category: e.category, label: e.label, severity: e.severity, lat: e.lat, lng: e.lng, since: e.timestamp });
  return {
    zoneId: z.id, name: z.name, lat: z.lat, lng: z.lng, roads: z.roads, address: z.address ?? null, baseline: z.baseline,
    weather: w ? { rainfallMmh: w.value, condition: conditionOf(w.value), tempC: w.extra?.tempC ?? null, severity: w.severity, timestamp: w.timestamp } : null,
    traffic: c ? { congestionPct: c.value, baselinePct: c.baseline, ratio: round2(c.value / c.baseline), avgSpeedKmh: c.extra?.avgSpeedKmh ?? null, level: LEVEL[c.severity], severity: c.severity, timestamp: c.timestamp } : null,
    incidents: { active: inc.length, items: inc.map((e) => ({ id: e.id, category: e.category, label: e.label, severity: e.severity, lat: e.lat, lng: e.lng, timestamp: e.timestamp })) },
    signals, signalCount: signals.length,
    severity: signals.reduce((s, x) => worstOf(s, x.severity), 'normal'),
    multiSource: signals.length >= 2 && new Set(signals.map((s) => s.source)).size >= 2, // the "civic situation" rule
  };
}

function scan(idx, tEnd, off, t0) {
  const start = Math.max(t0, tEnd - LOOKBACK), ts = [];
  for (let t = tEnd; t >= start; t -= STEP) ts.push(t);
  return ts.reverse().map((t) => ({ t, zones: idx.zones.map((z) => zoneState(idx, z, t, off)) }));
}

function episodesFor(steps, zi) { // contiguous multi-source runs; gaps <= 15 min are merged (no flicker)
  const eps = []; let cur = null;
  steps.forEach((s, i) => {
    if (!s.zones[zi].multiSource) return;
    if (cur && s.t - steps[cur.last].t <= MERGE_GAP) cur.last = i;
    else { cur = { first: i, last: i }; eps.push(cur); }
  });
  return eps;
}

const phrase = { rainfall: (z) => `${{ 'Light rain': 'light', Rain: 'moderate', 'Heavy rain': 'heavy' }[z.weather?.condition] ?? ''} rainfall`.trim(), traffic: () => 'increased traffic', incident: (z) => `${plural(z.incidents.active, 'active incident report')}` };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function toSituation(ep, steps, zi, tEnd) {
  const last = steps[ep.last], z = last.zones[zi], first = steps[ep.first];
  const active = ep.last === steps.length - 1;
  const range = steps.slice(ep.first, ep.last + 1);
  const severity = range.reduce((s, x) => worstOf(s, x.zones[zi].severity), 'normal');
  const has = (t) => z.signals.some((s) => s.type === t);
  const onsets = {};
  for (const type of TYPE_ORDER) { // walk back to when each signal FIRST became abnormal
    let j = range.findIndex((s) => s.zones[zi].signals.some((x) => x.type === type));
    if (j < 0) continue;
    j += ep.first;
    while (j > 0 && steps[j - 1].zones[zi].signals.some((x) => x.type === type)) j--;
    onsets[type] = steps[j].t;
  }
  const order = Object.keys(onsets).sort((a, b) => onsets[a] - onsets[b] || TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
  const critInc = z.signals.some((s) => s.type === 'incident' && s.severity === 'critical');
  const title = critInc ? 'Road incident' : has('rainfall') && has('traffic') && has('incident') ? 'Weather-related traffic disruption'
    : has('rainfall') && has('traffic') ? 'Unusual rainfall' : has('rainfall') && has('incident') ? 'Rain-related road incident' : 'Traffic disruption';
  const parts = order.map((t) => phrase[t](z));
  const summary = `${cap(parts[0])} coincided with ${parts.slice(1).join(' and ')} around ${z.name}.`;
  const lag = onsets.rainfall && onsets.traffic && onsets.traffic > onsets.rainfall ? Math.round((onsets.traffic - onsets.rainfall) / MIN) : 0;
  const names = { rainfall: 'rainfall', traffic: 'traffic', incident: 'incident reports' };
  const list = order.map((t) => names[t]);
  const corrText = has('rainfall') && has('traffic')
    ? `Rainfall and traffic increased within the same area and time window${lag ? `, with traffic rising about ${lag} min after rainfall` : ''}. This is a possible correlation, not a confirmed cause.`
    : `${cap(list.slice(0, -1).join(', ') + (list.length > 1 ? ' and ' : '') + list.at(-1))} changed within the same area and time window and may be related. No cause is confirmed.`;
  const chain = order.map((t) => ({ type: t, label: { rainfall: 'Rainfall ↑', traffic: 'Traffic ↑', incident: 'Incidents ↑' }[t], at: new Date(onsets[t]).toISOString() }));
  return {
    id: `sit-${z.zoneId}-${first.t}`, zoneId: z.zoneId, location: z.name, title, severity,
    status: active ? 'active' : 'resolved', detectedAt: new Date(first.t).toISOString(), resolvedAt: active ? null : new Date(last.t).toISOString(),
    signals: z.signals, signalCount: z.signals.length, summary,
    correlation: { label: 'POSSIBLE CORRELATION', text: corrText, lagMinutes: lag, chain },
    timeline: chain, // frontend may append a "Route ETA ↑" step once routes are wired in
    why: `Flagged because ${z.signals.length} signals from ${new Set(z.signals.map((s) => s.source)).size} different feeds changed in ${z.name} within the same ${RULES.windowMin}-minute window: ${z.signals.map((s) => s.label).join('; ')}. Several signals moving together in one area is a pattern worth a look, not proof that one caused another.`,
  };
}

export function computeState(idx, tEnd, { off = new Set(), meta } = {}) {
  const steps = scan(idx, tEnd, off, meta?.start ?? 0);
  if (!steps.length) return { now: new Date(tEnd).toISOString(), zones: [], situations: [], pulse: { level: 'Normal', situationCount: 0 } };
  const cur = steps.at(-1).zones;
  const situations = [];
  idx.zones.forEach((_, zi) => episodesFor(steps, zi).forEach((ep) => situations.push(toSituation(ep, steps, zi, tEnd))));
  const sevRankN = { critical: 2, attention: 1, normal: 0 };
  situations.sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1) || sevRankN[b.severity] - sevRankN[a.severity] || b.detectedAt.localeCompare(a.detectedAt));
  const active = situations.filter((s) => s.status === 'active');
  const inSit = new Set(active.map((s) => s.zoneId));
  const anomalies = cur.filter((z) => z.signalCount > 0 && !inSit.has(z.zoneId)).map((z) => ({
    zoneId: z.zoneId, name: z.name, severity: z.severity, signals: z.signals,
    title: `${{ rainfall: 'Rainfall', traffic: 'Traffic', incident: 'Incident' }[z.signals[0].type]} anomaly`,
  }));
  const counts = { normal: 0, attention: 0, critical: 0 };
  cur.forEach((z) => counts[z.severity]++);
  const worst = active.map((s) => s.severity).reduce(worstOf, 'normal'); // city level = worst ACTIVE situation; lone anomalies are listed separately
  const sitW = active.reduce((a, s) => a + (s.severity === 'critical' ? 1 : 0.5), 0);
  const rain = cur.filter((z) => z.weather), trf = cur.filter((z) => z.traffic);
  const maxRain = rain.length ? Math.max(...rain.map((z) => z.weather.rainfallMmh)) : null;
  const feeds = Object.entries(FEEDS).map(([id, f]) => {
    const evs = idx.all.filter((e) => e.source === id && Date.parse(e.timestamp) <= tEnd);
    const lastTs = evs.length ? evs.at(-1).timestamp : null;
    const disabled = off.has(id);
    const stale = f.cadenceMin && lastTs && tEnd - Date.parse(lastTs) > 3 * f.cadenceMin * MIN;
    return { id, name: f.name, cadenceMin: f.cadenceMin, enabled: !disabled, status: disabled ? 'offline' : stale ? 'stale' : 'live', lastUpdated: lastTs, simulated: true };
  });
  const missing = feeds.filter((f) => f.status !== 'live').map((f) => f.name);
  const stride = 3, n = steps.length;
  const trends = steps.filter((_, i) => (n - 1 - i) % stride === 0).map((s) => ({
    t: new Date(s.t).toISOString(),
    avgCongestionPct: mean(s.zones.filter((z) => z.traffic).map((z) => z.traffic.congestionPct)),
    avgBaselinePct: mean(s.zones.filter((z) => z.traffic).map((z) => z.traffic.baselinePct)),
    activeIncidents: s.zones.reduce((a, z) => a + z.incidents.active, 0),
    avgRainfallMmh: mean(s.zones.filter((z) => z.weather).map((z) => z.weather.rainfallMmh)),
    situations: s.zones.filter((z) => z.multiSource).length,
  }));
  return {
    mode: 'scenario', city: idx.zones[0]?.id.split('-')[0] ?? 'jaipur', snapshotAt: new Date().toISOString(), now: new Date(tEnd).toISOString(),
    range: { start: new Date(meta.start).toISOString(), end: new Date(meta.start + meta.rangeMin * MIN).toISOString(), default: new Date(meta.start + meta.defaultMin * MIN).toISOString() },
    degraded: missing.length > 0, missingFeeds: missing, feeds,
    pulse: { level: worst, label: worst.toUpperCase(), situationCount: active.length, intensity: Math.min(1, round2(sitW / 3)) },
    snapshot: {
      traffic: trf.length ? { level: LEVEL[trf.reduce((s, z) => worstOf(s, z.traffic.severity), 'normal')], avgCongestionPct: mean(trf.map((z) => z.traffic.congestionPct)) } : { level: 'Unavailable', avgCongestionPct: null },
      weather: rain.length ? { condition: conditionOf(maxRain), maxRainfallMmh: maxRain, avgTempC: mean(rain.map((z) => z.weather.tempC).filter((v) => v != null)) } : { condition: 'Unavailable', maxRainfallMmh: null, avgTempC: null },
      incidents: { active: cur.reduce((a, z) => a + z.incidents.active, 0) },
    },
    zones: cur, situations, anomalies,
    insights: {
      zoneCounts: counts, activeSituations: active.length, resolvedSituations: situations.length - active.length,
      patterns: active.filter((s) => s.signals.some((x) => x.type === 'rainfall') && s.signals.some((x) => x.type === 'traffic')).map((s) => `Rainfall coincided with a traffic slowdown around ${s.location}.`),
    },
    trends,
  };
}
