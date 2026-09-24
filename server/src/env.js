// Tiny .env loader (no dependency, works on any Node version). Import this first.
import fs from 'node:fs';
try {
  for (const line of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env: scenario mode still works */ }
export const TOMTOM_KEY = () => process.env.TOMTOM_KEY || process.env.TOMTOM_API_KEY || '';
export const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY || '';
