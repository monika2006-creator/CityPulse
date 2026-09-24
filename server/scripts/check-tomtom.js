// Run this ONCE on your machine to prove the TomTom key + parsing work:  npm run check:tomtom
import '../src/env.js';
import { TOMTOM_KEY } from '../src/env.js';
import { geocode, tomtomRoutes, attachTrafficSignals, liveResult } from '../src/routes.js';

const key = TOMTOM_KEY();
if (!key) { console.error('No TOMTOM_KEY in server/.env'); process.exit(1); }
const [fromQ, toQ] = process.argv.slice(2).length === 2 ? process.argv.slice(2) : ['Amity University Rajasthan', 'Jaipur International Airport'];
const [a] = await geocode(fromQ, key), [b] = await geocode(toQ, key);
console.log('from:', a ?? 'NOT FOUND'); console.log('to  :', b ?? 'NOT FOUND');
if (!a || !b) process.exit(1);
const routes = await tomtomRoutes(a, b, key);
await attachTrafficSignals(routes);
const out = liveResult(routes, { from: { name: a.name, lat: a.lat, lng: a.lng }, to: { name: b.name, lat: b.lat, lng: b.lng } });
for (const r of out.routes) console.log(`${r.isFastest ? '* ' : '  '}${r.name.padEnd(28)} normal ${r.normalMin} min | current ${r.currentMin} min | delay ${r.delayMin >= 0 ? '+' : ''}${r.delayMin} | ${r.signalCount} signals | traffic signals: ${r.trafficSignals ?? 'n/a'} | ${r.distanceKm} km`);
console.log('recommendation:', JSON.stringify(out.recommendation));
console.log('If numbers look wrong, paste this output to Claude (remove the key first).');
