import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function MapRefresher({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map((loc) => loc.location);
      map.fitBounds(bounds);
    }
  }, [locations, map]);

  return null;
}

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent({ userLocation, locations = [] }) {
  // Default center (Indore, India)
  const defaultLat = 22.7196;
  const defaultLon = 75.8577;

  const isValidLatLon = (lat, lon) =>
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon);

  // Use user's location if valid, otherwise default
  const [latitude, longitude] = isValidLatLon(...userLocation)
    ? userLocation
    : [defaultLat, defaultLon];

  return (
    <div
      style={{ height: "500px", width: "100%", border: "2px solid #1D4C6C" }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <MapRefresher locations={locations} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User's Location Marker */}
        {isValidLatLon(latitude, longitude) && (
          <Marker position={[latitude, longitude]} icon={customIcon}>
            <Popup>📍 Your Location</Popup>
          </Marker>
        )}

        {/* Recycling Centers Markers */}
        {locations?.length > 0 &&
          locations
            .filter((loc) =>
              isValidLatLon(loc.location?.[0], loc.location?.[1])
            )
            .map((loc, index) => (
              <Marker
                key={index}
                position={[loc.location[0], loc.location[1]]}
                icon={customIcon}
              >
                <Popup>{loc.name || "Recycling Center"}</Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
