# EcoRecycle — Frontend Improvement Plan

Scope: `EcoRecycle-main/` — React 18 + Vite 6 + Tailwind 4 + React Router 7, deployed on Vercel.
Audit date: 2026-09-04. Status legend: `[ ]` open · `[x]` done in this pass · `[~]` partially done.

| Module | Theme | Items | Priority |
|---|---|---|---|
| F1 | Build, config & environment | 7 | High |
| F2 | Routing & navigation | 6 | Critical |
| F3 | Authentication & session state | 7 | Critical |
| F4 | API layer | 5 | High |
| F5 | Broken code / runtime errors | 7 | Critical |
| F6 | Forms & validation | 6 | High |
| F7 | Object detection | 9 | High |
| F8 | Map component | 6 | Medium |
| F9 | Accessibility | 7 | Medium |
| F10 | UX, error handling & performance | 7 | Medium |
| F11 | Code hygiene | 7 | Low |

---

## F1 — Build, config & environment

| # | Finding | Fix | Status |
|---|---|---|---|
| F1.1 | [index.html](../EcoRecycle-main/index.html) links `/src/styles.css`, **a file that does not exist** — a 404 on every page load. | Removed. | [x] |
| F1.2 | The Google Fonts `preconnect` pair is duplicated verbatim. | De-duplicated. | [x] |
| F1.3 | No `<meta name="description">`, no `theme-color`, no `lang`-appropriate title/OG tags. | Added description, theme-color and Open Graph tags. | [x] |
| F1.4 | [index.css](../EcoRecycle-main/src/index.css) puts `@import "tailwindcss"` **after** a `body` rule. CSS requires `@import` first; the import is at best hoisted with a warning, at worst dropped, and the body rule cannot be overridden by utilities. | Import first, then base layer styles. | [x] |
| F1.5 | The font stack is `"Oxanium", serif` — if Oxanium fails to load the page falls back to a serif, which looks nothing like the design. | Sensible sans-serif fallback chain. | [x] |
| F1.6 | `src/App.css` is an empty file that is still imported. | Deleted, import removed. | [x] |
| F1.7 | No `.env.example`; there is no env plumbing at all (see F4.1). | Added with `VITE_API_URL`. | [x] |

## F2 — Routing & navigation (critical)

| # | Finding | Fix | Status |
|---|---|---|---|
| F2.1 | The signup route is declared as `path="/Signup"` while [Login.jsx](../EcoRecycle-main/src/Components/Pages/Login.jsx) links to `/signup` and the Navbar links to `/Signup`. This only works because React Router matches case-insensitively by default (`caseSensitive` defaults to `false`) — it breaks the moment anyone sets that prop, and it produces two URLs for one page, which is bad for links and analytics. | All routes normalised to lowercase. | [x] |
| F2.2 | No catch-all route — an unknown URL renders navbar + footer with nothing between them. | Added a `NotFound` page on `path="*"`. | [x] |
| F2.3 | `/object` exposes the detector directly, bypassing the login gate that `/services` applies. | Route removed; the detector is reachable only through the protected `/services`. | [x] |
| F2.4 | No scroll restoration — navigating from the bottom of About to Contact keeps you scrolled down. | Added a `ScrollToTop` listener. | [x] |
| F2.5 | Route protection is improvised: `Services.jsx` renders the whole `<Login />` page inline instead of redirecting, so the URL still says `/services` and there is no return-to-intended-page behaviour. | Added `<ProtectedRoute>` that redirects to `/login` carrying `state.from`, and Login redirects back after success. | [x] |
| F2.6 | `<Router>` wraps `Navbar`/`Footer` inside `App`, which is fine, but the router is `BrowserRouter` aliased to `Router`, obscuring which router is in use. | Import `BrowserRouter` directly. | [x] |

## F3 — Authentication & session state (critical)

| # | Finding | Fix | Status |
|---|---|---|---|
| F3.1 | `LoginState` is a boolean in React state only — **a page refresh logs the user out**. | Persist token + user in `localStorage` and hydrate on boot. | [x] |
| F3.2 | The backend returns no token (see S5.1), so the client had nothing to store; being "logged in" was a client-side lie. | Store the JWT the new backend issues and send it as `Authorization: Bearer`. | [x] |
| F3.3 | The context exports a typo'd name, `LoginStatee`, and consumers must `useContext` it directly. | Renamed to `AuthContext` with a `useAuth()` hook; the old export name is kept as a deprecated alias so nothing breaks mid-refactor. | [x] |
| F3.4 | No user identity anywhere in the UI — you cannot tell who is signed in. | Navbar shows the signed-in name. | [x] |
| F3.5 | Logout only flips the boolean; there is nothing to clear, and nothing invalidates on the server. | `logout()` clears storage and auth header. | [x] |
| F3.6 | In the mobile menu, the **Signup link calls `setLoginState(false)`** instead of closing the menu — tapping Signup silently logs you out. | Fixed to close the menu. | [x] |
| F3.7 | Signup does not sign the user in, so a new user has to immediately log in again. | Register now stores the returned token and lands the user on `/services`. | [x] |

## F4 — API layer

| # | Finding | Fix | Status |
|---|---|---|---|
| F4.1 | The production URL `https://ecorecycle-ll8y.onrender.com` is hardcoded in three components — it cannot be pointed at localhost without editing source. | Single axios instance in `src/lib/api.js` reading `VITE_API_URL`. | [x] |
| F4.2 | Two calls point at `https://bookstoreweb-1.onrender.com` — **an unrelated project**, left over from copy-paste. | Now hit this project's own auth routes. | [x] |
| F4.3 | No request timeout — a cold Render instance leaves the UI spinning indefinitely with no feedback. | 15s timeout with an explicit timeout message. | [x] |
| F4.4 | No interceptors: the token is not attached and a 401 does not clear the stale session. | Request interceptor adds the bearer token; response interceptor clears the session and redirects on 401. | [x] |
| F4.5 | Errors are handled as `console.log(err)` plus a generic toast, discarding the server's message. | Shared `getErrorMessage(err)` surfaces the API message. | [x] |

## F5 — Broken code / runtime errors (critical)

| # | Finding | Fix | Status |
|---|---|---|---|
| F5.1 | `sendOTP` in Login.jsx references a bare `email` variable that **is not defined in scope** — clicking "forget password" throws `ReferenceError`. | Uses `formData.email` and validates it is filled in first. | [x] |
| F5.2 | The same function contains `<NavLink to="/otp" />;` as a statement — it creates an element, discards it, and navigates nowhere. | Replaced with `navigate("/otp", { state: { email } })`. | [x] |
| F5.3 | [OTP.jsx](../EcoRecycle-main/src/Components/Pages/OTP.jsx) calls `toast.error` but **never imports `toast`** — the catch branch throws its own error. | Imported; page fully implemented. | [x] |
| F5.4 | OTP.jsx renders literally `<div>OTP</div>`; `verifyOTP` is defined and never called, and its three state variables have no inputs. | Built the real reset form (email, code, new password + confirm). | [x] |
| F5.5 | In Login.jsx the Signup button is `<button type="submit">` wrapping a `<Link>` — clicking it submits the login form *and* navigates. Signup.jsx has the same pattern with the invalid `type=""`. | Replaced with plain `<Link>` elements styled as buttons. | [x] |
| F5.6 | `MapComponent` does `isValidLatLon(...userLocation)` — spreading `undefined` throws `TypeError` if the prop is ever missing, and there is no default. | Guarded with an array check and a default prop. | [x] |
| F5.7 | `ObjectDetection` renders `{center.vicinity}` but its own mapping only keeps `name` and `location`, so every row reads "name - undefined". | `vicinity` is now carried through from the API. | [x] |
| F5.8 | `className="h=[1px]"` (five occurrences) — a typo for `h-[1px]`, so the rule does nothing. | Replaced those `<hr>` elements with real input borders. | [x] |

## F6 — Forms & validation

| # | Finding | Fix | Status |
|---|---|---|---|
| F6.1 | Login has no submit-in-flight state: the button stays live, so a slow request can be fired repeatedly. | `isSubmitting` disables the button and shows progress. | [x] |
| F6.2 | Login's `handleSubmit` wraps everything in `if (email && password)` and does nothing at all when the check fails — a silent no-op. | Explicit validation messages. | [x] |
| F6.3 | Login resets `{ name: "", email: "", password: "" }` — `name` is not part of that form's state, so the reset adds a junk key. | Resets only the real fields. | [x] |
| F6.4 | Signup's `onSubmit` swallows failures into `console.log`; the user sees no error at all when e.g. the email is taken. | Error toast with the server's message. | [x] |
| F6.5 | Signup uses `Controller` for three plain uncontrolled inputs — needless indirection and re-renders. | Switched to `register`. | [x] |
| F6.6 | The Contact form sets a "sent successfully!" banner **without sending anything anywhere**. | Wired to the new `POST /api/contact`, with email field, validation and real success/error state. | [x] |

## F7 — Object detection

> COCO-SSD has since been replaced by SmolVLM running in-browser — see
> [OBJECT_DETECTION_TODO.md](./OBJECT_DETECTION_TODO.md). The rows below were
> written against the TensorFlow.js detector; each has been re-checked against
> the replacement, and F7.6 / F7.7 changed shape as a result.

| # | Finding | Fix | Status |
|---|---|---|---|
| F7.1 | `@tensorflow/tfjs` + `coco-ssd` load on mount of a component that is in the main bundle — several MB of JS shipped to every visitor including the home page. | Route-level `React.lazy` + `Suspense`, so the model code is a separate chunk. Still holds: Transformers.js is in the lazy `Services` chunk, and the weights are only fetched once an image is chosen. | [x] |
| F7.2 | `cocoSsd.load()` has no error handling — if the CDN weights fail, the console shows nothing useful and the button silently does nothing forever. | try/catch, error state, retry affordance. Now also covers a worker that dies mid-load, which would otherwise leave every pending promise unsettled. | [x] |
| F7.3 | The Detect button is enabled before the model finishes loading and is not disabled while detecting. | Disabled until the model is ready and while a detection is running; status line shows which. | [x] |
| F7.4 | `URL.createObjectURL` is called on every upload and **never revoked** — one leaked blob per image. | Revoked on replace and on unmount. | [x] |
| F7.5 | `detectObjects` has no try/catch; a failed inference leaves `loading` stuck at `true`. | Wrapped with `finally`. | [x] |
| F7.6 | Predictions are used regardless of confidence, so a 12%-confidence "bottle" is reported as fact. | ~~0.5 score threshold~~ — SmolVLM emits no confidence score, so there is nothing to threshold. Replaced with honest framing: results are shown as "Looks like…", a material read from the object's name rather than stated by the model is labelled as the weaker guess it is, and the model's raw answer is one click away. | [x] |
| F7.7 | `RECYCLABLE_MATERIALS` is redefined on every render; matching produces duplicates and misreports category ("bottle" is listed under both plastic and glass, first match wins). | Moved to [materials.js](../EcoRecycle-main/src/lib/materials.js) and re-cut for open-vocabulary text: explicit material words beat object names, ambiguous names like "bottle" resolve to *unknown* instead of to whichever list mentioned them first, and text naming several materials at once is refused rather than resolved to the first. Covered by unit tests. | [x] |
| F7.8 | The recycling-centres list and map are gated on `recyclableObjects.length > 0`, so fetching your location before detecting anything appears to do nothing. | Gated on whether centres were actually fetched. | [x] |
| F7.9 | Geolocation failure and denial are only `console.error`; there is no loading state while the API call runs, and `console.log(recycleCenters)` right after `setState` prints the stale value. | User-visible loading and error states; debug logging removed. | [x] |

## F8 — Map component

| # | Finding | Fix | Status |
|---|---|---|---|
| F8.1 | `fitBounds` is computed from the centres only, so the user's own marker can end up off-screen. | Bounds include the user position. | [x] |
| F8.2 | `fitBounds` on a single point zooms to maximum. | `maxZoom` clamp and a `setView` path for the single-point case. | [x] |
| F8.3 | The custom icon omits `popupAnchor`, so popups open over the pin instead of above it. | Added, and `shadowSize`. | [x] |
| F8.4 | Markers are keyed by array index, so the list re-renders incorrectly when centres change. | Keyed by place id / name+coords. | [x] |
| F8.5 | The 500px height is a hardcoded inline style — it does not adapt on mobile. | Tailwind responsive height. | [x] |
| F8.6 | No empty state when zero centres come back. | Caller renders an explicit "none found nearby" message. | [x] |

## F9 — Accessibility

| # | Finding | Fix | Status |
|---|---|---|---|
| F9.1 | The hamburger button has no `aria-label`, no `aria-expanded`, no `aria-controls`. | All three added. | [x] |
| F9.2 | The remove-image button's only content is a ❌ emoji — screen readers announce nothing meaningful. | `aria-label="Remove image"`. | [x] |
| F9.3 | `UploadGuidelines` example image has `alt=""` while being meaningful content. | Descriptive alt text. | [x] |
| F9.4 | Login/Signup inputs use `text-gray-100` (near-white) text on a white input background — effectively invisible while typing. Contrast failure. | Dark text on white inputs. | [x] |
| F9.5 | Form validation errors are not associated with their inputs and are not announced. | `aria-invalid`, `aria-describedby`, `role="alert"`. | [x] |
| F9.6 | The file input has no visible label. | Labelled. | [x] |
| F9.7 | The desktop nav's Logout button is permanently rendered and merely *disabled* when signed out, conveying its state only through colour. | The nav is now auth-aware: Login/Signup when signed out, name + Logout when signed in — no disabled control to explain. | [x] |

## F10 — UX, error handling & performance

| # | Finding | Fix | Status |
|---|---|---|---|
| F10.1 | `<Toaster />` is mounted in three different components (Navbar, Login, Signup) — up to three overlapping toast containers. | One `<Toaster />` in `App`. | [x] |
| F10.2 | No error boundary: any render error blanks the whole app. | Added `ErrorBoundary` around the routes. | [x] |
| F10.3 | The nav shows "Signup" even when you are already signed in. | Auth-aware nav links. | [x] |
| F10.4 | Active navigation state is not indicated. | `NavLink` with an active style. | [x] |
| F10.5 | Duplicated navigation markup — the desktop and mobile menus are two hand-maintained copies of the same six links. | Single link array rendered twice. | [x] |
| F10.6 | The remove-image button has white text on a white-ish image area with no background — often invisible. | Solid background chip. | [x] |
| F10.7 | No loading feedback anywhere for network calls beyond the detector. | Consistent disabled + label-swap treatment on every submit. | [x] |
| F10.8 | Home page CTA "Learn more" points at `/services`, which is login-gated — a new visitor is bounced to a login form with no explanation. | Redirect now carries a message explaining why login is required. | [x] |

## F11 — Code hygiene

| # | Finding | Fix | Status |
|---|---|---|---|
| F11.1 | `import React from "react"` in six files that use the JSX runtime and never reference `React`. | Removed where unused. | [x] |
| F11.2 | Unused variables: `res` in Login/Signup, `Login` import in Services after the refactor. | Cleaned. | [x] |
| F11.3 | Commented-out `<Link to="/login">` blocks left in both nav menus. | Removed. | [x] |
| F11.4 | Leftover debug `console.log` calls in the detector, and emoji in log output. | Removed; only genuine `console.error` reporting remains. | [x] |
| F11.6 | `react/prop-types` fires on every component in this PropTypes-free JS project, so `npm run lint` reported errors before any of this work. `ecmaVersion` was pinned to 2020. | Rule disabled in [eslint.config.js](../EcoRecycle-main/eslint.config.js), `ecmaVersion` raised to 2022. `npm run lint` is now clean. | [x] |
| F11.7 | Exporting a context object and a hook from the same file as the provider component breaks Vite fast refresh (two `react-refresh/only-export-components` warnings). | Context and `useAuth` moved to `src/Context/authContext.js`; `LoginState.jsx` exports only the provider. | [x] |
| F11.5 | The project folder is named `EcoRecycle-main` — an artefact of a GitHub zip download. Renaming to `client/` would be cleaner but changes the Vercel root directory setting. | Deferred — needs a Vercel config change, flagged for the owner to decide. | [ ] |

---

## New files

| File | Purpose |
|---|---|
| `src/lib/api.js` | Single axios instance: base URL from env, bearer token, 401 handling, error-message helpers |
| `src/Context/authContext.js` | The auth context object and the `useAuth()` hook |
| `src/Context/LoginState.jsx` | Rewritten as `AuthProvider`: persistence, session restore, login/register/logout |
| `src/Components/ProtectedRoute.jsx` | Route guard with return-to-intended-page |
| `src/Components/ErrorBoundary.jsx` | Catches render errors |
| `src/Components/ScrollToTop.jsx` | Scroll restoration on navigation |
| `src/Components/Spinner.jsx` | Shared loading indicator |
| `src/Components/Pages/NotFound.jsx` | 404 page |
| `src/lib/materials.js` | Material vocabulary, disposal guidance and the free-text → material classifier |
| `src/lib/detection.js` | The prompts and the parsing of the model's answers, independent of any model runtime |
| `src/lib/imagePrep.js` | Decodes an upload and draws it to an offscreen canvas at the model's input size |
| `src/lib/vlmClient.js` | Main-thread wrapper around the inference worker, plus download-progress aggregation |
| `src/workers/vlm.worker.js` | Loads SmolVLM (WebGPU, WASM fallback) and runs generation off the main thread |
| `tests/detection.test.js` | `node --test` coverage for the classifier and the prompt/response flow |
| `.env.example` | Documents `VITE_API_URL` |

Deleted: `src/App.css` (empty, but imported).

## Verification performed

- `npm run lint` — clean (0 errors, 0 warnings).
- `npm run build` — succeeds. The lazy `Services` route confirms the code split:
  main bundle **286 kB** (97 kB gzip), with the detector's Transformers.js code
  in a separate `Services` chunk (177 kB) plus a **508 kB** worker chunk, both
  loaded only when a signed-in user opens the scanner.
- `npm test` — 16 `node --test` cases over the material classifier and the
  prompt/response flow, all passing.
- `vite dev` — every module in the graph transforms and serves `200`.
- Not verified: real browser interaction against a live backend (no MongoDB
  instance available in this environment). The detector, geolocation and map
  paths need a manual pass once the API is running.

## Ops actions required after this pass

1. `cd EcoRecycle-main && npm install` (no new dependencies were added, but the lockfile should be refreshed).
2. Create `.env` from `.env.example`; set `VITE_API_URL=http://localhost:5000/api` locally.
3. On Vercel, set `VITE_API_URL=https://ecorecycle-ll8y.onrender.com/api`.
4. Deploy the backend **before** the frontend — the frontend now expects the `/api/*` routes and a JWT in the login response.
