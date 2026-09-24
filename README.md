# CityPulse

React + Vite civic intelligence dashboard backed by the local Express API.

## Data sources and limits

- `/api/state` provides deterministic **simulated scenario** signals by default. With `mode=live`, it requests current weather from Open-Meteo and traffic flow from TomTom for the selected city's monitored zones.
- Live weather needs no API key. TomTom traffic, live routing, and place search require `TOMTOM_KEY`; the backend labels unavailable feeds and falls back to the simulated scenario when live providers are unavailable.
- `/api/routes` provides city-specific scenario routes by default. With TomTom configured, `mode=live` requests traffic-aware ETAs. The route page can also route between searched places.
- `/api/geocode` biases and constrains results to the selected city, and includes the city in the search query to avoid returning Jaipur results for Jodhpur or Udaipur.
- Live mode currently has no real-time incident provider. Incident counts are therefore unavailable in live mode and are not copied from simulated data.
- `/api/health` reports backend status and the TomTom request counter.

The UI derives frontend signal/situation shapes, correlations, delay and lowest-ETA display from backend responses and existing deterministic utilities. Scenario data remains explicitly labeled as simulated.

## Configure

Copy `server/.env.example` to `server/.env` and add your TomTom key. The Gemini key is optional and stays server-side. `.env` is ignored by Git.

```env
PORT=8787
TOMTOM_KEY=your_tomtom_key
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

## Run locally

After downloading and extracting the ZIP, open a terminal in the project root and run:

```bash
npm run setup
npm run dev
```

`npm run setup` installs dependencies for both the frontend and the API. `npm run dev` starts both services together. Open the local URL Vite prints in the terminal (usually `http://localhost:5173`). Keep that terminal running; press Ctrl+C to stop both services.

Do not open `index.html` directly or use VS Code's Live Server: the browser needs the running API and the Vite `/api` proxy.

To start either service separately, use two terminals:

```bash
cd "/Users/mysticnight/Desktop/citypulse/server"
npm start
```

```bash
cd /path/to/citypulse
npm run dev:web
```

Vite proxies `/api` requests to `http://127.0.0.1:8787`.

If the dashboard reports that backend data is unavailable, first confirm the backend terminal says `CityPulse server on http://localhost:8787`, then open `http://localhost:8787/api/health`. It should return JSON with `"ok": true`. Keep the backend running while using the frontend. For a separately hosted frontend, set `VITE_API_BASE_URL` to the backend's public base URL (for example `https://api.example.com/api`) before building; the backend must allow requests from the frontend origin.

## TomTom key check

```bash
cd /path/to/citypulse/server
npm run check:tomtom
```

Do not commit `.env` or paste API keys into frontend source.
