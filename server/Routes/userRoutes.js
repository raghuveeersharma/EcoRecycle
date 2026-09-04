import express from "express";
import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
} from "../Controllers/userControllers.js";
import { protect } from "../Middleware/auth.js";
import { authLimiter } from "../Middleware/rateLimiters.js";

const userRouter = express.Router();

userRouter.post("/register", authLimiter, register);
userRouter.post("/login", authLimiter, login);
userRouter.post("/forgot-password", authLimiter, forgotPassword);
userRouter.post("/reset-password", authLimiter, resetPassword);
userRouter.get("/me", protect, me);

export default userRouter;
