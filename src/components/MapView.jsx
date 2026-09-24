import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, AttributionControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import SignalMarker from "./SignalMarker.jsx";
import {
  JAIPUR_CENTER,
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

/**
 * Interactive Jaipur map. Renders whatever `signals` it is given — it owns no signal data.
 *
 * Props
 *  - signals:      array from signals.js (already filtered by the page)
 *  - selectedId:   id of the currently selected signal, or null
 *  - focus:        { id } request to fly to a signal (new object per request)
 *  - onSelect(id): marker clicked
 *  - onDeselect(id): popup closed
 *  - rightInset:   px on the right covered by an overlay, so popups pan clear of it
 */
export default function MapView({ signals, selectedId, focus, onSelect, onDeselect, rightInset = 0 }) {
  const offsets = getMarkerOffsets(signals);

  // Opening view: frame every signal (they are all in Jaipur), keeping clear of the
  // floating panel. MapContainer only reads this on first render, so later filtering
  // never moves the map. With no signals, fall back to the fixed Jaipur centre.
  const initialView = signals.length
    ? {
        bounds: L.latLngBounds(signals.map((signal) => [signal.latitude, signal.longitude])),
        boundsOptions: {
          paddingTopLeft: [32, 32],
          paddingBottomRight: [32 + rightInset, 32],
          maxZoom: 13,
        },
      }
    : { center: JAIPUR_CENTER, zoom: DEFAULT_ZOOM };

  const popupPadding = {
    topLeft: [24, 24],
    bottomRight: [24 + rightInset, 24],
  };

  return (
    <div
      className="citypulse-map relative h-full w-full"
      role="region"
      aria-label="Interactive map of simulated civic signals across Jaipur"
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

        <FocusController focus={focus} signals={signals} rightInset={rightInset} />
        <CloseOnEscape />
      </MapContainer>

      {/* Soft edge vignette so the map sits inside the dark UI. Below markers/popups. */}
      <div className="cp-map-vignette pointer-events-none absolute inset-0 z-[450]" aria-hidden="true" />
    </div>
  );
}
