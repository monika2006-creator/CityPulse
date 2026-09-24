import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import SignalPopup from "./SignalPopup.jsx";
import { SEVERITY_MARKER, SEVERITY_RANK } from "../data/mapConfig.js";

const SIZE = 30;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Compact circular badge with a severity glyph (● / ◆ / ⚠).
// `offset` is a pixel nudge used only to fan out signals that share almost the
// same coordinates; the marker stays anchored to its real latitude/longitude.
function buildIcon(signal, severityKey, [dx, dy]) {
  const marker = SEVERITY_MARKER[severityKey];
  const html = `
    <span class="cp-marker cp-marker--${severityKey}" style="--cp-color:${marker.color}">
      ${severityKey === "critical" ? '<span class="cp-marker__pulse"></span>' : ""}
      <span class="cp-marker__body">
        <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false">${marker.glyph}</svg>
      </span>
      <span class="cp-sr-only">${escapeHtml(marker.label)}: ${escapeHtml(signal.title)}, ${escapeHtml(signal.area)}</span>
    </span>`;

  return L.divIcon({
    className: "cp-marker-icon",
    html,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2 - dx, SIZE / 2 - dy],
    popupAnchor: [dx, dy - SIZE / 2 - 2],
  });
}

export default function SignalMarker({
  signal,
  offset,
  isSelected,
  onSelect,
  onDeselect,
  popupPadding,
}) {
  const markerRef = useRef(null);
  const severityKey = SEVERITY_MARKER[signal.severity] ? signal.severity : "normal";
  const [dx, dy] = offset;

  // Icon identity must stay stable between renders, otherwise Leaflet swaps the
  // DOM node and keyboard focus is lost.
  const icon = useMemo(
    () => buildIcon(signal, severityKey, [dx, dy]),
    [signal.title, signal.area, severityKey, dx, dy]
  );

  // Selected state: cyan ring via CSS class, and open the popup when the
  // selection came from somewhere else (e.g. the LIVE SIGNALS panel).
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.getElement()?.classList.toggle("is-selected", isSelected);
    if (isSelected && !marker.isPopupOpen()) marker.openPopup();
  }, [isSelected, icon]);

  return (
    <Marker
      ref={markerRef}
      position={[signal.latitude, signal.longitude]}
      icon={icon}
      zIndexOffset={SEVERITY_RANK[severityKey] * 100 + (isSelected ? 1000 : 0)}
      eventHandlers={{
        click: () => onSelect(signal.id),
        popupclose: () => onDeselect(signal.id),
      }}
    >
      <Popup
        className="cp-popup"
        minWidth={264}
        maxWidth={264}
        autoPanPaddingTopLeft={popupPadding.topLeft}
        autoPanPaddingBottomRight={popupPadding.bottomRight}
      >
        <SignalPopup signal={signal} />
      </Popup>
    </Marker>
  );
}
