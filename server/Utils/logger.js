import env from "../Config/env.js";

// "silent" suppresses everything; used by the test suite.
const LEVELS = { silent: -1, error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[env.LOG_LEVEL] ?? LEVELS.info;

const emit = (level, args) => {
  if (LEVELS[level] > threshold) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}]`;
  const sink = level === "error" ? console.error : console.log;
  sink(line, ...args);
};

const logger = {
  error: (...args) => emit("error", args),
  warn: (...args) => emit("warn", args),
  info: (...args) => emit("info", args),
  debug: (...args) => emit("debug", args),
};

export default logger;
