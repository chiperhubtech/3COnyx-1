import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketcheckRouter from "./marketcheck";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketcheckRouter);

export default router;
