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
          className="w-full rounded-lg border border-border bg-bg/60 py-2.5 pl-10 pr-3 text-[16px] text-ink outline-none transition-all duration-200 placeholder:text-muted hover:border-[#2a3a55] focus:border-cyan/50 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] sm:text-sm"
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
  onUseDemo,
  demoJourneyLabel,
}) {
  return (
    <section
      aria-label="Journey search"
      className="rounded-2xl border border-border bg-surface p-4 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.7)] sm:p-5"
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
          iconClass="text-cyan"
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-action px-5 py-2.5 text-[13px] font-bold tracking-wide text-bg transition-all duration-200 hover:bg-action/90 active:scale-[0.98] md:w-auto"
        >
          <Route size={15} strokeWidth={2.5} />
          ANALYZE ROUTES
        </button>
      </form>

      <div role="status" aria-live="polite" className="mt-3.5 text-xs">
        {feedback ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-attention">
            <span className="flex items-center gap-1.5 font-medium">
              <Info size={13} className="shrink-0" />
              {feedback}
            </span>
            {onUseDemo && (
              <button
                type="button"
                onClick={onUseDemo}
                className="font-semibold text-cyan underline-offset-2 transition-colors duration-200 hover:underline"
              >
                Use demo journey
              </button>
            )}
          </p>
        ) : (
          <p className="text-muted">
            Demo mode supports one journey: <span className="text-ink">{demoJourneyLabel}</span>. Simulated data only.
          </p>
        )}
      </div>
    </section>
  );
}
