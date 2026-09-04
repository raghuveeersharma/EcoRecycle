import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage, getFieldErrors } from "../../lib/api";
import { useAuth } from "../../Context/authContext";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 outline-none focus:border-[#1D916E] focus:ring-2 focus:ring-[#1D916E]";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/services";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Explains *why* the user landed on the login page (e.g. from /services).
  useEffect(() => {
    if (location.state?.message) toast(location.state.message);
  }, [location.state?.message]);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!formData.email.trim()) next.email = "Email is required";
    if (!formData.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      toast.success("Signed in successfully");
      setFormData({ email: "", password: "" });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err) || {});
      toast.error(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendOTP = async () => {
    const email = formData.email.trim();
    if (!email) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter your email first so we know where to send the code",
      }));
      return;
    }

    setIsSendingOtp(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("If that email is registered, a reset code is on its way");
      navigate("/otp", { state: { email } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send the reset code"));
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <section className="px-5 py-12 text-center text-[#1D4C6C]">
        <h1 className="mb-6 text-4xl font-bold">Login</h1>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto w-80 rounded-lg bg-[#1D4C6C] p-8 shadow-2xl lg:w-md"
        >
          <div className="mb-6 text-left">
            <label htmlFor="email" className="mb-2 block text-lg text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 text-sm text-red-300">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-6 text-left">
            <label htmlFor="password" className="mb-2 block text-lg text-white">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={inputClass}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1 text-sm text-red-300">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-blue-600 px-4 text-lg text-white transition-colors duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting ? "Signing in…" : "Login"}
            </button>

            <div className="w-full text-center">
              <Link
                to="/signup"
                className="flex h-10 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-lg text-white transition-colors duration-300 hover:bg-green-700"
              >
                Signup
              </Link>
              <p className="mt-2 text-xs text-gray-300">
                Don&apos;t have an account?
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 pt-6 text-white">
            <p>Forgot password?</p>
            <button
              type="button"
              onClick={sendOTP}
              disabled={isSendingOtp}
              className="rounded-lg bg-gray-900 px-3 py-1 text-base text-white transition-colors duration-300 hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {isSendingOtp ? "Sending…" : "Send code"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Login;
