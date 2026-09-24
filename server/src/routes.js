// Route intelligence. NOTHING here is a hardcoded result: ETAs, delays, signal counts and the
// fastest route are all computed from state (scenario) or from TomTom responses (live).
import { speedAt } from './normalize.js';

// ---- scenario journey: geography only (which zones a corridor crosses, and how long each stretch is) ----
export const SCENARIO_JOURNEY = { from: { name: 'MI Road', zoneId: 'mi-road' }, to: { name: 'Jaipur Airport', zoneId: 'sanganer-airport' } };

const CITY_CORRIDORS = {
  jaipur: [
    { id: 'route-1', name: 'Tonk Road corridor', indexes: [0, 2, 5], lengths: [3.2, 5.5, 4.1] },
    { id: 'route-2', name: 'Malviya Nagar corridor', indexes: [0, 3, 5], lengths: [3.2, 6.2, 3.8] },
    { id: 'route-3', name: 'Civil Lines bypass', indexes: [1, 3, 5], lengths: [4.8, 3.2, 4.9] },
  ],
  jodhpur: [
    { id: 'route-1', name: 'Paota & Ratanada corridor', indexes: [0, 2, 5], lengths: [3.0, 5.2, 4.0] },
    { id: 'route-2', name: 'Sardarpura corridor', indexes: [0, 1, 5], lengths: [2.8, 4.8, 4.2] },
    { id: 'route-3', name: 'Shastri Nagar bypass', indexes: [0, 4, 5], lengths: [3.5, 3.8, 3.9] },
  ],
  udaipur: [
    { id: 'route-1', name: 'Chetak Circle corridor', indexes: [0, 2, 5], lengths: [2.9, 4.5, 3.8] },
    { id: 'route-2', name: 'Fatehpura corridor', indexes: [0, 1, 5], lengths: [3.2, 5.0, 3.6] },
    { id: 'route-3', name: 'Sukhadia Circle bypass', indexes: [0, 4, 5], lengths: [3.6, 3.4, 4.0] },
  ],
};

const r1 = (n) => Math.round(n * 10) / 10;

// same id scheme as the frontend adapter, so route signals and map markers are the SAME objects
export const signalId = (zoneId, s) => (s.type === 'incident' ? `${zoneId}:${s.key.split(':')[1]}` : `${zoneId}:${s.type === 'rainfall' ? 'weather' : 'traffic'}`);

export function scenarioRoutes(state) {
  const cityKey = (state?.city?.id || 'jaipur').toLowerCase();
  const corridors = CITY_CORRIDORS[cityKey] ?? CITY_CORRIDORS.jaipur;
  const zones = Object.fromEntries(state.zones.map((z) => [z.zoneId, z]));
  const list = state.zones;
  const from = list[0];
  const to = list[5] ?? list.at(-1);
  const routes = corridors.map((c) => {
    let curH = 0, normH = 0, km = 0; const signals = [], path = [[from.lat, from.lng]];
    const legs = c.indexes.map((index, i) => [list[index] ?? list[0], c.lengths[i]]);
    for (const [zone, len] of legs) {
      const zid = zone.zoneId, z = zones[zid] ?? zone, vN = speedAt(z.baseline?.congestion ?? 30), vC = z.traffic ? z.traffic.avgSpeedKmh : vN;
      curH += len / vC; normH += len / vN; km += len; path.push([z.lat, z.lng]);
      for (const s of z.signals ?? []) signals.push({ id: signalId(zid, s), type: s.type === 'rainfall' ? 'weather' : s.type === 'incident' ? 'road_incident' : 'traffic', label: s.label, severity: s.severity, zoneId: zid });
    }
    path.push([to.lat, to.lng]);
    return { id: c.id, name: c.name, source: 'scenario', distanceKm: r1(km), normalSec: Math.round(normH * 3600), currentSec: Math.round(curH * 3600), signals, path, trafficSignals: null };
  });
  const missing = state.missingFeeds ?? [];
  return finalize(routes, { journey: { from: { name: from.name, lat: from.lat, lng: from.lng }, to: { name: to.name, lat: to.lat, lng: to.lng } }, source: 'scenario', now: state.now, degraded: missing.length > 0, missingFeeds: missing });
}

// ---- shared: rounding, delay, fastest ----
export function finalize(routes, meta) {
  const out = routes.map((r) => {
    const normalMin = Math.round(r.normalSec / 60), currentMin = Math.round(r.currentSec / 60);
    const seen = new Set();
    const signals = r.signals.filter((s) => !seen.has(s.id) && seen.add(s.id));
    return { ...r, signals, signalCount: signals.length, normalMin, currentMin, delayMin: currentMin - normalMin }; // delay = current - normal, always calculated
  });
  const byCurrent = [...out].sort((a, b) => a.currentSec - b.currentSec || a.delayMin - b.delayMin);
  const fastest = byCurrent[0], slowest = byCurrent.at(-1);
  out.forEach((r) => { r.isFastest = fastest && r.id === fastest.id; });
  return {
    ...meta, routes: out,
    recommendation: fastest ? { routeId: fastest.id, name: fastest.name, currentMin: fastest.currentMin, comparedTo: slowest.id !== fastest.id ? { routeId: slowest.id, name: slowest.name } : null, savingMin: slowest.currentMin - fastest.currentMin } : null,
  };
}

// ---- live: TomTom Routing API ----
const CATEGORY = { JAM: 'Traffic jam', ROAD_WORKS: 'Road works', ROAD_CLOSURE: 'Road closure', LANE_CLOSURE: 'Lane closure', ACCIDENT: 'Accident', BROKEN_DOWN_VEHICLE: 'Broken-down vehicle', DANGEROUS_CONDITIONS: 'Dangerous conditions', RAIN: 'Rain', FLOODING: 'Flooding' };
const INCIDENT_LIKE = new Set(['ROAD_WORKS', 'ROAD_CLOSURE', 'LANE_CLOSURE', 'ACCIDENT', 'BROKEN_DOWN_VEHICLE', 'DANGEROUS_CONDITIONS', 'FLOODING']);

export async function tomtomRoutes(from, to, key, fetchImpl = fetch) {
  const qs = new URLSearchParams({ key, traffic: 'true', maxAlternatives: '2', routeType: 'fastest', travelMode: 'car', computeTravelTimeFor: 'all', sectionType: 'traffic', instructionsType: 'text', language: 'en-GB' });
  const res = await fetchImpl(`https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json?${qs}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`TomTom routing ${res.status}`);
  return normalizeTomTom(await res.json());
}

export function normalizeTomTom(json) {
  const names = new Set();
  return (json.routes ?? []).map((r, i) => {
    const s = r.summary ?? {}, pts = (r.legs ?? []).flatMap((l) => l.points ?? []);
    const noTraffic = s.noTrafficTravelTimeInSeconds ?? (s.travelTimeInSeconds - (s.trafficDelayInSeconds ?? 0));
    const normalSec = s.historicTrafficTravelTimeInSeconds ?? noTraffic;      // typical for this time of day
    const id = `route-${i + 1}`;
    // name = the street the route spends the most distance on
    const ins = r.guidance?.instructions ?? [], perStreet = {};
    ins.forEach((x, k) => { if (!x.street) return; const end = ins[k + 1]?.routeOffsetInMeters ?? s.lengthInMeters; perStreet[x.street] = (perStreet[x.street] ?? 0) + (end - x.routeOffsetInMeters); });
    let name = Object.entries(perStreet).sort((a, b) => b[1] - a[1])[0]?.[0]; name = name ? `via ${name}` : `Route ${String.fromCharCode(65 + i)}`;
    while (names.has(name)) name += ' (alt)'; names.add(name);
    const signals = (r.sections ?? []).filter((x) => x.sectionType === 'TRAFFIC' && (x.delayInSeconds ?? 0) >= 60).map((x, k) => {
      const p = pts[x.startPointIndex] ?? pts[0], delayMin = Math.round(x.delayInSeconds / 60);
      const cat = x.simpleCategory ?? 'JAM';
      return { id: `${id}:tt:${k}`, type: INCIDENT_LIKE.has(cat) ? 'road_incident' : 'traffic', label: CATEGORY[cat] ?? 'Traffic disruption', delayMin, speedKmh: x.effectiveSpeedInKmh ?? null,
        severity: x.delayInSeconds >= 300 || (x.magnitudeOfDelay ?? 0) >= 3 ? 'critical' : x.delayInSeconds >= 120 || (x.magnitudeOfDelay ?? 0) === 2 ? 'attention' : 'normal',
        lat: p?.latitude ?? null, lng: p?.longitude ?? null };
    });
    return { id, name, source: 'tomtom', distanceKm: r1((s.lengthInMeters ?? 0) / 1000), normalSec, currentSec: s.travelTimeInSeconds, signals, fullPath: pts.map((p) => [p.latitude, p.longitude]), trafficSignals: null };
  });
}

// ---- optional: real traffic-light count from OpenStreetMap (Overpass). Fails soft -> null (UI hides it). ----
const toXY = ([lat, lng], lat0) => [lng * 111320 * Math.cos((lat0 * Math.PI) / 180), lat * 110540];
function distToPath(pt, path, lat0) {
  const [px, py] = toXY(pt, lat0); let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = toXY(path[i - 1], lat0), [bx, by] = toXY(path[i], lat0), dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
}
export async function attachTrafficSignals(routes, fetchImpl = fetch) {
  try {
    const all = routes.flatMap((r) => r.fullPath ?? []); if (!all.length) return;
    const lats = all.map((p) => p[0]), lngs = all.map((p) => p[1]), m = 0.002;
    const bbox = [Math.min(...lats) - m, Math.min(...lngs) - m, Math.max(...lats) + m, Math.max(...lngs) + m].join(',');
    const res = await fetchImpl('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(`[out:json][timeout:8];node["highway"="traffic_signals"](${bbox});out;`)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return;
    const nodes = ((await res.json()).elements ?? []).map((e) => [e.lat, e.lon]), lat0 = all[0][0];
    for (const r of routes) r.trafficSignals = nodes.filter((n) => distToPath(n, r.fullPath, lat0) <= 25).length;
  } catch { /* leave null */ }
}

export function liveResult(routes, journey) {
  const shaped = routes.map(({ fullPath, ...r }) => ({ ...r, path: downsample(fullPath, 300) }));
  return finalize(shaped, { journey, source: 'tomtom', now: new Date().toISOString(), degraded: false, missingFeeds: [] });
}
const downsample = (a, n) => (a.length <= n ? a : a.filter((_, i) => i % Math.ceil(a.length / n) === 0 || i === a.length - 1));

// ---- geocoding (TomTom Search), biased to selected city center ----
export async function geocode(q, key, fetchImpl = fetch, center = [26.9124, 75.7873]) {
  const city = Object.entries({ Jaipur: [26.9124, 75.7873], Jodhpur: [26.2389, 73.0243], Udaipur: [24.5854, 73.7125] })
    .find(([, point]) => point[0] === center[0] && point[1] === center[1])?.[0] ?? 'Jaipur';
  const query = new RegExp(`\\b${city}\\b`, 'i').test(q) ? q : `${q}, ${city}, Rajasthan, India`;
  const qs = new URLSearchParams({ key, limit: '10', countrySet: 'IN', lat: String(center[0]), lon: String(center[1]), radius: '60000', typeahead: 'true', language: 'en-GB' });
  const res = await fetchImpl(`https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?${qs}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`TomTom search ${res.status}`);
  const distanceKm = (a, b) => {
    const rad = (d) => d * Math.PI / 180;
    const dLat = rad(a[0] - b[0]), dLon = rad(a[1] - b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  };
  const rawResults = ((await res.json()).results ?? []).filter((x) => Number.isFinite(x.position?.lat) && Number.isFinite(x.position?.lon))
    .filter((x) => distanceKm(center, [x.position.lat, x.position.lon]) <= 60).map((x) => ({
    id: x.id,
    name: x.poi?.name ?? x.address?.freeformAddress ?? q,
    address: x.address?.freeformAddress ?? '',
    lat: x.position.lat,
    lng: x.position.lon,
  }));

  const qLower = q.toLowerCase();
  const list = [];

  // Special handling for Amity locations to verify coordinates and avoid duplicates
  if (city === 'Jaipur' && qLower.includes('amity')) {
    // Add verified Amity University Rajasthan
    list.push({
      id: 'amity-university-rajasthan',
      name: 'Amity University Rajasthan',
      address: 'SP-1 Kant Kalwar, NH11C, RIICO Industrial Area, Rajasthan 303002',
      lat: 27.1764,
      lng: 75.9568,
    });
    // Keep a distinct city office only when the geocoder returns its real position.
    const rawHouse = rawResults.find((r) => r.name.toLowerCase().includes('amity house') || r.address.toLowerCase().includes('lal kothi'));
    if (rawHouse) list.push({ ...rawHouse, name: 'Amity House' });
  }

  // Deduplicate and append other valid results
  const seenAddresses = new Set(list.map((item) => item.address.toLowerCase().trim()));
  const seenNames = new Set(list.map((item) => item.name.toLowerCase().trim()));

  for (const item of rawResults) {
    const normAddr = item.address.toLowerCase().trim();
    const normName = item.name.toLowerCase().trim();
    // Skip duplicate Amity entries (like duplicate Amity University at Amber or Lal Kothi) if already covered
    if (qLower.includes('amity') && normName.includes('university')) {
      continue;
    }
    if (seenAddresses.has(normAddr) || (normName && seenNames.has(normName))) {
      continue;
    }
    seenAddresses.add(normAddr);
    if (normName) seenNames.add(normName);
    list.push(item);
  }

  return list.slice(0, 6);
}
