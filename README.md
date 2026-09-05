# EcoRecycle ♻️

EcoRecycle is a full-stack web app that helps people figure out whether an
item is recyclable and where to take it. A visitor photographs an item, an
in-browser machine-learning model identifies what's in the picture, the app
checks it against a set of recyclable material categories, and — if it's
recyclable — plots the nearest recycling centres on a map using the visitor's
live location.

The project is split into two independently deployable pieces:

- **`EcoRecycle-main/`** — the React single-page app (Vite, Tailwind)
- **`server/`** — the Express + MongoDB API (auth, password reset, the
  recycling-centre lookup, and the contact form)

See [`docs/FRONTEND_IMPROVEMENTS.md`](docs/FRONTEND_IMPROVEMENTS.md) and
[`docs/SERVER_IMPROVEMENTS.md`](docs/SERVER_IMPROVEMENTS.md) for a full audit
of known issues and the fixes applied to each side of the codebase.

---

## Features

- **Snap-and-check recycling scanner** — upload a photo, get an object
  detection pass in the browser (no image ever leaves the device for
  detection), and see which detected items are recyclable and under which
  category (plastic, paper, glass, metal).
- **Nearest recycling centres on a map** — once something recyclable is
  found, the app asks for your location and plots nearby recycling centres
  on an interactive Leaflet map, backed by a server-side proxy to a places
  API.
- **Accounts** — register, sign in, and a forgot-password flow that emails a
  one-time 6-digit code to reset a password. Sessions are JWT-based and
  survive a page refresh.
- **Contact form** — a real, working submission path (not a UI-only stub).
- **Content pages** — Home, About, and Services, all responsive and built
  with Tailwind.

## Tech stack

### Frontend — `EcoRecycle-main/`

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite 6) |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form |
| HTTP | Axios (single instance with auth + error interceptors) |
| Notifications | react-hot-toast |
| Maps | Leaflet + react-leaflet |
| On-device ML | Transformers.js running SmolVLM-256M-Instruct in a Web Worker |
| Icons | react-icons |
| Tooling | ESLint, Vite dev server / build |
| Hosting | Vercel |

### Backend — `server/`

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs password hashing |
| Security | Helmet, express-rate-limit, CORS allow-list |
| Mail | Nodemailer (password-reset OTP, contact form) |
| Third-party | GoMaps Pro Places API (nearby recycling centres, proxied and cached server-side) |
| Tooling | Nodemon for local dev |
| Hosting | Render |

## Project structure

```
EcoRecycle/
├── EcoRecycle-main/        # React frontend
│   ├── src/
│   │   ├── Components/     # Navbar, Footer, Map, ObjectDetection, guards…
│   │   │   └── Pages/      # Home, About, Services, Contact, Login, Signup, OTP
│   │   ├── Context/        # Auth context + provider
│   │   └── lib/            # Shared axios instance
│   └── .env.example
├── server/                  # Express API
│   ├── Config/              # Env loading, DB connection
│   ├── Controllers/         # Route handlers
│   ├── Middleware/          # Auth, error handling, logging, rate limits
│   ├── Models/               # Mongoose schemas
│   ├── Routes/               # Route definitions
│   ├── Utils/                 # Logger, validators, mailer, ApiError
│   └── .env.example
└── docs/                     # Improvement audits for both sides
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET at minimum
npm run dev             # http://localhost:5000
```

Full route table and environment variable reference:
[`server/README.md`](server/README.md).

### 2. Frontend

```bash
cd EcoRecycle-main
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev             # http://localhost:5173
```

Start the backend before the frontend — the app expects the API to be
reachable and issues a token on login/register.

## License

ISC
