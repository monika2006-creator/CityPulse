// Deterministic fallback summary. Uses ONLY values already present in `state`.
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export function buildSummary(state) {
  const active = state.situations.filter((s) => s.status === 'active');
  const missing = state.missingFeeds;
  const parts = [];
  if (active.length) {
    const top = active[0];
    parts.push(`Most significant: ${top.title} at ${top.location} (${top.severity}). ${top.summary}`);
    if (active.length > 1) parts.push(`${plural(active.length - 1, 'other situation')} active: ${active.slice(1).map((s) => `${s.title} (${s.location})`).join(', ')}.`);
  } else if (state.anomalies.length) {
    parts.push(`No multi-signal situations, but ${plural(state.anomalies.length, 'single-signal anomaly')} noted: ${state.anomalies.map((a) => `${a.title} (${a.name})`).join(', ')}.`);
  } else parts.push('All monitored zones are within normal ranges.');
  if (missing.length) parts.push(`The ${missing.join(' and ')} feed${missing.length > 1 ? 's are' : ' is'} unavailable, so this summary leaves ${missing.length > 1 ? 'them' : 'it'} out.`);
  return {
    level: state.pulse.label,
    headline: active.length ? `${plural(active.length, 'situation')} detected` : state.pulse.level === 'normal' ? 'Conditions are normal' : 'Minor anomalies noted',
    text: parts.join(' '), generatedBy: 'template',
  };
}
