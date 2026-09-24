import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, AttributionControl, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import SignalMarker from "./SignalMarker.jsx";
import {
  getCityCenter,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  TILE_URL,
  TILE_ATTRIBUTION,
  LEAFLET_PREFIX,
} from "../data/mapConfig.js";

const FOCUS_ZOOM = 14;
// Signals closer than this (in degrees, ~330 m) are fanned out slightly on screen.
const OVERLAP_THRESHOLD = 0.003;

// Signals from the same spot (e.g. traffic + rain on Tonk Road) would otherwise sit
// exactly on top of each other at city zoom. This returns a small PIXEL offset per
// signal id so every marker stays clickable. Marker anchors keep the real coordinates.
function getMarkerOffsets(signals) {
  const offsets = {};
  const assigned = new Set();

  signals.forEach((signal) => {
    if (assigned.has(signal.id)) return;
    const group = signals.filter(
      (other) =>
        !assigned.has(other.id) &&
        Math.abs(other.latitude - signal.latitude) < OVERLAP_THRESHOLD &&
        Math.abs(other.longitude - signal.longitude) < OVERLAP_THRESHOLD
    );

    group.forEach((member, index) => {
      assigned.add(member.id);
      if (group.length === 1) {
        offsets[member.id] = [0, 0];
        return;
      }
      const radius = group.length === 2 ? 16 : 20;
      const start = group.length === 2 ? Math.PI : -Math.PI / 2;
      const angle = start + (2 * Math.PI * index) / group.length;
      offsets[member.id] = [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)];
    });
  });

  return offsets;
}

// Approx. height of an open signal popup, so a focused marker is placed low enough
// for its popup to fit above it.
const POPUP_CLEARANCE = 372;

// Pans/zooms to a signal when the LIVE SIGNALS panel asks for it.
function FocusController({ focus, signals, rightInset }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;
    const target = signals.find((signal) => signal.id === focus.id);
    if (!target) return;

    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
    const size = map.getSize();

    // Put the marker low and left of centre so its popup clears the top edge and any overlay.
    const markerY = Math.max(size.y / 2, Math.min(POPUP_CLEARANCE, size.y - 48));
    const shift = L.point(-rightInset / 2, markerY - size.y / 2);
    const center = map.unproject(
      map.project([target.latitude, target.longitude], zoom).subtract(shift),
      zoom
    );

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      map.setView(center, zoom, { animate: false });
    } else {
      map.flyTo(center, zoom, { duration: 0.7 });
    }
    // Only a new focus request should move the map, not a signals/filter change.
  }, [focus, map]);

  return null;
}

function PlaceFocusController({ place }) {
  const map = useMap();
  useEffect(() => {
    if (!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lng))) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([Number(place.lat), Number(place.lng)], Math.max(map.getZoom(), 14), { animate: !reduceMotion, duration: 0.7 });
  }, [place, map]);
  return null;
}

// Escape closes the open popup even when keyboard focus is outside the map
// (for example on a LIVE SIGNALS row). Leaflet only handles Escape while the map has focus.
function CloseOnEscape() {
  const map = useMap();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") map.closePopup();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [map]);

  return null;
}

function CityCenterController({ city, signals, rightInset }) {
  const map = useMap();
  const prevCityRef = useRef(city);

  useEffect(() => {
    if (!city) return;
    if (prevCityRef.current !== city) {
      prevCityRef.current = city;
      map.setView(getCityCenter(city), DEFAULT_ZOOM);
    }
  }, [city, signals, map, rightInset]);

  return null;
}

/**
 * Interactive civic map. Renders whatever `signals` it is given — it owns no signal data.
 *
 * Props
 *  - signals:      array from signals.js (already filtered by the page)
 *  - selectedId:   id of the currently selected signal, or null
 *  - focus:        { id } request to fly to a signal (new object per request)
 *  - city:         active city name (Jaipur, Jodhpur, Udaipur)
 *  - onSelect(id): marker clicked
 *  - onDeselect(id): popup closed
 *  - rightInset:   px on the right covered by an overlay, so popups pan clear of it
 */
export default function MapView({ signals, selectedId, focus, searchedPlace, city = "Jaipur", onSelect, onDeselect, rightInset = 0 }) {
  const offsets = getMarkerOffsets(signals);

  // Opening view: frame every signal in the selected city, keeping clear of the
  // floating panel. MapContainer only reads this on first render.
  const cityCenter = getCityCenter(city);
  const initialView = { center: cityCenter, zoom: DEFAULT_ZOOM };

  const popupPadding = {
    topLeft: [24, 24],
    bottomRight: [24 + rightInset, 24],
  };

  return (
    <div
      className="citypulse-map relative h-full w-full"
      role="region"
      aria-label={`Interactive map of simulated civic signals across ${city}`}
    >
      <MapContainer
        {...initialView}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        attributionControl={false}
        zoomSnap={0.5}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={MAX_ZOOM} />
        <AttributionControl position="bottomright" prefix={LEAFLET_PREFIX} />

        {signals.map((signal) => (
          <SignalMarker
            key={signal.id}
            signal={signal}
            offset={offsets[signal.id] ?? [0, 0]}
            isSelected={signal.id === selectedId}
            onSelect={onSelect}
            onDeselect={onDeselect}
            popupPadding={popupPadding}
          />
        ))}

        {searchedPlace && Number.isFinite(Number(searchedPlace.lat)) && Number.isFinite(Number(searchedPlace.lng)) && (
          <CircleMarker center={[Number(searchedPlace.lat), Number(searchedPlace.lng)]} radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0891b2", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>{searchedPlace.name}</Tooltip>
          </CircleMarker>
        )}

        <CityCenterController city={city} signals={signals} rightInset={rightInset} />
        <FocusController focus={focus} signals={signals} rightInset={rightInset} />
        <PlaceFocusController place={searchedPlace} />
        <CloseOnEscape />
      </MapContainer>

      {/* Soft edge vignette so the map sits inside the dark UI. Below markers/popups. */}
      <div className="cp-map-vignette pointer-events-none absolute inset-0 z-[450]" aria-hidden="true" />
    </div>
  );
}
