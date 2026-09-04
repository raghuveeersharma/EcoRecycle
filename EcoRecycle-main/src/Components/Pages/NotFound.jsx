import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
    <p className="text-6xl font-bold text-[#1D916E]">404</p>
    <h1 className="text-3xl font-bold text-[#1D4C6C]">Page not found</h1>
    <p className="max-w-md text-gray-600">
      The page you were looking for does not exist or has moved.
    </p>
    <Link
      to="/"
      className="rounded-lg bg-[#1D4C6C] px-6 py-3 text-white transition-colors duration-300 hover:bg-[#163A53]"
    >
      Back to home
    </Link>
  </div>
);

export default NotFound;
