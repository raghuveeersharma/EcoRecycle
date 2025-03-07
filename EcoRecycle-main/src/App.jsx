// App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Components/Navbar";
import "./App.css"; // If needed
import Home from "./Components/Pages/Home";
import About from "./Components/Pages/About";
import Services from "./Components/Pages/Services";
import Contact from "./Components/Pages/Contact";
import Login from "./Components/Pages/Login";
import Footer from "./Components/Footer";
import Signup from "./Components/Pages/Signup";
import OTP from "./Components/Pages/OTP";
import ObjectDetection from "./Components/ObjectDetection";

// Pages (for demonstration)

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/object" element={<ObjectDetection />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
