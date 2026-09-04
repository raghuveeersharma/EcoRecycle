import jwt from "jsonwebtoken";
import env from "../Config/env.js";
import User from "../Models/userModel.js";
import ApiError from "../Utils/ApiError.js";
import asyncHandler from "./asyncHandler.js";

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) throw ApiError.unauthorized("Please sign in to continue");

  const payload = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Account no longer exists");

  req.user = user;
  next();
});
