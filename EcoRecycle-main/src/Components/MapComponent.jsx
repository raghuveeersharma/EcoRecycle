import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent({ point, locations }) {
  // Fallback center location (Indore, India) if latitude & longitude are undefined
  const defaultLat = 22.7196;
  const defaultLng = 75.8577;

  const isValidLatLng = (lat, lng) =>
    lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);

  const userLat = point?.lat ?? defaultLat;
  const userLng = point?.lng ?? defaultLng;

  return (
    <div style={{ height: "500px", width: "100%" }}>
      {/* Render only if valid coordinates exist */}
      {isValidLatLng(userLat, userLng) ? (
        <MapContainer
          center={[userLat, userLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* User's Location Marker */}
          <Marker position={[userLat, userLng]} icon={customIcon}>
            <Popup>📍 Your Location</Popup>
          </Marker>

          {/* Recycling Centers Markers */}
          {locations
            .filter((loc) => isValidLatLng(loc.lat, loc.lng)) // Filter out invalid locations
            .map((location, index) => (
              <Marker
                key={index}
                position={[location.lat, location.lng]}
                icon={customIcon}
              >
                <Popup>{location.name || "Recycling Center"}</Popup>
              </Marker>
            ))}
        </MapContainer>
      ) : (
        <p>Loading map or invalid location data...</p>
      )}
    </div>
  );
}
