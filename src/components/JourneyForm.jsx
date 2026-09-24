import { ArrowRight, CircleDot, MapPin, Route, Info } from "lucide-react";

function LocationField({ id, label, icon: Icon, iconClass, value, onChange, placeholder }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.12em] text-muted">
        {label}
      </label>
      <div className="relative">
        <Icon size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-border bg-inset py-2.5 pl-10 pr-3 text-[16px] text-ink outline-none transition-all duration-200 placeholder:text-muted hover:border-line focus:border-cyan/50 focus:shadow-focus sm:text-sm"
        />
      </div>
    </div>
  );
}

// Journey input. Demo mode only: the parent decides whether a journey is supported.
// Kept generic (plain text in, plain text out) so real location search can slot in later.
export default function JourneyForm({
  from,
  to,
  onFromChange,
  onToChange,
  onSubmit,
  feedback,
  sourceHint,
  loading = false,
}) {
  return (
    <section
      aria-label="Journey search"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] md:items-end"
      >
        <LocationField
          id="route-from"
          label="FROM"
          icon={CircleDot}
          iconClass="text-cyan-ink"
          value={from}
          onChange={onFromChange}
          placeholder="Origin"
        />
        <ArrowRight size={16} className="mb-3 hidden text-muted md:block" aria-hidden="true" />
        <LocationField
          id="route-to"
          label="TO"
          icon={MapPin}
          iconClass="text-violet"
          value={to}
          onChange={onToChange}
          placeholder="Destination"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-action px-5 py-2.5 text-[13px] font-bold tracking-wide text-bg transition-all duration-200 hover:bg-action/90 active:scale-[0.98] md:w-auto"
        >
          <Route size={15} strokeWidth={2.5} />
          {loading ? "SEARCHING…" : "ANALYZE ROUTES"}
        </button>
      </form>

      <div role="status" aria-live="polite" className="mt-3.5 text-xs">
        {feedback ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-attention-ink">
            <span className="flex items-center gap-1.5 font-medium">
              <Info size={13} className="shrink-0" />
              {feedback}
            </span>
          </p>
        ) : (
          <p className="text-muted">
            {sourceHint}
          </p>
        )}
      </div>
    </section>
  );
}
