import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketcheckRouter from "./marketcheck";
import garageRouter from "./garage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketcheckRouter);
router.use(garageRouter);

export default router;
