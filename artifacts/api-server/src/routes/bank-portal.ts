/**
 * 3C ONYX — Stellantis Protocol: Bank Node Registry & Rep Portal
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Real-world proof: Ned Surman, Stellantis Financial Services US
 * Dealer Relationship Manager — Houston, TX
 * Ground Truth: "The paperwork is the bottleneck."
 *
 * "The Messy Family" Viral Loop — Tier-1 lenders mandate 3C Onyx
 * because their best reps hit numbers faster using the mesh.
 *
 * ──────────────────────────────────────────────────────────────
 * POST /api/banks/register               Register a Bank Node (lender)
 * POST /api/banks/:id/generate-key       Issue read-only Rep Portal Key
 * GET  /api/banks                        List all Bank Nodes + network stats
 * GET  /api/banks/:id                    Bank Node detail
 *
 * GET  /api/rep/:repKey                  Rep Portal — what the rep sees
 * GET  /api/rep/:repKey/bundle/:bundleId Rep views a specific deal bundle
 * POST /api/rep/:repKey/bundle/:bundleId/fund  Rep hits "Fund" — triggers payout
 *
 * GET  /api/banks/seed                   One-time: seed Pilot Bank Node #1 (Ned)
 * ──────────────────────────────────────────────────────────────
 */
import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  bankNodesTable,
  documentVaultTable,
  serviceNodesTable,
} from "@workspace/db";
import { eventBus } from "../lib/eventBus";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function genRepKey(institutionName: string): string {
  const slug = institutionName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `3C-${slug}-${rand}`;
}

function keyExpiry(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// PILOT SEED — Ned Surman + Jim's Rims (real contacts, hard-coded into mesh)
// ─────────────────────────────────────────────────────────────────────────────

let seeded = false;

async function seedPilotNodes() {
  if (seeded) return;
  seeded = true;

  // ── Seed Bank Node #1: Ned Surman — Stellantis Financial ──────────────────
  const existingNed = await db
    .select()
    .from(bankNodesTable)
    .where(eq(bankNodesTable.repEmail, "ned.surman@stellantis-fs.com"))
    .limit(1);

  if (existingNed.length === 0) {
    const repKey = "3C-STELLA-NED001PILOT";
    await db.insert(bankNodesTable).values({
      nodeCategory:     "Bank",
      institutionName:  "Stellantis Financial Services US",
      repName:          "Ned Surman",
      repTitle:         "Dealer Relationship Manager — Sales & Marketing",
      repEmail:         "ned.surman@stellantis-fs.com",
      repPhone:         "+17744234790",
      tier:             "Tier1",
      status:           "Invited",
      repPortalKey:     repKey,
      keyGeneratedAt:   new Date(),
      keyExpiresAt:     keyExpiry(),
      region:           "National — Houston, TX HQ",
      isPilotNode:      true,
      invitedAt:        new Date(),
      avgFundingDaysTraditional: 3.5,
      invitedBy:        "Ronald Antonio Cadet — 3C ONYX CVO",
      notes:            "PILOT BANK NODE #1. Ground Truth: Ned confirmed the paperwork bottleneck in person — the 'Stellantis Protocol' was built from this conversation. Address: 5757 Woodway Drive, Ste 400, Houston, TX 77057.",
      metadata: {
        groundTruth:    "Verbal confirmation: physical paperwork delays CIT funding 3–7 business days",
        solution:       "3C Bank-Ready Document Vault — SHA-256 sealed bundles, instant rep access",
        viralStrategy:  "Ned knows the Family — Ally, Chase, Capital One, JMMB network",
        cardPhoto:      "Attached to CVO records — March 30, 2026",
        architect:      "Ronald Antonio Cadet",
        patentRef:      "PAT-04: Cross-Departmental Data Synthesis",
      },
    });
  }

  // ── Seed Warranty Admin Node #1: Simoniz ──────────────────────────────────
  const existingSimoniz = await db
    .select()
    .from(bankNodesTable)
    .where(eq(bankNodesTable.institutionName, "Simoniz USA"))
    .limit(1);

  if (existingSimoniz.length === 0) {
    await db.insert(bankNodesTable).values({
      nodeCategory:     "WarrantyAdmin",
      institutionName:  "Simoniz USA",
      repName:          "Simoniz Admin Portal",
      repTitle:         "Warranty Claims Administrator",
      tier:             "Pilot",
      status:           "Invited",
      repPortalKey:     "3C-SIMNZ-PAINT001PILOT",
      keyGeneratedAt:   new Date(),
      keyExpiresAt:     keyExpiry(),
      region:           "National",
      isPilotNode:      true,
      invitedAt:        new Date(),
      avgFundingDaysTraditional: 5.0,   // days to process a paint protection claim manually
      invitedBy:        "Ronald Antonio Cadet — 3C ONYX CVO",
      notes:            "PILOT WARRANTY NODE #1 — Paint Protection Film (PPF) administrator. Same bottleneck as Stellantis: manual odometer verification, faxed contracts, 4-step claim lookup. Guardian Agent eliminates all of it.",
      metadata: {
        coverageType:  "Paint Protection Film, GlassCoat, Surface Protection",
        painPoint:     "Manual odometer statements, faxed contracts — same fragmentation as banking",
        solution:      "3C Guardian Agent: instant VIN integrity + in-service date + coverage confirmation",
        architect:     "Ronald Antonio Cadet",
        unionRole:     "WarrantyAdmin Node — The Automotive Union Layer",
      },
    });
  }

  // ── Seed Warranty Admin Node #2: Sonsio ───────────────────────────────────
  const existingSonsio = await db
    .select()
    .from(bankNodesTable)
    .where(eq(bankNodesTable.institutionName, "Sonsio Vehicle Protection"))
    .limit(1);

  if (existingSonsio.length === 0) {
    await db.insert(bankNodesTable).values({
      nodeCategory:     "WarrantyAdmin",
      institutionName:  "Sonsio Vehicle Protection",
      repName:          "Sonsio Admin Portal",
      repTitle:         "Tire & Wheel Claims Administrator",
      tier:             "Pilot",
      status:           "Invited",
      repPortalKey:     "3C-SNSIO-TIRE001PILOT",
      keyGeneratedAt:   new Date(),
      keyExpiresAt:     keyExpiry(),
      region:           "National",
      isPilotNode:      true,
      invitedAt:        new Date(),
      avgFundingDaysTraditional: 4.0,
      invitedBy:        "Ronald Antonio Cadet — 3C ONYX CVO",
      notes:            "PILOT WARRANTY NODE #2 — Tire & Wheel protection administrator. Every claim requires manual VIN lookup, odometer verification, and contract confirmation. Guardian Agent cuts this to seconds.",
      metadata: {
        coverageType:  "Tire & Wheel Road Hazard, Rim Repair, Blowout Protection",
        painPoint:     "Same fragmentation — scattered contracts, manual odometer checks, callbacks",
        solution:      "3C Rep Portal: instant coverage confirmation, no 4-step manual process",
        architect:     "Ronald Antonio Cadet",
        unionRole:     "WarrantyAdmin Node — The Automotive Union Layer",
      },
    });
  }

  // ── Seed Service Node #1: Jim's Rims — Rehoboth, MA ──────────────────────
  const existingJims = await db
    .select()
    .from(serviceNodesTable)
    .where(eq(serviceNodesTable.email, "jimsrimsma@gmail.com"))
    .limit(1);

  if (existingJims.length === 0) {
    await db.insert(serviceNodesTable).values({
      name:           "Jim's Rims",
      nodeType:       "Rims",
      status:         "Active",
      address:        "40R Fall River Avenue",
      city:           "Rehoboth",
      state:          "MA",
      zip:            "02769",
      lat:            41.8410,
      lng:            -71.1826,
      distanceMilesFromMilfordHub: 28.4,   // ~28 mi from Milford, MA hub
      phone:          "7742296608",
      email:          "jimsrimsma@gmail.com",
      website:        "https://jimsrims.net",
      contactName:    "Jim",
      servicesOffered: ["Wheel Repair", "Rim Refinishing", "Chrome Plating", "Custom Painting", "Powder Coating", "Bent Wheel Repair", "Curb Rash Repair"],
      capacityPerDay: 6,
      reputationScore: 90.0,
      techFeeRateBps: 300,
      isHubNode:      false,
      metadata: {
        pilotNode:      "SERVICE NODE #1 — Bird-Dog Referral Source",
        groundTruth:    "Real business card — Rehoboth, MA. 3C ONYX Bird-Dog referral engine built with Jim's Rims as the reference node.",
        proximityNote:  "28.4 mi from Milford Node hub — primary coverage for Southeast MA",
        architect:      "Ronald Antonio Cadet",
        tradeSecretRef: "TS-05: Automated Referral Ledger",
        cardPhoto:      "Attached to CVO records — March 30, 2026",
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK NODE REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/banks/register
 * Register a lender / bank rep as a Bank Node in the 3C Mesh.
 */
router.post("/register", async (req: Request, res: Response) => {
  await seedPilotNodes();
  const {
    institutionName, repName, repTitle, repEmail, repPhone,
    tier, region, notes,
  } = req.body as Record<string, unknown>;

  if (!institutionName || !repName) {
    return res.status(400).json({ error: "institutionName and repName are required" });
  }

  try {
    const repKey = genRepKey(String(institutionName));
    const [row] = await db
      .insert(bankNodesTable)
      .values({
        institutionName: String(institutionName),
        repName:         String(repName),
        repTitle:        repTitle ? String(repTitle) : null,
        repEmail:        repEmail ? String(repEmail) : null,
        repPhone:        repPhone ? String(repPhone) : null,
        tier:            (tier as "Tier1" | "Tier2" | "Tier3" | "Pilot") ?? "Pilot",
        status:          "Invited",
        repPortalKey:    repKey,
        keyGeneratedAt:  new Date(),
        keyExpiresAt:    keyExpiry(),
        region:          region ? String(region) : null,
        notes:           notes ? String(notes) : null,
        invitedAt:       new Date(),
        invitedBy:       "Ronald Antonio Cadet — 3C ONYX CVO",
        metadata:        { architect: "Ronald Antonio Cadet", patentRef: "PAT-04" },
      })
      .returning();

    await eventBus.emit("node.registered", {
      name: String(repName),
      nodeType: "BankNode",
      city: String(institutionName),
    });

    return res.status(201).json({
      success: true,
      bankNode: row,
      repPortalKey: repKey,
      repPortalUrl: `/api/rep/${repKey}`,
      message: `Bank Node created for ${String(repName)} at ${String(institutionName)}. Rep Portal Key: ${repKey}. Share this key — the rep never waits for a PDF scan again.`,
    });
  } catch (err) {
    console.error("[banks/register]", err);
    return res.status(500).json({ error: "Failed to register bank node" });
  }
});

/**
 * POST /api/banks/:id/generate-key
 * Regenerate the Rep Portal Key for a bank node.
 */
router.post("/:id/generate-key", async (req: Request, res: Response) => {
  await seedPilotNodes();
  const id = parseInt(req.params["id"] as string);
  try {
    const [node] = await db
      .select()
      .from(bankNodesTable)
      .where(eq(bankNodesTable.id, id))
      .limit(1);
    if (!node) return res.status(404).json({ error: "Bank node not found" });

    const repKey = genRepKey(node.institutionName);
    const [updated] = await db
      .update(bankNodesTable)
      .set({
        repPortalKey:   repKey,
        keyGeneratedAt: new Date(),
        keyExpiresAt:   keyExpiry(),
        status:         "Active",
        updatedAt:      new Date(),
      })
      .where(eq(bankNodesTable.id, id))
      .returning();

    return res.json({
      success: true,
      bankNode: updated,
      repPortalKey: repKey,
      repPortalUrl: `/api/rep/${repKey}`,
      expiresAt: updated?.keyExpiresAt,
      message: `New Rep Portal Key issued for ${node.repName} at ${node.institutionName}. This key gives read-only access to all verified deal bundles.`,
    });
  } catch (err) {
    console.error("[banks/generate-key]", err);
    return res.status(500).json({ error: "Failed to generate key" });
  }
});

/**
 * GET /api/banks
 * List all Bank Nodes — "The Family" network overview.
 */
router.get("/", async (_req: Request, res: Response) => {
  await seedPilotNodes();
  try {
    const nodes = await db
      .select()
      .from(bankNodesTable)
      .orderBy(desc(bankNodesTable.totalFundedUsd));

    const totalFunded = nodes.reduce((s, n) => s + parseFloat(String(n.totalFundedUsd ?? 0)), 0);
    const totalDeals  = nodes.reduce((s, n) => s + (n.dealsFunded ?? 0), 0);
    const tier1       = nodes.filter(n => n.tier === "Tier1");
    const pilots      = nodes.filter(n => n.isPilotNode);
    const avgSpeedGain = nodes
      .filter(n => n.avgFundingHours3c)
      .map(n => ({
        traditional: (n.avgFundingDaysTraditional ?? 3.5) * 24,
        with3c:      n.avgFundingHours3c ?? 2,
      }));

    return res.json({
      bankNodes: nodes,
      network: {
        totalNodes:   nodes.length,
        tier1Lenders: tier1.length,
        pilotNodes:   pilots.length,
        activeNodes:  nodes.filter(n => n.status === "Active").length,
        totalFundedUsd: fmtUsd(totalFunded),
        totalDealsFunded: totalDeals,
        avgFundingTimeGain: avgSpeedGain.length
          ? `${Math.round((avgSpeedGain[0]!.traditional - avgSpeedGain[0]!.with3c))} hours saved per deal`
          : "Pilot data pending",
        viralLoopActive: nodes.some(n => n.referredNodes > 0),
      },
      stellantisProtocol: {
        groundTruth:   "Ned Surman, Stellantis Financial — confirmed CIT bottleneck in person",
        painPoint:     "Physical paperwork delays funding 3–7 business days",
        solution:      "SHA-256 sealed Document Vault + instant Rep Portal key access",
        projectedImpact: "90% reduction in funding time · Most productive reps in their institution",
        viralTrigger:  "One rep hits numbers → tells the Family → banks mandate 3C Onyx",
      },
    });
  } catch (err) {
    console.error("[banks]", err);
    return res.status(500).json({ error: "Failed to fetch bank nodes" });
  }
});

/**
 * GET /api/banks/:id
 * Single bank node detail.
 */
router.get("/:id", async (req: Request, res: Response) => {
  await seedPilotNodes();
  try {
    const [node] = await db
      .select()
      .from(bankNodesTable)
      .where(eq(bankNodesTable.id, parseInt(req.params["id"] as string)))
      .limit(1);
    if (!node) return res.status(404).json({ error: "Bank node not found" });
    return res.json({ bankNode: node });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch bank node" });
  }
});

export { seedPilotNodes };
export default router;
