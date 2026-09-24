// Writes ../fixtures/*.json so the frontend can build against real engine output today.
import fs from 'node:fs';
import { META } from '../src/sim.js';
import { stateAt } from '../src/index.js';
const out = new URL('../../fixtures/', import.meta.url);
const at = (min) => stateAt(META.start + min * 60000);
const save = (name, s) => fs.writeFileSync(new URL(name, out), JSON.stringify(s, null, 2));
save('state.peak.json', at(META.defaultMin));   // default demo view
save('state.morning.json', at(70));             // one active situation (Vaishali Nagar)
save('state.resolved.json', at(130));           // same situation now resolved, otherwise quiet
save('state.quiet.json', at(10));               // nothing detected
console.log('fixtures written');
