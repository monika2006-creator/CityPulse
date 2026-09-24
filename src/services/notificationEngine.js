// CityPulse Smart Notification Engine
// Evaluates state transitions deterministically against civic rules and user notification preferences.

const SEVERITY_LEVELS = {
  low: 1,
  normal: 1,
  medium: 2,
  attention: 2,
  high: 3,
  critical: 3,
};

function satisfiesMinSeverity(severity, minSeverityPreference) {
  const level = SEVERITY_LEVELS[severity] ?? 1;
  if (minSeverityPreference === "high_only") return level >= 3;
  if (minSeverityPreference === "medium_high") return level >= 2;
  return true;
}

/**
 * Evaluates state changes between previous snapshot and current snapshot.
 * Returns an array of newly detected notifications.
 *
 * @param {Object} prevState - Previous snapshot { state, routes }
 * @param {Object} nextState - Current snapshot { state, routes }
 * @param {Object} settings - User settings from notificationStore
 * @param {Array} existingNotifications - Already generated notifications for deduplication
 * @param {string} currentCity - Current active city
 * @returns {Array} List of new notifications
 */
export function detectSmartNotifications(prevState, nextState, settings, existingNotifications = [], currentCity = "Jaipur") {
  if (!settings?.smartNotifications) return [];
  if (!nextState?.state || !prevState?.state) return [];

  // Prevent cross-city comparison notifications when switching cities
  if (prevState.city && nextState.city && prevState.city !== nextState.city) {
    return [];
  }

  const existingIds = new Set(existingNotifications.map((n) => n.id));
  const newNotifications = [];
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const minSev = settings.minSeverity || "all";
  const delayThreshold = Number(settings.delayThresholdMin) || 5;

  const prevRoutes = prevState.routes || [];
  const nextRoutes = nextState.routes || [];
  const prevRouteMap = new Map(prevRoutes.map((r) => [r.id, r]));
  const previousFastest = [...prevRoutes].filter((r) => Number.isFinite(r.currentTravelTime)).sort((a, b) => a.currentTravelTime - b.currentTravelTime)[0];
  const trackedRouteId = settings.trackedRouteId || previousFastest?.id;
  const previousTrackedRoute = prevRouteMap.get(trackedRouteId);
  const currentTrackedRoute = nextRoutes.find((r) => r.id === trackedRouteId);
  const bestAlternative = nextRoutes.filter((r) => r.id !== trackedRouteId && Number.isFinite(r.currentTravelTime)).sort((a, b) => a.currentTravelTime - b.currentTravelTime)[0];
  const alternativeSaving = currentTrackedRoute && bestAlternative ? currentTrackedRoute.currentTravelTime - bestAlternative.currentTravelTime : 0;
  const previousAlternative = bestAlternative ? prevRouteMap.get(bestAlternative.id) : null;
  const trackedRouteWorsened = Boolean(previousTrackedRoute && currentTrackedRoute && currentTrackedRoute.currentTravelTime > previousTrackedRoute.currentTravelTime);
  const alternativeImproved = Boolean(previousAlternative && bestAlternative && bestAlternative.currentTravelTime < previousAlternative.currentTravelTime);
  const hasFasterAlternative = settings.routeDelayAlerts && alternativeSaving >= delayThreshold && (trackedRouteWorsened || alternativeImproved);

  // 1. ROUTE DELAY INCREASED
  if (settings.routeDelayAlerts) {
    for (const route of nextRoutes) {
      if (hasFasterAlternative && route.id === trackedRouteId) continue;
      const prev = prevRouteMap.get(route.id);
      if (prev && Number.isFinite(route.currentTravelTime) && Number.isFinite(prev.currentTravelTime)) {
        const diff = route.currentTravelTime - prev.currentTravelTime;
        if (diff >= delayThreshold) {
          const id = `route-delay:${route.id}:${route.currentTravelTime}`;
          const sev = route.currentTravelTime >= 35 || diff >= 8 ? "critical" : "attention";
          if (!existingIds.has(id) && satisfiesMinSeverity(sev, minSev)) {
            newNotifications.push({
              id,
              category: "routes",
              severity: sev,
              title: "Route delay increased",
              description: `${route.name} is now ${diff} min slower (${route.currentTravelTime} min total).`,
              location: currentCity,
              routeId: route.id,
              timestamp,
              createdAt: now.toISOString(),
              isRead: false,
              action: {
                label: "View Route",
                page: "route-intelligence",
                routeId: route.id,
              },
            });
            existingIds.add(id);
          }
        }
      }
    }

    // Compare against the route the user is tracking (or the previous fastest route).
    if (hasFasterAlternative && currentTrackedRoute && bestAlternative) {
      const id = `route-faster:${trackedRouteId}:${bestAlternative.id}:${currentTrackedRoute.currentTravelTime}:${bestAlternative.currentTravelTime}`;
      const severity = currentTrackedRoute.currentTravelTime >= 35 || alternativeSaving >= 8 ? "critical" : "attention";
      if (!existingIds.has(id) && satisfiesMinSeverity(severity, minSev)) {
        const worsened = previousTrackedRoute && currentTrackedRoute.currentTravelTime > previousTrackedRoute.currentTravelTime;
        newNotifications.push({
          id, category: "routes", severity, title: "Faster route available",
          description: `${bestAlternative.name} is now ${alternativeSaving} min faster than your current route (${bestAlternative.currentTravelTime} vs ${currentTrackedRoute.currentTravelTime} min).${worsened ? ` Your route's ETA increased from ${previousTrackedRoute.currentTravelTime} to ${currentTrackedRoute.currentTravelTime} min.` : ""}`,
          location: currentCity, routeId: bestAlternative.id, trackedRouteId, timestamp, createdAt: now.toISOString(), isRead: false,
          action: { label: "View faster route", page: "route-intelligence", routeId: bestAlternative.id },
        });
        existingIds.add(id);
      }
    }
  }

  // 3. NEW CIVIC SITUATION & 4. SEVERITY ESCALATION
  const prevSituations = (prevState.state?.situations || []).filter((s) => s.status === "active");
  const nextSituations = (nextState.state?.situations || []).filter((s) => s.status === "active");
  const prevSitMap = new Map(prevSituations.map((s) => [s.id, s]));

  for (const sit of nextSituations) {
    const prev = prevSitMap.get(sit.id);
    const loc = sit.area || sit.location || currentCity;
    const sev = sit.severity || "medium";

    if (!prev) {
      // 3. NEW CIVIC SITUATION
      if (settings.newSituationAlerts) {
        const id = `new-sit:${sit.id}`;
        if (!existingIds.has(id) && satisfiesMinSeverity(sev, minSev)) {
          newNotifications.push({
            id,
            category: "situations",
            severity: sev,
            title: "New civic situation",
            description: `${sit.title} detected near ${loc}.`,
            location: `${currentCity} · ${loc}`,
            situationId: sit.id,
            timestamp,
            createdAt: now.toISOString(),
            isRead: false,
            action: {
              label: "View Situation",
              page: "situations",
              situationId: sit.id,
            },
          });
          existingIds.add(id);
        }
      }
    } else {
      // 4. SEVERITY ESCALATION
      if (settings.severityChangeAlerts) {
        const prevLevel = SEVERITY_LEVELS[prev.severity] ?? 1;
        const nextLevel = SEVERITY_LEVELS[sit.severity] ?? 1;
        if (nextLevel > prevLevel) {
          const id = `sev-esc:${sit.id}:${sit.severity}`;
          if (!existingIds.has(id) && satisfiesMinSeverity(sev, minSev)) {
            newNotifications.push({
              id,
              category: "situations",
              severity: sev,
              title: "Situation severity increased",
              description: `${sit.title} near ${loc} has escalated to ${String(sit.severity).toUpperCase()}.`,
              location: `${currentCity} · ${loc}`,
              situationId: sit.id,
              timestamp,
              createdAt: now.toISOString(),
              isRead: false,
              action: {
                label: "View Situation",
                page: "situations",
                situationId: sit.id,
              },
            });
            existingIds.add(id);
          }
        }
      }
    }
  }

  // 5. WEATHER & TRAFFIC SIGNAL CHANGES
  if (settings.signalChangeAlerts) {
    const prevZones = prevState.state?.zones || [];
    const nextZones = nextState.state?.zones || [];
    const prevZoneMap = new Map(prevZones.map((z) => [z.zoneId, z]));

    for (const zone of nextZones) {
      const prevZone = prevZoneMap.get(zone.zoneId);
      if (!prevZone) continue;

      // Weather signal change (e.g. rainfall intensity increased meaningfully)
      if (zone.weather && prevZone.weather) {
        const prevRain = prevZone.weather.rainfallMmh || 0;
        const nextRain = zone.weather.rainfallMmh || 0;
        const rainDiff = nextRain - prevRain;
        if (rainDiff >= 1.5) {
          const id = `rain-jump:${zone.zoneId}:${Math.round(nextRain)}`;
          const sev = nextRain >= 5.0 ? "critical" : "attention";
          if (!existingIds.has(id) && satisfiesMinSeverity(sev, minSev)) {
            newNotifications.push({
              id,
              category: "weather",
              severity: sev,
              title: "Weather signal changed",
              description: `Rainfall intensity increased to ${nextRain.toFixed(1)} mm/h around ${zone.name}.`,
              location: `${currentCity} · ${zone.name}`,
              timestamp,
              createdAt: now.toISOString(),
              isRead: false,
              action: {
                label: "View Map",
                page: "live-map",
                zoneId: zone.zoneId,
              },
            });
            existingIds.add(id);
          }
        }
      }

      // Traffic signal change (e.g. congestion jumped meaningfully)
      if (zone.traffic && prevZone.traffic) {
        const prevCong = prevZone.traffic.congestionPct || 0;
        const nextCong = zone.traffic.congestionPct || 0;
        const congDiff = nextCong - prevCong;
        if (congDiff >= 14) {
          const id = `traffic-jump:${zone.zoneId}:${Math.round(nextCong)}`;
          const sev = nextCong >= 60 ? "critical" : "attention";
          if (!existingIds.has(id) && satisfiesMinSeverity(sev, minSev)) {
            newNotifications.push({
              id,
              category: "traffic",
              severity: sev,
              title: "Traffic conditions changed",
              description: `Traffic congestion rose to ${Math.round(nextCong)}% around ${zone.name}.`,
              location: `${currentCity} · ${zone.name}`,
              timestamp,
              createdAt: now.toISOString(),
              isRead: false,
              action: {
                label: "View Map",
                page: "live-map",
                zoneId: zone.zoneId,
              },
            });
            existingIds.add(id);
          }
        }
      }
    }
  }

  return newNotifications;
}
