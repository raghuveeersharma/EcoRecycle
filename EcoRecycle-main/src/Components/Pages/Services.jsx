import React, { useContext, useEffect, useState } from "react";
import { FaRecycle, FaMapMarkerAlt, FaUpload } from "react-icons/fa";
import UploadGuidelines from "../UploadGuidelines";
import { LoginStatee } from "../../Context/LoginState";
import Login from "./Login";
import ObjectDetection from "../ObjectDetection";

const Services = () => {
  const { LoginState } = useContext(LoginStatee);
  return !LoginState ? (
    <div className=" flex flex-col items-center justify-center min-h-screen bg-gray-50 overflow-x-hidden">
      <h1 className="text-2xl pt-7 sm:w-2xl w-72 text-center">
        For using this service you need to login.
      </h1>
      <Login />
    </div>
  ) : (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <section className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-[#1D4C6C] mb-4 flex items-center justify-center gap-2">
          <FaRecycle /> Our Services
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Upload an image of the material, and we'll check if it's recyclable
          and guide you to the nearest recycling center.
        </p>

        <div>
          <ObjectDetection />
        </div>
      </section>
      <div className="mt-6">
        <UploadGuidelines />
      </div>
    </div>
  );
};

export default Services;
