import { FaRecycle } from "react-icons/fa";
import UploadGuidelines from "../UploadGuidelines";
import ObjectDetection from "../ObjectDetection";

// Route access is handled by <ProtectedRoute>, so this page can assume
// the visitor is signed in.
const Services = () => (
  <div className="flex min-h-screen flex-col items-center bg-gray-100 p-6">
    <section className="w-full max-w-2xl rounded-xl bg-white p-8 text-center shadow-lg">
      <h1 className="mb-4 flex items-center justify-center gap-2 text-4xl font-bold text-[#1D4C6C]">
        <FaRecycle aria-hidden="true" /> Our Services
      </h1>
      <p className="mb-6 text-lg text-gray-600">
        Upload an image of the material, and we&apos;ll check if it&apos;s
        recyclable and guide you to the nearest recycling center.
      </p>

      <ObjectDetection />
    </section>

    <div className="mt-6">
      <UploadGuidelines />
    </div>
  </div>
);

export default Services;
