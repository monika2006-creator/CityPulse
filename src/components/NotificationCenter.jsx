import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Route,
  AlertTriangle,
  CloudRain,
  Car,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

const CATEGORY_ICONS = {
  routes: Route,
  situations: AlertTriangle,
  weather: CloudRain,
  traffic: Car,
};

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "routes", label: "Routes" },
  { id: "situations", label: "Situations" },
  { id: "traffic", label: "Traffic" },
  { id: "weather", label: "Weather" },
];

export default function NotificationCenter({ isOpen, onClose, onNavigate }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotificationHistory,
  } = useCityPulseData();

  const [activeTab, setActiveTab] = useState("all");
  const panelRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Only close if not clicking a trigger button
        const isTrigger = event.target.closest("[data-notification-trigger]");
        if (!isTrigger) {
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.category === activeTab);
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications panel"
      className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md rounded-xl border border-border bg-surface shadow-card backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-cyan-ink" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-cyan/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-ink">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              title="Mark all as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-ink/5 hover:text-ink"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "all"
              ? notifications.length
              : notifications.filter((n) => n.category === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-cyan/15 text-cyan-ink"
                  : "text-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="font-mono text-[10px] opacity-75">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] divide-y divide-border overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-muted">
              <Bell size={18} />
            </div>
            <p className="text-sm font-semibold text-ink">
              {activeTab === "all"
                ? "No notifications yet"
                : `No ${activeTab} notifications`}
            </p>
            <p className="mt-1 text-xs text-muted">
              Smart notifications are generated dynamically when route delays,
              civic situations, or signals change.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || AlertTriangle;
            const isCritical = item.severity === "critical" || item.severity === "high";
            const isAttention = item.severity === "attention" || item.severity === "medium";

            const iconBg = isCritical
              ? "bg-critical/10 text-critical"
              : isAttention
              ? "bg-attention/10 text-attention-ink"
              : "bg-cyan/10 text-cyan-ink";

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markAsRead(item.id);
                }}
                className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                  item.isRead
                    ? "bg-transparent hover:bg-ink/[0.02]"
                    : "bg-cyan/[0.03] hover:bg-cyan/[0.06]"
                }`}
              >
                {/* Unread indicator dot */}
                {!item.isRead && (
                  <span
                    className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-cyan shadow-dot"
                    title="Unread notification"
                  />
                )}

                {/* Category Icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border ${iconBg}`}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`truncate text-xs ${
                        item.isRead
                          ? "font-medium text-ink/80"
                          : "font-bold text-ink"
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted">
                      {item.timestamp}
                    </span>
                  </div>

                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      item.isRead ? "text-muted" : "text-ink/90 font-medium"
                    }`}
                  >
                    {item.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-muted">
                      {item.location}
                    </span>

                    {/* Action button if actionable */}
                    {item.action && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                          onClose();
                          if (onNavigate) {
                            onNavigate(item.action.page, item.action);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded bg-cyan/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-ink transition-colors hover:bg-cyan/20"
                      >
                        <span>{item.action.label}</span>
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-surface/50">
          <span className="font-mono text-[11px] text-muted">
            {notifications.length} {notifications.length === 1 ? "alert" : "alerts"} in history
          </span>
          <button
            type="button"
            onClick={clearNotificationHistory}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-critical transition-colors"
          >
            <Trash2 size={12} />
            <span>Clear history</span>
          </button>
        </div>
      )}
    </div>
  );
}
