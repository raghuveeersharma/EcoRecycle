# EcoRecycle — Server

Express + MongoDB API for EcoRecycle: authentication, nearby recycling-centre
lookup, and the contact form.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGODB_URI and JWT_SECRET
npm run dev            # nodemon on http://localhost:5000
npm start              # production
npm test               # full test suite (no running MongoDB needed)
```

`JWT_SECRET` and `MONGODB_URI` are mandatory — the process exits at startup
with a readable message if either is missing.

## Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Uptime and DB connection state |
| POST | `/api/auth/register` | — | Create an account, returns a JWT |
| POST | `/api/auth/login` | — | Sign in, returns a JWT |
| GET | `/api/auth/me` | Bearer | Current user, used to re-hydrate a session |
| POST | `/api/auth/forgot-password` | — | Emails a 6-digit reset code |
| POST | `/api/auth/reset-password` | — | Verifies the code and sets a new password |
| GET | `/api/location?lat=&lon=&radius=` | Bearer | Nearby recycling centres |
| POST | `/api/contact` | — | Contact form submission |

`/user/*` and `/location` remain mounted as aliases of `/api/auth/*` and
`/api/location` so previously deployed frontends keep working. Remove them once
every client sends `VITE_API_URL=.../api`.

## Response envelope

Success: `{ "success": true, "message": "…", "data": { … } }`
Failure: `{ "success": false, "message": "…", "errors": { "field": "…" } }`

Field-level `errors` are only present for 400 validation failures.

## Rate limits

- Everything: 300 requests / 15 min
- Auth and contact: 10 requests / 15 min (successful requests are not counted)
- Location: 20 requests / min

Each is overridable via `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_AUTH_MAX` and
`RATE_LIMIT_LOCATION_MAX`, which is how the test suite exercises the limiter
without waiting out a 15-minute window.

## Tests

```bash
npm test          # run once
npm run test:watch
```

`node:test` with `mongodb-memory-server`, so no MongoDB instance is required —
the first run downloads a `mongod` binary and caches it. The suite starts the
real Express app on an ephemeral port and drives it over HTTP, so routing,
middleware, validation and the error handler are all covered end to end. The
upstream places API is stubbed with `nock`; no test makes a real network call.

| File | Covers |
|---|---|
| `tests/auth.test.js` | register, login, `me`, the full OTP reset cycle, legacy `/user/*` aliases |
| `tests/location.test.js` | auth gate, coordinate validation, response shape, radius caps, caching, upstream failures, API-key safety |
| `tests/app.test.js` | health, 404 and error envelope, body limits, helmet, CORS, contact form |
| `tests/rateLimit.test.js` | auth limiter (own app instance with tiny limits) |

`app.js` builds and exports the Express app; `index.js` only validates env,
connects to MongoDB, listens and handles shutdown. That split is what lets the
tests mount the app without booting a server.

## Notes

- Passwords are hashed by a `pre("save")` hook, never in a controller.
- `email` is unique and lower-cased; de-duplicate existing rows before deploying
  or the unique index will fail to build.
- Password reset codes are stored as bcrypt hashes with a 10-minute expiry.
- Without SMTP configured, reset codes and contact messages are written to the
  log instead of being emailed, so local development works out of the box.
- Nearby searches are cached in memory for 10 minutes per rounded coordinate to
  limit spend on the metered upstream API.
