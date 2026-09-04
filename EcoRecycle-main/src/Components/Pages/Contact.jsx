import { useState } from "react";
import { FaEnvelope, FaUser, FaPaperPlane } from "react-icons/fa";
import toast from "react-hot-toast";
import api, { getErrorMessage, getFieldErrors } from "../../lib/api";

const EMPTY = { name: "", email: "", message: "" };

const Contact = () => {
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setIsSubmitted(false);
  };

  const validate = () => {
    const next = {};
    if (formData.name.trim().length < 2) next.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (formData.message.trim().length < 10) {
      next.message = "Please write at least 10 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/contact", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setFormData(EMPTY);
      setIsSubmitted(true);
      toast.success("Message sent — we'll be in touch");
    } catch (err) {
      setErrors(getFieldErrors(err) || {});
      toast.error(getErrorMessage(err, "Could not send your message"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorFor = (name) =>
    errors[name] && (
      <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-red-600">
        {errors[name]}
      </p>
    );

  const a11y = (name) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-2xl rounded-xl border border-gray-300 bg-white p-8 text-center shadow-lg">
        <h1 className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-[#1D4C6C]">
          <FaEnvelope /> Contact Us
        </h1>
        <p className="mb-6 text-gray-600">
          Have questions or feedback? Feel free to reach out to us by filling
          out the form below.
        </p>

        {isSubmitted && (
          <p role="status" className="mb-5 text-lg text-green-600">
            Your message has been sent successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="text-left">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-lg font-semibold text-gray-700"
            >
              Name
            </label>
            <div className="flex items-center rounded-lg bg-gray-100 p-3 shadow-inner">
              <FaUser className="mr-3 text-gray-500" aria-hidden="true" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Enter your name"
                className="w-full bg-transparent text-gray-900 outline-none"
                {...a11y("name")}
              />
            </div>
            {errorFor("name")}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-lg font-semibold text-gray-700"
            >
              Email
            </label>
            <div className="flex items-center rounded-lg bg-gray-100 p-3 shadow-inner">
              <FaEnvelope className="mr-3 text-gray-500" aria-hidden="true" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-transparent text-gray-900 outline-none"
                {...a11y("email")}
              />
            </div>
            {errorFor("email")}
          </div>

          <div className="mb-4">
            <label
              htmlFor="message"
              className="mb-1 block text-lg font-semibold text-gray-700"
            >
              Message
            </label>
            <div className="rounded-lg bg-gray-100 p-3 shadow-inner">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your message"
                className="w-full resize-none bg-transparent text-gray-900 outline-none"
                rows="5"
                {...a11y("message")}
              />
            </div>
            {errorFor("message")}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4C6C] px-6 py-3 text-lg font-semibold text-white transition-colors duration-300 hover:bg-[#163A53] disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <FaPaperPlane aria-hidden="true" />
            {isSubmitting ? "Sending…" : "Send Message"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Contact;
