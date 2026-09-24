import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Lightbulb,
  Route,
  MapPin,
  Bell,
  Settings,
  Radio,
  X,
} from "lucide-react";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "live-map", label: "Live Map", icon: Map },
  { id: "route-intelligence", label: "Route Intelligence", icon: Route },
  { id: "situations", label: "Situations", icon: AlertTriangle },
  { id: "insights", label: "Insights", icon: Lightbulb },
];

function NavButton({ item, isActive, onSelect }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-cyan/10 text-ink shadow-active"
          : "text-muted hover:translate-x-0.5 hover:bg-ink/[0.04] hover:text-ink"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-cyan"
          style={{ width: 3, height: 16 }}
        />
      )}
      <Icon
        size={17}
        strokeWidth={2}
        className={`shrink-0 transition-colors duration-200 ${
          isActive ? "text-cyan-ink" : "text-muted group-hover:text-ink"
        }`}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none transition-colors duration-200 ${
            isActive
              ? "bg-cyan/15 text-cyan-ink"
              : "bg-ink/5 text-muted group-hover:text-ink"
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ currentPage, setCurrentPage, isOpen, onClose }) {
  const { activeSituations, dataMode, state } = useCityPulseData();
  const situationBadge = activeSituations.length ? String(activeSituations.length).padStart(2, "0") : undefined;
  const handleSelect = (id) => {
    setCurrentPage(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-scrim backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-[262px] shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / brand */}
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-elevated">
              <Radio size={17} className="text-cyan-ink" strokeWidth={2.25} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan shadow-dot" />
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-bold tracking-tight text-ink">CITYPULSE</p>
              <p className="text-[9.5px] font-semibold tracking-[0.12em] text-muted">
                CIVIC INTELLIGENCE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-ink/5 hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-1">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item.id === "situations" ? { ...item, badge: situationBadge } : item}
              isActive={currentPage === item.id}
              onSelect={handleSelect}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border px-3 py-4">
          <div className="mb-3 rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="text-[9.5px] font-semibold tracking-[0.1em] text-muted">
              SYSTEM STATUS
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-normal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-normal" />
              </span>
              <span className="text-xs font-semibold text-ink">{state ? "Backend connected" : "Connecting…"}</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5">
              <MapPin size={13} className="text-violet shrink-0" />
              <div className="leading-tight">
                <p className="text-xs font-medium text-ink">Jaipur</p>
                <p className="text-[10.5px] text-muted">{dataMode}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all duration-200 hover:bg-ink/[0.04] hover:text-ink"
            >
              <Bell size={16} />
              <span>Notifications</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all duration-200 hover:bg-ink/[0.04] hover:text-ink"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
