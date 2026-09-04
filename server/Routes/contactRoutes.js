import express from "express";
import { submitContact } from "../Controllers/contactController.js";
import { authLimiter } from "../Middleware/rateLimiters.js";

const contactRouter = express.Router();

contactRouter.post("/", authLimiter, submitContact);

export default contactRouter;
