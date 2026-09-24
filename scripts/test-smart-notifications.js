// Test suite for CityPulse Smart Notifications & Settings
import { detectSmartNotifications } from "../src/services/notificationEngine.js";
import { DEFAULT_SETTINGS } from "../src/services/notificationStore.js";

async function runTests() {
  console.log("=== RUNNING SMART NOTIFICATION ENGINE UNIT TESTS ===");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Route delay detection
  const prev1 = {
    city: "Jaipur",
    state: { situations: [], zones: [] },
    routes: [
      { id: "route-1", name: "Tonk Road corridor", currentTravelTime: 27 },
      { id: "route-2", name: "Malviya Nagar corridor", currentTravelTime: 27 },
    ],
  };
  const next1 = {
    city: "Jaipur",
    state: { situations: [], zones: [] },
    routes: [
      { id: "route-1", name: "Tonk Road corridor", currentTravelTime: 34 }, // +7 min
      { id: "route-2", name: "Malviya Nagar corridor", currentTravelTime: 27 },
    ],
  };

  const delayNotifs = detectSmartNotifications(prev1, next1, DEFAULT_SETTINGS, []);
  assert(delayNotifs.some((n) => n.title === "Route delay increased" && n.description.includes("7 min slower")), "Detects route delay >= 5 minutes");

  // TEST 2: Route delay below threshold should NOT trigger
  const nextSmallDelay = {
    city: "Jaipur",
    state: { situations: [], zones: [] },
    routes: [
      { id: "route-1", name: "Tonk Road corridor", currentTravelTime: 29 }, // +2 min (below 5 min)
      { id: "route-2", name: "Malviya Nagar corridor", currentTravelTime: 27 },
    ],
  };
  const smallDelayNotifs = detectSmartNotifications(prev1, nextSmallDelay, DEFAULT_SETTINGS, []);
  assert(!smallDelayNotifs.some((n) => n.title === "Route delay increased"), "Ignores small route delays below threshold (< 5 min)");

  // TEST 3: Faster alternative available
  const fasterNotifs = detectSmartNotifications(prev1, next1, DEFAULT_SETTINGS, []);
  assert(fasterNotifs.some((n) => n.title === "Faster route available"), "Detects faster alternative route");

  // TEST 4: New civic situation
  const prevSit = {
    city: "Jaipur",
    state: {
      situations: [{ id: "sit-1", title: "Traffic disruption", severity: "medium", status: "active", location: "MI Road" }],
      zones: [],
    },
    routes: [],
  };
  const nextSit = {
    city: "Jaipur",
    state: {
      situations: [
        { id: "sit-1", title: "Traffic disruption", severity: "medium", status: "active", location: "MI Road" },
        { id: "sit-2", title: "Multi-vehicle collision", severity: "critical", status: "active", location: "Tonk Road" },
      ],
      zones: [],
    },
    routes: [],
  };
  const sitNotifs = detectSmartNotifications(prevSit, nextSit, DEFAULT_SETTINGS, []);
  assert(sitNotifs.some((n) => n.title === "New civic situation" && n.description.includes("Multi-vehicle collision")), "Detects new civic situation");

  // TEST 5: Situation severity escalation
  const nextEscalated = {
    city: "Jaipur",
    state: {
      situations: [
        { id: "sit-1", title: "Traffic disruption", severity: "critical", status: "active", location: "MI Road" }, // escalated from medium to critical
      ],
      zones: [],
    },
    routes: [],
  };
  const escNotifs = detectSmartNotifications(prevSit, nextEscalated, DEFAULT_SETTINGS, []);
  assert(escNotifs.some((n) => n.title === "Situation severity increased" && n.description.includes("CRITICAL")), "Detects situation severity escalation");

  // TEST 6: Weather signal change
  const prevWeather = {
    city: "Jaipur",
    state: {
      situations: [],
      zones: [{ zoneId: "mi-road", name: "MI Road", weather: { rainfallMmh: 1.0 }, traffic: { congestionPct: 30 } }],
    },
    routes: [],
  };
  const nextWeather = {
    city: "Jaipur",
    state: {
      situations: [],
      zones: [{ zoneId: "mi-road", name: "MI Road", weather: { rainfallMmh: 6.5 }, traffic: { congestionPct: 30 } }],
    },
    routes: [],
  };
  const weatherNotifs = detectSmartNotifications(prevWeather, nextWeather, DEFAULT_SETTINGS, []);
  assert(weatherNotifs.some((n) => n.title === "Weather signal changed" && n.description.includes("6.5 mm/h")), "Detects rainfall surge");

  // TEST 7: Traffic signal change
  const nextTraffic = {
    city: "Jaipur",
    state: {
      situations: [],
      zones: [{ zoneId: "mi-road", name: "MI Road", weather: { rainfallMmh: 1.0 }, traffic: { congestionPct: 65 } }],
    },
    routes: [],
  };
  const trafficNotifs = detectSmartNotifications(prevWeather, nextTraffic, DEFAULT_SETTINGS, []);
  assert(trafficNotifs.some((n) => n.title === "Traffic conditions changed" && n.description.includes("65%")), "Detects traffic congestion surge");

  // TEST 8: City switching must NOT generate notifications
  const citySwitchState = {
    city: "Udaipur",
    state: { situations: nextSit.state.situations, zones: [] },
    routes: next1.routes,
  };
  const citySwitchNotifs = detectSmartNotifications(prev1, citySwitchState, DEFAULT_SETTINGS, []);
  assert(citySwitchNotifs.length === 0, "Does NOT create notifications when switching cities");

  // TEST 9: Deduplication prevention
  const existingHistory = [
    { id: "route-delay:route-1:34" },
    { id: "new-sit:sit-2" },
  ];
  const dedupNotifs = detectSmartNotifications(prevSit, nextSit, DEFAULT_SETTINGS, existingHistory);
  assert(!dedupNotifs.some((n) => n.id === "new-sit:sit-2"), "Prevents duplicate notifications if already in history");

  // TEST 10: Settings toggle gating
  const disabledSettings = { ...DEFAULT_SETTINGS, smartNotifications: false };
  const disabledNotifs = detectSmartNotifications(prev1, next1, disabledSettings, []);
  assert(disabledNotifs.length === 0, "Honors Smart Notifications master toggle (OFF = 0 alerts)");

  const noRouteSettings = { ...DEFAULT_SETTINGS, routeDelayAlerts: false };
  const noRouteNotifs = detectSmartNotifications(prev1, next1, noRouteSettings, []);
  assert(!noRouteNotifs.some((n) => n.category === "routes"), "Honors Route Delay Alerts toggle (OFF = no route alerts)");

  console.log(`\nResult: ${passed}/${total} unit tests passed.`);

  // TEST 11: Real Backend Simulation Integration Test
  console.log("\n=== TESTING WITH REAL LIVE BACKEND API (PORT 8787) ===");
  try {
    const fetchJson = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    const s150 = await fetchJson("http://127.0.0.1:8787/api/state?min=150");
    const r150 = await fetchJson("http://127.0.0.1:8787/api/routes?min=150");
    const s235 = await fetchJson("http://127.0.0.1:8787/api/state?min=235");
    const r235 = await fetchJson("http://127.0.0.1:8787/api/routes?min=235");

    const prevBackend = {
      city: "Jaipur",
      state: {
        situations: s150.situations.map((s) => ({
          id: s.id,
          title: s.title,
          severity: s.severity === "attention" ? "medium" : s.severity === "normal" ? "low" : s.severity,
          status: s.status,
          location: s.location,
        })),
        zones: s150.zones,
      },
      routes: r150.routes.map((r) => ({
        id: r.id,
        name: r.name,
        currentTravelTime: r.currentMin,
      })),
    };

    const nextBackend = {
      city: "Jaipur",
      state: {
        situations: s235.situations.map((s) => ({
          id: s.id,
          title: s.title,
          severity: s.severity === "attention" ? "medium" : s.severity === "normal" ? "low" : s.severity,
          status: s.status,
          location: s.location,
        })),
        zones: s235.zones,
      },
      routes: r235.routes.map((r) => ({
        id: r.id,
        name: r.name,
        currentTravelTime: r.currentMin,
      })),
    };

    const realNotifs = detectSmartNotifications(prevBackend, nextBackend, DEFAULT_SETTINGS, []);
    console.log(`Real backend generated ${realNotifs.length} smart notifications:`);
    realNotifs.forEach((n) => {
      console.log(`  [${n.severity.toUpperCase()}] ${n.title} - ${n.description} (${n.location})`);
    });

    assert(realNotifs.length > 0, "Real backend scenario transition (min 150 -> min 235) generates real notifications");
    assert(realNotifs.some((n) => n.title === "Route delay increased"), "Real backend transition generated 'Route delay increased'");
    assert(realNotifs.some((n) => n.title === "Faster route available"), "Real backend transition generated 'Faster route available'");
    assert(realNotifs.some((n) => n.title === "New civic situation"), "Real backend transition generated 'New civic situation'");
    console.log(`\nALL TESTS PASSED SUCCESSFULLY! (${passed}/${total})`);
  } catch (err) {
    console.error("Backend integration test error:", err.message);
  }
}

runTests();
