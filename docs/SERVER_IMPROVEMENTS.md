# EcoRecycle — Server (Backend) Improvement Plan

Scope: `server/` — Express 4 + Mongoose 8, ESM, deployed on Render.
Audit date: 2026-09-04. Status legend: `[ ]` open · `[x]` done in this pass · `[~]` partially done / needs ops action.

| Module | Theme | Items | Priority |
|---|---|---|---|
| S1 | Configuration & environment | 6 | High |
| S2 | Application bootstrap & middleware | 7 | High |
| S3 | Routing & API surface | 5 | High |
| S4 | Data model | 6 | High |
| S5 | Authentication & authorization | 8 | Critical |
| S6 | Input validation & error contract | 6 | High |
| S7 | Location / third-party integration | 7 | Medium |
| S8 | Missing endpoints the frontend already calls | 4 | High |
| S9 | Observability & operations | 5 | Medium |
| S10 | Quality: tests, lint, docs | 5 | Medium |

---

## S1 — Configuration & environment

| # | Finding | Fix | Status |
|---|---|---|---|
| S1.1 | `dotenv.config()` in [index.js](../server/index.js) runs *after* module imports, so any module reading `process.env` at import time sees `undefined`. It only works today because `dbConnections.js` calls `dotenv.config()` again itself. | Load env once, as the very first statement, before any other import. | [x] |
| S1.2 | `PORT` has no fallback — `app.listen(undefined)` silently binds a random port locally. | `const PORT = process.env.PORT \|\| 5000`. | [x] |
| S1.3 | Env var named `MongoDB_URI` (mixed case) — inconsistent with the `GOMAPS_PRO_API_KEY` convention and easy to mistype on Render. | Read `MONGODB_URI`, keep `MongoDB_URI` as a deprecated fallback so the live deploy does not break. | [x] |
| S1.4 | No `.env.example`, so a new contributor cannot know which variables exist. | Add `server/.env.example` documenting every variable. | [x] |
| S1.5 | `dotenv.config()` is duplicated across three files. | Centralise in `Config/env.js`, which also validates required vars and fails fast with a readable message. | [x] |
| S1.6 | No `start` script — Render has to guess how to boot the app; `nodemon` is used by `dev` but is not a declared dependency. | Add `"start": "node index.js"`, add `nodemon` to `devDependencies`, add an `engines.node` floor. | [x] |

## S2 — Application bootstrap & middleware

| # | Finding | Fix | Status |
|---|---|---|---|
| S2.1 | No security headers at all. | Add `helmet()`. | [x] |
| S2.2 | No rate limiting — `/user/login` and `/user/register` are open to credential stuffing and the location proxy is open to quota drain. | Add `express-rate-limit`: a global limiter plus a stricter one on auth routes. | [x] |
| S2.3 | Allowed CORS origins are hardcoded in the source. | Read from `CORS_ORIGINS` (comma-separated) with the current two values as the default. | [x] |
| S2.4 | The CORS callback rejects with `new Error("Not allowed by CORS")`, which surfaces as an unhandled 500. | Reject without throwing and let the browser see a clean absence of CORS headers. | [x] |
| S2.5 | `express.json()` has no size limit — a large body can exhaust memory. | `express.json({ limit: "10kb" })`, same for `urlencoded`. | [x] |
| S2.6 | No 404 handler and no central error handler; every controller repeats its own `try/catch` + `res.status(500)`. | Add `notFound` and `errorHandler` middleware plus an `asyncHandler` wrapper, and an `ApiError` class. | [x] |
| S2.7 | Behind Render's proxy, `req.ip` is the proxy address, which makes rate limiting global rather than per-client. | `app.set("trust proxy", 1)`. | [x] |

## S3 — Routing & API surface

| # | Finding | Fix | Status |
|---|---|---|---|
| S3.1 | `app.use("/", routerL)` mounts the location router at the root, so `/location` sits in the same namespace as any future static or page route. | Mount everything under `/api`: `/api/auth`, `/api/location`, `/api/contact`. | [x] |
| S3.2 | Changing the prefix breaks the deployed frontend. | Keep the legacy `/user/*` and `/location` mounts as thin aliases so old clients keep working during rollout. | [x] |
| S3.3 | No health endpoint, so Render / uptime checks have to hit a real route. | Add `GET /health` returning uptime and DB connection state. | [x] |
| S3.4 | Exported router names (`router`, `routerL`) carry no meaning. | Rename to `userRouter`, `locationRouter`, `contactRouter`. | [x] |
| S3.5 | Verb/path naming is inconsistent (`/user/register` vs `/user/login`) and controllers are exported PascalCase (`Signup`, `Login`) as if they were components. | Standardise on `/api/auth/register`, `/login`, `/me`, `/forgot-password`, `/reset-password`; export camelCase handlers. | [x] |

## S4 — Data model

| # | Finding | Fix | Status |
|---|---|---|---|
| S4.1 | `email` is not `unique` — the same address can register unlimited times, and `findOne` then returns an arbitrary one of them. | Add a unique index. | [x] |
| S4.2 | Email is stored with original casing, so `A@b.com` and `a@b.com` are different users. | `lowercase: true, trim: true`. | [x] |
| S4.3 | No `timestamps`, so there is no way to tell when an account was created. | `{ timestamps: true }`. | [x] |
| S4.4 | `password` is returned by every query that fetches a user. | `select: false` on the field, opt in explicitly at login. | [x] |
| S4.5 | No schema-level validation (email format, name length, password length). | Add `match`, `minlength`, `maxlength`. | [x] |
| S4.6 | Password hashing lives in the controller, so any future write path can persist a plaintext password. | Move hashing into a `pre("save")` hook and add a `comparePassword` method. | [x] |

## S5 — Authentication & authorization (critical)

| # | Finding | Fix | Status |
|---|---|---|---|
| S5.1 | Login returns `{ success: true }` and nothing else — there is **no session and no token**. The client "is logged in" purely because a React state variable flipped. | Issue a signed JWT on register and login. | [x] |
| S5.2 | Consequently every endpoint is unauthenticated; anyone can call the location proxy directly. | Add a `protect` middleware and apply it to `/api/location` and `/api/auth/me`. | [x] |
| S5.3 | No `JWT_SECRET` in the environment. | Add it to `.env.example` and make startup fail if it is missing. | [x] |
| S5.4 | Login error responses do not distinguish "no such user" from "wrong password" — good — but both return 400 rather than 401. | Return 401 with a single generic message for both. | [x] |
| S5.5 | Duplicate registration hits the Mongo `E11000` path and returns 500. | Detect duplicate key and return 409 with a clear message. | [x] |
| S5.6 | `bcrypt` cost factor is hardcoded to 10. | Read `BCRYPT_ROUNDS` (default 12). | [x] |
| S5.7 | No way for a client to re-hydrate the session after a refresh. | Add `GET /api/auth/me`. | [x] |
| S5.8 | The frontend's "forget password" flow has no backend at all (see S8). | Implement OTP issue + verify with hashed, expiring codes. | [x] |

## S6 — Input validation & error contract

| # | Finding | Fix | Status |
|---|---|---|---|
| S6.1 | `Signup` destructures `name, email, password` without checking any of them; a missing password makes `bcrypt.hash` throw and return an opaque 500. | Validate presence, type and shape before touching the DB. | [x] |
| S6.2 | Password length is enforced only in the browser (react-hook-form), so the API accepts a 1-character password. | Enforce 8–72 characters server-side (72 is the bcrypt input limit). | [x] |
| S6.3 | Every failure returns `{ success: false }` with no message, so the client cannot tell the user what went wrong. | Standard envelope: `{ success, message, data? }`. | [x] |
| S6.4 | `req.body` fields are passed straight into the model — mass assignment risk as the schema grows. | Pick fields explicitly. | [x] |
| S6.5 | No `Content-Type` guard; a form-encoded post to a JSON route silently produces `undefined` fields. | Both parsers are registered; validation now rejects the resulting empty body with 400. | [x] |
| S6.6 | Email format is never checked server-side. | Shared `isEmail` helper used by validators and the schema. | [x] |

## S7 — Location / third-party integration

| # | Finding | Fix | Status |
|---|---|---|---|
| S7.1 | **The full request URL, including the API key, is logged** in [locationController.js](../server/Controllers/locationController.js) — the key leaks into Render's log stream. | Never log the key; log only lat/lon/radius. | [x] |
| S7.2 | `if (!lat \|\| !lon)` rejects the legitimate value `0` (equator / prime meridian). | Check for `undefined` and then validate numerically. | [x] |
| S7.3 | `lat`/`lon` are forwarded to the upstream API unvalidated — any string is interpolated into the URL. | Parse with `Number()` and range-check (-90..90, -180..180). | [x] |
| S7.4 | Query string is built by string interpolation. | Pass `params` to axios so values are encoded. | [x] |
| S7.5 | No timeout — a hung upstream call ties up the request until the platform kills it. | 8s axios timeout. | [x] |
| S7.6 | Identical nearby searches re-hit the paid API on every click. | Add a small in-memory TTL cache keyed on rounded coordinates. | [x] |
| S7.7 | `radius` and `keyword` are hardcoded; the raw upstream payload (dozens of fields per place) is proxied to the browser. | Accept `radius` (capped) and return a slim, stable shape: `{ id, name, vicinity, location:{lat,lng}, rating }`. | [x] |

## S8 — Missing endpoints the frontend already calls

| # | Finding | Fix | Status |
|---|---|---|---|
| S8.1 | `Login.jsx` posts to `https://bookstoreweb-1.onrender.com/user/sendOTP` — a **different project's** server. No such route exists here. | Implement `POST /api/auth/forgot-password`. | [x] |
| S8.2 | `OTP.jsx` posts to `https://bookstoreweb-1.onrender.com/api/auth/verify-otp` — same problem. | Implement `POST /api/auth/reset-password`. | [x] |
| S8.3 | `nodemailer` is a dependency but is never imported anywhere. | Use it to deliver OTP mail; fall back to logging the code when SMTP is not configured, so local dev works. | [x] |
| S8.4 | The Contact form pretends to submit and throws the message away. | Implement `POST /api/contact`. | [x] |

## S9 — Observability & operations

| # | Finding | Fix | Status |
|---|---|---|---|
| S9.1 | Logging is bare `console.log`, including inside hot paths, with emoji and debug leftovers. | Small levelled logger (`Utils/logger.js`) honouring `LOG_LEVEL`; drop debug noise. | [x] |
| S9.2 | No request logging, so production 500s cannot be traced to a route. | Log method, path, status and duration per request. | [x] |
| S9.3 | `process.exit(1)` on DB failure with no retry — a transient Atlas blip permanently kills the Render instance until it is redeployed. | Retry with backoff, exit only after N attempts. | [x] |
| S9.4 | No graceful shutdown — in-flight requests are dropped and the Mongo socket is never closed on redeploy. | Handle `SIGTERM`/`SIGINT`, close the HTTP server then the DB. | [x] |
| S9.5 | `unhandledRejection` / `uncaughtException` are unhandled. | Log and shut down cleanly. | [x] |

## S10 — Quality: tests, lint, docs

| # | Finding | Fix | Status |
|---|---|---|---|
| S10.1 | `npm test` is the default "no test specified" stub; there are zero tests. | Not implemented in this pass — needs `node:test` + `mongodb-memory-server`, which is a separate chunk of work. | [ ] |
| S10.2 | No ESLint / Prettier config for the server; indentation and quoting are inconsistent (`connection =async()=>`). | Not implemented in this pass. | [ ] |
| S10.3 | No README for the server — no setup, env or route documentation. | Added `server/README.md` with setup and the full route table. | [x] |
| S10.4 | `.gitignore` is repo-root only and misses `dist/`, `.env.*`, editor and log files; its lines have trailing whitespace. | Rewritten. | [x] |
| S10.5 | No API version prefix, so a breaking change has nowhere to go. | Deferred: `/api` is in place, `/api/v1` can be layered on when a v2 is actually needed. | [ ] |

---

## New files

| File | Purpose |
|---|---|
| `Config/env.js` | Loads and validates every environment variable in one place |
| `Utils/logger.js` | Levelled logger honouring `LOG_LEVEL` |
| `Utils/ApiError.js` | Typed operational errors with status codes |
| `Utils/validators.js` | Declarative body validation that also strips unknown fields |
| `Utils/mailer.js` | Nodemailer wrapper that logs instead of sending when SMTP is unset |
| `Middleware/asyncHandler.js` | Forwards async rejections to the error handler |
| `Middleware/errorHandler.js` | `notFound` + central error handler (duplicate key, validation, cast, JWT) |
| `Middleware/requestLogger.js` | Per-request method/path/status/duration |
| `Middleware/auth.js` | `signToken` and the `protect` middleware |
| `Middleware/rateLimiters.js` | Global, auth and location limiters |
| `Controllers/contactController.js` | Contact form handler |
| `Routes/contactRoutes.js` | `/api/contact` |
| `.env.example`, `README.md` | Setup, variables, route table |

## Verification performed

- `npm install` — succeeds (146 packages).
- Every module in the graph imports cleanly (`Config` → `Utils` → `Middleware` →
  `Models` → `Controllers` → `Routes`), so there are no circular-import or
  missing-export faults.
- The routers were mounted into a live Express instance and exercised over HTTP:

  | Request | Result |
  |---|---|
  | `GET /api/nope` | `404 {"success":false,"message":"Route GET /api/nope not found"}` |
  | `GET /api/location?lat=22&lon=75` (no token) | `401 "Please sign in to continue"` |
  | same with `Bearer garbage` | `401 "Session expired, please sign in again"` |
  | `POST /api/contact {}` | `400` with per-field `errors` for name, email, message |
  | `POST /api/contact` with `name:"A"`, `email:"bad"`, `message:"short"` | `400` with the correct three messages |
  | `POST /api/auth/login {email:"nope",password:""}` | `400` with per-field `errors` |

- Validation confirmed to lower-case and trim emails and to drop undeclared
  body fields (mass-assignment guard).
- Not verified: anything requiring a live MongoDB or the metered GoMaps API —
  register/login round-trip, the unique-email index, OTP delivery and the
  nearby-search cache. These need a manual pass against a real database.

## Ops actions required after this pass

1. `cd server && npm install` — new dependencies: `helmet`, `express-rate-limit`, `jsonwebtoken`, `nodemon` (dev).
2. Set on Render: `MONGODB_URI` (rename of `MongoDB_URI`), `JWT_SECRET` (long random string), `CORS_ORIGINS`, optionally `SMTP_*`, `BCRYPT_ROUNDS`, `LOG_LEVEL`.
3. The unique index on `email` (S4.1) will fail to build if the collection already contains duplicate addresses — de-duplicate before deploying.
4. Frontend must be pointed at the new `/api/*` routes via `VITE_API_URL`; legacy mounts (S3.2) cover the window in between.
