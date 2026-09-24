# CityPulse — Step 4: Frontend Shell

Live Civic Intelligence dashboard shell. Midnight Intelligence theme.

## Setup

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## What's included

- `src/components/Sidebar.jsx` — navigation, mobile drawer, bottom section
- `src/components/Header.jsx` — page title/description + action icons
- `src/components/Layout.jsx` — shell wiring sidebar + header + page content
- `src/components/StatCard.jsx`, `src/components/PlaceholderPage.jsx` — small reusable pieces
- `src/pages/Overview.jsx` — polished placeholder dashboard
- `src/pages/LiveMap.jsx`, `Situations.jsx`, `Insights.jsx` — placeholder pages
- `src/App.jsx` — page state (`useState`), no React Router
- `src/index.css` — global theme, font, scrollbar styling
- `tailwind.config.js` — CityPulse color tokens (bg, surface, elevated, primary, secondary, ink, muted, border, normal, attention, critical)

## Testing checklist

- [ ] `npm run dev` starts with no console errors
- [ ] Sidebar shows CITYPULSE logo, nav items, Jaipur/notifications/settings, "Systems Operational"
- [ ] Clicking Overview / Live Map / Situations / Insights swaps the page without reloading
- [ ] Active nav item shows blue background, blue icon, left indicator bar
- [ ] Hover states work on nav items and buttons
- [ ] Resize to tablet/mobile width — sidebar collapses into a drawer
- [ ] On mobile, the header menu button opens the drawer with an overlay; clicking the overlay closes it
- [ ] Overview page shows 4 stat cards + "Live City Overview" empty state
- [ ] Colors match the Midnight Intelligence palette (dark navy bg, blue primary accent)

## Step 6: Live Civic Map

`Live Map` now shows the simulated signals from `src/data/signals.js` on an interactive OpenStreetMap view of Jaipur (Leaflet + React Leaflet).

- `src/pages/LiveMap.jsx` — filters, signal count, LIVE SIGNALS panel, layout
- `src/components/MapView.jsx` / `MapView.css` — map, dark tiles, CityPulse-styled controls and popups (all CSS scoped to `.citypulse-map`)
- `src/components/SignalMarker.jsx`, `SignalPopup.jsx` — custom markers (● normal, ◆ attention, ⚠ critical) and popup
- `src/components/LiveSignalsPanel.jsx`, `MapLegend.jsx`, `SeverityGlyph.jsx` — panel, legend, shared severity shapes
- `src/data/mapConfig.js` — map centre, tile URL, filter labels, marker colours (no signal data)

Data is **simulated**. To use real data later, replace `signals.js` with an API-backed source of the same shape; the map has no signal data of its own.

## Step 7: Route Intelligence

`Route Intelligence` compares the mock routes in `src/data/routes.js` for the demo journey Amity University → Jaipur Airport. All data is **simulated**; there is no real routing, geocoding or navigation.

- `src/pages/RouteIntelligence.jsx` — journey input, analysis state, layout
- `src/components/JourneyForm.jsx`, `FastestRouteCard.jsx`, `RouteCard.jsx`, `EtaComparison.jsx`, `RouteDetail.jsx`
- `src/utils/routeHelpers.js` — delay severity, `signalIds` → `signals.js` lookup, formatting

Rules the page follows:
- The current fastest route is calculated from `currentTravelTime` (`getFastestRoute`), never hardcoded.
- `currentTravelTime` is the authoritative mock ETA. Linked signals only explain a route's conditions and are never summed into the ETA.
- The route detail reuses the Step 6 `MapView` to show the selected route's linked signals (no route path is drawn).
