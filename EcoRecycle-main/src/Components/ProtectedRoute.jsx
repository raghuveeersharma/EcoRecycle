import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../Context/authContext";
import Spinner from "./Spinner";

/**
 * Gates a route behind authentication. Redirects to /login while remembering
 * where the user was heading, so they land there after signing in.
 */
const ProtectedRoute = ({ message }) => {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: message || "Please sign in to use this service.",
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
