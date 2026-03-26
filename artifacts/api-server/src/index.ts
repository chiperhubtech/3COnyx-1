import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import * as wsHub from "./lib/wsHub";
import { startPriceAlertJob } from "./lib/priceAlertJob";
import { initChains } from "./lib/chainOfCustody";
import { runStartupSecurityChecks } from "./lib/startupGuard";
import { startMaintenanceScheduler } from "./lib/maintenanceScheduler";

// ── Security: validate all required secrets BEFORE binding the port ──────────
runStartupSecurityChecks();

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
  startMaintenanceScheduler();
  initChains().catch((err) => logger.warn({ err }, "initChains failed"));
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
