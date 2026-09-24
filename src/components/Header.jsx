import { Bell, Settings, Menu, MapPin } from "lucide-react";
import SearchBar from "./SearchBar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useCityPulseData } from "../context/CityPulseDataContext.jsx";

export default function Header({ title, description, onMenuClick, onPlaceSelect }) {
  const { state, dataMode, loading } = useCityPulseData();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted">{description}</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 px-4 md:block">
          <SearchBar className="mx-auto max-w-xl" onPlaceSelect={onPlaceSelect} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-attention/25 bg-attention/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-attention-ink sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-attention" />
            {loading && !state ? "CONNECTING" : dataMode}
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted md:flex">
            <MapPin size={13} className="text-violet" />
            Jaipur
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="relative rounded-lg border border-border bg-surface p-2 text-muted transition-all duration-200 hover:border-cyan/40 hover:text-ink"
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-critical" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-border bg-surface p-2 text-muted transition-all duration-200 hover:border-cyan/40 hover:text-ink"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 md:hidden sm:px-8">
        <SearchBar onPlaceSelect={onPlaceSelect} />
      </div>
    </header>
  );
}
