/**
 * SmolVLM inference worker.
 *
 * Generation runs a transformer token by token; on the WASM fallback that is
 * seconds of solid CPU work, so it lives off the main thread — otherwise the
 * page (including the spinner meant to say "working") freezes while it runs.
 */
import {
  AutoModelForVision2Seq,
  AutoProcessor,
  InterruptableStoppingCriteria,
  RawImage,
  TextStreamer,
  env,
} from "@huggingface/transformers";

// The weights are fetched from the Hugging Face CDN; there is no local copy to
// probe for, and looking for one just produces 404s in the console.
env.allowLocalModels = false;

const MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct";

// 4-bit weights for the two big graphs, fp16 embeddings: the combination the
// Transformers.js SmolVLM demo ships, and what keeps this inside the ~1GB of
// VRAM a modest integrated GPU will give us.
const WEBGPU_DTYPE = {
  embed_tokens: "fp16",
  vision_encoder: "q4",
  decoder_model_merged: "q4",
};
// WASM has no fp16 path, so everything is int8 there.
const WASM_DTYPE = {
  embed_tokens: "q8",
  vision_encoder: "q8",
  decoder_model_merged: "q8",
};

let processor = null;
let model = null;
let device = null;
let loadPromise = null;
let stopper = null;
/** Generation is not reentrant — requests are chained onto this. */
let queue = Promise.resolve();

const post = (message) => self.postMessage(message);

const errorMessage = (error) =>
  error?.message || String(error) || "Unknown error";

async function loadModel() {
  const progress_callback = (payload) => post({ type: "progress", payload });

  processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });

  // WebGPU first, WASM second. `navigator.gpu` existing is not a promise that
  // a device can actually be acquired, so a failure here falls through rather
  // than surfacing as "the model is broken".
  const devices = "gpu" in navigator ? ["webgpu", "wasm"] : ["wasm"];
  let lastError = null;

  for (const candidate of devices) {
    try {
      model = await AutoModelForVision2Seq.from_pretrained(MODEL_ID, {
        device: candidate,
        dtype: candidate === "webgpu" ? WEBGPU_DTYPE : WASM_DTYPE,
        progress_callback,
      });
      device = candidate;
      return;
    } catch (error) {
      lastError = error;
      post({
        type: "notice",
        message: `${candidate} backend unavailable: ${errorMessage(error)}`,
      });
      model = null;
    }
  }

  throw lastError ?? new Error("No usable inference backend.");
}

/** A neutral grey square, only ever used to warm the graphs up. */
const warmupImage = () =>
  new RawImage(new Uint8ClampedArray(64 * 64 * 3).fill(128), 64, 64, 3);

async function generate({ prompt, image, maxNewTokens, id, stream }) {
  const messages = [
    { role: "user", content: [{ type: "image" }, { type: "text", text: prompt }] },
  ];
  const text = processor.apply_chat_template(messages, {
    add_generation_prompt: true,
  });
  const inputs = await processor(text, [image], { do_image_splitting: false });

  stopper = new InterruptableStoppingCriteria();

  const streamer = stream
    ? new TextStreamer(processor.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (chunk) => post({ type: "stream", id, chunk }),
      })
    : undefined;

  try {
    const output = await model.generate({
      ...inputs,
      max_new_tokens: maxNewTokens,
      do_sample: false,
      streamer,
      stopping_criteria: stopper,
    });

    // Drop the prompt tokens; only the model's own answer is wanted.
    const answer = output.slice(null, [inputs.input_ids.dims.at(-1), null]);
    const [decoded] = processor.batch_decode(answer, { skip_special_tokens: true });
    return decoded.trim();
  } finally {
    stopper = null;
  }
}

const enqueue = (task) => {
  const run = queue.then(task, task);
  // Keep the chain alive after a failed task without swallowing the result.
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

self.addEventListener("message", async ({ data }) => {
  switch (data.type) {
    case "load": {
      if (!loadPromise) {
        loadPromise = loadModel().catch((error) => {
          // Let a later "load" retry after a transient network failure.
          loadPromise = null;
          throw error;
        });
      }
      try {
        await loadPromise;
        // Warm up so the first real detection is not also paying for shader
        // compilation and graph initialisation.
        await enqueue(() =>
          generate({
            prompt: "What is this?",
            image: warmupImage(),
            maxNewTokens: 1,
            id: "warmup",
            stream: false,
          })
        );
        post({ type: "ready", device });
      } catch (error) {
        post({ type: "load-error", message: errorMessage(error) });
      }
      break;
    }

    case "generate": {
      const { id, prompt, maxNewTokens, image } = data;
      try {
        const raw = new RawImage(
          new Uint8ClampedArray(image.data),
          image.width,
          image.height,
          4
        ).rgb();
        const response = await enqueue(() =>
          generate({ prompt, image: raw, maxNewTokens, id, stream: true })
        );
        post({ type: "result", id, response });
      } catch (error) {
        post({ type: "generate-error", id, message: errorMessage(error) });
      }
      break;
    }

    case "interrupt": {
      stopper?.interrupt();
      break;
    }

    default:
      break;
  }
});
