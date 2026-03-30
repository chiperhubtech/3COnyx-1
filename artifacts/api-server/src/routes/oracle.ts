/**
 * 3C ONYX — Oracle Cloud Integration Routes
 * GET  /api/oracle/status   — integration health + setup instructions
 * POST /api/oracle/upload   — upload object to Oracle bucket
 */
import { Router, type Request, type Response } from "express";
import { getOracleStatus, uploadToOracle, type OraclePrefix } from "../lib/oracleStorage";

const router = Router();

// GET /api/oracle/status
router.get("/oracle/status", (_req: Request, res: Response) => {
  res.json({ ok: true, ...getOracleStatus() });
});

// POST /api/oracle/upload
router.post("/oracle/upload", async (req: Request, res: Response) => {
  const { objectName, contentType, prefix } = req.body as {
    objectName: string;
    contentType?: string;
    prefix?: OraclePrefix;
  };

  if (!objectName?.trim()) {
    res.status(400).json({ error: "objectName required" });
    return;
  }

  const result = await uploadToOracle(
    objectName,
    Buffer.from("placeholder"),
    contentType ?? "application/octet-stream",
    prefix ?? "platform"
  );

  res.json(result);
});

export default router;
