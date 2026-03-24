// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

const MOTOR_API_KEY = process.env.MOTOR_API_KEY;
const MOTOR_BASE = "https://api.motor.com/v2";

function isLive() {
  return !!MOTOR_API_KEY;
}

function generateHistory(vin: string) {
  const hash = crypto.createHash("sha256").update(vin).digest("hex");
  const seed = parseInt(hash.slice(0, 8), 16);
  const prng = (n: number) => ((seed * 1103515245 + n * 12345) & 0x7fffffff) / 0x7fffffff;

  const owners = Math.floor(prng(1) * 2) + 1;
  const accidents = Math.floor(prng(2) * 2);
  const serviceRecords = Math.floor(prng(3) * 8) + 3;
  const odometer = Math.floor(prng(4) * 60000) + 8000;

  const eventTypes = ["Title", "Registration Renewal", "Service Record", "Emissions Test", "Transfer of Ownership", "Loan/Lien"];

  const events = Array.from({ length: 8 }, (_, i) => {
    const month = 12 - i * 2;
    const year = month <= 0 ? 2024 : 2025;
    const adjMonth = month <= 0 ? month + 12 : month;
    return {
      date: `${year}-${String(adjMonth).padStart(2, "0")}-${String(Math.floor(prng(i + 10) * 28) + 1).padStart(2, "0")}`,
      type: eventTypes[Math.floor(prng(i + 20) * eventTypes.length)],
      odometer: Math.floor(odometer * (1 - i * 0.1)),
      state: ["CA", "FL", "NY", "TX", "NV"][Math.floor(prng(i + 30) * 5)],
      source: ["DMV", "Dealer", "Service Center", "Insurance"][Math.floor(prng(i + 40) * 4)],
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  return {
    vin_masked: "•".repeat(vin.length - 4) + vin.slice(-4),
    owners,
    accidents,
    accident_details: accidents > 0 ? [{ date: "2024-08-14", severity: "Minor", reported_by: "Insurance", repaired: true }] : [],
    service_records: serviceRecords,
    odometer,
    title_status: "Clean",
    lemon_law: false,
    theft_record: false,
    flood_damage: false,
    structural_damage: accidents > 1,
    salvage: false,
    auction_record: false,
    rental_history: false,
    events,
    market_value: 145_000 + Math.floor(prng(99) * 80000),
    condition_score: Math.floor(prng(50) * 25) + 70,
    retrieved_at: new Date().toISOString(),
  };
}

// GET /api/motor/history/:vin
router.get("/motor/history/:vin", async (req: Request, res: Response) => {
  const { vin } = req.params;
  if (!vin || vin.length < 5) { res.status(400).json({ error: "Valid VIN required" }); return; }

  if (isLive()) {
    try {
      const resp = await fetch(`${MOTOR_BASE}/vehicle/${vin}/history`, {
        headers: { "X-API-Key": MOTOR_API_KEY! },
      });
      const data = await resp.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("Motor.com error:", err);
    }
  }

  res.json({ ...generateHistory(vin), simulated: !isLive() });
});

// GET /api/motor/market-value/:vin
router.get("/motor/market-value/:vin", async (req: Request, res: Response) => {
  const { vin } = req.params;
  if (!vin) { res.status(400).json({ error: "VIN required" }); return; }

  const hash = crypto.createHash("sha256").update(vin).digest("hex");
  const seed = parseInt(hash.slice(0, 8), 16);
  const base = 80000 + (seed % 200000);

  res.json({
    vin_masked: "•".repeat(vin.length - 4) + vin.slice(-4),
    retail_value: base,
    trade_in_value: Math.floor(base * 0.88),
    private_party_value: Math.floor(base * 0.94),
    auction_value: Math.floor(base * 0.82),
    price_trend: seed % 3 === 0 ? "declining" : seed % 3 === 1 ? "stable" : "appreciating",
    price_change_30d: ((seed % 20) - 10) * 100,
    comparable_listings: Math.floor(seed % 40) + 5,
    simulated: !isLive(),
  });
});

export default router;
