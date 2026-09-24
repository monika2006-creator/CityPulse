// Storage and state management for CityPulse Smart Notifications & User Settings
const NOTIFICATIONS_KEY = "citypulse-notifications";
const SETTINGS_KEY = "citypulse-settings";
const CITY_KEY = "citypulse-selected-city";

export const DEFAULT_SETTINGS = {
  smartNotifications: true,
  routeDelayAlerts: true,
  newSituationAlerts: true,
  severityChangeAlerts: true,
  signalChangeAlerts: true,
  minSeverity: "all", // "all" | "medium_high" | "high_only"
  delayThresholdMin: 5,
  refreshIntervalMin: 5,
  scenarioStepMin: 5,
  trackedRouteId: "route-1",
  defaultCity: "Jaipur",
  dataMode: "scenario", // "scenario" | "live"
  routePreference: "fastest", // "fastest" | "balanced" | "fewest_signals"
  showAmenities: false,
  showPetrolPumps: true,
  showEvChargers: true,
};

export const CITIES = [
  { id: "Jaipur", name: "Jaipur", state: "Rajasthan", supported: true },
  { id: "Udaipur", name: "Udaipur", state: "Rajasthan", supported: true },
  { id: "Jodhpur", name: "Jodhpur", state: "Rajasthan", supported: true },
];

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
  }
}

export function getStoredCity() {
  try {
    const saved = localStorage.getItem(CITY_KEY);
    if (saved && CITIES.some((c) => c.id === saved)) return saved;
    const settings = getStoredSettings();
    return settings.defaultCity || "Jaipur";
  } catch {
    return "Jaipur";
  }
}

export function saveStoredCity(city) {
  try {
    localStorage.setItem(CITY_KEY, city);
  } catch (err) {
    console.error("Failed to save city to localStorage:", err);
  }
}

export function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifications) {
  try {
    // Keep at most 50 notifications in history
    const trimmed = (notifications || []).slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Failed to save notifications to localStorage:", err);
  }
}
