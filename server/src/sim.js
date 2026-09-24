// Deterministic "Monsoon Tuesday" scenario. Same output every run -> reliable laptop demos + replay.
import { CITY_ZONES } from './zones.js';
import { makeEvent, conditionOf, round1, speedAt } from './normalize.js';

export const T0 = Date.parse('2026-09-22T04:30:00Z'); // 10:00 IST
export const META = { start: T0, rangeMin: 480, defaultMin: 235 };

const RAIN = { // peak mm/h, start/end minute
  'mi-road':          { peak: 7.0, start: 150, end: 330 },
  'civil-lines':      { peak: 6.0, start: 160, end: 320 },
  'tonk-road':        { peak: 2.0, start: 170, end: 310 },
  'malviya-nagar':    { peak: 1.4, start: 175, end: 300 },
  'vaishali-nagar':   { peak: 1.2, start: 190, end: 290 },
  'sanganer-airport': { peak: 0.8, start: 200, end: 280 },
};
const INCIDENTS = [
  { zoneId: 'vaishali-nagar', category: 'closure',      label: 'Road closure for water main repair', start: 30,  dur: 70,  severity: 'attention', d: [0.003, 0.002] },
  { zoneId: 'tonk-road',      category: 'accident',     label: 'Multi-vehicle collision',            start: 170, dur: 120, severity: 'critical',  d: [0.004, -0.003] },
  { zoneId: 'tonk-road',      category: 'closure',      label: 'Lane closure for recovery work',     start: 185, dur: 100, severity: 'attention', d: [-0.003, 0.004] },
  { zoneId: 'mi-road',        category: 'obstruction',  label: 'Waterlogging on carriageway',        start: 205, dur: 120, severity: 'attention', d: [0.003, 0.003] },
  { zoneId: 'mi-road',        category: 'accident',     label: 'Minor collision',                    start: 215, dur: 60,  severity: 'attention', d: [-0.002, -0.004] },
  { zoneId: 'malviya-nagar',  category: 'construction', label: 'Road resurfacing works',             start: 0,   dur: 480, severity: 'attention', d: [0.002, -0.002] },
];
const EFFECT = { accident: 6, closure: 12, obstruction: 4, construction: 3 }; // extra congestion pts
const K_RAIN = 3.0; // congestion pts per mm/h of rain (15 min lag)

function rng(seed) { // mulberry32
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const bump = (m, p) => (m > p.start && m < p.end ? p.peak * Math.sin((Math.PI * (m - p.start)) / (p.end - p.start)) : 0);
function incidentEffect(zoneId, m) {
  let sum = 0;
  for (const i of INCIDENTS) {
    if (i.zoneId !== zoneId) continue;
    const end = i.start + i.dur;
    const f = m >= i.start && m <= end ? Math.min(1, (m - i.start) / 15) : m > end && m < end + 15 ? 1 - (m - end) / 15 : 0;
    sum += EFFECT[i.category] * f;
  }
  return sum;
}

export function generate(city = 'jaipur', zones = CITY_ZONES[city] ?? CITY_ZONES.jaipur) {
  const ev = [];
  zones.forEach((z, zi) => {
    const rand = rng(1000 + zi * 17 + city.length * 31);
    const sourceId = city === 'jaipur' && z.scenarioIndex < 6 ? ZONESafeId(zi) : null;
    const p = RAIN[sourceId] ?? { peak: zi < 2 ? 5.5 : zi < 4 ? 2.4 : 1.2, start: 150 + zi * 6, end: 330 - zi * 7 };
    for (let m = 0; m <= META.rangeMin; m += 15) { // weather feed: every 15 min
      const b = bump(m, p);
      const rain = Math.max(0, b + (b > 0 ? (rand() - 0.5) * 0.6 : 0));
      ev.push(makeEvent({ source: 'weather', feed: 'sim', category: 'rainfall', zoneId: z.id, ts: T0 + m * 60000, value: rain, unit: 'mm/h', baseline: 0, simulated: true,
        extra: { tempC: round1(31 - 0.6 * rain + (rand() - 0.5) * 0.4), condition: conditionOf(rain) } }));
    }
    for (let m = 0; m <= META.rangeMin; m += 5) { // traffic feed: every 5 min
      const c = Math.min(98, z.baseline.congestion * (1 + 0.08 * (rand() - 0.5)) + K_RAIN * bump(m - 15, p) + incidentEffect(sourceId ?? z.id, m));
      ev.push(makeEvent({ source: 'traffic', feed: 'sim', category: 'congestion', zoneId: z.id, ts: T0 + m * 60000, value: c, unit: '%', baseline: z.baseline.congestion, simulated: true,
        extra: { avgSpeedKmh: speedAt(c) } }));
    }
  });
  const incidents = city === 'jaipur' ? INCIDENTS : zones.slice(0, 5).map((z, i) => ({
    zoneId: z.id, category: i % 2 ? 'closure' : 'accident', label: i % 2 ? 'Road maintenance report' : 'Traffic incident report',
    start: 70 + i * 42, dur: 55 + (i % 3) * 20, severity: i === 2 ? 'critical' : 'attention', d: [0.002, -0.002],
  }));
  for (const i of incidents) { // explicitly simulated incident feed
    const z = zones.find((x) => x.id === i.zoneId);
    ev.push(makeEvent({ source: 'incident', feed: 'sim', category: i.category, zoneId: i.zoneId, ts: T0 + i.start * 60000, value: 1, unit: 'count',
      severity: i.severity, durationMin: i.dur, label: i.label, lat: z.lat + i.d[0], lng: z.lng + i.d[1], simulated: true }));
  }
  return ev.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
}

function ZONESafeId(index) { return ['mi-road', 'civil-lines', 'tonk-road', 'malviya-nagar', 'vaishali-nagar', 'sanganer-airport'][index]; }
