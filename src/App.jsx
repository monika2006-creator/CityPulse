import { useState } from "react";
import Layout from "./components/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import LiveMap from "./pages/LiveMap.jsx";
import RouteIntelligence from "./pages/RouteIntelligence.jsx";
import Situations from "./pages/Situations.jsx";
import Insights from "./pages/Insights.jsx";
import { CityPulseDataProvider } from "./context/CityPulseDataContext.jsx";

const PAGES = {
  overview: Overview,
  "live-map": LiveMap,
  "route-intelligence": RouteIntelligence,
  situations: Situations,
  insights: Insights,
};

export default function App() {
  const [page, setPage] = useState("overview");
  const CurrentPage = PAGES[page] ?? Overview;

  return (
    <CityPulseDataProvider>
      <Layout currentPage={page} setCurrentPage={setPage}>
        <CurrentPage />
      </Layout>
    </CityPulseDataProvider>
  );
}
