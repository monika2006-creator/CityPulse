import { SEVERITY_MARKER } from "../data/mapConfig.js";

// Small severity shape (● normal, ◆ attention, ⚠ critical).
// Shape + colour, so severity never relies on colour alone.
export default function SeverityGlyph({ severity, size = 14, className = "" }) {
  const marker = SEVERITY_MARKER[severity] ?? SEVERITY_MARKER.normal;
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ color: marker.color }}
      dangerouslySetInnerHTML={{ __html: marker.glyph }}
    />
  );
}
