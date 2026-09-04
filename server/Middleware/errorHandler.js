import env from "../Config/env.js";
import logger from "../Utils/logger.js";
import ApiError from "../Utils/ApiError.js";

export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let details = err.details;

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || { field: 1 })[0];
    message =
      field === "email"
        ? "An account with this email already exists"
        : `Duplicate value for ${field}`;
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Please check the highlighted fields";
    details = Object.fromEntries(
      Object.entries(err.errors).map(([key, e]) => [key, e.message])
    );
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired, please sign in again";
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
};
