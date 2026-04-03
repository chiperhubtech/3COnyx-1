import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  vehiclesTable,
  vinPassportsTable,
  blockchainRecordsTable,
  dealsTable,
  warrantyIntelTable,
} from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Vehicle Verification & Trust Protocol",
    version: "1.0.0",
    description: "Unified vehicle verification returning ONYX Verified status, trust timeline, and cryptographic proof chain",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    endpoints: {
      verify: "GET /api/vehicles/:vin/verify",
      badge: "GET /api/vehicles/:vin/badge",
    },
    trustLevels: ["Unverified", "Basic", "Verified", "ONYX Certified", "ONYX Sovereign"],
    mandate: "Every vehicle on the network carries a verifiable digital identity",
  });
});

interface VerificationEvent {
  type: string;
  label: string;
  timestamp: string;
  actor: string;
  proofHash?: string;
  detail?: string;
}

function calculateTrustScore(factors: {
  hasPassport: boolean;
  hasBlockchainRecords: boolean;
  blockchainCount: number;
  hasWarranty: boolean;
  hasDealHistory: boolean;
  hasRecalls: boolean;
  chainIntegrity: boolean;
}): { score: number; level: string; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  breakdown.vinDecoded = factors.hasPassport ? 15 : 0;
  breakdown.blockchainProof = factors.hasBlockchainRecords ? Math.min(30, factors.blockchainCount * 5) : 0;
  breakdown.warrantyVerified = factors.hasWarranty ? 20 : 0;
  breakdown.dealHistory = factors.hasDealHistory ? 15 : 0;
  breakdown.recallStatus = factors.hasPassport ? (factors.hasRecalls ? 5 : 10) : 0;
  breakdown.chainIntegrity = factors.chainIntegrity ? 10 : 0;

  const score = Object.values(breakdown).reduce((s, v) => s + v, 0);

  let level = "Unverified";
  if (score >= 80) level = "ONYX Sovereign";
  else if (score >= 60) level = "ONYX Certified";
  else if (score >= 40) level = "Verified";
  else if (score >= 15) level = "Basic";

  return { score, level, breakdown };
}

router.get("/verify/:vin", async (req: Request, res: Response) => {
  try {
    const vin = (req.params.vin as string).toUpperCase().trim();

    if (!vin || vin.length < 11 || vin.length > 17) {
      res.status(400).json({ error: "Invalid VIN — must be 11-17 characters" });
      return;
    }

    const [vehicle] = await db.select().from(vehiclesTable)
      .where(eq(vehiclesTable.vin, vin)).limit(1);

    const [passport] = await db.select().from(vinPassportsTable)
      .where(eq(vinPassportsTable.vin, vin)).limit(1);

    const blockchainRecords = await db.select().from(blockchainRecordsTable)
      .where(eq(blockchainRecordsTable.vehicleId, vin))
      .orderBy(desc(blockchainRecordsTable.timestamp))
      .limit(50);

    const deals = await db.select({
      id: dealsTable.id,
      status: dealsTable.status,
      dealType: dealsTable.dealType,
      createdAt: dealsTable.createdAt,
    }).from(dealsTable)
      .where(eq(dealsTable.vehicleId, vehicle?.id ?? 0))
      .orderBy(desc(dealsTable.createdAt))
      .limit(10);

    const [warranty] = await db.select().from(warrantyIntelTable)
      .where(eq(warrantyIntelTable.vin, vin)).limit(1);

    let chainIntegrity = true;
    if (blockchainRecords.length > 1) {
      for (let i = 0; i < blockchainRecords.length - 1; i++) {
        const current = blockchainRecords[i];
        const previous = blockchainRecords[i + 1];
        if (current.previousHash !== previous.sha256) {
          chainIntegrity = false;
          break;
        }
      }
    }

    const trust = calculateTrustScore({
      hasPassport: !!passport,
      hasBlockchainRecords: blockchainRecords.length > 0,
      blockchainCount: blockchainRecords.length,
      hasWarranty: !!warranty,
      hasDealHistory: deals.length > 0,
      hasRecalls: passport?.hasOpenRecalls ?? false,
      chainIntegrity,
    });

    const timeline: VerificationEvent[] = [];

    if (passport) {
      timeline.push({
        type: "vin_decoded",
        label: "VIN Decoded & Registered",
        timestamp: passport.createdAt.toISOString(),
        actor: "ONYX VIN Intelligence",
        detail: `${passport.year} ${passport.make} ${passport.model}${passport.trim ? ` ${passport.trim}` : ""}`,
      });
    }

    if (passport?.blockchainHash) {
      timeline.push({
        type: "blockchain_anchored",
        label: "Anchored to ONYX Ledger",
        timestamp: passport.createdAt.toISOString(),
        actor: "ONYX Proof Agent",
        proofHash: passport.blockchainHash,
      });
    }

    for (const record of blockchainRecords.slice(0, 10)) {
      timeline.push({
        type: `chain_${record.type.toLowerCase()}`,
        label: `${record.type.replace(/_/g, " ")}`,
        timestamp: record.timestamp.toISOString(),
        actor: record.actor,
        proofHash: record.sha256,
        detail: record.actorRole,
      });
    }

    if (warranty) {
      timeline.push({
        type: "warranty_verified",
        label: "Warranty Status Verified",
        timestamp: warranty.createdAt?.toISOString() ?? new Date().toISOString(),
        actor: "ONYX Warranty Agent",
        detail: warranty.warrantyStatus ?? "Checked",
      });
    }

    for (const deal of deals) {
      timeline.push({
        type: "deal_recorded",
        label: `Deal: ${deal.dealType?.replace(/_/g, " ") ?? "Transaction"}`,
        timestamp: deal.createdAt?.toISOString() ?? new Date().toISOString(),
        actor: "ONYX Deal Engine",
        detail: `Status: ${deal.status}`,
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const verificationHash = crypto.createHash("sha256").update(JSON.stringify({
      vin,
      trustScore: trust.score,
      trustLevel: trust.level,
      timelineCount: timeline.length,
      blockchainRecords: blockchainRecords.length,
      verifiedAt: new Date().toISOString(),
      architect: "Ronald Antonio Cadet",
    })).digest("hex");

    res.json({
      vin,
      verified: trust.score >= 15,
      trustScore: trust.score,
      trustLevel: trust.level,
      trustBreakdown: trust.breakdown,
      vehicle: vehicle ? {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        color: vehicle.color,
        mileage: vehicle.mileage,
        status: vehicle.status,
      } : passport ? {
        year: passport.year,
        make: passport.make,
        model: passport.model,
        trim: passport.trim,
        bodyClass: passport.bodyClass,
        driveType: passport.driveType,
        engineType: passport.engineType,
        fuelType: passport.fuelType,
      } : null,
      passport: passport ? {
        decoded: true,
        recallCount: passport.recallCount,
        hasOpenRecalls: passport.hasOpenRecalls,
        aiSummary: passport.aiSummaryEn,
      } : { decoded: false },
      blockchain: {
        totalRecords: blockchainRecords.length,
        chainIntegrity,
        latestHash: blockchainRecords[0]?.sha256 ?? null,
      },
      warranty: warranty ? {
        status: warranty.warrantyStatus,
      } : null,
      dealHistory: {
        totalDeals: deals.length,
        latestStatus: deals[0]?.status ?? null,
      },
      timeline,
      verificationHash,
      verifiedAt: new Date().toISOString(),
      protocol: "ONYX Vehicle Verification Protocol v1.0",
      architect: "Ronald Antonio Cadet",
      sovereignty: "CUXTOMCANDYCLUB LLC",
    });
  } catch (error) {
    res.status(500).json({ error: "Vehicle verification failed", detail: String(error) });
  }
});

router.get("/badge/:vin", async (req: Request, res: Response) => {
  try {
    const vin = (req.params.vin as string).toUpperCase().trim();

    const [passport] = await db.select().from(vinPassportsTable)
      .where(eq(vinPassportsTable.vin, vin)).limit(1);

    const blockchainCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(blockchainRecordsTable)
      .where(eq(blockchainRecordsTable.vehicleId, vin));

    const count = blockchainCount[0]?.count ?? 0;

    let level = "Unverified";
    let score = 0;
    if (passport) score += 15;
    if (count > 0) score += Math.min(30, count * 5);
    if (score >= 60) level = "ONYX Certified";
    else if (score >= 40) level = "Verified";
    else if (score >= 15) level = "Basic";

    res.json({
      vin,
      badge: level,
      score,
      vehicle: passport ? `${passport.year} ${passport.make} ${passport.model}` : null,
      proofCount: count,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Badge generation failed", detail: String(error) });
  }
});

export default router;
