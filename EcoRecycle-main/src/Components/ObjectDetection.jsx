import { useState, useEffect, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import axios from "axios";
import MapComponent from "./MapComponent";

export default function ObjectDetection() {
  const [image, setImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [recycleCenters, setRecycleCenters] = useState([]);
  const [recyclableObjects, setRecyclableObjects] = useState([]);
  const [userLocation, setUserLocation] = useState([22.7179, 75.8333]);

  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);

  const handleRemoveImage = () => {
    setImage(null);
    setDetectedObjects([]);
    setRecyclableObjects([]);
  };

  // ✅ Define a list of recyclable objects
  const RECYCLABLE_MATERIALS = {
    plastic: [
      "bottle",
      "jug",
      "container",
      "plastic",
      "bag",
      "packaging",
      "takeout",
    ],
    paper: [
      "paper",
      "newspaper",
      "magazine",
      "cardboard",
      "envelope",
      "book",
      "carton",
      "box",
    ],
    glass: ["glass", "bottle", "jar"],
    metals: ["can", "aluminum", "tin", "foil", "lid"],
  };

  const modelRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      modelRef.current = await cocoSsd.load();
      console.log("✅ Model Loaded");
    };
    loadModel();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const detectObjects = async () => {
    if (!imageRef.current || !modelRef.current) return;

    setLoading(true); // Show loading state

    const predictions = await modelRef.current.detect(imageRef.current);

    setDetectedObjects(predictions.map((p) => p.class));

    const recyclableItems = predictions
      .map((p) => p.class)
      .filter((item) =>
        Object.values(RECYCLABLE_MATERIALS).some((category) =>
          category.some((keyword) => item.toLowerCase().includes(keyword))
        )
      );

    setRecyclableObjects(recyclableItems);

    console.log("Detected Objects:", predictions);
    console.log("Recyclable Objects:", recyclableItems);

    setLoading(false); // Hide loading state
  };
  useEffect(() => {
    fetch("/api/recycling-centers") // Ensure this API call is correct
      .then((res) => res.json())
      .then((data) => {
        console.log("Raw API response:", data);

        if (Array.isArray(data) && data.length > 0) {
          // Map and filter valid locations with correct lat/lng extraction
          const validLocations = data
            .filter(
              (loc) =>
                loc.geometry?.location?.lat && loc.geometry?.location?.lng
            )
            .map((loc) => ({
              lat: loc.geometry.location.lat,
              lon: loc.geometry.location.lng, // Convert "lng" to "lon" to match your code
              name: loc.name || "Recycling Center",
            }));

          if (validLocations.length === 0) {
            console.warn("No valid recycling centers found.");
          }

          setRecycleCenters(validLocations);
        } else {
          console.warn("No recycling centers data received.");
        }
      })
      .catch((error) => console.error("Error fetching locations:", error));
  }, []);

  // const getLocation = () => {
  //   navigator.geolocation.getCurrentPosition(
  //     async (position) => {
  //       const { latitude, longitude } = position.coords;

  //       console.log("📍 User Location:", latitude, longitude); // Debugging

  //       try {
  //         const response = await axios.get("http://localhost:5000/location", {
  //           params: { lat: latitude, lon: longitude },
  //         });

  //         console.log("✅ Recycling Centers:", response.data); // Debugging
  //         setUserLocation([latitude, longitude]);
  //         response.data?.length > 0 && setRecycleCenters(response.data);
  //         // setRecycleCenters(response.data);
  //       } catch (error) {
  //         console.error(
  //           "❌ Error fetching recycling centers:",
  //           error.response?.data || error.message
  //         );
  //       }
  //     },
  //     (error) => console.error("❌ Geolocation Error:", error.message)
  //   );
  // };

  const getLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          console.log("Fetching recycling centers...");
          const response = await axios.get(
            `http://localhost:5000/location?lat=${latitude}&lon=${longitude}`
          );

          console.log("API Response:", response.data);

          // Ensure response contains valid locations
          if (Array.isArray(response.data) && response.data.length > 0) {
            const filteredData = response.data.filter(
              (place) => place.lat && place.lon
            );

            if (filteredData.length === 0) {
              console.warn("No valid recycling centers found.");
              return;
            }

            setRecycleCenters(filteredData);
          } else {
            console.warn("No recycling centers found.");
          }
        } catch (error) {
          console.error(
            "Error fetching recycling centers:",
            error.response?.data || error.message
          );
        }
      },
      (error) => console.error("Geolocation Error:", error.message)
    );
  };

  return (
    <div className="container mx-auto flex flex-col p-5 overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">♻️ Recycle Object Detector</h1>

      <div className="border-2 border-gray-300 rounded p-2 w-60 mx-auto">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {image && (
        <div className="relative mx-auto inline-block mt-4 lg:w-80 w-40">
          <img
            ref={imageRef}
            src={image}
            alt="Uploaded"
            className="lg:w-80 w-56 border rounded "
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
          >
            ❌
          </button>
        </div>
      )}

      <button
        onClick={detectObjects}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2 "
      >
        {loading ? "Detecting..." : "Detect Objects"}
      </button>

      {detectedObjects.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Detected Objects:</h2>
          <ul>
            {detectedObjects.map((obj, index) => (
              <li key={index}>✅ {obj}</li>
            ))}
          </ul>
        </div>
      )}

      {recyclableObjects.length > 0 ? (
        <div className="mt-4 text-green-600">
          <h2 className="text-lg font-semibold">♻️ Recyclable Objects:</h2>
          <ul>
            {recyclableObjects.map((obj, index) => (
              <li key={index}>✅ {obj} is recyclable</li>
            ))}
          </ul>
        </div>
      ) : (
        detectedObjects.length > 0 && (
          <p className="text-red-600 mt-4">
            ❌ No recyclable objects detected.
          </p>
        )
      )}

      <button
        onClick={getLocation}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
      >
        Find Nearest Recycling Center
      </button>

      {recyclableObjects.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Nearest Recycling Centers:</h2>
          <ul>
            {recycleCenters?.map((center, index) => (
              <li key={index}>
                ♻️ {center.name} - {center.vicinity}
              </li>
            ))}
          </ul>
          <MapComponent
            latitude={userLocation[0]}
            longitude={userLocation[1]}
            locations={recycleCenters}
          />
        </div>
      )}
    </div>
  );
}
