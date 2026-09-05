import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ScrollToTop from "./Components/ScrollToTop";
import ErrorBoundary from "./Components/ErrorBoundary";
import ProtectedRoute from "./Components/ProtectedRoute";
import Spinner from "./Components/Spinner";

import Home from "./Components/Pages/Home";
import About from "./Components/Pages/About";
import Contact from "./Components/Pages/Contact";
import Login from "./Components/Pages/Login";
import Signup from "./Components/Pages/Signup";
import OTP from "./Components/Pages/OTP";
import NotFound from "./Components/Pages/NotFound";

// Transformers.js is several megabytes of JavaScript before any model weights
// are fetched; keeping the Services page lazy stops every visitor from
// downloading it.
const Services = lazy(() => import("./Components/Pages/Services"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spinner label="Loading…" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/otp" element={<OTP />} />

            <Route
              element={
                <ProtectedRoute message="Please sign in to use the recycling scanner." />
              }
            >
              <Route path="/services" element={<Services />} />
            </Route>

            {/* The detector used to be reachable here, bypassing the login gate. */}
            <Route path="/object" element={<Navigate to="/services" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
