import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getErrorMessage, getFieldErrors } from "../../lib/api";
import { useAuth } from "../../Context/authContext";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 outline-none focus:border-[#1D916E] focus:ring-2 focus:ring-[#1D916E]";

const Signup = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate("/services", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      await registerUser({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      reset();
      toast.success("Account created — welcome to EcoRecycle!");
      navigate("/services", { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field, { type: "server", message })
        );
      }
      toast.error(getErrorMessage(err, "Could not create your account"));
    }
  };

  const fieldError = (name) =>
    errors[name] && (
      <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-red-300">
        {errors[name].message}
      </p>
    );

  return (
    <div className="flex min-h-screen flex-col items-center overflow-x-hidden pt-16">
      <h1 className="mb-6 text-4xl font-bold text-[#1D4C6C]">
        Create an Account
      </h1>
      <p className="mb-4 max-w-md text-center text-gray-600">
        Sign up to access exclusive recycling insights and contribute towards a
        greener planet!
      </p>

      <div className="w-80 rounded-lg bg-[#1D4C6C] py-6 shadow-2xl lg:w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mx-auto p-8 text-gray-100"
        >
          <div className="mb-4">
            <label htmlFor="name" className="block text-lg text-gray-100">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
                maxLength: { value: 60, message: "Name must be at most 60 characters" },
              })}
            />
            {fieldError("name")}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-lg text-gray-100">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {fieldError("email")}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-lg text-gray-100">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClass}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                maxLength: {
                  value: 72,
                  message: "Password must be at most 72 characters",
                },
              })}
            />
            {fieldError("password")}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-md bg-green-600 px-4 text-white hover:bg-green-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isSubmitting ? "Creating account…" : "Sign Up"}
            </button>
            <div className="text-center">
              <Link
                to="/login"
                className="flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-white transition-colors duration-300 hover:bg-blue-700"
              >
                Login
              </Link>
              <p className="mt-2 text-xs text-gray-300">
                Already have an account?
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
