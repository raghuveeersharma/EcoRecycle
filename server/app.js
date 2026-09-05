import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import env from "./Config/env.js";
import logger from "./Utils/logger.js";
import requestLogger from "./Middleware/requestLogger.js";
import { globalLimiter } from "./Middleware/rateLimiters.js";
import { notFound, errorHandler } from "./Middleware/errorHandler.js";
import userRouter from "./Routes/userRoutes.js";
import locationRouter from "./Routes/locationRoutes.js";
import contactRouter from "./Routes/contactRoutes.js";

const app = express();

// Render terminates TLS at its proxy; without this, rate limiting sees one IP.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No origin: same-origin requests, curl, health checks.
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`Blocked CORS origin: ${origin}`);
      // Deny without throwing, so the browser sees a clean CORS failure
      // rather than a 500 from an unhandled error.
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(requestLogger);
app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    uptime: Math.round(process.uptime()),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: env.NODE_ENV,
  });
});

app.use("/api/auth", userRouter);
app.use("/api/location", locationRouter);
app.use("/api/contact", contactRouter);

// Legacy mounts kept so already-deployed clients keep working during rollout.
app.use("/user", userRouter);
app.use("/location", locationRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
