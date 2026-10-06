import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  SmartcarError, connections, createConnect, verifyConnectState, configured, redirectUri,
  mode, normalizeSignals, smartcarRequest, vehicleSummary,
} from "../lib/smartcar";

const router = Router();
const cookie = "onyx_smartcar_state";
const cookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/garage/callback" };
function fail(req: Request, res: Response, err: unknown) {
  const status = err instanceof SmartcarError ? err.status : 502;
  // Never log provider response bodies, credentials, state, or URLs with tokens.
  req.log.warn({ status }, "Smartcar request failed");
  res.status(status).json({ error: err instanceof SmartcarError ? err.message : "Smartcar is temporarily unavailable. Please try again.", mode: "unavailable" });
}
router.get("/garage/callback", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  try {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const nonce = typeof req.cookies?.[cookie] === "string" ? req.cookies[cookie] : "";
    const userId = await verifyConnectState(state, nonce);
    res.clearCookie(cookie, cookieOptions);
    const destination = new URL("/garage", redirectUri());
    if (req.query.error) {
      destination.searchParams.set("smartcar", "cancelled");
    } else {
      const list = await connections(userId);
      const linked = typeof req.query.user_id === "string" &&
        list.some(c => c.attributes.user.id === req.query.user_id);
      destination.searchParams.set("smartcar", linked ? "connected" : "pending");
    }
    res.redirect(303, destination.toString());
  } catch {
    res.clearCookie(cookie, cookieOptions);
    res.status(400).type("text").send("Smartcar connection could not be confirmed. Return to your garage and try Connect Vehicle again.");
  }
});
router.use("/garage", requireAuth, (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/garage/status", (_req, res) => {
  res.json({ configured: configured(), mode: mode() });
});
router.post("/garage/connect", async (req, res) => {
  try {
    const result = await createConnect(req.user!.sub);
    res.cookie(cookie, result.nonce, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
    res.json({ connectUrl: result.connectUrl, mode: "smartcar" });
  } catch (err) { fail(req, res, err); }
});
router.get("/garage/vehicles", async (req, res) => {
  try {
    if (!configured()) throw new SmartcarError(503, "Smartcar is not fully configured.");
    res.json({ vehicles: (await connections(req.user!.sub)).map(vehicleSummary), mode: mode() });
  } catch (err) { fail(req, res, err); }
});
router.get("/garage/vehicles/:id/telemetry", async (req, res) => {
  try {
    const connection = (await connections(req.user!.sub)).find(c => c.relationships.vehicle.data.id === req.params.id);
    if (!connection) { res.status(404).json({ error: "Vehicle not found in your garage." }); return; }
    const data = await smartcarRequest(`/vehicles/${encodeURIComponent(req.params.id as string)}/signals`, connection.attributes.user.id);
    const telemetry = normalizeSignals(data.data);
    res.json({ ...telemetry, vehicleId: req.params.id, fuelType: vehicleSummary(connection).fuelType, mode: connection.attributes.vehicle.mode });
  } catch (err) { fail(req, res, err); }
});
router.delete("/garage/vehicles/:id", async (req, res) => {
  try {
    const connection = (await connections(req.user!.sub)).find(c => c.relationships.vehicle.data.id === req.params.id);
    if (!connection) { res.status(404).json({ error: "Vehicle not found in your garage." }); return; }
    await smartcarRequest(`/connections/${encodeURIComponent(connection.id)}`, undefined, "DELETE");
    res.json({ success: true });
  } catch (err) { fail(req, res, err); }
});
export default router;
