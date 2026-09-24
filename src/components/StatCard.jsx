const TONE_STYLES = {
  neutral: { text: "text-ink", chip: "bg-elevated text-muted" },
  cyan: { text: "text-cyan-ink", chip: "bg-cyan/10 text-cyan-ink" },
  normal: { text: "text-normal-ink", chip: "bg-normal/10 text-normal-ink" },
  attention: { text: "text-attention-ink", chip: "bg-attention/10 text-attention-ink" },
  critical: { text: "text-critical-ink", chip: "bg-critical/10 text-critical-ink" },
  violet: { text: "text-violet-ink", chip: "bg-violet/10 text-violet-ink" },
};

// `children` renders in a footer under the value (e.g. a severity breakdown).
export default function StatCard({ icon: Icon, label, value, tone = "neutral", children }) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.neutral;
  return (
    <div className="group flex flex-col rounded-xl border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-lift">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${styles.chip}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${styles.text}`}>{value}</p>
      {children && <div className="mt-3 border-t border-border pt-3">{children}</div>}
    </div>
  );
}
