/**
 * The longest edge SmolVLM's image processor resizes to internally
 * (`max_image_size.longest_edge` in the checkpoint's preprocessor config).
 * Matching it here means the browser does the downscale once, with a proper
 * resampling filter, instead of handing the model a full-resolution photo.
 */
export const MODEL_INPUT_EDGE = 512;

const createCanvas = (width, height) =>
  typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement("canvas"), { width, height });

/**
 * Decodes an uploaded file and draws it to an offscreen canvas at the model's
 * input size, returning raw RGBA pixels ready to post to the worker.
 *
 * The old detector passed the CSS-shrunk `<img>` element straight to the model,
 * which threw away resolution for no reason; this draws from the decoded
 * bitmap instead, so display size and inference size are independent.
 *
 * @param {File|Blob} file
 * @returns {Promise<{data: Uint8ClampedArray, width: number, height: number}>}
 */
export const prepareImage = async (file) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Safari < 17 rejects the options bag rather than ignoring it.
    bitmap = await createImageBitmap(file);
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    // Only ever downscale — upscaling a small photo adds no information.
    const scale = longest > MODEL_INPUT_EDGE ? MODEL_INPUT_EDGE / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get a 2D canvas context.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    return { data, width, height };
  } finally {
    bitmap.close?.();
  }
};
