import { Router, type IRouter, type Request, type Response } from "express";

// Vehicle linking, ownership and telemetry live in the Smartcar router.
// Keep the existing specialist-request contract separate from vehicle authorization.
const router: IRouter = Router();
router.post("/garage/specialist", (req: Request, res: Response) => {
  const { vehicleId, name, phone, concern } = req.body as {
    vehicleId: string; name: string; phone: string; concern?: string;
  };
  if (!vehicleId || !name || !phone) {
    res.status(400).json({ error: "vehicleId, name, and phone are required" });
    return;
  }
  const refId = `3CS-${Date.now().toString().slice(-6)}`;
  req.log.info({ vehicleId, refId }, "Specialist request submitted");
  res.json({
    success: true, refId,
    message: "A 3C Specialist will contact you within 2 hours.", eta: "2 hours",
  });
});
export default router;
