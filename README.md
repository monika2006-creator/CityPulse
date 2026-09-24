# CityPulse

React + Vite civic intelligence dashboard backed by the local Express API.

## Data sources and limits

- `/api/state` provides deterministic **simulated scenario** signals, situations, pulse, and summary. It is not a live government/weather/incident feed.
- `/api/routes` provides scenario routes by default. With TomTom configured, `/api/routes?mode=live&from=lat,lng&to=lat,lng` returns TomTom traffic-aware route ETAs and traffic sections.
- `/api/geocode` uses TomTom place search. If TomTom is unavailable, routing falls back to the labeled scenario response.
- `/api/health` reports backend status and the TomTom request counter.

The UI derives frontend signal/situation shapes, correlations, delay and lowest-ETA display from backend responses and existing deterministic utilities. It does not label scenario civic signals as live.

## Configure

Copy `server/.env.example` to `server/.env` and add your TomTom key. The Gemini key is optional and stays server-side. `.env` is ignored by Git.

```env
PORT=8787
TOMTOM_KEY=your_tomtom_key
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

## Run locally

From the project root, start both the API and frontend together:

```bash
cd "/Users/mysticnight/Desktop/citypulse"
npm ci
npm --prefix server ci
npm run dev:all
```

The dashboard opens at `http://localhost:5173`. Keep that terminal running; press Ctrl+C to stop both services.

To start either service separately, use two terminals:

```bash
cd "/Users/mysticnight/Desktop/citypulse/server"
npm start
```

```bash
cd "/Users/mysticnight/Desktop/citypulse"
npm run dev
```

Vite proxies `/api` requests to `http://127.0.0.1:8787`.

If the dashboard reports that backend data is unavailable, first confirm the backend terminal says `CityPulse server on http://localhost:8787`, then open `http://localhost:8787/api/health`. It should return JSON with `"ok": true`. Keep the backend running while using the frontend. For a separately hosted frontend, set `VITE_API_BASE_URL` to the backend's public base URL (for example `https://api.example.com/api`) before building; the backend must allow requests from the frontend origin.

## TomTom key check

```bash
cd /path/to/citypulse/server
npm run check:tomtom
```

Do not commit `.env` or paste API keys into frontend source.
