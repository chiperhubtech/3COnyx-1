/**
 * 3C Onyx — Software-Defined Vehicle (SDV) Intelligence Layer
 *
 * The trust and services middleware for the SDV market.
 * Market: $213B (2024) → $1.2T (2030) — MarketsandMarkets
 *
 * Routes:
 *   GET  /api/sdv/status
 *   GET  /api/sdv/profile/:vehicleId
 *   POST /api/sdv/profile/:vehicleId/register
 *   POST /api/sdv/telemetry
 *   POST /api/sdv/ota/report
 *   GET  /api/sdv/ota/:vehicleId
 *   POST /api/sdv/score
 *   GET  /api/sdv/market
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sdvProfiles, sdvOtaEvents, sdvTelemetry } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import * as chainOfCustody from "../lib/chainOfCustody";

const router: IRouter = Router();

// ── SDV Tier Definitions ──────────────────────────────────────────────────────

export const SDV_TIERS: Record<number, { label: string; description: string; minScore: number }> = {
  0: { label: "SDV-0",  description: "Legacy — no software connectivity",                     minScore: 0  },
  1: { label: "SDV-1",  description: "Connected — OBD-II access, basic diagnostics",          minScore: 20 },
  2: { label: "SDV-2",  description: "Updatable — OTA capable, telemetry, remote access",     minScore: 40 },
  3: { label: "SDV-3",  description: "Intelligent — V2X, rich sensors, vehicle API access",   minScore: 65 },
  4: { label: "SDV-4",  description: "Autonomous-Ready — full sensor suite, OEM API, SOA",    minScore: 85 },
};

// ── Deterministic SDV Scoring (engine pattern — no LLM) ──────────────────────

export interface SDVInput {
  vehicleId: string;
  hasOtaCapability: boolean;
  hasVehicleApi: boolean;
  hasV2x: boolean;
  hasRemoteAccess: boolean;
  sensorTypes: string[];
  v2xProtocols: string[];
  inVehicleApps: string[];
  otaUpdatesCount: number;
  softwareArchitecture?: string;
}

export function calculateSDVScore(input: SDVInput) {
  let score = 0;
  const capabilities: string[] = [];
  const missing: string[] = [];

  // OTA Capability (25 pts max)
  if (input.hasOtaCapability) {
    score += 20;
    capabilities.push("Over-The-Air Updates");
    if (input.otaUpdatesCount >= 3) { score += 5; capabilities.push("Active OTA History"); }
  } else {
    missing.push("OTA Update Capability");
  }

  // Vehicle API (20 pts)
  if (input.hasVehicleApi) {
    score += 20;
    capabilities.push("Open Vehicle API");
  } else {
    missing.push("Vehicle API Access");
  }

  // V2X Connectivity (20 pts)
  if (input.hasV2x) {
    score += 15;
    capabilities.push("V2X Connectivity");
    if (input.v2xProtocols.includes("C-V2X") || input.v2xProtocols.includes("5G-V2X")) {
      score += 5;
      capabilities.push("5G/C-V2X Protocol");
    }
  } else {
    missing.push("V2X Communication");
  }

  // Remote Access (10 pts)
  if (input.hasRemoteAccess) {
    score += 10;
    capabilities.push("Remote Vehicle Access");
  } else {
    missing.push("Remote Access");
  }

  // Sensor Suite (15 pts)
  const advancedSensors = input.sensorTypes.filter(s =>
    ["LIDAR", "RADAR", "360-CAMERA", "ULTRASONIC", "THERMAL"].includes(s.toUpperCase())
  );
  if (advancedSensors.length >= 3) {
    score += 15;
    capabilities.push(`Full Sensor Suite (${advancedSensors.join(", ")})`);
  } else if (advancedSensors.length > 0) {
    score += advancedSensors.length * 4;
    capabilities.push(`Partial Sensors (${advancedSensors.join(", ")})`);
  } else if (input.sensorTypes.includes("GPS")) {
    score += 3;
    capabilities.push("GPS Telemetry");
  } else {
    missing.push("Advanced Sensor Suite");
  }

  // In-Vehicle App Ecosystem (10 pts)
  if (input.inVehicleApps.length >= 2) {
    score += 10;
    capabilities.push(`App Ecosystem (${input.inVehicleApps.join(", ")})`);
  } else if (input.inVehicleApps.length > 0) {
    score += 5;
    capabilities.push(input.inVehicleApps[0]);
  } else {
    missing.push("In-Vehicle App Platform");
  }

  // Software Architecture bonus (5 pts)
  if (input.softwareArchitecture?.toUpperCase().includes("SOA") ||
      input.softwareArchitecture?.toUpperCase().includes("AUTOSAR")) {
    score += 5;
    capabilities.push(`${input.softwareArchitecture} Architecture`);
  }

  score = Math.min(100, score);

  // Determine tier
  const tier = score >= 85 ? 4 : score >= 65 ? 3 : score >= 40 ? 2 : score >= 20 ? 1 : 0;
  const tierInfo = SDV_TIERS[tier];

  // Value premium: SDV-capable vehicles command higher resale value
  const valuePremium = tier === 4 ? 18 : tier === 3 ? 12 : tier === 2 ? 6 : tier === 1 ? 2 : 0;

  return {
    vehicleId: input.vehicleId,
    sdvScore: score,
    sdvTier: tier,
    tierLabel: tierInfo.label,
    tierDescription: tierInfo.description,
    capabilities,
    missingCapabilities: missing,
    valuePremium,
    deterministic: true,
    source: "engine",
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/sdv/status", (_req: Request, res: Response) => {
  res.json({
    status: "OPERATIONAL",
    layer: "SDV Intelligence",
    market: { current: "213B", projected2030: "1.2T", cagr: "~34%" },
    capabilities: ["vehicle_scoring", "ota_tracking", "telemetry_ingestion", "v2x_readiness", "blockchain_stamping"],
    tiersSupported: Object.values(SDV_TIERS),
    deterministic: true,
    llmDependency: false,
  });
});

router.get("/sdv/market", (_req: Request, res: Response) => {
  res.json({
    market: {
      size2024: 213_000_000_000,
      size2030: 1_200_000_000_000,
      cagr: "~34%",
      source: "MarketsandMarkets",
      keyDrivers: [
        "OTA software updates replacing hardware recalls",
        "Vehicle-as-a-Service (VaaS) subscription models",
        "Autonomous driving software stack maturation",
        "V2X infrastructure rollout (DSRC + C-V2X + 5G)",
        "EV software differentiation (battery management, charging optimization)",
        "Regulatory mandates for connected safety systems",
      ],
    },
    onyxPosition: {
      role: "Trust and Services Middleware for the SDV Ecosystem",
      value: "3C Onyx is the blockchain-anchored identity and intelligence layer that SDV data flows through",
      moat: "Every OTA update is blockchain-stamped. Every vehicle has an SDV score. Every transaction reflects software-defined value.",
    },
  });
});

router.get("/sdv/profile/:vehicleId", async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  try {
    const [profile] = await db.select().from(sdvProfiles).where(eq(sdvProfiles.vehicleId, vehicleId));
    if (!profile) {
      res.status(404).json({ error: "No SDV profile found. Register this vehicle first." });
      return;
    }
    const otaEvents = await db.select().from(sdvOtaEvents)
      .where(eq(sdvOtaEvents.vehicleId, vehicleId))
      .orderBy(desc(sdvOtaEvents.installedAt))
      .limit(10);
    const tier = SDV_TIERS[profile.sdvTier ?? 0];
    res.json({ profile, tier, otaHistory: otaEvents });
  } catch {
    res.status(500).json({ error: "Failed to fetch SDV profile" });
  }
});

router.post("/sdv/profile/:vehicleId/register", async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const body = req.body as SDVInput & { vin?: string; make?: string; model?: string; year?: number };

  const scored = calculateSDVScore({ ...body, vehicleId });

  try {
    const [profile] = await db
      .insert(sdvProfiles)
      .values({
        vehicleId,
        vin: body.vin,
        make: body.make,
        model: body.model,
        year: body.year,
        sdvTier: scored.sdvTier,
        sdvScore: scored.sdvScore,
        hasOtaCapability: body.hasOtaCapability,
        hasVehicleApi: body.hasVehicleApi,
        hasV2x: body.hasV2x,
        hasRemoteAccess: body.hasRemoteAccess,
        sensorTypes: body.sensorTypes ?? [],
        v2xProtocols: body.v2xProtocols ?? [],
        inVehicleApps: body.inVehicleApps ?? [],
        otaUpdatesCount: body.otaUpdatesCount ?? 0,
        softwareArchitecture: body.softwareArchitecture,
        sdvValuePremium: String(scored.valuePremium),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sdvProfiles.vehicleId,
        set: {
          sdvTier: scored.sdvTier,
          sdvScore: scored.sdvScore,
          hasOtaCapability: body.hasOtaCapability,
          hasVehicleApi: body.hasVehicleApi,
          hasV2x: body.hasV2x,
          hasRemoteAccess: body.hasRemoteAccess,
          sensorTypes: body.sensorTypes ?? [],
          v2xProtocols: body.v2xProtocols ?? [],
          inVehicleApps: body.inVehicleApps ?? [],
          otaUpdatesCount: body.otaUpdatesCount ?? 0,
          sdvValuePremium: String(scored.valuePremium),
          updatedAt: new Date(),
        },
      })
      .returning();

    // Stamp on blockchain
    try {
      await chainOfCustody.addEntry(vehicleId, {
        type: "sdv_registration",
        actor: "3C-SDV-LAYER",
        data: { sdvScore: scored.sdvScore, tier: scored.tierLabel, capabilities: scored.capabilities },
      });
    } catch { /* non-fatal */ }

    res.json({ profile, score: scored });
  } catch (err) {
    res.status(500).json({ error: "Failed to register SDV profile" });
  }
});

router.post("/sdv/ota/report", async (req: Request, res: Response) => {
  const { vehicleId, vin, fromVersion, toVersion, updateType, description } = req.body ?? {};
  if (!vehicleId || !toVersion || !updateType) {
    res.status(400).json({ error: "vehicleId, toVersion, and updateType are required" });
    return;
  }

  // Blockchain-stamp every OTA event
  let blockchainHash: string | undefined;
  try {
    const entry = await chainOfCustody.addEntry(vehicleId, {
      type: "ota_update",
      actor: "OTA-SYSTEM",
      data: { fromVersion, toVersion, updateType, description },
    });
    blockchainHash = entry?.sha256;
  } catch { /* non-fatal */ }

  // Determine SDV score delta by update type
  const deltas: Record<string, number> = {
    feature: 5, security: 3, performance: 2, autonomous: 10, connectivity: 7,
  };
  const sdvScoreDelta = deltas[updateType.toLowerCase()] ?? 2;

  try {
    const [event] = await db.insert(sdvOtaEvents).values({
      vehicleId, vin, fromVersion, toVersion, updateType, description,
      sdvScoreDelta, blockchainHash,
    }).returning();

    // Update profile OTA count and version
    await db
      .update(sdvProfiles)
      .set({ otaUpdatesCount: db.$count(sdvOtaEvents, eq(sdvOtaEvents.vehicleId, vehicleId)) as any, lastOtaVersion: toVersion, lastOtaAt: new Date(), updatedAt: new Date() })
      .where(eq(sdvProfiles.vehicleId, vehicleId));

    res.json({
      recorded: true,
      event,
      blockchainHash,
      sdvScoreDelta,
      message: `OTA event blockchain-stamped. SDV score impact: +${sdvScoreDelta} pts.`,
    });
  } catch {
    res.status(500).json({ error: "Failed to record OTA event" });
  }
});

router.get("/sdv/ota/:vehicleId", async (req: Request, res: Response) => {
  try {
    const events = await db.select().from(sdvOtaEvents)
      .where(eq(sdvOtaEvents.vehicleId, req.params.vehicleId))
      .orderBy(desc(sdvOtaEvents.installedAt))
      .limit(50);
    res.json({ vehicleId: req.params.vehicleId, events, total: events.length });
  } catch {
    res.json({ vehicleId: req.params.vehicleId, events: [], total: 0 });
  }
});

router.post("/sdv/telemetry", async (req: Request, res: Response) => {
  const { vehicleId, vin, speed, batteryLevel, range, latitude, longitude, diagnosticCodes, sensorData } = req.body ?? {};
  if (!vehicleId) { res.status(400).json({ error: "vehicleId is required" }); return; }

  try {
    const [snap] = await db.insert(sdvTelemetry).values({
      vehicleId, vin,
      speed: speed != null ? String(speed) : null,
      batteryLevel: batteryLevel != null ? String(batteryLevel) : null,
      range: range != null ? String(range) : null,
      latitude: latitude != null ? String(latitude) : null,
      longitude: longitude != null ? String(longitude) : null,
      diagnosticCodes: diagnosticCodes ?? [],
      sensorData: sensorData ?? {},
    }).returning();

    // Update latest snapshot on profile
    await db.update(sdvProfiles)
      .set({ lastTelemetryAt: new Date(), latestTelemetry: req.body, updatedAt: new Date() })
      .where(eq(sdvProfiles.vehicleId, vehicleId));

    res.json({ received: true, telemetryId: snap.id });
  } catch {
    res.status(500).json({ error: "Failed to store telemetry" });
  }
});

router.post("/sdv/score", (req: Request, res: Response) => {
  const input = req.body as SDVInput;
  if (!input?.vehicleId) { res.status(400).json({ error: "vehicleId is required" }); return; }
  const score = calculateSDVScore(input);
  res.json({ score });
});

export default router;
