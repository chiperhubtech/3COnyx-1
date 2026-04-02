import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

const PREDII_API_KEY = process.env.PREDII_API_KEY;
const PREDII_BASE = process.env.PREDII_BASE_URL || "https://api.predii.com/v1";

function isLive(): boolean {
  return !!PREDII_API_KEY;
}

router.get("/predii/status", (_req: Request, res: Response) => {
  res.json({
    provider: "Predii",
    live: isLive(),
    mode: isLive() ? "production" : "demo",
    capabilities: ["diagnostic_analysis", "repair_prediction", "parts_lookup", "labor_estimate", "symptom_decode"],
    description: "Automotive AI platform — repair data, parts search, service workflow intelligence",
  });
});

router.post("/predii/diagnose", async (req: Request, res: Response) => {
  const { dtcCodes, symptoms, vin, make, model, year, mileage } = req.body as {
    dtcCodes?: string[];
    symptoms?: string[];
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
  };

  if (!dtcCodes?.length && !symptoms?.length) {
    res.status(400).json({ error: "Provide dtcCodes[] or symptoms[] for diagnosis" });
    return;
  }

  if (isLive()) {
    try {
      const r = await fetch(`${PREDII_BASE}/diagnose`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PREDII_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dtcCodes, symptoms, vin, make, model, year, mileage }),
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[predii] diagnose error:", err);
    }
  }

  const hash = crypto.createHash("md5").update(JSON.stringify({ dtcCodes, symptoms })).digest("hex");
  const seed = parseInt(hash.slice(0, 6), 16);

  const codeMap: Record<string, { system: string; description: string; severity: string; repair: string; laborHrs: number; partsCost: number }> = {
    P0300: { system: "Engine", description: "Random/Multiple Cylinder Misfire", severity: "high", repair: "Replace spark plugs and ignition coils, check fuel injectors", laborHrs: 2.5, partsCost: 280 },
    P0420: { system: "Emissions", description: "Catalyst System Efficiency Below Threshold (Bank 1)", severity: "medium", repair: "Replace catalytic converter or diagnose O2 sensors", laborHrs: 3.0, partsCost: 850 },
    P0171: { system: "Fuel System", description: "System Too Lean (Bank 1)", severity: "medium", repair: "Check for vacuum leaks, clean MAF sensor, inspect fuel pump", laborHrs: 1.5, partsCost: 120 },
    P0442: { system: "EVAP", description: "Evaporative Emission System Leak (Small)", severity: "low", repair: "Replace gas cap or inspect EVAP canister purge valve", laborHrs: 0.5, partsCost: 45 },
    P0128: { system: "Cooling", description: "Coolant Thermostat Below Regulating Temperature", severity: "medium", repair: "Replace thermostat and coolant flush", laborHrs: 1.5, partsCost: 95 },
  };

  const diagnoses = (dtcCodes ?? []).map(code => {
    const known = codeMap[code.toUpperCase()];
    if (known) return { code, ...known };
    return {
      code,
      system: "Unknown",
      description: `Diagnostic code ${code} — requires OBD-II deep scan`,
      severity: "medium",
      repair: "Schedule diagnostic appointment with 3C Specialist",
      laborHrs: 1.0,
      partsCost: 0,
    };
  });

  const symptomAnalysis = (symptoms ?? []).map(s => ({
    symptom: s,
    possibleCauses: [
      `${s} — most common cause for ${year ?? 2023} ${make ?? "vehicle"}: worn component`,
      `${s} — secondary cause: sensor malfunction or calibration drift`,
    ],
    urgency: seed % 3 === 0 ? "immediate" : seed % 3 === 1 ? "soon" : "monitor",
    recommendedAction: "Schedule inspection with 3C Certified Specialist",
  }));

  const totalLabor = diagnoses.reduce((a, d) => a + d.laborHrs, 0);
  const totalParts = diagnoses.reduce((a, d) => a + d.partsCost, 0);
  const laborRate = 125;

  res.json({
    vehicle: { vin, make, model, year, mileage },
    diagnoses,
    symptomAnalysis,
    estimate: {
      laborHours: totalLabor,
      laborRate,
      laborTotal: Math.round(totalLabor * laborRate),
      partsTotal: totalParts,
      grandTotal: Math.round(totalLabor * laborRate + totalParts),
      currency: "USD",
    },
    confidence: 0.87 + (seed % 10) * 0.01,
    recommendedPriority: diagnoses.some(d => d.severity === "high") ? "urgent" : "scheduled",
    generatedAt: new Date().toISOString(),
    simulated: true,
  });
});

router.post("/predii/parts-lookup", async (req: Request, res: Response) => {
  const { partNumber, description, vin, make, model, year } = req.body as {
    partNumber?: string;
    description?: string;
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
  };

  if (!partNumber && !description) {
    res.status(400).json({ error: "Provide partNumber or description" });
    return;
  }

  if (isLive()) {
    try {
      const r = await fetch(`${PREDII_BASE}/parts/search`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PREDII_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ partNumber, description, vin, make, model, year }),
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[predii] parts error:", err);
    }
  }

  const query = partNumber || description || "";
  res.json({
    query,
    vehicle: { make, model, year },
    results: [
      { partNumber: "OEM-" + query.slice(0, 6).toUpperCase(), brand: "OEM", description: `${query} — factory original`, price: 189.99, availability: "in_stock", fitment: "confirmed", source: "dealer" },
      { partNumber: "AFT-" + query.slice(0, 6).toUpperCase(), brand: "Aftermarket Premium", description: `${query} — performance equivalent`, price: 129.99, availability: "in_stock", fitment: "confirmed", source: "3c_network" },
      { partNumber: "REM-" + query.slice(0, 6).toUpperCase(), brand: "Remanufactured", description: `${query} — certified remanufactured`, price: 89.99, availability: "2-3 days", fitment: "confirmed", source: "3c_network" },
    ],
    simulated: true,
  });
});

router.post("/predii/labor-estimate", async (req: Request, res: Response) => {
  const { repairType, make, model, year } = req.body as {
    repairType: string;
    make?: string;
    model?: string;
    year?: number;
  };

  if (!repairType) {
    res.status(400).json({ error: "repairType is required" });
    return;
  }

  if (isLive()) {
    try {
      const r = await fetch(`${PREDII_BASE}/labor/estimate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PREDII_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ repairType, make, model, year }),
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[predii] labor error:", err);
    }
  }

  const laborMap: Record<string, number> = {
    oil_change: 0.5, brake_pads: 1.5, brake_rotors: 2.5, transmission_service: 3.0,
    timing_belt: 5.0, alternator: 2.0, starter: 2.5, water_pump: 4.0,
    head_gasket: 12.0, clutch: 6.0, ac_compressor: 3.5, suspension: 3.0,
  };

  const hours = laborMap[repairType] ?? 2.0;
  const rate = 125;

  res.json({
    repairType,
    vehicle: { make, model, year },
    laborHours: hours,
    laborRate: rate,
    laborTotal: Math.round(hours * rate),
    difficulty: hours > 5 ? "advanced" : hours > 2 ? "intermediate" : "basic",
    specialTools: hours > 4,
    simulated: true,
  });
});

export default router;
