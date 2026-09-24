import SeverityGlyph from "./SeverityGlyph.jsx";
import { SEVERITY_STYLES } from "./SignalRow.jsx";

const NEUTRAL = { text: "text-muted", chip: "bg-inset" };

// Style for a calculated route's delay: semantic colour when data exists, neutral otherwise.
export const getDelayStyle = (route) => (route.severity ? SEVERITY_STYLES[route.severity] : NEUTRAL);

// Status chip. Label text plus a shape glyph, so status never relies on colour alone.
export default function RouteStatusBadge({ route }) {
  const style = getDelayStyle(route);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${style.chip} ${style.text}`}
    >
      {route.severity && <SeverityGlyph severity={route.severity} size={10} className="shrink-0" />}
      {route.statusLabel}
    </span>
  );
}
