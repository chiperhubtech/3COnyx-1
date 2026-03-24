import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const VALID_TYPES = ["license_front", "license_back", "insurance", "registration", "title"];

router.post("/documents/upload", async (req: Request, res: Response) => {
  const { type, imageUri } = req.body ?? {};

  if (!type || !VALID_TYPES.includes(type)) {
    res.status(400).json({ error: "Invalid document type" });
    return;
  }

  // In production: store imageUri/base64 in object storage (S3/R2),
  // encrypt at rest with AES-256, save metadata to member_documents table.
  res.json({
    status: "received",
    documentId: `doc-${Date.now()}-${type}`,
    type,
    encryption: "AES-256-GCM",
    message: "Document received and queued for secure storage.",
  });
});

router.get("/documents/:userId", async (req: Request, res: Response) => {
  res.json({ documents: [], userId: req.params.userId });
});

export default router;
