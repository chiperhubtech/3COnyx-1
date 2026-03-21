import { Router, type IRouter } from "express";
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

export default router;
