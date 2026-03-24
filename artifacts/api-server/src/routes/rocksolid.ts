/**
 * 3C Onyx — AR Core Bridge
 * Production target: IPC/FFI bridge to native Basemark Rocksolid AR renderer.
 * Current: Lightweight status stub until native module ships.
 */
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/ar/status", (_req: Request, res: Response) => {
  res.json({ status: "standby", engine: "rocksolid", version: "0.9.0-staging" });
});

router.post("/ar/session/start", (_req: Request, res: Response) => {
  res.json({ sessionId: `ar-${Date.now()}`, status: "initialized" });
});

router.post("/ar/session/:sessionId/end", (req: Request, res: Response) => {
  res.json({ sessionId: req.params.sessionId, status: "closed" });
});

export default router;
