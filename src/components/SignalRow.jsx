import { Car, CloudRain, AlertTriangle, Wind, Bus, Zap, Volume2, Radio } from "lucide-react";

export const TYPE_ICON = {
  traffic: Car,
  weather: CloudRain,
  road_incident: AlertTriangle,
  air_quality: Wind,
  public_transport: Bus,
  power: Zap,
  noise: Volume2,
};

export const SEVERITY_STYLES = {
  normal: { text: "text-normal", chip: "bg-normal/10", label: "NORMAL" },
  attention: { text: "text-attention", chip: "bg-attention/10", label: "ATTENTION" },
  critical: { text: "text-critical", chip: "bg-critical/10", label: "CRITICAL" },
};

export default function SignalRow({ signal }) {
  const Icon = TYPE_ICON[signal.type] ?? Radio;
  const sev = SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.normal;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-bg/40 px-3 py-2.5 transition-colors duration-200 hover:border-[#2a3a55]">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${sev.chip}`}>
        <Icon size={15} className={sev.text} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{signal.title}</p>
        <p className="truncate text-xs text-muted">{signal.area}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className={`font-mono text-sm font-semibold ${sev.text}`}>{signal.change}</span>
        <span
          className={`hidden rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide sm:inline-block ${sev.chip} ${sev.text}`}
        >
          {sev.label}
        </span>
        <span className="font-mono text-xs text-muted">{signal.detectedAt.slice(0, 5)}</span>
      </div>
    </div>
  );
}
