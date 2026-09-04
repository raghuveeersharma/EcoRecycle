import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import env from "../Config/env.js";
import User from "../Models/userModel.js";
import ApiError from "../Utils/ApiError.js";
import { validateBody } from "../Utils/validators.js";
import { sendMail } from "../Utils/mailer.js";
import logger from "../Utils/logger.js";
import asyncHandler from "../Middleware/asyncHandler.js";
import { signToken } from "../Middleware/auth.js";

// 72 bytes is bcrypt's input limit; anything longer is silently truncated.
const PASSWORD_RULE = { required: true, min: 8, max: 72, label: "Password" };

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = validateBody(req.body, {
    name: { required: true, min: 2, max: 60, label: "Name" },
    email: { required: true, type: "email", label: "Email" },
    password: PASSWORD_RULE,
  });

  const existing = await User.findOne({ email }).select("_id");
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password });
  logger.info(`User registered: ${user.id}`);

  res.status(201).json({
    success: true,
    message: "Account created",
    data: { token: signToken(user), user: user.toPublicJSON() },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = validateBody(req.body, {
    email: { required: true, type: "email", label: "Email" },
    password: { required: true, label: "Password" },
  });

  const user = await User.findOne({ email }).select("+password");
  // Same message for both branches so the endpoint cannot enumerate accounts.
  const invalid = ApiError.unauthorized("Invalid email or password");
  if (!user) throw invalid;

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw invalid;

  logger.info(`User logged in: ${user.id}`);
  res.json({
    success: true,
    message: "Signed in",
    data: { token: signToken(user), user: user.toPublicJSON() },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = validateBody(req.body, {
    email: { required: true, type: "email", label: "Email" },
  });

  const user = await User.findOne({ email });

  // Always answer the same way, so the endpoint cannot be used to test emails.
  const response = {
    success: true,
    message: "If that email is registered, a reset code is on its way",
  };

  if (!user) return res.json(response);

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  user.resetOtpHash = await bcrypt.hash(otp, env.BCRYPT_ROUNDS);
  user.resetOtpExpiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: "Your EcoRecycle password reset code",
    text:
      `Your password reset code is ${otp}.\n` +
      `It expires in ${env.OTP_TTL_MINUTES} minutes.\n` +
      "If you did not request this, you can ignore this email.",
  });

  res.json(response);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = validateBody(req.body, {
    email: { required: true, type: "email", label: "Email" },
    otp: { required: true, min: 6, max: 6, label: "Reset code" },
    password: PASSWORD_RULE,
  });

  const user = await User.findOne({ email }).select(
    "+resetOtpHash +resetOtpExpiresAt"
  );

  const invalid = ApiError.badRequest("That reset code is invalid or has expired");
  if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) throw invalid;
  if (user.resetOtpExpiresAt.getTime() < Date.now()) throw invalid;

  const isMatch = await bcrypt.compare(otp, user.resetOtpHash);
  if (!isMatch) throw invalid;

  user.password = password;
  user.resetOtpHash = undefined;
  user.resetOtpExpiresAt = undefined;
  await user.save();

  logger.info(`Password reset for user ${user.id}`);
  res.json({
    success: true,
    message: "Password updated",
    data: { token: signToken(user), user: user.toPublicJSON() },
  });
});
