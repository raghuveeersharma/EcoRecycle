# EcoRecycle — Frontend

React single-page app for EcoRecycle: upload a photo, detect recyclable
items in-browser, and find the nearest recycling centre. See the
[project root README](../README.md) for the full picture (backend included)
and [`docs/FRONTEND_IMPROVEMENTS.md`](../docs/FRONTEND_IMPROVEMENTS.md) for
the audit behind this codebase's current state.

## Tech stack

- **React 18** on **Vite 6**
- **React Router 7** for routing, incl. a `ProtectedRoute` guard for the
  scanner page
- **Tailwind CSS 4**
- **React Hook Form** for the signup form
- **Axios**, one shared instance (`src/lib/api.js`) with auth headers and
  centralised error handling
- **react-hot-toast** for notifications
- **Leaflet / react-leaflet** for the recycling-centre map
- **Transformers.js + SmolVLM-256M-Instruct**, lazy-loaded only on the
  scanner route and run in a Web Worker (WebGPU, with a WASM fallback), for
  on-device item identification — photos never leave the browser

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend's /api URL
npm run dev             # http://localhost:5173
```

The backend (`../server`) needs to be running for login, signup, password
reset, the recycling-centre lookup, and the contact form to work.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint over the project |
| `npm test` | `node --test` over the detector's classifier and prompt-parsing logic |

## Structure

```
src/
├── Components/
│   ├── Pages/          # Home, About, Services, Contact, Login, Signup, OTP, NotFound
│   ├── Navbar.jsx, Footer.jsx
│   ├── ObjectDetection.jsx, MapComponent.jsx
│   ├── ProtectedRoute.jsx, ErrorBoundary.jsx, ScrollToTop.jsx, Spinner.jsx
├── Context/             # Auth context, hook, and provider
├── lib/
│   ├── api.js           # Shared axios instance
│   ├── detection.js     # Detector prompts and answer parsing
│   ├── materials.js     # Material vocabulary, guidance, and text classifier
│   ├── imagePrep.js     # Canvas resize to the model's input size
│   └── vlmClient.js     # Main-thread wrapper around the inference worker
├── workers/vlm.worker.js  # SmolVLM loading and generation, off the main thread
├── App.jsx, main.jsx
```
