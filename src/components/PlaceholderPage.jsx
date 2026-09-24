const ACCENT_STYLES = {
  cyan: { ring: "border-cyan/25", chip: "bg-cyan/10", icon: "text-cyan-ink" },
  attention: { ring: "border-attention/25", chip: "bg-attention/10", icon: "text-attention-ink" },
  violet: { ring: "border-violet/25", chip: "bg-violet/10", icon: "text-violet" },
};

export default function PlaceholderPage({ icon: Icon, title, message, accent = "cyan" }) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.cyan;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      {Icon && (
        <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${styles.ring} ${styles.chip}`}>
          <Icon size={22} className={styles.icon} />
        </span>
      )}
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
