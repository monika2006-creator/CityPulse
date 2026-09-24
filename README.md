# CityPulse

CityPulse is a React + Vite civic conditions dashboard backed by a local Express API. It supports Jaipur, Jodhpur, and Udaipur.

## Features

- **City snapshot:** Map, Situations, and Insights use the selected city's latest backend snapshot.
- **Scenario and live modes:** Scenario mode uses deterministic simulated conditions. Live mode gets current weather from Open-Meteo and traffic flow from TomTom when a key is configured. Missing feeds are labeled; incidents have no live provider and are not presented as live.
- **Routes:** City-specific scenario routes are always available. TomTom place search and traffic-aware routes require `TOMTOM_KEY`.
- **Smart alerts:** Notifications compare successive snapshots for meaningful route and civic changes. The notification center is available from the sidebar and header; new alerts can show a popup and link to the affected route, situation, or map area. Notification history and settings are stored in the browser.
- **Refresh settings:** Choose automatic refresh every 5 or 10 minutes, and choose a simulated time step of +5 or +10 minutes per refresh.
- **Map weather:** Searching for a place shows its current Open-Meteo temperature in the map popup. Weather uses the place's coordinates and needs an internet connection.
- **Route stops:** The selected route map can show petrol stations and EV chargers from OpenStreetMap Overpass. Coverage depends on OpenStreetMap data and service availability.
- **Summaries:** The optional Gemini key enables generated briefings. Without it, CityPulse uses its deterministic fallback summary.

## Data sources and limits

- `/api/state` returns deterministic scenario data by default. With `mode=live`, it requests current Open-Meteo weather and, when configured, TomTom traffic for monitored zones. If both providers fail, the backend falls back to the scenario snapshot. If only one provider is unavailable, that feed is marked unavailable.
- `/api/routes` returns scenario routes by default. TomTom live routing and `/api/geocode` place search require a valid `TOMTOM_KEY`.
- `/api/weather` returns current conditions for the selected map location from Open-Meteo; no API key is needed.
- `/api/amenities` queries OpenStreetMap Overpass for mapped petrol stations and charging stations near a route. It needs internet access and may return no results if the service is unavailable or no mapped stops are nearby.
- Situations and correlations are derived from the selected city's current backend snapshot. Scenario results are simulated and labeled as such.
- Smart route alerts monitor the tracked route among the backend's available routes. Notifications are generated when a refreshed snapshot meets the configured thresholds; they are not a continuous vehicle-tracking service.
- `/api/health` reports backend status, configured providers, and supported cities.

## Configure provider keys

Copy `server/.env.example` to `server/.env` and add the keys you have. `.env` is ignored by Git; keep keys on the server and do not put them in frontend source.

```env
PORT=8787
TOMTOM_KEY=your_tomtom_key
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

TomTom and Gemini are optional. Without TomTom, scenario routes remain available, but live routing and place search are unavailable. Without Gemini, briefings use the fallback summary.

## Install and run on your computer

From the project root:

```bash
npm run setup
npm run dev
```

`npm run setup` installs dependencies for both the frontend and API. `npm run dev` starts both services. Open the Vite URL printed in the terminal, usually `http://localhost:5173`. Keep the terminal open; press Ctrl+C to stop the services.

The launcher checks that an existing backend has the current weather API. If an older CityPulse backend is still running on port 8787, the launcher selects another local API port and points Vite at it. If the app still shows a backend error, stop old CityPulse terminals with Ctrl+C and run `npm run dev` again from the project root.

Do not open `index.html` directly or use VS Code Live Server: the app needs the Express API and Vite's `/api` proxy.

### Run frontend and backend separately

Use two terminals from the project root:

```bash
cd server
npm start
```

```bash
npm run dev:web
```

By default, Vite proxies `/api` requests to `http://127.0.0.1:8787`. If you run the API on another port, start Vite with that port, for example:

```bash
CITYPULSE_API_PORT=8788 npm run dev:web
```

## Open CityPulse on Android

CityPulse is currently a web app, not an Expo/React Native project. Expo Go cannot load it as a native app. You can use it on an Android phone in Chrome while your Mac and phone are on the same Wi-Fi network.

From the project root, start both services and expose Vite to your local network:

```bash
cd ~/Desktop/citypulse
HOST=0.0.0.0 npm run dev
```

The app launcher selects a current backend port automatically if an older backend is still occupying the default port.

Find your Mac's Wi-Fi IP address:

```bash
ipconfig getifaddr en0
```

On Android, open Chrome and visit `http://MAC_IP:5173`, replacing `MAC_IP` with the address printed above. This development server is intended for devices on your trusted local network.

## Check TomTom configuration

```bash
cd server
npm run check:tomtom
```
