import axios from "axios";
import env from "../Config/env.js";
import ApiError from "../Utils/ApiError.js";
import logger from "../Utils/logger.js";
import asyncHandler from "../Middleware/asyncHandler.js";

const UPSTREAM_URL =
  "https://maps.gomaps.pro/maps/api/place/nearbysearch/json";
const DEFAULT_RADIUS = 5000;
const MAX_RADIUS = 25000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

// Identical searches are common (users click the button repeatedly), and the
// upstream API is metered, so results are cached briefly per rounded location.
const cache = new Map();

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const cacheSet = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
};

const parseCoordinate = (raw, name, limit) => {
  if (raw === undefined || raw === null || raw === "") {
    throw ApiError.badRequest(`${name} is required`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || Math.abs(value) > limit) {
    throw ApiError.badRequest(`${name} must be a number between -${limit} and ${limit}`);
  }
  return value;
};

export const locationDetection = asyncHandler(async (req, res) => {
  if (!env.GOMAPS_PRO_API_KEY) {
    throw new ApiError(503, "Location lookup is not configured on the server");
  }

  const lat = parseCoordinate(req.query.lat, "Latitude", 90);
  const lon = parseCoordinate(req.query.lon, "Longitude", 180);
  const radius = Math.min(
    Math.max(Number(req.query.radius) || DEFAULT_RADIUS, 500),
    MAX_RADIUS
  );

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${radius}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    logger.debug(`Location cache hit for ${cacheKey}`);
    return res.json({ success: true, data: cached, cached: true });
  }

  logger.info(`Nearby search lat=${lat} lon=${lon} radius=${radius}`);

  let response;
  try {
    response = await axios.get(UPSTREAM_URL, {
      timeout: REQUEST_TIMEOUT_MS,
      params: {
        location: `${lat},${lon}`,
        keyword: "recycling",
        radius,
        key: env.GOMAPS_PRO_API_KEY,
      },
    });
  } catch (err) {
    // Never log err.config.url — it carries the API key.
    logger.error(
      `Upstream nearby search failed: ${err.code || err.response?.status || err.message}`
    );
    throw new ApiError(502, "Could not reach the recycling centre directory");
  }

  const places = Array.isArray(response.data?.results) ? response.data.results : [];

  const centres = places
    .filter((place) => place?.name && place?.geometry?.location)
    .map((place) => ({
      id: place.place_id || `${place.name}-${place.geometry.location.lat}`,
      name: place.name,
      vicinity: place.vicinity || place.formatted_address || "",
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating ?? null,
    }));

  cacheSet(cacheKey, centres);
  res.json({ success: true, data: centres, cached: false });
});
