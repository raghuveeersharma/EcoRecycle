import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { startTestServer, clearDatabase, registerUser } from "./helpers.js";

const UPSTREAM_HOST = "https://maps.gomaps.pro";
const UPSTREAM_PATH = "/maps/api/place/nearbysearch/json";
const API_KEY = "test-api-key-must-never-be-logged";

let request;
let stop;
let mongoose;
let token;

// The controller must never write the API key anywhere; capture all output.
const output = [];
const realLog = console.log;
const realError = console.error;

before(async () => {
  console.log = (...a) => output.push(a.join(" "));
  console.error = (...a) => output.push(a.join(" "));
  ({ request, stop, mongoose } = await startTestServer({
    LOG_LEVEL: "debug",
    GOMAPS_PRO_API_KEY: API_KEY,
  }));
  nock.disableNetConnect();
  // The test client still has to reach our own server.
  nock.enableNetConnect("127.0.0.1");
});

after(async () => {
  nock.cleanAll();
  nock.enableNetConnect();
  console.log = realLog;
  console.error = realError;
  await stop();
});

beforeEach(async () => {
  nock.cleanAll();
  output.length = 0;
  await clearDatabase(mongoose);
  ({ token } = await registerUser(request));
});

const stubUpstream = (results, status = 200) =>
  nock(UPSTREAM_HOST).get(UPSTREAM_PATH).query(true).reply(status, { results });

const PLACE = {
  place_id: "abc123",
  name: "Green Street Recycling",
  vicinity: "12 Green Street",
  geometry: { location: { lat: 51.5, lng: -0.12 } },
  rating: 4.5,
  // Fields that must not be proxied through to the browser (S7.7).
  opening_hours: { open_now: true },
  photos: [{ photo_reference: "x".repeat(200) }],
  plus_code: { global_code: "9C3XGV" },
};

/**
 * The controller caches by rounded coordinate in a module-level map that lives
 * for the whole process, so every test that must reach the upstream needs a
 * location no earlier test has already looked up.
 */
let coordSeed = 0;
const freshCoords = () => {
  coordSeed += 1;
  return { lat: (coordSeed * 0.017).toFixed(4), lon: (coordSeed * 0.031).toFixed(4) };
};
const freshQuery = (extra = "") => {
  const { lat, lon } = freshCoords();
  return `lat=${lat}&lon=${lon}${extra}`;
};

describe("GET /api/location — authorization (S5.2)", () => {
  test("requires a token", async () => {
    const { status, body } = await request("GET", "/api/location?lat=51.5&lon=-0.12");
    assert.equal(status, 401);
    assert.equal(body.success, false);
  });

  test("the legacy /location alias is protected too", async () => {
    const { status } = await request("GET", "/location?lat=51.5&lon=-0.12");
    assert.equal(status, 401);
  });
});

describe("GET /api/location — coordinate validation (S7.2, S7.3)", () => {
  test("accepts lat=0 / lon=0 instead of treating them as missing", async () => {
    stubUpstream([PLACE]);
    const { status } = await request("GET", "/api/location?lat=0&lon=0", { token });
    // The key assertion is that this is NOT a 400 "Latitude is required".
    assert.equal(status, 200);
  });

  test("rejects out-of-range, non-numeric and missing coordinates", async () => {
    const cases = [
      ["lon=0", /Latitude is required/],
      ["lat=0", /Longitude is required/],
      ["lat=91&lon=0", /Latitude must be a number between -90 and 90/],
      ["lat=-91&lon=0", /Latitude must be a number between -90 and 90/],
      ["lat=0&lon=181", /Longitude must be a number between -180 and 180/],
      ["lat=abc&lon=0", /Latitude must be a number/],
      ["lat=&lon=0", /Latitude is required/],
    ];

    for (const [query, expected] of cases) {
      const { status, body } = await request("GET", `/api/location?${query}`, { token });
      assert.equal(status, 400, `${query} should be rejected`);
      assert.match(body.message, expected);
    }
  });

  test("never reaches the upstream API when coordinates are invalid", async () => {
    const scope = stubUpstream([PLACE]);
    await request("GET", "/api/location?lat=999&lon=0", { token });
    assert.equal(scope.isDone(), false, "no upstream call should have been made");
  });
});

describe("GET /api/location — response shape (S7.7)", () => {
  test("returns a slim, stable shape and drops upstream noise", async () => {
    stubUpstream([PLACE]);
    const { status, body } = await request("GET", `/api/location?${freshQuery()}`, {
      token,
    });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.deepEqual(body.data[0], {
      id: "abc123",
      name: "Green Street Recycling",
      vicinity: "12 Green Street",
      location: { lat: 51.5, lng: -0.12 },
      rating: 4.5,
    });
    assert.ok(!JSON.stringify(body).includes("photo_reference"));
  });

  test("skips malformed places rather than emitting broken rows", async () => {
    stubUpstream([
      PLACE,
      { name: "No geometry here" },
      { geometry: { location: { lat: 1, lng: 1 } } },
      null,
    ]);

    const { body } = await request("GET", `/api/location?${freshQuery()}`, { token });
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].name, "Green Street Recycling");
  });

  test("falls back to formatted_address and a synthetic id", async () => {
    stubUpstream([
      {
        name: "Depot",
        formatted_address: "1 Some Road",
        geometry: { location: { lat: 2, lng: 3 } },
      },
    ]);

    const { body } = await request("GET", `/api/location?${freshQuery()}`, { token });
    assert.equal(body.data[0].vicinity, "1 Some Road");
    assert.equal(body.data[0].id, "Depot-2");
    assert.equal(body.data[0].rating, null);
  });

  test("returns an empty list, not an error, when nothing is nearby (F8.6)", async () => {
    stubUpstream([]);
    const { status, body } = await request("GET", `/api/location?${freshQuery()}`, {
      token,
    });
    assert.equal(status, 200);
    assert.deepEqual(body.data, []);
  });
});

describe("GET /api/location — radius handling (S7.7)", () => {
  const capturedRadius = async (query) => {
    let radius;
    nock(UPSTREAM_HOST)
      .get(UPSTREAM_PATH)
      .query((q) => {
        radius = Number(q.radius);
        return true;
      })
      .reply(200, { results: [] });
    await request("GET", `/api/location?${query}`, { token });
    return radius;
  };

  test("defaults to 5000m", async () => {
    assert.equal(await capturedRadius(freshQuery()), 5000);
  });

  test("caps an oversized radius at 25000m", async () => {
    assert.equal(await capturedRadius(freshQuery("&radius=999999")), 25000);
  });

  test("floors a tiny radius at 500m", async () => {
    assert.equal(await capturedRadius(freshQuery("&radius=1")), 500);
  });
});

describe("GET /api/location — caching (S7.6)", () => {
  test("serves a repeat search from cache without re-billing the upstream", async () => {
    const scope = stubUpstream([PLACE]);
    const query = freshQuery();

    const first = await request("GET", `/api/location?${query}`, { token });
    assert.equal(first.body.cached, false);
    assert.equal(scope.isDone(), true);

    // No second interceptor is registered, so a second upstream call would fail.
    const second = await request("GET", `/api/location?${query}`, { token });
    assert.equal(second.status, 200);
    assert.equal(second.body.cached, true);
    assert.deepEqual(second.body.data, first.body.data);
  });

  test("a materially different location is not served from that cache", async () => {
    stubUpstream([PLACE]);
    await request("GET", `/api/location?${freshQuery()}`, { token });

    stubUpstream([{ ...PLACE, place_id: "other", name: "Other Depot" }]);
    const { body } = await request("GET", `/api/location?${freshQuery()}`, { token });

    assert.equal(body.cached, false);
    assert.equal(body.data[0].name, "Other Depot");
  });
});

describe("GET /api/location — upstream failure and key safety", () => {
  test("turns an upstream error into a 502, not a 500", async () => {
    stubUpstream({}, 500);
    const { status, body } = await request("GET", `/api/location?${freshQuery()}`, {
      token,
    });

    assert.equal(status, 502);
    assert.match(body.message, /Could not reach the recycling centre directory/);
  });

  test("turns a network error into a 502", async () => {
    nock(UPSTREAM_HOST)
      .get(UPSTREAM_PATH)
      .query(true)
      .replyWithError(Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }));

    const { status } = await request("GET", `/api/location?${freshQuery()}`, { token });
    assert.equal(status, 502);
  });

  // Intentionally slow: it proves the client really does give up at 8s rather
  // than waiting on the upstream, which is the whole point of S7.5.
  test("gives up on a hung upstream after its own 8s timeout (S7.5)", async () => {
    nock(UPSTREAM_HOST)
      .get(UPSTREAM_PATH)
      .query(true)
      .delayConnection(30000)
      .reply(200, { results: [] });

    const startedAt = Date.now();
    const { status } = await request("GET", `/api/location?${freshQuery()}`, { token });
    const elapsed = Date.now() - startedAt;

    assert.equal(status, 502);
    assert.ok(
      elapsed >= 7000 && elapsed < 12000,
      `expected the 8s timeout to fire, took ${elapsed}ms`
    );
  });

  test("never writes the API key to the logs (S7.1)", async () => {
    stubUpstream([PLACE]);
    await request("GET", `/api/location?${freshQuery()}`, { token });

    stubUpstream({}, 500);
    await request("GET", `/api/location?${freshQuery()}`, { token });

    assert.ok(output.length > 0, "the controller did log something");
    const leaked = output.filter((line) => line.includes(API_KEY));
    assert.deepEqual(leaked, [], "the API key must never appear in log output");
  });

  test("never returns the API key to the client", async () => {
    stubUpstream({}, 500);
    const { body } = await request("GET", `/api/location?${freshQuery()}`, { token });
    assert.ok(!JSON.stringify(body).includes(API_KEY));
  });
});
