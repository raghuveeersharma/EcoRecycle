import React from "react";
import { FaInfoCircle, FaImage, FaCheckCircle } from "react-icons/fa";

const UploadGuidelines = () => {
  return (
    <div className="bg-green-100 p-6 rounded-xl shadow-lg w-full max-w-2xl text-center border border-gray-300">
      <h2 className="text-2xl font-bold text-[#1D4C6C] flex items-center justify-center gap-2 mb-4">
        <FaInfoCircle /> Image Upload Guidelines
      </h2>
      <p className="text-gray-600 mb-4">
        To ensure accurate identification, please follow these guidelines when
        uploading an image:
      </p>

      <ul className="text-left space-y-3">
        <li className="flex items-center gap-2 text-gray-700">
          <FaCheckCircle className="text-green-600" /> Ensure the image is clear
          and well-lit.
        </li>
        <li className="flex items-center gap-2 text-gray-700">
          <FaCheckCircle className="text-green-600" /> The product should be
          fully visible and not cropped.
        </li>
        <li className="flex items-center gap-2 text-gray-700">
          <FaCheckCircle className="text-green-600" /> Avoid blurry or
          low-resolution images.
        </li>
        <li className="flex items-center gap-2 text-gray-700">
          <FaCheckCircle className="text-green-600" /> Place the material
          against a neutral background if possible.
        </li>
        <li className="flex items-center gap-2 text-gray-700">
          <FaCheckCircle className="text-green-600" /> Do not include multiple
          products in a single image.
        </li>
      </ul>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Example:</h3>
        <div className="flex items-center justify-center">
          <img
            src="https://5.imimg.com/data5/ANDROID/Default/2023/10/352266357/ZG/LO/IK/68921569/product-jpeg.jpg"
            alt=""
            className="size-64 rounded-lg shadow-md border border-gray-300"
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Upload a clear image of a single recyclable material.
        </p>
      </div>
    </div>
  );
};

export default UploadGuidelines;
