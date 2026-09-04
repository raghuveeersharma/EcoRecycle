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

## Notes

- Passwords are hashed by a `pre("save")` hook, never in a controller.
- `email` is unique and lower-cased; de-duplicate existing rows before deploying
  or the unique index will fail to build.
- Password reset codes are stored as bcrypt hashes with a 10-minute expiry.
- Without SMTP configured, reset codes and contact messages are written to the
  log instead of being emailed, so local development works out of the box.
- Nearby searches are cached in memory for 10 minutes per rounded coordinate to
  limit spend on the metered upstream API.
