import React from "react";
import { useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";

const OTP = () => {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const verifyOTP = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
        newPassword,
      });
      //   toast.success("Password reset successfully!");
    } catch (error) {
      toast.error("Invalid OTP or expired");
    }
  };

  return <div>OTP</div>;
};

export default OTP;
