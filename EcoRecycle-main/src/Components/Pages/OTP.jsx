import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage, getFieldErrors } from "../../lib/api";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 outline-none focus:border-[#1D916E] focus:ring-2 focus:ring-[#1D916E]";

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    // Pre-filled when arriving from the login page's "forgot password" flow.
    email: location.state?.email || "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!/^\d{6}$/.test(form.otp.trim())) next.otp = "Enter the 6-digit code";
    if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email: form.email.trim(),
        otp: form.otp.trim(),
        password: form.password,
      });
      toast.success("Password updated — please sign in");
      navigate("/login", { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err) || {});
      toast.error(getErrorMessage(err, "Could not reset your password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (!form.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    setIsResending(true);
    try {
      await api.post("/auth/forgot-password", { email: form.email.trim() });
      toast.success("A new code is on its way");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not resend the code"));
    } finally {
      setIsResending(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="mb-5 text-left">
      <label htmlFor={name} className="mb-2 block text-lg text-white">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={inputClass}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-red-300">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <section className="px-5 py-12 text-center text-[#1D4C6C]">
        <h1 className="mb-2 text-4xl font-bold">Reset your password</h1>
        <p className="mx-auto mb-6 max-w-md text-gray-600">
          Enter the 6-digit code we emailed you along with your new password.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto w-80 rounded-lg bg-[#1D4C6C] p-8 shadow-2xl lg:w-md"
        >
          {field("email", "Email", {
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          })}
          {field("otp", "Reset code", {
            type: "text",
            inputMode: "numeric",
            maxLength: 6,
            autoComplete: "one-time-code",
            placeholder: "123456",
          })}
          {field("password", "New password", {
            type: "password",
            autoComplete: "new-password",
            placeholder: "At least 8 characters",
          })}
          {field("confirmPassword", "Confirm new password", {
            type: "password",
            autoComplete: "new-password",
            placeholder: "Re-enter your password",
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full rounded-lg bg-blue-600 px-4 text-lg text-white transition-colors duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Updating…" : "Reset password"}
          </button>

          <button
            type="button"
            onClick={resend}
            disabled={isResending}
            className="mt-4 text-sm text-gray-300 underline transition-colors hover:text-white disabled:cursor-not-allowed"
          >
            {isResending ? "Sending…" : "Resend the code"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default OTP;
