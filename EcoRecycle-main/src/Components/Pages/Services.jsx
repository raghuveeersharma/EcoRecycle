import React, { useState } from "react";
import { FaRecycle, FaMapMarkerAlt, FaUpload } from "react-icons/fa";
import UploadGuidelines from "../UploadGuidelines";

const Services = () => {
  const [image, setImage] = useState(null);
  const [recyclable, setRecyclable] = useState(null);
  const [store, setStore] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    checkRecyclableMaterial(file);
  };

  // Mock function to check if material is recyclable
  const checkRecyclableMaterial = (file) => {
    if (file.type === "image/jpeg" || file.type === "image/png") {
      setRecyclable(true);
      fetchNearestStore();
    } else {
      setRecyclable(false);
      setStore(null);
    }
  };

  // Mock function to fetch nearest recycling store
  const fetchNearestStore = () => {
    setStore("Recycling Center #123, Main Street, City");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <section className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-[#1D4C6C] mb-4 flex items-center justify-center gap-2">
          <FaRecycle /> Our Services
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Upload an image of the material, and we'll check if it's recyclable
          and guide you to the nearest recycling center.
        </p>

        <div className="mb-6 flex flex-col items-center">
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex items-center gap-2 bg-[#1D4C6C] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#163A53]"
          >
            <FaUpload /> Upload Material Image
          </label>
          <input
            type="file"
            id="image-upload"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {image && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Uploaded Image</h3>
            <img
              src={image}
              alt="Material"
              className="w-64 h-64 mt-2 rounded-lg shadow-md border border-gray-300"
            />
          </div>
        )}

        {recyclable !== null && (
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Recyclable Status:</h3>
            <p
              className={`text-lg font-medium ${
                recyclable ? "text-green-600" : "text-red-600"
              }`}
            >
              {recyclable
                ? "This material is recyclable!"
                : "This material is not recyclable."}
            </p>
          </div>
        )}

        {store && recyclable && (
          <div className="bg-[#1D4C6C] p-4 rounded-lg text-white text-lg mt-5 flex items-center gap-2">
            <FaMapMarkerAlt className="text-2xl" />
            <div>
              <h3 className="text-xl font-semibold">
                Nearest Recycling Store:
              </h3>
              <p>{store}</p>
            </div>
          </div>
        )}
      </section>
      <div className="mt-6">
        <UploadGuidelines />
      </div>
    </div>
  );
};

export default Services;
