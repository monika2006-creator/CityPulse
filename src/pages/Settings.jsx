import { useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  MapPin,
  Moon,
  Sun,
  Database,
  Route,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";
import { CITIES } from "../services/notificationStore.js";

function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-semibold text-ink cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
          checked ? "bg-cyan" : "bg-ink/20"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const {
    settings,
    updateSettings,
    selectedCity,
    setSelectedCity,
    health,
    state,
    dataMode,
    refresh,
    clearNotificationHistory,
    notifications,
    scenarioMin,
    setScenarioMin,
  } = useCityPulseData();

  const { theme, setTheme } = useTheme();
  const [clearedNotice, setClearedNotice] = useState(false);
  const [activeStep, setActiveStep] = useState(scenarioMin ?? 235);

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    updateSettings({ defaultCity: cityName });
  };

  const handleClearHistory = () => {
    clearNotificationHistory();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  const handleScenarioStep = (min) => {
    setActiveStep(min);
    setScenarioMin(min);
  };

  // Status indicators based on actual data
  const isBackendOk = health?.ok === true;
  const isTomTomConfigured = health?.tomtomKey === true;
  const isCivicDataConnected = Boolean(state);
  const tomtomCallsToday = health?.tomtomCallsToday ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          System Settings & Preferences
        </h2>
        <p className="mt-1 text-sm text-muted">
          Configure civic notifications, geographic defaults, routing behavior, and inspection feeds.
        </p>
      </div>

      {/* DEMO SCENARIO STEPPER (CRITICAL FOR JUDGING DEMO) */}
      <section className="rounded-xl border border-cyan/30 bg-cyan/[0.04] p-5 sm:p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan/20">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/15 text-cyan-ink">
              <Clock size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Scenario Timeline Stepper (Hackathon Judging Demo)
              </h3>
              <p className="text-xs text-muted">
                Step through deterministic backend scenario minutes to trigger real dynamic Smart Notifications.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-cyan/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-cyan-ink">
            Minute: {activeStep}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => handleScenarioStep(150)}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
              activeStep === 150
                ? "border-cyan bg-surface shadow-active ring-1 ring-cyan"
                : "border-border bg-surface/70 hover:border-cyan/40 hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[11px] font-bold text-cyan-ink">10:00 (min 150)</span>
              {activeStep === 150 && <span className="h-2 w-2 rounded-full bg-cyan" />}
            </div>
            <p className="mt-1 text-xs font-bold text-ink">Baseline Conditions</p>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">
              Quiet traffic (Tonk Rd 27 min), 1 minor situation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioStep(185)}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
              activeStep === 185
                ? "border-attention bg-surface shadow-active ring-1 ring-attention"
                : "border-border bg-surface/70 hover:border-attention/40 hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[11px] font-bold text-attention-ink">10:35 (min 185)</span>
              {activeStep === 185 && <span className="h-2 w-2 rounded-full bg-attention" />}
            </div>
            <p className="mt-1 text-xs font-bold text-ink">Rain & Incident Onset</p>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">
              Tonk collision starts, rain begins in MI Road.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioStep(235)}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
              activeStep === 235
                ? "border-critical bg-surface shadow-active ring-1 ring-critical"
                : "border-border bg-surface/70 hover:border-critical/40 hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[11px] font-bold text-critical">11:25 (min 235)</span>
              {activeStep === 235 && <span className="h-2 w-2 rounded-full bg-critical" />}
            </div>
            <p className="mt-1 text-xs font-bold text-ink">Peak Disruption</p>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">
              Tonk Rd delay surges (+7m), Civil Lines bypass is fastest alternative!
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioStep(330)}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
              activeStep === 330
                ? "border-normal bg-surface shadow-active ring-1 ring-normal"
                : "border-border bg-surface/70 hover:border-normal/40 hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[11px] font-bold text-normal">13:00 (min 330)</span>
              {activeStep === 330 && <span className="h-2 w-2 rounded-full bg-normal" />}
            </div>
            <p className="mt-1 text-xs font-bold text-ink">Clearing & Recovery</p>
            <p className="mt-0.5 text-[11px] text-muted leading-tight">
              Rain subsides, situations resolve.
            </p>
          </button>
        </div>

        <p className="mt-3 text-[11px] text-muted">
          💡 <span className="font-semibold text-ink">Judge Demo Flow:</span> Click{" "}
          <strong className="text-cyan-ink">Baseline Conditions (min 150)</strong> first, then click{" "}
          <strong className="text-critical">Peak Disruption (min 235)</strong>. The notification bell will light up with real
          delay, alternative route, and situation alerts!
        </p>
      </section>

      {/* 1. GENERAL SETTINGS */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <MapPin size={17} className="text-cyan-ink" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            General Configuration
          </h3>
        </div>

        {/* Default City */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Monitored City (Single Source of Truth)
          </label>
          <p className="mt-0.5 text-xs text-muted">
            Select the active city for civic signal observation and route intelligence.
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {CITIES.map((c) => {
              const isSelected = selectedCity === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCityChange(c.id)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-cyan bg-cyan/10 font-bold text-cyan-ink shadow-active"
                      : "border-border bg-surface hover:border-line hover:bg-ink/[0.02] text-ink"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm">{c.name}</p>
                    <p className="text-[11px] text-muted">{c.state}</p>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-cyan-ink" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Setting */}
        <div className="border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Interface Appearance
          </label>
          <p className="mt-0.5 text-xs text-muted">
            Select light or dark workspace presentation.
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                theme === "dark"
                  ? "border-cyan bg-cyan/10 text-cyan-ink shadow-active"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <Moon size={15} />
              <span>Dark Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                theme === "light"
                  ? "border-cyan bg-cyan/10 text-cyan-ink shadow-active"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <Sun size={15} />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        {/* Data Mode */}
        <div className="border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Civic Data Mode
          </label>
          <p className="mt-0.5 text-xs text-muted">
            Current mode: <strong className="text-ink">{dataMode}</strong>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => updateSettings({ dataMode: "scenario" })}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                settings.dataMode === "scenario"
                  ? "border-cyan bg-cyan/10 text-cyan-ink font-semibold"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <span>Simulated Scenario</span>
              <span className="rounded bg-attention/20 px-1.5 py-0.2 font-mono text-[9px] text-attention-ink">
                Monsoon Tuesday
              </span>
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ dataMode: "live" })}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                settings.dataMode === "live"
                  ? "border-cyan bg-cyan/10 text-cyan-ink font-semibold"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <span>Live Mode</span>
              <span className="rounded bg-normal/20 px-1.5 py-0.2 font-mono text-[9px] text-normal">
                {isTomTomConfigured ? "TomTom Active" : "Requires TomTom Key"}
              </span>
            </button>
          </div>
          {settings.dataMode === "scenario" && (
            <p className="mt-2 text-[11px] text-muted italic">
              Note: Scenario data is deterministic simulation for reliable testing. It is never labeled as live government data.
            </p>
          )}
        </div>
      </section>

      {/* 2. NOTIFICATIONS CONFIGURATION */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Bell size={17} className="text-cyan-ink" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            Smart Notification Engine
          </h3>
        </div>

        {/* Master Toggle */}
        <Toggle
          id="toggle-master"
          checked={settings.smartNotifications}
          onChange={(val) => updateSettings({ smartNotifications: val })}
          label="Smart Notifications Master Switch"
          description="Enable or disable all real-time civic intelligence and route alerts."
        />

        <div className={`space-y-1 divide-y divide-border/60 transition-opacity ${settings.smartNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <Toggle
            id="toggle-delay"
            checked={settings.routeDelayAlerts}
            onChange={(val) => updateSettings({ routeDelayAlerts: val })}
            label="Route Delay Alerts"
            description="Notify when current route travel times increase meaningfully above typical baseline."
          />

          <Toggle
            id="toggle-sit"
            checked={settings.newSituationAlerts}
            onChange={(val) => updateSettings({ newSituationAlerts: val })}
            label="New Civic Situation Alerts"
            description="Notify when multi-signal patterns (e.g. rain + waterlogging + slowdown) emerge."
          />

          <Toggle
            id="toggle-sev"
            checked={settings.severityChangeAlerts}
            onChange={(val) => updateSettings({ severityChangeAlerts: val })}
            label="Severity Escalation Alerts"
            description="Notify when an existing situation escalates (e.g. Attention to Critical)."
          />

          <Toggle
            id="toggle-signals"
            checked={settings.signalChangeAlerts}
            onChange={(val) => updateSettings({ signalChangeAlerts: val })}
            label="Traffic & Weather Changes"
            description="Notify when rainfall intensity or zone congestion surges significantly."
          />
        </div>

        {/* Minimum Severity Filter */}
        <div className={`border-t border-border pt-4 ${settings.smartNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Minimum Severity Threshold
          </label>
          <p className="mt-0.5 text-xs text-muted">
            Filter out low-impact alerts according to your preference.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {[
              { id: "all", label: "All Meaningful Changes" },
              { id: "medium_high", label: "Medium + High Severity" },
              { id: "high_only", label: "High / Critical Only" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSettings({ minSeverity: opt.id })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  settings.minSeverity === opt.id
                    ? "border-cyan bg-cyan/10 text-cyan-ink font-semibold"
                    : "border-border bg-surface text-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delay Threshold */}
        <div className={`border-t border-border pt-4 ${settings.smartNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Route Delay Notification Threshold
              </label>
              <p className="mt-0.5 text-xs text-muted">
                Minimum minutes of delay increase required to trigger an alert.
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-cyan-ink">
              +{settings.delayThresholdMin} min
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            {[3, 5, 7, 10].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updateSettings({ delayThresholdMin: mins })}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-mono font-medium transition-all ${
                  settings.delayThresholdMin === mins
                    ? "border-cyan bg-cyan/10 text-cyan-ink font-bold"
                    : "border-border bg-surface text-muted hover:text-ink"
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. ROUTE PREFERENCES */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Route size={17} className="text-cyan-ink" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            Route Preferences
          </h3>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted">
            Default Routing Algorithm
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { id: "fastest", label: "Fastest ETA", desc: "Prioritize lowest travel time" },
              { id: "balanced", label: "Balanced", desc: "Balance delay and distance" },
              { id: "fewest_signals", label: "Fewest Incidents", desc: "Avoid corridors with disruption" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSettings({ routePreference: opt.id })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  settings.routePreference === opt.id
                    ? "border-cyan bg-cyan/10 font-bold text-cyan-ink shadow-active"
                    : "border-border bg-surface text-ink hover:border-line"
                }`}
              >
                <p className="text-xs">{opt.label}</p>
                <p className="mt-0.5 text-[10px] text-muted font-normal">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-2 divide-y divide-border/60">
          <Toggle
            id="toggle-amenities"
            checked={settings.showAmenities}
            onChange={(val) => updateSettings({ showAmenities: val })}
            label="Show Route Amenities"
            description="Display key points of interest along the chosen corridor."
          />
          <Toggle
            id="toggle-petrol"
            checked={settings.showPetrolPumps}
            onChange={(val) => updateSettings({ showPetrolPumps: val })}
            label="Show Fuel / Petrol Stations"
            description="Highlight refueling points near corridor intersections."
          />
          <Toggle
            id="toggle-ev"
            checked={settings.showEvChargers}
            onChange={(val) => updateSettings({ showEvChargers: val })}
            label="Show EV Charging Stations"
            description="Highlight fast charging infrastructure along route paths."
          />
        </div>
      </section>

      {/* 4. DATA & PRIVACY */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Database size={17} className="text-cyan-ink" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            Data Provenance & Privacy
          </h3>
        </div>

        <div className="text-xs text-muted leading-relaxed space-y-2">
          <p>
            • <strong className="text-ink">Scenario Data:</strong> Deterministic simulated civic telemetry generated on Tuesday morning monsoon baseline. Used for testing, demonstration, and fallback.
          </p>
          <p>
            • <strong className="text-ink">TomTom Routing:</strong> Traffic-aware routing and geocoding via TomTom API when an active key is supplied in the backend environment.
          </p>
          <p>
            • <strong className="text-ink">Privacy:</strong> No personal or GPS tracking data is stored on the server. Notification history and settings are stored locally in your browser.
          </p>
        </div>

        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-ink">Clear Notification History</p>
            <p className="text-[11px] text-muted">
              Removes all locally stored notification alerts ({notifications.length} currently saved).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 rounded-lg border border-critical/30 bg-critical/10 px-3 py-1.5 text-xs font-semibold text-critical hover:bg-critical/20 transition-colors"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        </div>

        {clearedNotice && (
          <p className="text-xs font-semibold text-normal">
            ✓ Notification history successfully cleared.
          </p>
        )}
      </section>

      {/* 5. ABOUT & SYSTEM STATUS */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Activity size={17} className="text-cyan-ink" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            System Health & Status
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-elevated p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Backend API</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isBackendOk ? "bg-normal" : "bg-critical"}`} />
              <span className="text-xs font-bold text-ink">
                {isBackendOk ? "Operational" : "Offline"}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">Port 8787</p>
          </div>

          <div className="rounded-lg border border-border bg-elevated p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Routing Engine</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-normal" />
              <span className="text-xs font-bold text-ink">
                {isTomTomConfigured ? "TomTom Live" : "Scenario"}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">
              {isTomTomConfigured ? `${tomtomCallsToday} calls today` : "Deterministic"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-elevated p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Civic Telemetry</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isCivicDataConnected ? "bg-normal" : "bg-attention"}`} />
              <span className="text-xs font-bold text-ink">
                {isCivicDataConnected ? "Connected" : "Reconnecting"}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">6 Monitored Zones</p>
          </div>

          <div className="rounded-lg border border-border bg-elevated p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">AI Explanation</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan" />
              <span className="text-xs font-bold text-ink">Available</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">Deterministic Fallback</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="text-xs text-muted">
            <span className="font-semibold text-ink">CityPulse</span> v1.2.0 • Civic Intelligence Platform
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            <RefreshCw size={13} />
            <span>Poll / Refresh Now</span>
          </button>
        </div>
      </section>
    </div>
  );
}
