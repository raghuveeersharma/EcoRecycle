import express from "express";
const router = express.Router();
import { Signup,Login } from "../Controllers/userControllers.js";
router.post("/register", Signup);
router.post("/login", Login);
export default router;