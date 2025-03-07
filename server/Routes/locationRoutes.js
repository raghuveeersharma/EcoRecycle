import { locationDetection } from "../Controllers/locationController.js";
import express from "express";
const routerL = express.Router();
routerL.get("/location", locationDetection);
export default routerL;
