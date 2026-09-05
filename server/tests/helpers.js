/**
 * Test harness: an in-memory MongoDB plus the real Express app on an ephemeral
 * port, driven over real HTTP so middleware, routing and the error handler are
 * all exercised the way they are in production.
 *
 * Environment must be set before anything imports Config/env.js, which reads
 * process.env once at module load — hence the dynamic imports below.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * @param {Record<string,string>} [overrides] extra env for this file's app,
 *   e.g. a low RATE_LIMIT_AUTH_MAX to exercise the limiter.
 */
export const startTestServer = async (overrides = {}) => {
  const mongo = await MongoMemoryServer.create();

  Object.assign(process.env, {
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-do-not-use-in-production",
    MONGODB_URI: mongo.getUri("ecorecycle_test"),
    // 4 rounds keeps bcrypt honest but fast; production default is 12.
    BCRYPT_ROUNDS: "4",
    LOG_LEVEL: "silent",
    // Generous by default so ordinary tests are not throttled.
    RATE_LIMIT_GLOBAL_MAX: "10000",
    RATE_LIMIT_AUTH_MAX: "10000",
    RATE_LIMIT_LOCATION_MAX: "10000",
    OTP_TTL_MINUTES: "10",
    ...overrides,
  });

  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(process.env.MONGODB_URI);

  const { default: app } = await import("../app.js");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  /** Issues a request and returns { status, body }. */
  const request = async (method, path, { body, token, headers = {} } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined
        ? { body: typeof body === "string" ? body : JSON.stringify(body) }
        : {}),
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed, headers: res.headers };
  };

  const stop = async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongo.stop();
  };

  return { baseUrl, request, stop, mongoose };
};

/** Wipes all collections between tests so each one starts from a clean slate. */
export const clearDatabase = async (mongoose) => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
};

export const VALID_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

/** Registers VALID_USER (or an override) and returns { token, user }. */
export const registerUser = async (request, overrides = {}) => {
  const { status, body } = await request("POST", "/api/auth/register", {
    body: { ...VALID_USER, ...overrides },
  });
  if (status !== 201) {
    throw new Error(`registerUser failed: ${status} ${JSON.stringify(body)}`);
  }
  return body.data;
};
