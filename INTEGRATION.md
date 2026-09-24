# Integration overlay v2

1. Commit your current work / use a branch. Unzip at the repo ROOT (overwrites files, adds `server/`, `fixtures/`, `src/services/`).
2. DELETE these hardcoded files (nothing imports them any more):
   `src/data/signals.js  src/data/situations.js  src/data/cityData.js  src/data/routes.js`
3. Put your keys in `server/.env` (see `server/.env.example`: TOMTOM_KEY, GEMINI_API_KEY). Never commit it (.gitignore covers it).
4. Verify the key once:   cd server && npm install && npm run check:tomtom
5. Run:  terminal 1 `cd server && npm start`   terminal 2 (root) `npm install && npm run dev`

Data flow (nothing typed in the frontend):
- /api/state  -> pulse, zones, signals, situations, summary   (scenario engine)
- /api/routes -> scenario: ETAs computed from zone speeds in the current state
                 live (?mode=live&from=lat,lng&to=lat,lng): TomTom routing, traffic sections become route signals
- delay = currentMin - normalMin (calculated); fastest = lowest current ETA (calculated, backend + frontend agree)
- /api/geocode -> TomTom place search; /api/health shows tomtomCallsToday (free tier 2,500/day)
- Live mode falls back to scenario with a visible warning if TomTom fails.
