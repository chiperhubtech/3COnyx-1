import { Router, type IRouter, type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../lib/trpc";
import blockchainRouter from "./blockchain";
import orchestratorRouter from "./orchestrator";
import healthRouter from "./health";
import marketcheckRouter from "./marketcheck";
import garageRouter from "./garage";
import logisticsRouter from "./logistics";
import deliveryRouter from "./delivery";
import walletRouter from "./wallet";
import auditRouter from "./audit";
import specialistsRouter from "./specialists";
import geminiRouter from "./gemini/index";
import notificationsRouter from "./notifications";
import inspectionsRouter from "./inspections";
import watchlistRouter from "./watchlist";
import analyticsRouter from "./analytics";
import mcpRouter from "./mcp/index";
import ciRouter from "./ci";
import plaidRouter from "./plaid";
import insuremoRouter from "./insuremo";
import motorRouter from "./motor";
import browserbaseRouter from "./browserbase";
import gumloopRouter from "./gumloop";
import dynastyRouter from "./dynasty";
import dropshipRouter from "./dropship";
import securityRouter from "./security";
import commandRouter from "./command";
import guardianRouter from "./guardian";
import subscriptionRouter from "./subscription";
import fullpathRouter from "./fullpath";
import reputationRouter from "./reputation";
import unityRouter from "./unity";
import agentsRouter from "./agents";
import impactRouter from "./impact";
import proRouter from "./pro";
import rocksolidRouter from "./rocksolid";
import spinmediaRouter from "./spinmedia";
import authRouter from "./auth";
import adminRouter from "./admin";
import waitlistRouter from "./waitlist";
import escalationRouter from "./escalation";
import checkoutRouter from "./checkout";
import runnerRouter from "./runner";
import intelligenceRouter from "./intelligence";
import foundingRouter from "./founding";
import growthRouter from "./growth";
import enhanceRouter from "./enhance";
import documentsRouter from "./documents";
import engineRouter from "./engine";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketcheckRouter);
router.use(garageRouter);
router.use(logisticsRouter);
router.use(deliveryRouter);
router.use(walletRouter);
router.use(auditRouter);
router.use(specialistsRouter);
router.use(geminiRouter);
router.use(notificationsRouter);
router.use(inspectionsRouter);
router.use(watchlistRouter);
router.use(analyticsRouter);
router.use(mcpRouter);
router.use(ciRouter);
router.use(plaidRouter);
router.use(insuremoRouter);
router.use(motorRouter);
router.use(browserbaseRouter);
router.use(gumloopRouter);
router.use(dynastyRouter);
router.use(dropshipRouter);
router.use(securityRouter);
router.use(commandRouter);
router.use("/guardian", guardianRouter);
router.use("/subscription", subscriptionRouter);
router.use("/fullpath", fullpathRouter);
router.use("/reputation", reputationRouter);
router.use("/unity", unityRouter);
router.use(agentsRouter);
router.use(impactRouter);
router.use(proRouter);
router.use(blockchainRouter);
router.use(rocksolidRouter);
router.use(spinmediaRouter);
router.use(authRouter);
router.use("/admin", adminRouter);
router.use(waitlistRouter);
router.use(escalationRouter);
router.use(checkoutRouter);
router.use(runnerRouter);
router.use(intelligenceRouter);
router.use(foundingRouter);
router.use(growthRouter);
router.use(enhanceRouter);
router.use(documentsRouter);
router.use(engineRouter);
router.use(orchestratorRouter);

router.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  }),
);

router.get("/ws-stats", (_req: Request, res: Response) => {
  const { stats } = require("../lib/wsHub") as typeof import("../lib/wsHub");
  res.json({ ...stats(), ts: new Date().toISOString() });
});

router.get("/ai-router/status", (_req: Request, res: Response) => {
  const { getRouterStatus } = require("../lib/ai-router") as typeof import("../lib/ai-router");
  res.json(getRouterStatus());
});

export default router;
