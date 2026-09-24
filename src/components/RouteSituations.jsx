import { Layers } from "lucide-react";
import { getRouteSituations } from "../utils/routeHelpers.js";

// Situations (from the existing Step 8 engine) detected from some of the same signals as
// this route. Deliberately cautious: a shared signal is context, not proof of a cause.
export default function RouteSituations({ route, situations }) {
  const related = getRouteSituations(route, situations);
  if (related.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-muted">
        <Layers size={12} className="shrink-0 text-violet" aria-hidden="true" />
        RELATED SITUATION{related.length > 1 ? "S" : ""}
      </p>
      <ul className="mt-1 space-y-0.5 text-[13px] text-ink">
        {related.map((situation) => (
          <li key={situation.id}>{situation.title}</li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted">Detected from some of the same signals. This does not establish a cause.</p>
    </div>
  );
}
