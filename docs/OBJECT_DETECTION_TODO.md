# Object Detection — Upgrade Plan

The problem this document was opened for: COCO-SSD (client-side,
TensorFlow.js) detected only 80 fixed classes, and the app's keyword-based
material mapping only actually matched 5 of them (`bottle`, `wine glass`,
`cup`, `book`, `handbag` — the last one wrongly). Everything else in
`RECYCLABLE_MATERIALS` was dead code. See
[FRONTEND_IMPROVEMENTS.md](./FRONTEND_IMPROVEMENTS.md) F7 for the detector
fixes shipped before this one (confidence threshold, dedup, lazy-loading,
etc.) — those were sound; the limitation was the model's vocabulary, not the
surrounding code.

Decision: replace COCO-SSD with **SmolVLM**, run in-browser. No new hosting,
no new server route, no per-call cost. **Done** — see the implementation plan
below for what shipped, where it diverged from this plan, and how it measured
against real photos.

Status legend: `[ ]` open · `[x]` done · `[~]` in progress

---

## Options considered

### Option 1 — SmolVLM in-browser (chosen)

Run a small vision-language model directly on the visitor's device via
Transformers.js + WebGPU (falling back to WASM), replacing COCO-SSD's
fixed 80-class detector with a model you can prompt in free text.

- **Cost:** $0. No server, no host, no per-call fee, no rate limit, no
  third-party ToS about user images.
- **Model:** SmolVLM-256M-Instruct — ~0.8GB VRAM for single-image
  inference, small enough to run 100% client-side on WebGPU.
- **Gain over COCO-SSD:** open-ended prompting ("what recyclable materials
  are in this image?") instead of matching against a fixed class list —
  this is the actual fix for the accuracy problem, not a tuning change.
- **Trade-off:** the 256M model scores lower on general benchmarks than
  larger VLMs (~44% vs. ~60% for the 2.2B variant on one cited eval).
  Whether that's good enough is only answerable by testing it against real
  photos of what users actually submit.
- **Device cost:** moves compute onto the user's device. Older phones or
  WASM-only fallback will be slower, and there's a first-load model
  download (same category of cost the current TensorFlow.js bundle
  already imposes).

### Option 2 — Moondream2, self-hosted on a free host (fallback)

Keep a larger model (Moondream2, ~1.9B params) but run it server-side on
an actually-free host, if SmolVLM-256M's accuracy doesn't hold up.

- **Hugging Face Spaces (free CPU tier):** 2 vCPU / 16GB RAM, free, no
  card. Sleeps after 48h idle — acceptable for low/sporadic traffic
  (occasional slow first request, not a cost).
- **Oracle Cloud "Always Free":** a free ARM VM that never sleeps — no
  cold starts, ever, at zero cost. More setup work than a managed
  platform; ARM needs slightly more care when installing ML deps.
- Requires a new internal server route (`POST /api/detect` → the
  inference host) and the internal-auth/timeout/error-envelope pattern
  already used for the location proxy.
- **Verdict:** only pursue this if Option 1's accuracy testing comes up
  short. Adds a second service to operate; Option 1 doesn't.

---

## Option 1 — SmolVLM implementation plan — **shipped**

### Flow as built

```
User selects a photo
        │
        ▼
Model download starts (choosing a photo is the first sign the visitor
wants this; the weights are ~100s of MB, so nothing is fetched before)
        │
        ▼
Image decoded and drawn to an offscreen canvas at 512px longest edge —
the size SmolVLM's own image processor resizes to
(replaces today's CSS-shrunk <img> passed straight to fromPixels)
        │
        ▼
Web Worker: AutoProcessor + AutoModelForVision2Seq, WebGPU (q4) with a
WASM (q8) fallback, warmed up with a dummy generation on load
        │
        ▼
Question 1: "What is the main object in this photo? Answer with only the
name of the object, in two or three words."
  → object name, and usually the material with it ("a plastic bottle")
        │
        ▼
Question 2, only when the name did not settle the material:
"What material is the main object in this photo made of? Answer with one
word: plastic, paper, glass, metal, electronics, textile, or food."
        │
        ▼
Answers parsed into { item, material, certainty }; disposal guidance
comes from our own table, not from the model
        │
        ▼
Existing UI shape: result, material badge, "couldn't tell" empty state,
recycling-centre lookup unchanged
```

### What changed from the plan above

- **No `pipeline("image-text-to-text", …)`.** Transformers.js 4.2 has no such
  pipeline task; SmolVLM is reached through `AutoProcessor` +
  `AutoModelForVision2Seq`, which is what the checkpoint's own demo uses.
- **The single structured prompt does not work.** The planned "give me item +
  material per line" prompt was tried against real photos first: SmolVLM-256M
  never produced the format — it paraphrases the instruction or reads the list
  of options back verbatim. Asking it to *name the object* works well, and its
  answer usually contains the material anyway, so most photos need one
  generation, not two.
- **Inference moved into a Web Worker.** Token-by-token generation on the WASM
  fallback is seconds of solid CPU; on the main thread it would freeze the page,
  including the spinner meant to indicate progress.
- **Disposal advice is ours, not the model's.** The plan had the model write a
  disposal note. A 256M model writing recycling instructions produces
  plausible-sounding and occasionally wrong advice, which is worse than generic
  advice that is always right, so the model is asked only *what* the thing is.

### Implementation steps

- [x] Add `@huggingface/transformers` (Transformers.js) as a dependency, and
      drop `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd`.
- [x] Replace the `cocoSsd`/`tf` model-loading code in
      [ObjectDetection.jsx](../EcoRecycle-main/src/Components/ObjectDetection.jsx)
      with SmolVLM-256M-Instruct, loaded in
      [vlm.worker.js](../EcoRecycle-main/src/workers/vlm.worker.js) and driven
      from [vlmClient.js](../EcoRecycle-main/src/lib/vlmClient.js). The route
      stays lazy, as F7.1 already had it.
- [x] Draw the uploaded image to an offscreen canvas at the model's input size
      before inference ([imagePrep.js](../EcoRecycle-main/src/lib/imagePrep.js)),
      instead of passing the CSS-sized `<img>` element directly.
- [x] Write the prompts and a parser
      ([detection.js](../EcoRecycle-main/src/lib/detection.js)). Constrained
      decoding is not available for this checkpoint, so the parser is tolerant
      and has an explicit "couldn't read the answer" state — never a silent
      wrong answer. It also refuses text that names several materials at once
      rather than taking the first.
- [x] Keep an uncertainty signal in the UI. The model emits no score, so
      nothing is presented as a checkmarked fact: results read "Looks like…",
      a material matched from the object's *name* rather than stated by the
      model is labelled as the weaker guess it is, and the model's raw answers
      are one click away under "show what the model actually said".
- [x] Warm the model up on load with a dummy generation, so the first real
      detection is not also paying for graph and shader initialisation.
- [x] Revoke object URLs, terminate the worker on unmount, and handle
      WebGPU-unavailable devices explicitly (fall back to WASM, tell the user
      why it is slow, surface a real error rather than hanging).
- [x] Test against real item photos — see **Measured accuracy** below.
- [x] Update [FRONTEND_IMPROVEMENTS.md](./FRONTEND_IMPROVEMENTS.md) F7. The
      confidence filter (F7.6) no longer applies and the material map (F7.7) was
      re-cut for open-vocabulary text; both rows are annotated.

### Measured accuracy

Six real photos (not studio product shots), run end-to-end through the shipped
prompts and parser, int8 on CPU:

| Photo | Model's answer | Result |
|---|---|---|
| Plastic bottle on a table | "a plastic bottle on top of a black table" | plastic ✓ (1 question) |
| Ring-pull drink can | "Can." | metal ✓ (inferred from the name) |
| Stack of newspapers | "Paper." | paper ✓ |
| Laptop | "a laptop" | electronics ✓ |
| Skateboarder jumping over a cardboard box | "Skateboarder." | no material — refused ✓ |
| Shop shelf of glass jars | "Store." | no material — refused ✓ |

The two failures are both **cluttered scenes with no single subject** — exactly
what [UploadGuidelines](../EcoRecycle-main/src/Components/UploadGuidelines.jsx)
tells users to avoid. In both, the system declined to name a material rather
than guessing one, which is the failure mode this was designed for. On
single-item photos it was right every time, including the case COCO-SSD could
never have handled (the laptop → e-waste).

Latency was 2–5s per photo on CPU int8; WebGPU q4 in the browser should be at
or better than that, and the WASM fallback worse — the UI says so when it lands
on WASM.

**Verdict: Option 2 is not needed.** Nothing here suggests the accuracy problem
this document was opened for still exists.

### Still open

- [ ] A pass in a real browser. Everything above was verified with the same
      Transformers.js calls the worker makes, but run under Node — WebGPU
      selection, the download-progress bar and the worker lifecycle have not
      been exercised in a browser.
- [ ] `npm run build` emits a 23 MB `ort-wasm-simd-threaded.asyncify.wasm` into
      `dist/` that is never fetched: Transformers.js points onnxruntime-web at
      the jsDelivr CDN by default, and the bundler emits the local copy anyway.
      Harmless at runtime, but it is dead weight in every deploy. Pointing
      `env.backends.onnx.wasm.wasmPaths` at the bundled copy would remove both
      the waste and the third-party CDN dependency, but which ORT variants Vite
      emits needs checking in a browser first.

### Pros

- Zero ongoing cost — no server, no API key, no rate limit, no vendor ToS
  over user images.
- Open vocabulary — not capped at a fixed class list, which is the actual
  root cause of the current low accuracy and narrow detection range.
- Same privacy posture as today: images never leave the device.
- Architecturally a swap, not a rewrite — same lazy-loaded-model,
  detect-button, results-list shape already in place.

### Cons

- Lower raw accuracy than a larger model (e.g. Moondream2) or a hosted
  API (Claude, Gemini) — the 256M model is the smallest, fastest tier,
  not the most capable one.
- Performance depends on the visitor's device; older phones or
  WebGPU-less browsers fall back to slower WASM.
- First-visit model download cost, same category as today's TF.js bundle.
- No built-in structured output guarantee — likely needs a hand-written
  response parser, with the failure modes that implies (malformed or
  unparseable model output needs a defined fallback, not a crash).
- Recyclability is still locale-dependent and the model can't know local
  council rules — same caveat as every option discussed, not specific to
  SmolVLM.
