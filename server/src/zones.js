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
export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]));
