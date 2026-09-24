// Mock route data — SIMULATED DATA.
// No route calculation happens here; this only models what a future
// route-intelligence response could look like.

export const routeQuery = {
  from: "Amity University",
  to: "Jaipur Airport",
};

export const routes = [
  {
    id: "route-1",
    name: "Main Road",
    normalTravelTime: 32,
    currentTravelTime: 41,
    delay: 9,
    distance: 18.4,
    signalCount: 4,
    signalIds: ["SIG-001", "SIG-003"],
    status: "delayed",
  },
  {
    id: "route-2",
    name: "Tonk Road",
    normalTravelTime: 34,
    currentTravelTime: 39,
    delay: 5,
    distance: 19.1,
    signalCount: 2,
    signalIds: ["SIG-001", "SIG-002"],
    status: "delayed",
  },
  {
    id: "route-3",
    name: "Ring Road",
    normalTravelTime: 34,
    currentTravelTime: 35,
    delay: 1,
    distance: 21.6,
    signalCount: 1,
    signalIds: ["SIG-009"],
    status: "normal",
  },
];

// Route with the lowest current (simulated) ETA. Accepts a list so callers can
// pass whatever routes they display; defaults to the mock routes above.
export const getFastestRoute = (list = routes) =>
  [...list].sort((a, b) => a.currentTravelTime - b.currentTravelTime)[0];
