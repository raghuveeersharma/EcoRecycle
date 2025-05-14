import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
const Signup = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(
        `https://ecorecycle-ll8y.onrender.com/user/register`,
        data
      );
      console.log(res.data);
      reset();
      toast.success("User registered successfully!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen  items-center flex flex-col pt-16 overflow-x-hidden">
      <Toaster />
      <h1 className="text-4xl font-bold text-[#1D4C6C] mb-6">
        Create an Account
      </h1>
      <p className="text-gray-600 text-center mb-4 max-w-md">
        Sign up to access exclusive recycling insights and contribute towards a
        greener planet!
      </p>
      <div className=" bg-[#1D4C6C] rounded-lg shadow-2xl w-80 lg:w-md py-12 overflow-hidden ">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="text-gray-100  mx-auto bg-[#1D4C6C] p-8 rounded-lg"
        >
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-lg text-gray-100">
              Full Name
            </label>
            <Controller
              name="name"
              control={control}
              defaultValue=""
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="name"
                  className="mt-1 block w-full px-4 py-2 outline-none"
                  placeholder="john doe"
                />
              )}
            />
            <hr className="h=[1px] lg:w-96 w-60 text-white" />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-lg text-gray-100">
              Email
            </label>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  id="email"
                  className="mt-1 block w-full px-4 py-2 outline-none"
                  placeholder="n8N5o@example.com"
                />
              )}
            />
            <hr className="h=[1px] lg:w-96 w-60 text-white" />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-lg  text-gray-100">
              Password
            </label>
            <Controller
              name="password"
              control={control}
              defaultValue=""
              rules={{
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Password must be at most 20 characters",
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="password"
                  id="password"
                  className="mt-1 block w-full px-4 py-2 shadow-sm outline-none"
                  placeholder="********"
                />
              )}
            />
            <hr className="h=[1px] lg:w-96 w-60 text-white" />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-4 justify-between h-16 mt-10">
            <button
              type="submit"
              className="w-full h-10 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign Up
            </button>
            <div className="text-center">
              <button
                type=""
                className="w-full h-10 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Link to="/login">Login</Link>
              </button>
              <p className="text-xs text-gray-300 mt-2">
                already have an account?
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
