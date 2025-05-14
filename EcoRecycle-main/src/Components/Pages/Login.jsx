import React, { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { LoginStatee } from "../../Context/LoginState";

const Login = () => {
  const { setLoginState } = useContext(LoginStatee);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.email && formData.password) {
      try {
        const res = await axios.post(
          `https://bookstoreweb-1.onrender.com/user/login`,
          formData
        );
        toast.success("User logged in successfully!");
        setLoginState(true);
        setFormData({ name: "", email: "", password: "" });
      } catch (err) {
        console.log(err);
        toast.error(
          "Invalid credentials! Please check your email and password."
        );
      }
    }
  };

  const sendOTP = async () => {
    try {
      <NavLink to="/otp" />;
      await axios.post(`https://bookstoreweb-1.onrender.com/user/sendOTP`, {
        email,
      });
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error("Failed to send OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Toaster />
      <section className="py-12 px-5 bg-gray-50 text-[#1D4C6C] text-center ">
        <h1 className="text-4xl font-bold mb-6">Login</h1>
        <form
          onSubmit={handleSubmit}
          className="lg:w-md mx-auto w-80 bg-[#1D4C6C] p-8 rounded-lg shadow-2xl"
        >
          <div className="mb-6 text-left">
            <label htmlFor="email" className="block text-lg mb-2 text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg text-gray-100 outline-none "
            />
            <hr className="h=[1px] lg:w-96 w-60 text-white" />
          </div>

          <div className="mb-6 text-left">
            <label htmlFor="password" className="block text-lg mb-2 text-white">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg text-gray-100 outline-none "
            />
            <hr className="h=[1px] lg:w-96 w-60 text-white" />
          </div>

          <div className="flex flex-col justify-between items-center gap-4 h-16 text-center">
            <button
              type="submit"
              className="w-full h-10 bg-blue-600 text-white py-2 px-4 rounded-lg text-lg  hover:bg-blue-700 transition-colors duration-300"
            >
              Login
            </button>
            <div className="text-center w-full">
              <button
                type="submit"
                className="w-full h-10 bg-green-600 text-white py-2 px-4 rounded-lg text-lg   hover:bg-green-700 transition-colors duration-300"
              >
                <Link to="/signup">Signup</Link>
              </button>
              <p className="text-xs text-gray-300 mt-2">
                Don't have an account?
              </p>
            </div>
          </div>
          <div className="text-white text-center pt-10 mt-8 flex justify-center gap-3 items-center">
            <p>forget password</p>
            <button
              type="button"
              onClick={() => sendOTP()}
              className="bg-gray-900 hover:bg-black transition-colors duration-300 text-white py-1 px-1 rounded-lg text-base "
            >
              click
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Login;
