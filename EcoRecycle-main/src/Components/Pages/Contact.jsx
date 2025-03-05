import React, { useState } from "react";
import { FaEnvelope, FaUser, FaPaperPlane } from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", message: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setFormData({ name: "", message: "" }); // Clear form after submission
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <section className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl text-center border border-gray-300">
        <h1 className="text-4xl font-bold text-[#1D4C6C] flex items-center justify-center gap-2 mb-5">
          <FaEnvelope /> Contact Us
        </h1>
        <p className="text-gray-600 mb-6">
          Have questions or feedback? Feel free to reach out to us by filling
          out the form below.
        </p>

        {isSubmitted && (
          <p className="text-lg text-green-600 mb-5">
            Your message has been sent successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-lg font-semibold text-gray-700 mb-1"
            >
              Name
            </label>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner">
              <FaUser className="text-gray-500 mr-3" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-lg font-semibold text-gray-700 mb-1"
            >
              Message
            </label>
            <div className="bg-gray-100 p-3 rounded-lg shadow-inner">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Enter your message"
                className="w-full bg-transparent outline-none resize-none"
                rows="5"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1D4C6C] text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-[#163A53] transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <FaPaperPlane /> Send Message
          </button>
        </form>
      </section>
    </div>
  );
};

export default Contact;
