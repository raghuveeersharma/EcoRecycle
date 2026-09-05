import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, clearDatabase, registerUser, VALID_USER } from "./helpers.js";

let request;
let stop;
let mongoose;

/**
 * Reset codes are only ever delivered by mail, and with no SMTP configured the
 * mailer writes the body to the log instead. Capturing that is the only way to
 * observe the code without weakening the design (it is stored bcrypt-hashed).
 */
const logLines = [];
const realLog = console.log;

before(async () => {
  console.log = (...args) => logLines.push(args.join(" "));
  ({ request, stop, mongoose } = await startTestServer({ LOG_LEVEL: "info" }));
});

after(async () => {
  console.log = realLog;
  await stop();
});

beforeEach(async () => {
  logLines.length = 0;
  await clearDatabase(mongoose);
});

const lastOtp = () => {
  const line = logLines.filter((l) => /reset code is \d{6}/.test(l)).pop();
  assert.ok(line, "expected a reset code to be delivered");
  return line.match(/reset code is (\d{6})/)[1];
};

describe("POST /api/auth/register", () => {
  test("creates an account and returns a token", async () => {
    const { status, body } = await request("POST", "/api/auth/register", {
      body: VALID_USER,
    });

    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.equal(body.data.user.email, "test@example.com");
    assert.equal(body.data.user.name, "Test User");
  });

  test("never returns the password hash", async () => {
    const { body } = await request("POST", "/api/auth/register", { body: VALID_USER });
    assert.equal(body.data.user.password, undefined);
    assert.ok(!JSON.stringify(body).toLowerCase().includes("password123"));
  });

  test("normalises the email to lowercase (S4.2)", async () => {
    const { body } = await request("POST", "/api/auth/register", {
      body: { ...VALID_USER, email: "MiXeD@Example.COM" },
    });
    assert.equal(body.data.user.email, "mixed@example.com");
  });

  test("rejects a duplicate email with 409, case-insensitively (S4.1, S5.5)", async () => {
    await registerUser(request);
    const { status, body } = await request("POST", "/api/auth/register", {
      body: { ...VALID_USER, name: "Someone Else", email: "TEST@EXAMPLE.COM" },
    });

    assert.equal(status, 409);
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  test("reports every invalid field at once (S6.1, S6.2, S6.6)", async () => {
    const { status, body } = await request("POST", "/api/auth/register", {
      body: { name: "A", email: "not-an-email", password: "short" },
    });

    assert.equal(status, 400);
    assert.deepEqual(Object.keys(body.errors).sort(), ["email", "name", "password"]);
    assert.match(body.errors.password, /at least 8/);
  });

  test("rejects a missing body rather than throwing (S6.5)", async () => {
    const { status, body } = await request("POST", "/api/auth/register", { body: {} });
    assert.equal(status, 400);
    assert.equal(body.success, false);
    assert.ok(body.errors.email);
  });

  test("ignores unknown fields instead of mass-assigning them (S6.4)", async () => {
    await request("POST", "/api/auth/register", {
      body: { ...VALID_USER, role: "admin", isAdmin: true },
    });

    const stored = await mongoose.connection
      .collection("users")
      .findOne({ email: VALID_USER.email });
    assert.equal(stored.role, undefined);
    assert.equal(stored.isAdmin, undefined);
  });

  test("stores the password hashed, not in plaintext (S4.6)", async () => {
    await registerUser(request);
    const stored = await mongoose.connection
      .collection("users")
      .findOne({ email: VALID_USER.email });

    assert.notEqual(stored.password, VALID_USER.password);
    assert.match(stored.password, /^\$2[aby]\$/);
    assert.ok(stored.createdAt instanceof Date, "timestamps are recorded (S4.3)");
  });
});

describe("POST /api/auth/login", () => {
  test("signs in with correct credentials", async () => {
    await registerUser(request);
    const { status, body } = await request("POST", "/api/auth/login", {
      body: { email: VALID_USER.email, password: VALID_USER.password },
    });

    assert.equal(status, 200);
    assert.ok(body.data.token);
    assert.equal(body.data.user.email, VALID_USER.email);
  });

  test("accepts a differently-cased email", async () => {
    await registerUser(request);
    const { status } = await request("POST", "/api/auth/login", {
      body: { email: "TEST@Example.com", password: VALID_USER.password },
    });
    assert.equal(status, 200);
  });

  test("returns 401 with an identical message for both failure modes (S5.4)", async () => {
    await registerUser(request);

    const wrongPassword = await request("POST", "/api/auth/login", {
      body: { email: VALID_USER.email, password: "totally-wrong-password" },
    });
    const noSuchUser = await request("POST", "/api/auth/login", {
      body: { email: "nobody@example.com", password: VALID_USER.password },
    });

    assert.equal(wrongPassword.status, 401);
    assert.equal(noSuchUser.status, 401);
    // Identical wording is what stops the endpoint enumerating accounts.
    assert.equal(wrongPassword.body.message, noSuchUser.body.message);
  });
});

describe("GET /api/auth/me", () => {
  test("returns the signed-in user (S5.7)", async () => {
    const { token } = await registerUser(request);
    const { status, body } = await request("GET", "/api/auth/me", { token });

    assert.equal(status, 200);
    assert.equal(body.data.user.email, VALID_USER.email);
    assert.equal(body.data.user.password, undefined);
  });

  test("rejects a missing, malformed or forged token with 401 (S5.2)", async () => {
    const { token } = await registerUser(request);

    for (const attempt of [
      { label: "no header", opts: {} },
      { label: "not a bearer token", opts: { headers: { Authorization: token } } },
      { label: "garbage token", opts: { token: "not.a.jwt" } },
      { label: "wrong signature", opts: { token: `${token}tampered` } },
    ]) {
      const { status, body } = await request("GET", "/api/auth/me", attempt.opts);
      assert.equal(status, 401, `${attempt.label} should be 401`);
      assert.equal(body.success, false);
    }
  });

  test("rejects a valid token whose account has been deleted", async () => {
    const { token } = await registerUser(request);
    await mongoose.connection.collection("users").deleteMany({});

    const { status } = await request("GET", "/api/auth/me", { token });
    assert.equal(status, 401);
  });
});

describe("password reset (S5.8, S8.1, S8.2)", () => {
  test("completes the full forgot -> reset -> login cycle", async () => {
    await registerUser(request);

    const forgot = await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    assert.equal(forgot.status, 200);

    const reset = await request("POST", "/api/auth/reset-password", {
      body: {
        email: VALID_USER.email,
        otp: lastOtp(),
        password: "brand-new-password",
      },
    });
    assert.equal(reset.status, 200);
    assert.ok(reset.body.data.token, "a session is issued on reset");

    const withNew = await request("POST", "/api/auth/login", {
      body: { email: VALID_USER.email, password: "brand-new-password" },
    });
    assert.equal(withNew.status, 200);

    const withOld = await request("POST", "/api/auth/login", {
      body: { email: VALID_USER.email, password: VALID_USER.password },
    });
    assert.equal(withOld.status, 401, "the old password must stop working");
  });

  test("a reset code cannot be replayed", async () => {
    await registerUser(request);
    await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    const otp = lastOtp();

    const first = await request("POST", "/api/auth/reset-password", {
      body: { email: VALID_USER.email, otp, password: "first-new-password" },
    });
    assert.equal(first.status, 200);

    const replay = await request("POST", "/api/auth/reset-password", {
      body: { email: VALID_USER.email, otp, password: "second-new-password" },
    });
    assert.equal(replay.status, 400);
    assert.match(replay.body.message, /invalid or has expired/i);
  });

  test("an expired code is refused", async () => {
    await registerUser(request);
    await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    const otp = lastOtp();

    await mongoose.connection
      .collection("users")
      .updateOne(
        { email: VALID_USER.email },
        { $set: { resetOtpExpiresAt: new Date(Date.now() - 1000) } }
      );

    const { status, body } = await request("POST", "/api/auth/reset-password", {
      body: { email: VALID_USER.email, otp, password: "another-new-password" },
    });
    assert.equal(status, 400);
    assert.match(body.message, /invalid or has expired/i);
  });

  test("a wrong code is refused", async () => {
    await registerUser(request);
    await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    const wrong = String((Number(lastOtp()) + 1) % 1_000_000).padStart(6, "0");

    const { status } = await request("POST", "/api/auth/reset-password", {
      body: { email: VALID_USER.email, otp: wrong, password: "another-new-password" },
    });
    assert.equal(status, 400);
  });

  test("stores the code hashed, never in plaintext", async () => {
    await registerUser(request);
    await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    const otp = lastOtp();

    const stored = await mongoose.connection
      .collection("users")
      .findOne({ email: VALID_USER.email });
    assert.notEqual(stored.resetOtpHash, otp);
    assert.match(stored.resetOtpHash, /^\$2[aby]\$/);
  });

  test("an unknown email gets the same answer, so accounts cannot be probed", async () => {
    await registerUser(request);

    const known = await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });
    const unknown = await request("POST", "/api/auth/forgot-password", {
      body: { email: "nobody@example.com" },
    });

    assert.equal(known.status, unknown.status);
    assert.deepEqual(known.body, unknown.body);
  });

  test("enforces the password rules on the new password too (S6.2)", async () => {
    await registerUser(request);
    await request("POST", "/api/auth/forgot-password", {
      body: { email: VALID_USER.email },
    });

    const { status, body } = await request("POST", "/api/auth/reset-password", {
      body: { email: VALID_USER.email, otp: lastOtp(), password: "short" },
    });
    assert.equal(status, 400);
    assert.match(body.errors.password, /at least 8/);
  });
});

describe("legacy route aliases (S3.2)", () => {
  test("/user/register and /user/login still work", async () => {
    const registered = await request("POST", "/user/register", { body: VALID_USER });
    assert.equal(registered.status, 201);

    const loggedIn = await request("POST", "/user/login", {
      body: { email: VALID_USER.email, password: VALID_USER.password },
    });
    assert.equal(loggedIn.status, 200);
    assert.ok(loggedIn.body.data.token);
  });
});
