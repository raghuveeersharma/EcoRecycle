import express from "express";
import { locationDetection } from "../Controllers/locationController.js";
import { protect } from "../Middleware/auth.js";
import { locationLimiter } from "../Middleware/rateLimiters.js";

const locationRouter = express.Router();

locationRouter.get("/", protect, locationLimiter, locationDetection);

export default locationRouter;
