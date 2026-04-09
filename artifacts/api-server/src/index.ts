import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import * as wsHub from "./lib/wsHub";
import { startPriceAlertJob } from "./lib/priceAlertJob";
import { initChains } from "./lib/chainOfCustody";
import { runStartupSecurityChecks } from "./lib/startupGuard";
import { startMaintenanceScheduler } from "./lib/maintenanceScheduler";
import { warmSecrets, CRITICAL_SECRETS } from "./lib/secrets";
import { ensureVehicleIndex } from "./lib/vehicleSearch";
import { eventBus } from "./lib/eventBus";
import { UACL_AGENT_MAP } from "./lib/protocols";
import { initGrowthSubscribers } from "./lib/growth-engine";
import { initCommunicationOrchestrator } from "./lib/communication-orchestrator";

// ── Security: validate all required secrets BEFORE binding the port ──────────
runStartupSecurityChecks();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

wsHub.attach(server);

async function startServer() {
  await ensureVehicleIndex().catch(err =>
    logger.warn({ err: (err as Error).message }, "[startup] Vehicle index init skipped")
  );

  server.listen(port, () => {
    logger.info({ port }, "Server listening");
    logger.info("WebSocket hub active at /ws");
    startPriceAlertJob();
    startMaintenanceScheduler();
    initChains().catch((err) => logger.warn({ err }, "initChains failed"));

    import("./lib/proofEngine").then(({ ensureGenesis, getChainStats }) => {
      ensureGenesis()
        .then(() => getChainStats())
        .then((stats) => logger.info(stats, "[genesis] ONYX Proof Engine — SEALED"))
        .catch((err) => logger.warn({ err: (err as Error).message }, "[genesis] Proof Engine init deferred"));
    });

    import("./lib/sovereignBehavior").then(({ getBehavioralStatus }) => {
      const status = getBehavioralStatus();
      logger.info({
        engineVersion: status.engineVersion,
        agentProfiles: status.agentProfiles,
        objectionTypes: status.objectionTypes,
        protocol: status.protocol,
        architect: status.architect,
        status: status.status,
      }, "[genesis] Sovereign Behavioral Execution Engine — ARMED");
    });

    Promise.all([
      import("./lib/stateTransitionHardener"),
      import("./lib/michelinDemandEngine"),
      import("./lib/distributionHubEngine"),
    ]).then(([sh, md, dh]) => {
      const hardener = sh.getHardenerStatus();
      const michelin = md.getMichelinEngineStatus();
      const hub = dh.getHubEngineStatus();
      logger.info({
        stateHardener: { domains: hardener.domains, states: hardener.totalStates, transitions: hardener.totalTransitions, status: hardener.status },
        michelinDemand: { frictionTypes: michelin.frictionEventTypes, tiers: michelin.demandTiers, status: michelin.status },
        distributionHub: { tiers: hub.tiers, categories: hub.categories, status: hub.status },
        architect: "Ronald Antonio Cadet",
      }, "[genesis] Sovereign Hardened Infrastructure — ARMED");
    }).catch(err => logger.warn({ err: (err as Error).message }, "[genesis] Hardened infra init deferred"));

    Promise.all([
      import("./lib/sovereignServiceMesh"),
      import("./lib/onyxMetricsEngine"),
      import("./lib/onyxLogAggregator"),
      import("./lib/onyxObjectVault"),
      import("./lib/onyxCIPipeline"),
    ]).then(([meshMod, metricsMod, logsMod, vaultMod, ciMod]) => {
      meshMod.serviceMesh.genesis();
      metricsMod.metricsEngine.genesis();
      logsMod.logAggregator.genesis();
      vaultMod.objectVault.genesis();
      ciMod.ciPipeline.genesis();
      logger.info({
        serviceMesh: "ARMED",
        metricsEngine: "ARMED",
        logAggregator: "ARMED",
        objectVault: "ARMED",
        ciPipeline: "ARMED",
        architect: "Ronald Antonio Cadet",
      }, "[genesis] Sovereign Infrastructure Grid — ALL 5 SYSTEMS ARMED");
    }).catch(err => logger.warn({ err: (err as Error).message }, "[genesis] Infrastructure Grid init deferred"));

    warmSecrets([...CRITICAL_SECRETS]).catch(err =>
      logger.warn({ err: (err as Error).message }, "[startup] Secrets warm skipped")
    );
    logger.info(eventBus.getStatus(), "[startup] EventBus initialized");
    initGrowthSubscribers();
    initCommunicationOrchestrator();

    const agentCount = Object.keys(UACL_AGENT_MAP).filter(k => k !== "unknown").length;
    const agentNames = Object.entries(UACL_AGENT_MAP)
      .filter(([k]) => k !== "unknown")
      .map(([, v]) => v.agent);
    logger.info({ agentCount, agents: agentNames }, "[genesis] Agent Mesh activated");
    logger.info("[genesis] Protocols S1·S2·S3 — ACTIVE");

    const { initPaperworkKiller } = require("./lib/paperworkKiller") as typeof import("./lib/paperworkKiller");
    initPaperworkKiller();
    logger.info("[genesis] S1-S3 Paperwork-Killer cascade — ARMED");

    logger.info("[genesis] Automotive Ecosystem OS — ONLINE");
  });
}

startServer();

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});

// ── Graceful Shutdown — SIGTERM / SIGINT with connection draining ─────────────
// Inspired by the 12-factor app standard and AWS ECS task shutdown behavior.
// - On SIGTERM (container stop / deployment): stop accepting new connections,
//   drain in-flight requests for up to 15 s, then exit cleanly.
// - On SIGINT (Ctrl+C in dev): same flow, faster.
// - On unhandledRejection / uncaughtException: log + exit(1) so the process
//   supervisor (ECS, K8s, Replit) immediately restarts rather than running
//   in a zombie state.

const DRAIN_TIMEOUT_MS = 15_000;
let isShuttingDown = false;

function gracefulShutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutdown signal received — draining connections");

  // Stop accepting new HTTP connections
  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during server.close()");
      process.exit(1);
    }
    logger.info("All connections drained — exiting cleanly");
    process.exit(0);
  });

  // Force-kill if drain takes too long (stuck websockets, long-running requests)
  setTimeout(() => {
    logger.warn({ drainTimeoutMs: DRAIN_TIMEOUT_MS }, "Drain timeout exceeded — force exit");
    process.exit(1);
  }, DRAIN_TIMEOUT_MS).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// ── Unhandled rejections / exceptions — log and crash fast ───────────────────
// A zombie process serving requests with corrupted state is far more dangerous
// than a restart. Fail fast; let the supervisor recover.
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "UNHANDLED_REJECTION — crashing to avoid corrupt state");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "UNCAUGHT_EXCEPTION — crashing to avoid corrupt state");
  process.exit(1);
});
