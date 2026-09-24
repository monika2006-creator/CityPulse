import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

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
};

export default function Layout({ currentPage, setCurrentPage, onPlaceSelect, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const meta = PAGE_META[currentPage] ?? PAGE_META.overview;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-transparent">
        <Header
          title={meta.title}
          description={meta.description}
          onMenuClick={() => setSidebarOpen(true)}
          onPlaceSelect={onPlaceSelect}
        />
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
