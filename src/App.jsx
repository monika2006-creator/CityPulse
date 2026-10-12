import { useEffect, useState } from "react";
import Layout from "./components/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import LiveMap from "./pages/LiveMap.jsx";
import RouteIntelligence from "./pages/RouteIntelligence.jsx";
import Situations from "./pages/Situations.jsx";
import Insights from "./pages/Insights.jsx";
import Settings from "./pages/Settings.jsx";
import { CityPulseDataProvider } from "./context/CityPulseDataContext.jsx";

const PAGES = {
  overview: Overview,
  "live-map": LiveMap,
  "route-intelligence": RouteIntelligence,
  situations: Situations,
  insights: Insights,
  settings: Settings,
};

const PAGE_META = {
  overview: ["Overview", "Live and simulated civic conditions across Jaipur and other supported cities."],
  "live-map": ["Live Map", "Explore civic signals, traffic, and weather across supported cities."],
  "route-intelligence": ["Route Intelligence", "Compare routes and travel times with CityPulse route intelligence."],
  situations: ["Situations", "Review active patterns detected across civic signals."],
  insights: ["Insights", "Explore relationships between overlapping civic signals."],
  settings: ["Settings", "Manage CityPulse city, data, notification, and display preferences."],
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [alertAction, setAlertAction] = useState(null);
  const CurrentPage = PAGES[page] ?? Overview;
  useEffect(() => {
    const [title, description] = PAGE_META[page] ?? PAGE_META.overview;
    document.title = `${title} | CityPulse`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [page]);
  const handleAlertNavigate = (targetPage, action) => {
    setAlertAction(action ?? null);
    setPage(targetPage);
  };
  const handlePlaceSelect = (place) => {
    setSearchedPlace(place);
    setPage("live-map");
  };

  return (
    <CityPulseDataProvider>
      <Layout currentPage={page} setCurrentPage={setPage} onNavigate={handleAlertNavigate} onPlaceSelect={handlePlaceSelect}>
        {page === "live-map" ? <LiveMap searchedPlace={searchedPlace} alertAction={alertAction} /> : <CurrentPage alertAction={alertAction} />}
      </Layout>
    </CityPulseDataProvider>
  );
}
