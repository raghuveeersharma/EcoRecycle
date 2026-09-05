/**
 * Rate limiters are module-level singletons configured at import time, so this
 * file runs its own app with deliberately tiny limits. node:test gives each
 * test file its own process, which keeps those limits out of the other suites.
 */
import test, { before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, VALID_USER } from "./helpers.js";

let request;
let stop;

before(async () => {
  ({ request, stop } = await startTestServer({
    RATE_LIMIT_AUTH_MAX: "3",
    RATE_LIMIT_GLOBAL_MAX: "10000",
  }));
});

after(async () => {
  await stop();
});

describe("auth rate limiting (S2.2)", () => {
  test("blocks credential stuffing after the configured number of failures", async () => {
    const attempt = () =>
      request("POST", "/api/auth/login", {
        body: { email: VALID_USER.email, password: "wrong-password-here" },
      });

    // The limiter is configured with skipSuccessfulRequests, so only failures
    // count — exactly the behaviour that matters for credential stuffing.
    const first = await attempt();
    const second = await attempt();
    const third = await attempt();
    assert.equal(first.status, 401);
    assert.equal(second.status, 401);
    assert.equal(third.status, 401);

    const blocked = await attempt();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.success, false);
    assert.match(blocked.body.message, /too many attempts/i);
  });

  test("advertises the limit with standard RateLimit headers", async () => {
    const { headers } = await request("POST", "/api/auth/login", {
      body: { email: "someone@example.com", password: "wrong-password-here" },
    });

    assert.ok(
      headers.get("ratelimit-limit") || headers.get("ratelimit"),
      "expected standard RateLimit headers"
    );
    // legacyHeaders: false means the X- variants must be gone.
    assert.equal(headers.get("x-ratelimit-limit"), null);
  });

  test("the unmetered health check is unaffected", async () => {
    for (let i = 0; i < 6; i += 1) {
      const { status } = await request("GET", "/health");
      assert.equal(status, 200);
    }
  });
});
