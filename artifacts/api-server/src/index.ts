import app from "./app";
import { logger } from "./lib/logger";

if (!process.env.DATABASE_URL) {
  logger.warn("DATABASE_URL is not set — all database queries will fail");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening on 0.0.0.0");
});

server.on("error", (err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
