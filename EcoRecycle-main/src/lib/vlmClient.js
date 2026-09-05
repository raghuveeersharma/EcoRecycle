/**
 * Main-thread half of the SmolVLM worker: turns its message stream into
 * promises, and keeps the React component free of postMessage plumbing.
 */
export class VlmClient {
  constructor({ onProgress, onNotice } = {}) {
    this.worker = new Worker(
      new URL("../workers/vlm.worker.js", import.meta.url),
      { type: "module" }
    );
    this.onProgress = onProgress;
    this.onNotice = onNotice;
    this.pending = new Map();
    this.loadWaiter = null;
    this.device = null;
    this.nextId = 0;

    this.worker.addEventListener("message", this.handleMessage);
    this.worker.addEventListener("error", this.handleWorkerError);
  }

  handleMessage = ({ data }) => {
    switch (data.type) {
      case "progress":
        this.onProgress?.(data.payload);
        break;
      case "notice":
        this.onNotice?.(data.message);
        break;
      case "ready":
        this.device = data.device;
        this.loadWaiter?.resolve(data.device);
        this.loadWaiter = null;
        break;
      case "load-error":
        this.loadWaiter?.reject(new Error(data.message));
        this.loadWaiter = null;
        this.loadPromise = null;
        break;
      case "stream":
        this.pending.get(data.id)?.onStream?.(data.chunk);
        break;
      case "result": {
        const entry = this.pending.get(data.id);
        this.pending.delete(data.id);
        entry?.resolve(data.response);
        break;
      }
      case "generate-error": {
        const entry = this.pending.get(data.id);
        this.pending.delete(data.id);
        entry?.reject(new Error(data.message));
        break;
      }
      default:
        break;
    }
  };

  // A worker that dies takes every outstanding promise with it; without this
  // the UI would sit on a spinner forever.
  handleWorkerError = (event) => {
    const error = new Error(event.message || "The detection worker crashed.");
    this.loadWaiter?.reject(error);
    this.loadWaiter = null;
    this.loadPromise = null;
    for (const entry of this.pending.values()) entry.reject(error);
    this.pending.clear();
  };

  /** Loads and warms up the model. Repeat calls share one load. */
  load() {
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        this.loadWaiter = { resolve, reject };
        this.worker.postMessage({ type: "load" });
      });
    }
    return this.loadPromise;
  }

  /**
   * @param {string} prompt
   * @param {{data: Uint8ClampedArray, width: number, height: number}} image
   * @param {number} maxNewTokens
   * @param {(chunk: string) => void} [onStream]
   * @returns {Promise<string>}
   */
  generate(prompt, image, maxNewTokens, onStream) {
    const id = `gen-${this.nextId++}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onStream });
      this.worker.postMessage({ type: "generate", id, prompt, image, maxNewTokens });
    });
  }

  /** Stops the generation in flight; it resolves with whatever it had. */
  interrupt() {
    this.worker.postMessage({ type: "interrupt" });
  }

  dispose() {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleWorkerError);
    this.worker.terminate();
    this.pending.clear();
  }
}

/**
 * Collapses Transformers.js's per-file progress events into a single
 * percentage, so the UI can show one bar for a multi-file download.
 */
export const createProgressTracker = () => {
  const files = new Map();
  return (event) => {
    if (event.status === "progress" || event.status === "done") {
      const total = event.total ?? files.get(event.file)?.total ?? 0;
      const loaded = event.status === "done" ? total : (event.loaded ?? 0);
      files.set(event.file, { loaded, total });
    } else if (event.status === "initiate") {
      files.set(event.file, { loaded: 0, total: event.total ?? 0 });
    } else {
      return null;
    }

    let loaded = 0;
    let total = 0;
    for (const entry of files.values()) {
      loaded += entry.loaded;
      total += entry.total;
    }
    // Totals only firm up as each file starts, so early percentages would jump
    // around; report null until every known file has a size.
    if (!total) return null;
    return Math.min(100, Math.round((loaded / total) * 100));
  };
};
