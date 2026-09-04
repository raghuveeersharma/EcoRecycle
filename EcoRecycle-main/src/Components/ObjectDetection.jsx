import { useCallback, useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import api, { getErrorMessage } from "../lib/api";
import MapComponent from "./MapComponent";
import Spinner from "./Spinner";

// Hoisted so it is not rebuilt on every render.
const RECYCLABLE_MATERIALS = {
  plastic: ["bottle", "jug", "container", "plastic", "bag", "packaging", "takeout"],
  paper: ["paper", "newspaper", "magazine", "cardboard", "envelope", "book", "carton", "box"],
  glass: ["glass", "jar", "wine glass", "cup"],
  metal: ["can", "aluminum", "tin", "foil", "lid"],
};

// COCO-SSD happily reports low-confidence guesses; below this they are noise.
const MIN_CONFIDENCE = 0.5;

const categoriseItem = (label) => {
  const lower = label.toLowerCase();
  for (const [category, keywords] of Object.entries(RECYCLABLE_MATERIALS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return null;
};

export default function ObjectDetection() {
  const [imageUrl, setImageUrl] = useState(null);
  const [detections, setDetections] = useState([]);
  const [hasDetected, setHasDetected] = useState(false);

  const [modelStatus, setModelStatus] = useState("loading"); // loading | ready | error
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [centres, setCentres] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const imageRef = useRef(null);
  const modelRef = useRef(null);
  const objectUrlRef = useRef(null);

  const loadModel = useCallback(async () => {
    setModelStatus("loading");
    try {
      await tf.ready();
      modelRef.current = await cocoSsd.load();
      setModelStatus("ready");
    } catch (err) {
      console.error("Failed to load the detection model:", err);
      setModelStatus("error");
    }
  }, []);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  // Object URLs are never reclaimed automatically, so revoke the last one.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const resetResults = () => {
    setDetections([]);
    setHasDetected(false);
    setDetectError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
    resetResults();
  };

  const handleRemoveImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageUrl(null);
    resetResults();
  };

  const detectObjects = async () => {
    if (!imageRef.current || !modelRef.current || isDetecting) return;

    setIsDetecting(true);
    setDetectError(null);
    try {
      const predictions = await modelRef.current.detect(imageRef.current);
      const confident = predictions
        .filter((p) => p.score >= MIN_CONFIDENCE)
        .map((p) => ({
          label: p.class,
          score: p.score,
          category: categoriseItem(p.class),
        }));

      // De-duplicate: the model often reports the same class several times.
      const unique = [
        ...new Map(confident.map((item) => [item.label, item])).values(),
      ];
      setDetections(unique);
      setHasDetected(true);
    } catch (err) {
      console.error("Detection failed:", err);
      setDetectError("Detection failed. Try a different image.");
    } finally {
      setIsDetecting(false);
    }
  };

  const findCentres = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location lookup.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setUserLocation([latitude, longitude]);

        try {
          const { data } = await api.get("/location", {
            params: { lat: latitude, lon: longitude },
          });
          setCentres(
            data.data.map((centre) => ({
              id: centre.id,
              name: centre.name,
              vicinity: centre.vicinity,
              location: [centre.location.lat, centre.location.lng],
            }))
          );
        } catch (err) {
          setCentres([]);
          setLocationError(
            getErrorMessage(err, "Could not load nearby recycling centres")
          );
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Enable it to find nearby centres."
            : "Could not determine your location. Please try again."
        );
      },
      { timeout: 10000 }
    );
  };

  const recyclable = detections.filter((item) => item.category);

  return (
    <div className="container mx-auto flex flex-col gap-4 overflow-x-hidden p-5">
      <h1 className="text-2xl font-bold">♻️ Recycle Object Detector</h1>

      <div className="mx-auto w-full max-w-sm rounded border-2 border-gray-300 p-3 text-left">
        <label htmlFor="image-upload" className="mb-2 block text-sm font-semibold">
          Upload a photo of the item
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full text-sm"
        />
      </div>

      {imageUrl && (
        <div className="relative mx-auto mt-2 inline-block">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="The item you uploaded, awaiting analysis"
            className="w-56 rounded border lg:w-80"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-white text-sm shadow-md ring-1 ring-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {modelStatus === "error" ? (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">
          <p>The detection model could not be loaded.</p>
          <button
            type="button"
            onClick={loadModel}
            className="mt-2 rounded bg-red-600 px-3 py-1 text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={detectObjects}
          disabled={modelStatus !== "ready" || !imageUrl || isDetecting}
          className="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {modelStatus === "loading"
            ? "Loading model…"
            : isDetecting
              ? "Detecting…"
              : "Detect Objects"}
        </button>
      )}

      {modelStatus === "loading" && (
        <p className="text-sm text-gray-500">
          The detection model is downloading — this happens once per visit.
        </p>
      )}
      {detectError && (
        <p role="alert" className="text-sm text-red-600">
          {detectError}
        </p>
      )}

      {detections.length > 0 && (
        <div className="text-left">
          <h2 className="text-lg font-semibold">Detected objects</h2>
          <ul>
            {detections.map((item) => (
              <li key={item.label}>
                ✅ {item.label}{" "}
                <span className="text-sm text-gray-500">
                  ({Math.round(item.score * 100)}% confidence)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recyclable.length > 0 ? (
        <div className="text-left text-green-700">
          <h2 className="text-lg font-semibold">♻️ Recyclable objects</h2>
          <ul>
            {recyclable.map((item) => (
              <li key={item.label}>
                ✅ {item.label} — recyclable as {item.category}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        hasDetected && (
          <p className="text-red-600">
            {detections.length === 0
              ? "❌ Nothing recognisable was found. Try a clearer, closer photo."
              : "❌ No recyclable objects detected in this image."}
          </p>
        )
      )}

      <button
        type="button"
        onClick={findCentres}
        disabled={isLocating}
        className="mt-2 rounded bg-green-600 px-4 py-2 text-white transition-colors duration-300 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLocating ? "Locating…" : "Find Nearest Recycling Center"}
      </button>

      {isLocating && <Spinner label="Finding centres near you…" />}
      {locationError && (
        <p role="alert" className="text-sm text-red-600">
          {locationError}
        </p>
      )}

      {centres !== null && !isLocating && (
        <div className="mt-2 text-left">
          <h2 className="mb-2 text-lg font-semibold">Nearest recycling centres</h2>
          {centres.length === 0 ? (
            <p className="text-gray-600">
              No recycling centres were found within 5&nbsp;km of you.
            </p>
          ) : (
            <ul className="mb-4">
              {centres.map((centre) => (
                <li key={centre.id}>
                  ♻️ {centre.name}
                  {centre.vicinity ? ` — ${centre.vicinity}` : ""}
                </li>
              ))}
            </ul>
          )}
          <MapComponent locations={centres} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}
