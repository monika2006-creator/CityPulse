import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

const PAGE_META = {
  overview: {
    title: "Overview",
    description: "Real-time view of what's happening across the city.",
  },
  "live-map": {
    title: "Live Map",
    description: "Geographic view of simulated civic signals across Jaipur.",
  },
  "route-intelligence": {
    title: "Route Intelligence",
    description: "Route options and the civic conditions behind them.",
  },
  situations: {
    title: "Situations",
    description: "Unusual conditions detected across the city.",
  },
  insights: {
    title: "Insights",
    description: "Patterns and trends in city activity over time.",
  },
};

export default function Layout({ currentPage, setCurrentPage, children }) {
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
        />
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
