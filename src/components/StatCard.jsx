const TONE_STYLES = {
  neutral: { text: "text-ink", chip: "bg-elevated text-muted" },
  cyan: { text: "text-cyan", chip: "bg-cyan/10 text-cyan" },
  normal: { text: "text-normal", chip: "bg-normal/10 text-normal" },
  attention: { text: "text-attention", chip: "bg-attention/10 text-attention" },
  critical: { text: "text-critical", chip: "bg-critical/10 text-critical" },
  violet: { text: "text-violet", chip: "bg-violet/10 text-violet" },
};

export default function StatCard({ icon: Icon, label, value, tone = "neutral" }) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.neutral;
  return (
    <div className="group rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a3a55] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${styles.chip}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${styles.text}`}>
        {value}
      </p>
    </div>
  );
}
