import dotenv from "dotenv";

dotenv.config();

const required = ["JWT_SECRET"];

// MongoDB_URI is the legacy (mixed-case) name used by the original deploy.
const MONGODB_URI = process.env.MONGODB_URI || process.env.MongoDB_URI;

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  RATE_LIMIT_GLOBAL_MAX: Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 300,
  RATE_LIMIT_AUTH_MAX: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  RATE_LIMIT_LOCATION_MAX: Number(process.env.RATE_LIMIT_LOCATION_MAX) || 20,
  GOMAPS_PRO_API_KEY: process.env.GOMAPS_PRO_API_KEY,
  CORS_ORIGINS: (
    process.env.CORS_ORIGINS ||
    "http://localhost:5173,https://eco-recycle-rho.vercel.app"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES) || 10,
  SMTP: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "EcoRecycle <no-reply@ecorecycle.app>",
  },
  CONTACT_TO: process.env.CONTACT_TO || process.env.SMTP_USER,
};

export const assertEnv = () => {
  const missing = required.filter((key) => !env[key]);
  if (!MONGODB_URI) missing.push("MONGODB_URI");
  if (missing.length) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}.\n` +
        "See server/.env.example for the full list."
    );
    process.exit(1);
  }
};

export default env;
