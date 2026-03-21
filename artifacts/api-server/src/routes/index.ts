import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketcheckRouter from "./marketcheck";
import garageRouter from "./garage";
import logisticsRouter from "./logistics";
import deliveryRouter from "./delivery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketcheckRouter);
router.use(garageRouter);
router.use(logisticsRouter);
router.use(deliveryRouter);

export default router;
