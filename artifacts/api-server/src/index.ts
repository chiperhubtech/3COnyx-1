import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import * as wsHub from "./lib/wsHub";
import { startPriceAlertJob } from "./lib/priceAlertJob";

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

const server = http.createServer(app);

wsHub.attach(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
  logger.info("WebSocket hub active at /ws");
  startPriceAlertJob();
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
