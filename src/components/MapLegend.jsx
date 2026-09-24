import SeverityGlyph from "./SeverityGlyph.jsx";
import { SEVERITY_MARKER } from "../data/mapConfig.js";

// Key for the marker shapes. Shape + colour, so it works without relying on colour alone.
export default function MapLegend() {
  return (
    <ul className="flex items-center gap-4" aria-label="Marker legend">
      {Object.entries(SEVERITY_MARKER).map(([severity, marker]) => (
        <li key={severity} className="flex items-center gap-1.5">
          <SeverityGlyph severity={severity} size={12} />
          <span className="font-mono text-[10.5px] font-medium tracking-wide text-muted">
            {marker.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
