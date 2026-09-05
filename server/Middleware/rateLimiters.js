import rateLimit from "express-rate-limit";
import env from "../Config/env.js";

const message = (text) => ({ success: false, message: text });

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many requests, please try again later"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_AUTH_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many attempts, please try again in 15 minutes"),
});

export const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_LOCATION_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Slow down — too many location lookups"),
});
