import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { analyseImage } from "../lib/detection";
import { prepareImage } from "../lib/imagePrep";
import { materialInfo } from "../lib/materials";
import { VlmClient, createProgressTracker } from "../lib/vlmClient";
import MapComponent from "./MapComponent";
import Spinner from "./Spinner";

export default function ObjectDetection() {
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [streamedText, setStreamedText] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // idle → the model has not been asked for yet; it only downloads once the
  // visitor has actually chosen an image, because it is a far bigger download
  // than the old COCO-SSD weights and most visitors never run a detection.
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error
  const [loadProgress, setLoadProgress] = useState(null);
  const [device, setDevice] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [centres, setCentres] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const clientRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrlRef = useRef(null);

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      const track = createProgressTracker();
      clientRef.current = new VlmClient({
        onProgress: (event) => {
          const percent = track(event);
          if (percent !== null) setLoadProgress(percent);
        },
        onNotice: (message) => console.warn("Detector:", message),
      });
    }
    return clientRef.current;
  }, []);

  const loadModel = useCallback(async () => {
    setModelStatus("loading");
    setLoadProgress(null);
    try {
      const backend = await getClient().load();
      setDevice(backend);
      setModelStatus("ready");
    } catch (err) {
      console.error("Failed to load the detection model:", err);
      setModelStatus("error");
    }
  }, [getClient]);

  // The worker holds the model weights in memory; leaving the page must free
  // them, and object URLs are never reclaimed automatically.
  useEffect(
    () => () => {
      clientRef.current?.dispose();
      clientRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const resetResults = () => {
    setResult(null);
    setStreamedText("");
    setShowTranscript(false);
    setDetectError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    fileRef.current = file;
    setImageUrl(url);
    resetResults();

    // Choosing an image is the first sign the visitor actually wants this, so
    // start the download now rather than making them wait after pressing
    // Detect.
    if (modelStatus === "idle" || modelStatus === "error") loadModel();
  };

  const handleRemoveImage = () => {
    clientRef.current?.interrupt();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    fileRef.current = null;
    setImageUrl(null);
    resetResults();
  };

  const detectObjects = async () => {
    if (!fileRef.current || isDetecting) return;

    setIsDetecting(true);
    resetResults();
    try {
      await getClient().load();
      const image = await prepareImage(fileRef.current);

      const analysis = await analyseImage((prompt, maxNewTokens) => {
        setStreamedText("");
        return getClient().generate(prompt, image, maxNewTokens, (chunk) =>
          setStreamedText((current) => current + chunk)
        );
      });

      setResult(analysis);
    } catch (err) {
      console.error("Detection failed:", err);
      setDetectError(
        "The analysis could not be completed. Try again, or use a different photo."
      );
    } finally {
      setStreamedText("");
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

  const material = result?.material ? materialInfo(result.material) : null;

  const detectLabel = () => {
    if (isDetecting) return "Analysing…";
    if (modelStatus === "loading") {
      return loadProgress === null
        ? "Loading model…"
        : `Loading model… ${loadProgress}%`;
    }
    return "Identify this item";
  };

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
        <p className="mt-2 text-xs text-gray-500">
          The photo is analysed on your own device — it is never uploaded.
        </p>
      </div>

      {imageUrl && (
        <div className="relative mx-auto mt-2 inline-block">
          <img
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
          <p>
            The on-device model could not be loaded. It needs a modern browser
            and a working connection for the first download.
          </p>
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
          disabled={!imageUrl || isDetecting || modelStatus === "loading"}
          className="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {detectLabel()}
        </button>
      )}

      {modelStatus === "loading" && (
        <div className="text-sm text-gray-500">
          <p>
            The model is downloading to your device — this happens once, then
            it is cached by the browser.
          </p>
          {loadProgress !== null && (
            <div
              role="progressbar"
              aria-valuenow={loadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Model download progress"
              className="mx-auto mt-2 h-2 w-full max-w-sm overflow-hidden rounded bg-gray-200"
            >
              <div
                className="h-full bg-blue-500 transition-[width] duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {isDetecting && (
        <div className="text-sm text-gray-600">
          <Spinner label="Looking at your photo…" />
          {device === "wasm" && (
            <p className="mt-1">
              This device has no WebGPU support, so analysis runs on the CPU and
              will take longer.
            </p>
          )}
          {streamedText && (
            <p className="mt-2 font-mono text-xs break-words text-gray-500">
              {streamedText}
            </p>
          )}
        </div>
      )}

      {detectError && (
        <p role="alert" className="text-sm text-red-600">
          {detectError}
        </p>
      )}

      {result?.status === "identified" && (
        <div className="text-left">
          <h2 className="text-lg font-semibold">
            Looks like: {result.item ?? "an item we could not name"}
          </h2>

          {material ? (
            <div
              className={`mt-2 rounded p-3 ${
                material.recyclable
                  ? "bg-green-50 text-green-900"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              <p className="font-semibold">
                {material.recyclable ? "♻️ Likely recyclable" : "⚠️ Check before binning"}{" "}
                — {material.label}
              </p>
              <p className="mt-1 text-sm">{material.guidance}</p>
              {result.certainty === "inferred" && (
                <p className="mt-2 text-xs">
                  The model named the object but not its material — this was
                  matched from the object&apos;s name, so it is a weaker guess.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 rounded bg-amber-50 p-3 text-sm text-amber-900">
              The model recognised the object but not what it is made of. Try a
              closer photo, or check the item for a recycling symbol.
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            This is a small model running on your device — a suggestion, not a
            verdict. Recycling rules also vary by area; your local council&apos;s
            list is the authority.
          </p>
        </div>
      )}

      {result?.status === "unparseable" && (
        <p role="alert" className="text-left text-amber-700">
          The model&apos;s answer could not be read as an identification. Try a
          clearer, closer photo of a single item.
        </p>
      )}

      {result && (
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowTranscript((shown) => !shown)}
            aria-expanded={showTranscript}
            className="text-sm text-blue-700 underline"
          >
            {showTranscript ? "Hide" : "Show"} what the model actually said
          </button>
          {showTranscript && (
            <div className="mt-2 space-y-2 rounded bg-gray-50 p-3 text-xs">
              {result.transcript.map((turn) => (
                <div key={turn.prompt}>
                  <p className="whitespace-pre-line text-gray-500">{turn.prompt}</p>
                  <p className="mt-1 font-mono break-words text-gray-800">
                    {turn.response || "(empty response)"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
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
