// Jaipur zones. lat/lng and road names are APPROXIMATE placeholders:
// pin each one by clicking the Leaflet map and paste the real values here.
export const ZONES = [
  { id: 'mi-road',          name: 'MI Road',          lat: 26.9155, lng: 75.8050, roads: ['MI Road', 'Station Road'],               baseline: { congestion: 38 } },
  { id: 'civil-lines',      name: 'Civil Lines',      lat: 26.9040, lng: 75.7870, roads: ['Bhawani Singh Road', 'Civil Lines Road'], baseline: { congestion: 30 } },
  { id: 'tonk-road',        name: 'Tonk Road',        lat: 26.8700, lng: 75.7960, roads: ['Tonk Road', 'Gopalpura Bypass'],          baseline: { congestion: 34 } },
  { id: 'malviya-nagar',    name: 'Malviya Nagar',    lat: 26.8550, lng: 75.8110, roads: ['JLN Marg', 'Malviya Nagar Main Road'],    baseline: { congestion: 32 } },
  { id: 'vaishali-nagar',   name: 'Vaishali Nagar',   lat: 26.9080, lng: 75.7290, roads: ['Ajmer Road', 'Vaishali Circle Road'],     baseline: { congestion: 28 } },
  { id: 'sanganer-airport', name: 'Sanganer / Airport', lat: 26.8242, lng: 75.8122, roads: ['Airport Road', 'Tonk Road'],            baseline: { congestion: 22 } },
];
const makeCityZones = (prefix, rows) => rows.map(([slug, name, lat, lng, congestion], index) => ({
  id: `${prefix}-${slug}`, name, lat, lng,
  roads: [name, `${name} Road`], baseline: { congestion },
  scenarioIndex: index,
}));

export const CITY_ZONES = {
  jaipur: [
    ...ZONES.map((z, index) => ({ ...z, scenarioIndex: index })),
    {
      id: 'amity-university-rajasthan',
      name: 'Amity University Rajasthan',
      address: 'SP-1 Kant Kalwar, NH11C, RIICO Industrial Area, Rajasthan 303002',
      lat: 27.1764,
      lng: 75.9568,
      roads: ['NH11C'],
      baseline: { congestion: 24 },
      scenarioIndex: 6,
    },
  ],
  jodhpur: makeCityZones('jodhpur', [
    ['clock-tower', 'Clock Tower', 26.2968, 73.0351, 38], ['sardarpura', 'Sardarpura', 26.2767, 73.0080, 32],
    ['paota', 'Paota', 26.3084, 73.0350, 30], ['ratanada', 'Ratanada', 26.2780, 73.0354, 34],
    ['shastri-nagar', 'Shastri Nagar', 26.2660, 73.0100, 28], ['aiims', 'AIIMS Jodhpur', 26.2389, 73.0169, 22],
  ]),
  udaipur: makeCityZones('udaipur', [
    ['city-palace', 'City Palace', 24.5764, 73.6835, 38], ['fatehpura', 'Fatehpura', 24.6068, 73.6930, 32],
    ['chetak-circle', 'Chetak Circle', 24.5902, 73.6870, 30], ['hiran-magri', 'Hiran Magri', 24.5665, 73.7100, 34],
    ['sukhadia-circle', 'Sukhadia Circle', 24.6010, 73.6850, 28], ['railway-station', 'Udaipur City Railway Station', 24.5763, 73.7000, 22],
  ]),
};

export const CITIES = {
  jaipur: { id: 'jaipur', name: 'Jaipur', center: [26.9124, 75.7873], zones: CITY_ZONES.jaipur },
  jodhpur: { id: 'jodhpur', name: 'Jodhpur', center: [26.2389, 73.0243], zones: CITY_ZONES.jodhpur },
  udaipur: { id: 'udaipur', name: 'Udaipur', center: [24.5854, 73.7125], zones: CITY_ZONES.udaipur },
};

export const zoneById = Object.fromEntries(
  Object.values(CITY_ZONES).flat().map((z) => [z.id, z])
);
