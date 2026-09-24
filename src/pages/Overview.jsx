import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Radio, MapPin } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import SignalRow from "../components/SignalRow.jsx";
import SituationCard from "../components/SituationCard.jsx";
import { cityData } from "../data/cityData.js";
import { getRecentSignals } from "../data/signals.js";
import { getActiveSituations } from "../data/situations.js";

function formatClock(date) {
  return date.toTimeString().slice(0, 8);
}

export default function Overview() {
  const recentSignals = getRecentSignals(4);
  const activeSituations = getActiveSituations();

  // Lightweight, frontend-only clock so "last updated" feels live.
  // No backend, no polling — just a local tick for the demo.
  const [lastUpdated, setLastUpdated] = useState(cityData.lastUpdated);
  useEffect(() => {
    const id = setInterval(() => setLastUpdated(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">City Overview</h2>
          <p className="mt-1 text-sm text-muted">
            Monitor live civic signals, situations, and city activity from one place.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <span className="font-semibold tracking-wide">{cityData.dataMode} DATA</span>
          <span className="text-border">·</span>
          <span>
            Updated <span className="font-mono text-ink">{lastUpdated}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity} label="Civic Pulse" value={cityData.status} tone="normal" />
        <StatCard
          icon={AlertTriangle}
          label="Active Situations"
          value={String(cityData.activeSituations).padStart(2, "0")}
          tone="attention"
        />
        <StatCard
          icon={Radio}
          label="Live Signals"
          value={String(cityData.liveSignals).padStart(2, "0")}
          tone="cyan"
        />
        <StatCard
          icon={MapPin}
          label="Monitored Areas"
          value={String(cityData.monitoredAreas).padStart(2, "0")}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-surface p-5 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-ink">Live Signals</h3>
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-cyan">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
              </span>
              LIVE
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {recentSignals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
          <h3 className="text-base font-bold tracking-tight text-ink">Active Situations</h3>
          <div className="mt-4 space-y-2.5">
            {activeSituations.map((situation) => (
              <SituationCard key={situation.id} situation={situation} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-ink">Live City Overview</h3>
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-cyan">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
            </span>
            LIVE DATA STREAM
          </span>
        </div>

        <div
          className="relative mt-4 flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-bg/60 text-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,41,59,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "center",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(34,211,238,0.10), transparent 55%)",
            }}
          />
          <span className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-cyan/25 bg-cyan/10">
            <Radio size={19} className="text-cyan" />
          </span>
          <p className="relative text-sm text-muted">Live civic signals will appear here.</p>
        </div>
      </div>
    </div>
  );
}
