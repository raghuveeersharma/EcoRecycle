import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, clearDatabase, VALID_USER } from "./helpers.js";

let request;
let stop;
let mongoose;

before(async () => {
  ({ request, stop, mongoose } = await startTestServer());
});

after(async () => {
  await stop();
});

beforeEach(async () => {
  await clearDatabase(mongoose);
});

describe("GET /health (S3.3)", () => {
  test("reports uptime and database state", async () => {
    const { status, body } = await request("GET", "/health");

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.database, "connected");
    assert.equal(typeof body.uptime, "number");
  });
});

describe("error contract (S2.6, S6.3)", () => {
  test("an unknown route returns a 404 in the standard envelope", async () => {
    const { status, body } = await request("GET", "/api/does-not-exist");

    assert.equal(status, 404);
    assert.equal(body.success, false);
    assert.match(body.message, /not found/i);
  });

  test("every failure carries success:false and a human-readable message", async () => {
    const responses = await Promise.all([
      request("GET", "/api/nope"),
      request("GET", "/api/auth/me"),
      request("POST", "/api/auth/login", { body: {} }),
    ]);

    for (const { body } of responses) {
      assert.equal(body.success, false);
      assert.equal(typeof body.message, "string");
      assert.ok(body.message.length > 0);
    }
  });

  test("never leaks a stack trace outside development", async () => {
    const { body } = await request("GET", "/api/auth/me");
    assert.equal(body.stack, undefined);
  });

  test("malformed JSON is a 400, not a 500", async () => {
    const { status } = await request("POST", "/api/auth/login", {
      body: "{not valid json",
      headers: { "Content-Type": "application/json" },
    });
    assert.ok(status >= 400 && status < 500, `expected a 4xx, got ${status}`);
  });
});

describe("request body limits (S2.5)", () => {
  test("rejects a body over 10kb with 413", async () => {
    const { status } = await request("POST", "/api/auth/register", {
      body: { ...VALID_USER, name: "a".repeat(20000) },
    });
    assert.equal(status, 413);
  });
});

describe("security headers (S2.1)", () => {
  test("helmet is applied", async () => {
    const { headers } = await request("GET", "/health");

    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.ok(headers.get("x-frame-options") || headers.get("content-security-policy"));
    // Helmet removes this fingerprinting header.
    assert.equal(headers.get("x-powered-by"), null);
  });
});

describe("CORS (S2.3, S2.4)", () => {
  test("allows a configured origin", async () => {
    const { headers } = await request("GET", "/health", {
      headers: { Origin: "http://localhost:5173" },
    });
    assert.equal(
      headers.get("access-control-allow-origin"),
      "http://localhost:5173"
    );
  });

  test("denies an unknown origin without a 500 (S2.4)", async () => {
    const { status, headers } = await request("GET", "/health", {
      headers: { Origin: "https://evil.example.com" },
    });

    // The request still completes; the browser is simply not given permission.
    assert.equal(status, 200);
    assert.equal(headers.get("access-control-allow-origin"), null);
  });
});

describe("POST /api/contact (S8.4)", () => {
  const VALID_MESSAGE = {
    name: "Jo Bloggs",
    email: "jo@example.com",
    message: "I would like to know where to recycle batteries near me.",
  };

  test("accepts a valid submission", async () => {
    const { status, body } = await request("POST", "/api/contact", {
      body: VALID_MESSAGE,
    });

    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.match(body.message, /received/i);
  });

  test("requires name, email and message", async () => {
    const { status, body } = await request("POST", "/api/contact", { body: {} });

    assert.equal(status, 400);
    assert.deepEqual(Object.keys(body.errors).sort(), ["email", "message", "name"]);
  });

  test("rejects a bad email and a too-short message", async () => {
    const { status, body } = await request("POST", "/api/contact", {
      body: { name: "Jo Bloggs", email: "nope", message: "hi" },
    });

    assert.equal(status, 400);
    assert.match(body.errors.email, /valid email/i);
    assert.match(body.errors.message, /at least 10/);
  });

  test("rejects an over-long message", async () => {
    const { status, body } = await request("POST", "/api/contact", {
      body: { ...VALID_MESSAGE, message: "a".repeat(2500) },
    });

    assert.equal(status, 400);
    assert.match(body.errors.message, /at most 2000/);
  });

  test("does not require authentication", async () => {
    const { status } = await request("POST", "/api/contact", { body: VALID_MESSAGE });
    assert.equal(status, 201);
  });
});
