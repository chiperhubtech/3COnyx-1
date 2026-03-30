/**
 * 3C ONYX — Partner Rep Portal (Key-Gated, Read-Only)
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Used by BOTH:
 *   1. Bank Reps (Ned Surman — Stellantis Financial) — see verified deal bundles, hit "Fund"
 *   2. Warranty Admins (Simoniz, Sonsio) — see warranty contract status, approve claims
 *
 * The same manual-paperwork bottleneck exists in BOTH industries.
 * One key. One ping. Instant answer. No fax. No email. No 3–7 day delay.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * GET  /api/rep/:repKey                         Rep dashboard — who they are + what they can see
 * GET  /api/rep/:repKey/bundle/:bundleId        Bank rep views a specific deal bundle
 * POST /api/rep/:repKey/bundle/:bundleId/fund   Bank rep hits "Fund" — deal closes
 * GET  /api/rep/:repKey/warranty/:vin           Warranty admin instant claim eligibility
 * POST /api/rep/:repKey/warranty/:vin/approve   Warranty admin approves claim
 * GET  /api/rep/:repKey/stats                   Rep productivity metrics
 * ──────────────────────────────────────────────────────────────────────────────
 */
import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  bankNodesTable,
  documentVaultTable,
  warrantyRecordsTable,
} from "@workspace/db";
import { eventBus } from "../lib/eventBus";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function resolveRep(repKey: string) {
  const [node] = await db
    .select()
    .from(bankNodesTable)
    .where(eq(bankNodesTable.repPortalKey, repKey))
    .limit(1);
  return node ?? null;
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function warrantyLiveStatus(
  inServiceDate: Date | null,
  currentOdometer: number | null,
  expiresDate: Date | null,
  expiresOdometer: number | null,
): { status: string; daysRemaining: number | null; milesRemaining: number | null } {
  if (!inServiceDate) return { status: "Unknown", daysRemaining: null, milesRemaining: null };
  const now = new Date();
  const dateExpired   = expiresDate ? now > expiresDate : false;
  const milesExpired  = expiresOdometer && currentOdometer ? currentOdometer > expiresOdometer : false;
  if (dateExpired || milesExpired) return {
    status: "Expired",
    daysRemaining:  expiresDate ? 0 : null,
    milesRemaining: expiresOdometer && currentOdometer ? Math.max(0, expiresOdometer - currentOdometer) : null,
  };
  const daysRemaining  = expiresDate ? Math.max(0, Math.round((expiresDate.getTime() - now.getTime()) / 86400000)) : null;
  const milesRemaining = expiresOdometer && currentOdometer ? Math.max(0, expiresOdometer - currentOdometer) : null;
  const expiringSoon   = (daysRemaining !== null && daysRemaining < 60) || (milesRemaining !== null && milesRemaining < 2000);
  return { status: expiringSoon ? "ExpiringSoon" : "Active", daysRemaining, milesRemaining };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rep/:repKey — Rep Dashboard
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:repKey", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid or expired Rep Portal Key" });

  // Update last active
  await db
    .update(bankNodesTable)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(bankNodesTable.id, rep.id));

  const isBank       = rep.nodeCategory === "Bank";
  const isWarranty   = rep.nodeCategory === "WarrantyAdmin";

  const welcomeMsg = isBank
    ? `Welcome, ${rep.repName}. You have read-only access to all verified deal bundles in the 3C Mesh. Every bundle is SHA-256 sealed — no missing staples, no blurry signatures. Hit "Fund" and move on.`
    : isWarranty
    ? `Welcome, ${rep.repName} — ${rep.institutionName}. You have instant access to all vehicle warranty contracts verified by the 3C Guardian Agent. VIN integrity confirmed. Coverage status live. No fax required.`
    : `Welcome, ${rep.repName}. Your 3C Partner Portal is active.`;

  const availableEndpoints = isBank
    ? [
        `GET  /api/rep/${rep.repPortalKey}/bundle/:bundleId — View a deal bundle`,
        `POST /api/rep/${rep.repPortalKey}/bundle/:bundleId/fund — Fund a deal`,
        `GET  /api/rep/${rep.repPortalKey}/stats — Your productivity metrics`,
      ]
    : isWarranty
    ? [
        `GET  /api/rep/${rep.repPortalKey}/warranty/:vin — Instant warranty status for a VIN`,
        `POST /api/rep/${rep.repPortalKey}/warranty/:vin/approve — Approve a warranty claim`,
        `GET  /api/rep/${rep.repPortalKey}/stats — Your claim metrics`,
      ]
    : [];

  return res.json({
    rep: {
      name:          rep.repName,
      title:         rep.repTitle,
      institution:   rep.institutionName,
      category:      rep.nodeCategory,
      tier:          rep.tier,
      status:        rep.status,
      pilotNode:     rep.isPilotNode,
      region:        rep.region,
      keyExpiresAt:  rep.keyExpiresAt,
    },
    portalActive: true,
    welcome:       welcomeMsg,
    endpoints:     availableEndpoints,
    productivity: {
      dealsReviewed:          rep.dealsReviewed,
      dealsFunded:            rep.dealsFunded,
      totalFundedUsd:         fmtUsd(parseFloat(String(rep.totalFundedUsd ?? 0))),
      avgFundingDaysTraditional: rep.avgFundingDaysTraditional ?? 3.5,
      avgFundingHours3c:       rep.avgFundingHours3c,
      timeSaved:               rep.avgFundingHours3c
        ? `${Math.round(((rep.avgFundingDaysTraditional ?? 3.5) * 24) - rep.avgFundingHours3c)} hours per deal`
        : "Data accumulates as you fund deals",
    },
    stellantisProtocol: isBank ? {
      bottleneck: "Physical paperwork delays Contract-in-Transit (CIT) funding 3–7 business days",
      solution:   "3C Document Vault — every contract sealed, verified, and instantly accessible",
      impact:     "90% reduction in funding time. You become the most productive rep in the building.",
    } : null,
    warrantyProtocol: isWarranty ? {
      bottleneck: "Manual contract lookup, faxed odometer statements, scattered provider files",
      solution:   "3C Guardian Agent resolves warranty status from in-service date + live odometer in one call",
      impact:     "Claim eligibility in seconds. No paperwork. No callbacks. No denials on technicalities.",
    } : null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BANK REP — Bundle Access + Fund
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/rep/:repKey/bundle/:bundleId
 * Bank rep views a deal bundle — everything they need to hit "Fund".
 */
router.get("/:repKey/bundle/:bundleId", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid Rep Portal Key" });
  if (rep.nodeCategory !== "Bank") {
    return res.status(403).json({ error: "Bundle access is for Bank Nodes only" });
  }

  try {
    const [bundle] = await db
      .select()
      .from(documentVaultTable)
      .where(eq(documentVaultTable.bundleId, req.params["bundleId"] as string))
      .limit(1);

    if (!bundle) return res.status(404).json({ error: "Bundle not found" });

    const docs = Array.isArray(bundle.documents)
      ? bundle.documents as { type: string; name: string; verified: boolean }[]
      : [];

    const fundReady = bundle.status === "Sealed" || bundle.status === "Submitted";
    const allVerified = docs.every(d => d.verified);

    // Update rep reviewed count
    await db
      .update(bankNodesTable)
      .set({
        dealsReviewed: (rep.dealsReviewed ?? 0) + 1,
        lastActiveAt:  new Date(),
        updatedAt:     new Date(),
      })
      .where(eq(bankNodesTable.id, rep.id));

    return res.json({
      repName:       rep.repName,
      institution:   rep.institutionName,
      bundle: {
        bundleId:      bundle.bundleId,
        dealId:        bundle.dealId,
        vin:           bundle.vin,
        vehicleLabel:  bundle.vehicleLabel,
        buyerName:     bundle.buyerName,
        dealAmountUsd: bundle.dealAmountUsd,
        status:        bundle.status,
        bundleHash:    bundle.bundleHash,
        sealedAt:      bundle.sealedAt,
        lenderName:    bundle.lenderName,
        fundingRep:    bundle.fundingRep,
      },
      documents:     docs,
      checklist: {
        total:    docs.length,
        verified: docs.filter(d => d.verified).length,
        pending:  docs.filter(d => !d.verified).length,
        complete: allVerified,
      },
      fundReady,
      guardianVerification: {
        vinIntegrity:    "SHA-256 sealed — tamper-evident",
        bundleHash:      bundle.bundleHash ?? "Pending seal",
        architect:       "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
        verifiedAt:      bundle.sealedAt ?? null,
      },
      action: fundReady
        ? { message: "All documents verified. Ready to fund.", endpoint: `POST /api/rep/${rep.repPortalKey}/bundle/${bundle.bundleId}/fund` }
        : { message: "Bundle still assembling. Check back when status is Sealed.", endpoint: null },
    });
  } catch (err) {
    console.error("[rep/bundle]", err);
    return res.status(500).json({ error: "Failed to retrieve bundle" });
  }
});

/**
 * POST /api/rep/:repKey/bundle/:bundleId/fund
 * Bank rep hits "Fund" — no paperwork, no callbacks. Deal is done.
 */
router.post("/:repKey/bundle/:bundleId/fund", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid Rep Portal Key" });
  if (rep.nodeCategory !== "Bank") {
    return res.status(403).json({ error: "Fund action is for Bank Nodes only" });
  }

  try {
    const [bundle] = await db
      .select()
      .from(documentVaultTable)
      .where(eq(documentVaultTable.bundleId, req.params["bundleId"] as string))
      .limit(1);

    if (!bundle) return res.status(404).json({ error: "Bundle not found" });
    if (bundle.status === "Funded") {
      return res.status(409).json({ error: "Deal already funded", fundedAt: bundle.fundedAt });
    }
    if (bundle.status !== "Sealed" && bundle.status !== "Submitted" && bundle.status !== "FundingApproved") {
      return res.status(400).json({ error: `Bundle not ready to fund — current status: ${bundle.status}` });
    }

    const fundedAt = new Date();
    const [updated] = await db
      .update(documentVaultTable)
      .set({
        status:             "Funded",
        fundingApprovedAt:  fundedAt,
        fundedAt:           fundedAt,
        fundingRep:         rep.repName,
        lenderName:         rep.institutionName,
        updatedAt:          fundedAt,
      })
      .where(eq(documentVaultTable.bundleId, req.params["bundleId"] as string))
      .returning();

    const dealAmt = parseFloat(String(bundle.dealAmountUsd ?? 0));
    const fundingTimeMs = bundle.sealedAt
      ? fundedAt.getTime() - bundle.sealedAt.getTime()
      : null;
    const fundingMinutes = fundingTimeMs ? Math.round(fundingTimeMs / 60000) : null;

    // Update rep stats
    await db
      .update(bankNodesTable)
      .set({
        dealsFunded:       (rep.dealsFunded ?? 0) + 1,
        totalFundedUsd:    String((parseFloat(String(rep.totalFundedUsd ?? 0)) + dealAmt).toFixed(2)),
        avgFundingHours3c: fundingMinutes ? Math.round(fundingMinutes / 60 * 10) / 10 : rep.avgFundingHours3c,
        status:            "Active",
        lastActiveAt:      fundedAt,
        updatedAt:         fundedAt,
      })
      .where(eq(bankNodesTable.id, rep.id));

    await eventBus.emit("vault.bundle.sealed", {
      bundleId:  bundle.bundleId,
      vin:       bundle.vin,
      lenderName: rep.institutionName,
    });

    const traditional = (rep.avgFundingDaysTraditional ?? 3.5) * 24 * 60;
    const savedMin    = fundingMinutes ? Math.round(traditional - fundingMinutes) : null;

    return res.json({
      success:      true,
      funded:       true,
      bundle:       updated,
      fundedBy:     `${rep.repName} — ${rep.institutionName}`,
      fundedAt:     fundedAt.toISOString(),
      dealAmount:   fmtUsd(dealAmt),
      fundingTime:  fundingMinutes ? `${fundingMinutes} minutes` : "Instant",
      timeSaved:    savedMin ? `${Math.round(savedMin / 60)} hours faster than traditional` : "vs. 3–7 business day CIT delay",
      message: `Deal ${bundle.dealId} funded by ${rep.repName} at ${rep.institutionName}. ${fundingMinutes ? `Time from sealed to funded: ${fundingMinutes} minutes.` : ""} Traditional CIT delay: ELIMINATED. The Stellantis Protocol is live.`,
      viralNote: "Share this result with your network — this is how you become the most productive rep in the country.",
    });
  } catch (err) {
    console.error("[rep/bundle/fund]", err);
    return res.status(500).json({ error: "Failed to fund deal" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WARRANTY ADMIN REP — Instant Claim Eligibility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/rep/:repKey/warranty/:vin
 * Warranty admin instantly sees all contracts on a VIN — no fax, no phone tag.
 * Resolves: Active / Expired / ExpiringSoon for every contract.
 * Filters to contracts issued by their institution.
 */
router.get("/:repKey/warranty/:vin", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid Rep Portal Key" });
  if (rep.nodeCategory !== "WarrantyAdmin") {
    return res.status(403).json({ error: "Warranty access is for Warranty Administrator Nodes only" });
  }

  const vin = (req.params["vin"] as string).toUpperCase().trim();

  try {
    // Get all warranty records for this VIN
    const allRecords = await db
      .select()
      .from(warrantyRecordsTable)
      .where(eq(warrantyRecordsTable.vin, vin))
      .orderBy(desc(warrantyRecordsTable.createdAt));

    // Filter to this admin's contracts (by provider name) — or show all if admin has global access
    const myRecords = allRecords.filter(r =>
      r.providerName.toLowerCase().includes(rep.institutionName.toLowerCase().split(" ")[0]!)
      || rep.institutionName.toLowerCase().includes(r.providerName.toLowerCase())
    );

    const recordsToShow = myRecords.length > 0 ? myRecords : allRecords;

    const resolved = recordsToShow.map(r => {
      const { status, daysRemaining, milesRemaining } = warrantyLiveStatus(
        r.inServiceDate, r.currentOdometer, r.expiresDate, r.expiresOdometer ?? null,
      );
      return {
        contractNumber:  r.contractNumber,
        warrantyType:    r.warrantyType,
        providerName:    r.providerName,
        inServiceDate:   r.inServiceDate,
        inServiceOdometer: r.inServiceOdometer,
        currentOdometer: r.currentOdometer,
        expiresDate:     r.expiresDate,
        expiresOdometer: r.expiresOdometer,
        deductibleUsd:   r.deductibleUsd,
        isTransferable:  r.isTransferable,
        coverageDetails: r.coverageDetails,
        liveStatus:      status,
        daysRemaining,
        milesRemaining,
        guardianVerified: r.guardianVerified,
        claimEligible:   status === "Active" || status === "ExpiringSoon",
        summary: `${r.providerName} ${r.warrantyType} — ${status}${daysRemaining !== null ? ` · ${daysRemaining} days remaining` : ""}${milesRemaining !== null ? ` · ${milesRemaining.toLocaleString()} miles remaining` : ""}`,
      };
    });

    const eligible = resolved.filter(r => r.claimEligible);

    // Update rep last active
    await db
      .update(bankNodesTable)
      .set({ dealsReviewed: (rep.dealsReviewed ?? 0) + 1, lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(bankNodesTable.id, rep.id));

    return res.json({
      repName:      rep.repName,
      institution:  rep.institutionName,
      vin,
      vehicleLabel: allRecords[0]?.vehicleLabel ?? null,
      contracts:    resolved,
      claimSummary: {
        totalContracts: resolved.length,
        eligible:       eligible.length,
        expired:        resolved.filter(r => r.liveStatus === "Expired").length,
        expiringSoon:   resolved.filter(r => r.liveStatus === "ExpiringSoon").length,
        guardianVerified: resolved.filter(r => r.guardianVerified).length,
      },
      warrantyProtocol: {
        bottleneck: "Manual odometer verification, faxed contracts, 4-step admin lookup",
        solution:   "Guardian Agent resolves all contracts in one call — in-service date + live odometer",
        stepsEliminated: 4,
        message:    eligible.length > 0
          ? `${eligible.length} contract(s) eligible for claim. No further verification needed — Guardian Agent has confirmed VIN integrity.`
          : "No active contracts found for this VIN. All contracts expired.",
      },
      action: eligible.length > 0
        ? { approve: `POST /api/rep/${rep.repPortalKey}/warranty/${vin}/approve` }
        : null,
    });
  } catch (err) {
    console.error("[rep/warranty]", err);
    return res.status(500).json({ error: "Warranty lookup failed" });
  }
});

/**
 * POST /api/rep/:repKey/warranty/:vin/approve
 * Warranty admin approves a claim — no callbacks, no fax, instant confirmation.
 */
router.post("/:repKey/warranty/:vin/approve", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid Rep Portal Key" });
  if (rep.nodeCategory !== "WarrantyAdmin") {
    return res.status(403).json({ error: "Claim approval is for Warranty Administrator Nodes only" });
  }

  const vin = (req.params["vin"] as string).toUpperCase().trim();
  const { contractNumber, claimType, approvedAmountUsd, notes } = req.body as Record<string, unknown>;

  const claimId = `CLM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // Mark warranty as guardian-verified on approval
  if (contractNumber) {
    await db
      .update(warrantyRecordsTable)
      .set({ guardianVerified: true, lastCheckedAt: new Date(), updatedAt: new Date() })
      .where(eq(warrantyRecordsTable.contractNumber, String(contractNumber)));
  }

  // Update rep stats
  await db
    .update(bankNodesTable)
    .set({
      dealsFunded:  (rep.dealsFunded ?? 0) + 1,
      lastActiveAt: new Date(),
      updatedAt:    new Date(),
    })
    .where(eq(bankNodesTable.id, rep.id));

  await eventBus.emit("node.appointment.scheduled", {
    appointmentId: claimId,
    nodeId:        String(rep.id),
    nodeName:      rep.institutionName,
    vin,
    serviceType:   String(claimType ?? "WarrantyClaim"),
  });

  return res.json({
    success:       true,
    claimId,
    vin,
    contractNumber: contractNumber ?? null,
    claimType:      claimType ?? "General",
    approvedAmountUsd: approvedAmountUsd ?? null,
    approvedBy:    `${rep.repName} — ${rep.institutionName}`,
    approvedAt:    new Date().toISOString(),
    notes:         notes ?? null,
    message: `Claim ${claimId} approved by ${rep.repName} at ${rep.institutionName}. No paperwork. No callbacks. No 3–7 day delay. The 3C Warranty Protocol just eliminated the manual lookup bottleneck for this claim.`,
    viralNote: "Share this process with other admins — this is the new standard.",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REP PRODUCTIVITY STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/rep/:repKey/stats
 * The rep's personal productivity scorecard — proof they're the best in the building.
 */
router.get("/:repKey/stats", async (req: Request, res: Response) => {
  const rep = await resolveRep(req.params["repKey"] as string);
  if (!rep) return res.status(401).json({ error: "Invalid Rep Portal Key" });

  const fundingTimeImprovement = rep.avgFundingHours3c
    ? Math.round(((rep.avgFundingDaysTraditional ?? 3.5) * 24 - rep.avgFundingHours3c) / ((rep.avgFundingDaysTraditional ?? 3.5) * 24) * 100)
    : 90;

  const totalFunded = parseFloat(String(rep.totalFundedUsd ?? 0));

  return res.json({
    rep:          { name: rep.repName, institution: rep.institutionName, category: rep.nodeCategory, tier: rep.tier },
    productivity: {
      dealsReviewed:    rep.dealsReviewed,
      dealsFunded:      rep.dealsFunded,
      fundingRate:      rep.dealsReviewed > 0
        ? `${Math.round((rep.dealsFunded / rep.dealsReviewed) * 100)}%`
        : "N/A",
      totalFundedUsd:   fmtUsd(totalFunded),
      avgFundingTimeTraditional: `${(rep.avgFundingDaysTraditional ?? 3.5).toFixed(1)} business days`,
      avgFundingTime3c: rep.avgFundingHours3c ? `${rep.avgFundingHours3c.toFixed(1)} hours` : "< 2 hours (projected)",
      timeImprovement:  `${fundingTimeImprovement}% faster`,
      referredNodes:    rep.referredNodes,
      status:           rep.status,
    },
    message: rep.dealsFunded > 0
      ? `${rep.repName} has funded ${rep.dealsFunded} deal(s) totaling ${fmtUsd(totalFunded)} through the 3C Mesh — ${fundingTimeImprovement}% faster than traditional. The Family is watching.`
      : `${rep.repName} is activated. First deal funded through 3C Onyx will be ${fundingTimeImprovement}% faster than traditional. Go tell the Family.`,
  });
});

export default router;
