import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketcheckRouter from "./marketcheck";
import garageRouter from "./garage";
import logisticsRouter from "./logistics";
import deliveryRouter from "./delivery";
import walletRouter from "./wallet";
import auditRouter from "./audit";
import specialistsRouter from "./specialists";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketcheckRouter);
router.use(garageRouter);
router.use(logisticsRouter);
router.use(deliveryRouter);
router.use(walletRouter);
router.use(auditRouter);
router.use(specialistsRouter);

export default router;
