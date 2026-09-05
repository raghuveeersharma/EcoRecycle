import env, { assertEnv } from "./Config/env.js";
import app from "./app.js";
import connection, { disconnect } from "./Config/dbConnections.js";
import logger from "./Utils/logger.js";

assertEnv();

const start = async () => {
  await connection();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnect();
      logger.info("Shutdown complete");
      process.exit(0);
    });
    // Do not hang forever on stuck connections.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection:", reason);
    shutdown("unhandledRejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception:", err);
    process.exit(1);
  });
};

start();
