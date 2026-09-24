import { useEffect, useRef, useState } from "react";
import { ArrowRight, BellRing, X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

const PAGE_META = {
  overview: {
    title: "Overview",
    description: "Backend snapshot of monitored city conditions.",
  },
  "live-map": {
    title: "Live Map",
    description: "Geographic view of simulated civic signals across Jaipur.",
  },
  "route-intelligence": {
    title: "Route Intelligence",
    description: "TomTom live routes with scenario fallback when unavailable.",
  },
  situations: {
    title: "Situations",
    description: "Patterns detected across related civic signals.",
  },
  insights: {
    title: "Civic Correlations",
    description: "Relationships between overlapping civic signals.",
  },
  settings: { title: "Settings", description: "Manage your city, notifications, and preferences." },
};

export default function Layout({ currentPage, setCurrentPage, onPlaceSelect, onNavigate = setCurrentPage, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { notifications, markAsRead } = useCityPulseData();
  const seenNotificationIds = useRef(new Set(notifications.map((item) => item.id)));
  const meta = PAGE_META[currentPage] ?? PAGE_META.overview;

  useEffect(() => {
    const fresh = notifications.filter((item) => !seenNotificationIds.current.has(item.id));
    notifications.forEach((item) => seenNotificationIds.current.add(item.id));
    if (fresh.length) setToast(fresh.find((item) => item.title === "Faster route available") || fresh[0]);
  }, [notifications]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const followAlert = (alert) => {
    markAsRead(alert.id);
    setToast(null);
    setNotificationsOpen(false);
    onNavigate(alert.action?.page || "overview", alert.action || {});
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <main className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-transparent">
        <div className="sticky top-0 z-40">
          <div className="relative">
            <Header
              title={meta.title}
              description={meta.description}
              onMenuClick={() => setSidebarOpen(true)}
              onPlaceSelect={onPlaceSelect}
              onOpenNotifications={() => setNotificationsOpen((open) => !open)}
              onOpenSettings={() => setCurrentPage("settings")}
              notificationsOpen={notificationsOpen}
            />
            <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onNavigate={(page, action) => onNavigate(page, action)} />
          </div>
        </div>
        {toast && (
          <div className="fixed right-4 top-20 z-[80] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-critical/40 bg-surface p-4 shadow-float" role="alert" aria-live="assertive">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-critical/10 text-critical"><BellRing size={17} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-critical">Smart alert · {toast.location}</p><button type="button" onClick={() => setToast(null)} aria-label="Dismiss alert" className="text-muted hover:text-ink"><X size={15} /></button></div>
                <p className="mt-1 text-sm font-bold text-ink">{toast.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{toast.description}</p>
                {toast.action && <button type="button" onClick={() => followAlert(toast)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-cyan/10 px-2.5 py-1.5 text-xs font-bold text-cyan-ink hover:bg-cyan/20">{toast.action.label || "Open affected area"}<ArrowRight size={13} /></button>}
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
