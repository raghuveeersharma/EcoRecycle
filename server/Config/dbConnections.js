import mongoose from "mongoose";
import env from "./env.js";
import logger from "../Utils/logger.js";

const MAX_ATTEMPTS = 5;

/** Connects to MongoDB, retrying with backoff so a transient blip is survivable. */
const connection = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const con = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      logger.info(`Database connected to ${con.connection.host}`);
      return con;
    } catch (err) {
      logger.error(
        `MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`
      );
      if (attempt === MAX_ATTEMPTS) {
        logger.error("Giving up on MongoDB connection");
        process.exit(1);
      }
      const waitMs = Math.min(1000 * 2 ** (attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
};

export const disconnect = () => mongoose.connection.close(false);

export default connection;
