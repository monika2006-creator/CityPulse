import { conditionOf, round1, severityOf } from './normalize.js';

const ttlCache = new Map();
const cachedFetch = async (key, ttl, load) => {
  const hit = ttlCache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;
  const value = await load();
  ttlCache.set(key, { at: Date.now(), value });
  return value;
};

async function fetchWeatherAt(latitude, longitude) {
    const qs = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,precipitation,rain,weather_code', timezone: 'auto' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`weather provider returned ${response.status}`);
    const data = await response.json();
    if (!data.current) throw new Error('weather provider returned no current conditions');
    return data;
}

export async function weatherAt(latitude, longitude) {
  const key = `weather:${Number(latitude).toFixed(3)}:${Number(longitude).toFixed(3)}`;
  return cachedFetch(key, 5 * 60_000, () => fetchWeatherAt(latitude, longitude));
}

async function currentWeather(zone) {
  return weatherAt(zone.lat, zone.lng);
}

async function currentTraffic(zone, key, onTomTomRequest) {
  return cachedFetch(`traffic:${zone.id}`, 6 * 60_000, async () => {
    onTomTomRequest?.();
    const qs = new URLSearchParams({ point: `${zone.lat},${zone.lng}`, unit: 'KMPH', key });
    const response = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?${qs}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`traffic provider returned ${response.status}`);
    const data = await response.json();
    if (!data.flowSegmentData) throw new Error('traffic provider returned no flow data');
    return data.flowSegmentData;
  });
}

const toIso = (value) => value ? new Date(value).toISOString() : new Date().toISOString();

/** Merge provider observations into the normal CityPulse snapshot shape. */
export async function liveSnapshot(city, baseState, tomtomKey, onTomTomRequest) {
  const observedAt = new Date().toISOString();
  const outcomes = await Promise.all(city.zones.map(async (zone) => {
    const [weatherResult, trafficResult] = await Promise.allSettled([
      currentWeather(zone),
      tomtomKey ? currentTraffic(zone, tomtomKey, onTomTomRequest) : Promise.reject(new Error('TomTom key is not configured')),
    ]);
    return { zone, weatherResult, trafficResult };
  }));

  let weatherCount = 0, trafficCount = 0;
  const zones = outcomes.map(({ zone, weatherResult, trafficResult }) => {
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const flow = trafficResult.status === 'fulfilled' ? trafficResult.value : null;
    if (weather) weatherCount++;
    if (flow) trafficCount++;
    const base = baseState.zones.find((item) => item.zoneId === zone.id);
    const rain = weather ? Math.max(0, Number(weather.current.rain ?? weather.current.precipitation) || 0) : null;
    const tempC = weather ? Number(weather.current.temperature_2m) : null;
    const currentSpeed = flow ? Number(flow.currentSpeed) : null;
    const freeFlowSpeed = flow ? Number(flow.freeFlowSpeed) : null;
    const congestion = flow && freeFlowSpeed > 0 ? round1(Math.max(0, Math.min(100, (1 - currentSpeed / freeFlowSpeed) * 100))) : null;
    const trafficSeverity = congestion == null ? null : severityOf('congestion', congestion, zone.baseline.congestion);
    const rainSeverity = rain == null ? null : severityOf('rainfall', rain, 0);
    const timestamp = toIso(weather?.current?.time || observedAt);
    const signals = [];
    if (rain != null && rainSeverity !== 'normal') signals.push({ key: 'rainfall', type: 'rainfall', source: 'weather', label: `${conditionOf(rain)} (${round1(rain)} mm/h)`, severity: rainSeverity, value: round1(rain), unit: 'mm/h' });
    if (congestion != null && trafficSeverity !== 'normal') signals.push({ key: 'traffic', type: 'traffic', source: 'traffic', label: `Traffic at ${round1(currentSpeed)} km/h (${round1(congestion)}% congestion)`, severity: trafficSeverity, value: congestion, unit: '%', baseline: zone.baseline.congestion });
    const severityRank = { normal: 0, attention: 1, critical: 2 };
    const severity = signals.reduce((worst, signal) => severityRank[signal.severity] > severityRank[worst] ? signal.severity : worst, 'normal');
    return {
      ...base,
      weather: weather ? { rainfallMmh: round1(rain), condition: conditionOf(rain), tempC: round1(tempC), severity: rainSeverity, timestamp } : null,
      traffic: flow ? { congestionPct: congestion, baselinePct: zone.baseline.congestion, ratio: round1(congestion / zone.baseline.congestion), avgSpeedKmh: round1(currentSpeed), freeFlowSpeedKmh: round1(freeFlowSpeed), level: trafficSeverity, severity: trafficSeverity, timestamp: observedAt } : null,
      incidents: { active: 0, items: [] }, signals, signalCount: signals.length, severity,
      multiSource: Boolean(weather && flow && signals.length > 1), sourceStatus: { weather: Boolean(weather), traffic: Boolean(flow) },
    };
  });

  if (!weatherCount && !trafficCount) {
    return { ...baseState, snapshotAt: observedAt, warnings: ['Live providers are unavailable; showing the simulated scenario.'] };
  }

  const situations = zones.filter((z) => z.multiSource).map((z) => ({ id: `live-${z.zoneId}`, zoneId: z.zoneId, location: z.name, title: 'Weather and traffic conditions overlap', severity: z.severity, status: 'active', detectedAt: observedAt, summary: `Current weather and traffic readings are both elevated around ${z.name}.`, why: 'Both conditions were reported by their live data providers in the same monitored area.', signals: z.signals }));
  const activeByZone = new Set(situations.map((s) => s.zoneId));
  const anomalies = zones.filter((z) => z.signalCount && !activeByZone.has(z.zoneId)).map((z) => ({ zoneId: z.zoneId, name: z.name, severity: z.severity, signals: z.signals, title: `${z.signals[0].type === 'rainfall' ? 'Rainfall' : 'Traffic'} anomaly` }));
  const rank = { normal: 0, attention: 1, critical: 2 };
  const level = situations.reduce((worst, s) => rank[s.severity] > rank[worst] ? s.severity : worst, 'normal');
  const avg = (values) => values.length ? round1(values.reduce((sum, n) => sum + n, 0) / values.length) : null;
  const rains = zones.map((z) => z.weather?.rainfallMmh).filter(Number.isFinite);
  const traffics = zones.map((z) => z.traffic?.congestionPct).filter(Number.isFinite);
  const feeds = [
    { id: 'weather', name: 'Open-Meteo current weather', enabled: weatherCount > 0, status: weatherCount ? 'live' : 'offline', lastUpdated: observedAt, simulated: false, zonesAvailable: weatherCount },
    { id: 'traffic', name: 'TomTom traffic flow', enabled: trafficCount > 0, status: trafficCount ? 'live' : 'offline', lastUpdated: observedAt, simulated: false, zonesAvailable: trafficCount },
    { id: 'incident', name: 'Incidents', enabled: false, status: 'unavailable', lastUpdated: null, simulated: false, note: 'No live incident provider is configured.' },
  ];
  const missingFeeds = feeds.filter((f) => f.status !== 'live').map((f) => f.name);
  const state = {
    ...baseState, mode: weatherCount || trafficCount ? 'live' : 'scenario', city: { id: city.id, name: city.name, center: city.center }, now: observedAt, snapshotAt: observedAt,
    degraded: missingFeeds.length > 0, missingFeeds, feeds, zones, situations, anomalies,
    warnings: missingFeeds.length ? [`Some live data is unavailable: ${missingFeeds.join(', ')}.`] : [],
    pulse: { level, label: level.toUpperCase(), situationCount: situations.length, intensity: Math.min(1, situations.length / 3) },
    snapshot: { traffic: { level, avgCongestionPct: avg(traffics) }, weather: { condition: conditionOf(rains.length ? Math.max(...rains) : 0), maxRainfallMmh: rains.length ? Math.max(...rains) : null, avgTempC: avg(zones.map((z) => z.weather?.tempC).filter(Number.isFinite)) }, incidents: { active: 0 } },
    insights: { zoneCounts: { normal: zones.filter((z) => z.severity === 'normal').length, attention: zones.filter((z) => z.severity === 'attention').length, critical: zones.filter((z) => z.severity === 'critical').length }, activeSituations: situations.length, resolvedSituations: 0, patterns: situations.map((s) => `Weather and traffic conditions overlap around ${s.location}.`) },
    trends: [{ t: observedAt, avgCongestionPct: avg(traffics), avgBaselinePct: avg(zones.map((z) => z.traffic?.baselinePct).filter(Number.isFinite)), activeIncidents: 0, avgRainfallMmh: avg(rains), situations: situations.length }],
  };
  return state;
}
