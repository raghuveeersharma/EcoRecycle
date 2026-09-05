import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Default centre: Indore, India — used when no user position is available.
const DEFAULT_CENTER = [22.7196, 75.8577];
const SINGLE_POINT_ZOOM = 14;

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const isValidLatLon = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lon) <= 180;

/** Keeps the viewport framed around the user and every centre. */
function MapFramer({ points }) {
  const map = useMap();
  // `points` is a fresh array on every render, so depending on it directly
  // would re-frame the map each time the parent re-renders — fighting the user
  // whenever they pan or zoom. Re-frame only when the coordinates change.
  const key = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], SINGLE_POINT_ZOOM);
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      padding: [40, 40],
      maxZoom: SINGLE_POINT_ZOOM,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
}

/** Lets the visitor correct a bad geolocation fix by clicking the map. */
function ClickToSetLocation({ onSelect }) {
  const map = useMapEvents({
    click: (event) => onSelect([event.latlng.lat, event.latlng.lng]),
  });

  useEffect(() => {
    const container = map.getContainer();
    const previous = container.style.cursor;
    container.style.cursor = "crosshair";
    return () => {
      container.style.cursor = previous;
    };
  }, [map]);

  return null;
}

export default function MapComponent({
  userLocation = null,
  locations = [],
  onSelectLocation = null,
  userLocationLabel = "📍 Your location",
}) {
  const hasUserLocation =
    Array.isArray(userLocation) && isValidLatLon(userLocation[0], userLocation[1]);

  const center = hasUserLocation ? userLocation : DEFAULT_CENTER;

  const validCentres = locations.filter((loc) =>
    isValidLatLon(loc.location?.[0], loc.location?.[1])
  );

  // The user's own marker must be inside the bounds, or it scrolls off-screen.
  const points = useMemo(
    () => [
      ...(hasUserLocation ? [userLocation] : []),
      ...validCentres.map((loc) => loc.location),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasUserLocation, userLocation?.join(","), validCentres.map((loc) => loc.location.join(",")).join("|")]
  );

  return (
    <div className="h-72 w-full border-2 border-[#1D4C6C] sm:h-96 lg:h-[500px]">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <MapFramer points={points} />
        {onSelectLocation && <ClickToSetLocation onSelect={onSelectLocation} />}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {hasUserLocation && (
          <Marker position={userLocation} icon={customIcon}>
            <Popup>{userLocationLabel}</Popup>
          </Marker>
        )}

        {validCentres.map((loc) => (
          <Marker
            key={loc.id || `${loc.name}-${loc.location.join(",")}`}
            position={loc.location}
            icon={customIcon}
          >
            <Popup>
              <strong>{loc.name || "Recycling centre"}</strong>
              {loc.vicinity && (
                <>
                  <br />
                  {loc.vicinity}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
