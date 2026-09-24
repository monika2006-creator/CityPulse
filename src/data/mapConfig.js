// Presentation config for the Live Civic Map.
// This file holds map settings and labels only — NO signal data.
// Signals always come from signals.js.

// Jaipur city centre. Deliberately fixed: CityPulse never uses the visitor's location.
export const JAIPUR_CENTER = [26.885, 75.79];
export const DEFAULT_ZOOM = 12;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 18;

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
export const LEAFLET_PREFIX =
  '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>';

// Filter chip labels (and the noun used in the "N ___ SIGNALS" count),
// keyed by the `type` field used in signals.js. The array order is the chip order.
// Only types that actually exist in the data are ever shown.
export const CATEGORY_FILTERS = [
  { type: "traffic", label: "TRAFFIC", noun: "TRAFFIC" },
  { type: "weather", label: "WEATHER", noun: "WEATHER" },
  { type: "road_incident", label: "INCIDENTS", noun: "INCIDENT" },
  { type: "air_quality", label: "AQI", noun: "AQI" },
  { type: "public_transport", label: "TRANSIT", noun: "TRANSIT" },
  { type: "power", label: "POWER", noun: "POWER" },
  { type: "noise", label: "NOISE", noun: "NOISE" },
];

// Higher = more relevant. Used for the LIVE SIGNALS ranking and marker stacking.
export const SEVERITY_RANK = { normal: 0, attention: 1, critical: 2 };

// Marker colours and glyphs (14x14 viewBox, filled with currentColor).
// One source of truth, shared by map markers, the legend and the signal panel.
export const SEVERITY_MARKER = {
  normal: {
    label: "NORMAL",
    color: "#34D399",
    glyph: '<circle cx="7" cy="7" r="3.75"/>',
  },
  attention: {
    label: "ATTENTION",
    color: "#FBBF24",
    glyph: '<path d="M7 1.25 12.75 7 7 12.75 1.25 7Z"/>',
  },
  critical: {
    label: "CRITICAL",
    color: "#FB7185",
    glyph:
      '<path fill-rule="evenodd" d="M7 1.5 13.25 12.25H.75Z M6.4 5.1h1.2v3.5H6.4Z M6.4 9.3h1.2v1.2H6.4Z"/>',
  },
};

export const LIVE_ACCENT = "#22D3EE";
