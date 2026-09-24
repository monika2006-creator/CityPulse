import { Link2 } from "lucide-react";
import { getRouteCorrelations } from "../utils/signalCorrelation.js";

// Correlations that include at least one of this route's signals. Context only: the
// route's ETA is the simulated current travel time and is not derived from these.
export default function RouteCorrelations({ route, correlations }) {
  const related = getRouteCorrelations(route, correlations);
  if (related.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-muted">
        <Link2 size={12} className="shrink-0 text-cyan-ink" aria-hidden="true" />
        SIGNAL RELATIONSHIP{related.length > 1 ? "S" : ""}
      </p>
      <ul className="mt-1 space-y-0.5 text-[13px] text-ink">
        {related.map((item) => (
          <li key={item.id}>
            {item.title} <span className="text-muted">· {item.area}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted">Signals overlapping in area and time. This does not set the ETA.</p>
    </div>
  );
}
