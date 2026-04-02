import { Router, type Request, type Response } from "express";
import { getChain, verifyChain } from "../lib/chainOfCustody";
import { getCascadeStatus } from "../lib/paperworkKiller";
import { maskPii } from "../lib/cipher";
import { db, referralLedgerTable, documentVaultTable, warrantyRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

interface ProofEvent {
  timestamp: string;
  type: string;
  actor: string;
  description: string;
  verified: boolean;
  sha256?: string;
  ethTxHash?: string | null;
  blockIndex?: number;
  source: string;
  category?: string;
  amount?: string | null;
}

function computeTrustScore(chain: { valid: boolean; totalEntries: number }, eventCount: number, dbEventCount: number): {
  score: number;
  grade: string;
  label: string;
  color: string;
} {
  let score = 0;

  if (chain.totalEntries > 0) score += 25;
  if (chain.valid) score += 20;

  score += Math.min(20, chain.totalEntries * 4);
  score += Math.min(15, eventCount * 3);
  score += Math.min(20, dbEventCount * 5);

  score = Math.min(100, score);

  let grade: string;
  let label: string;
  let color: string;

  if (score >= 90)      { grade = "A+"; label = "ONYX CERTIFIED";        color = "#C9A227"; }
  else if (score >= 80) { grade = "A";  label = "ONYX VERIFIED";         color = "#10B981"; }
  else if (score >= 65) { grade = "B";  label = "VERIFIED";              color = "#3B82F6"; }
  else if (score >= 50) { grade = "C";  label = "PARTIALLY VERIFIED";    color = "#F59E0B"; }
  else                  { grade = "D";  label = "UNVERIFIED";            color = "#EF4444"; }

  return { score, grade, label, color };
}

function fmt(n: number | string | null | undefined) {
  const num = parseFloat(String(n ?? 0));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

router.get("/vehicle/:vin/proof", async (req: Request, res: Response) => {
  const vin = String(req.params.vin).toUpperCase();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    res.status(400).json({ error: "Invalid VIN — must be 17 alphanumeric characters (no I, O, Q)" });
    return;
  }

  const chain = getChain(vin);
  const verification = verifyChain(vin);

  const proofEvents: ProofEvent[] = [];

  for (const entry of chain) {
    const descMap: Record<string, string> = {
      inspection: "Vehicle inspection completed",
      delivery: "Vehicle delivered to owner",
      transfer: "Ownership transferred",
      ownership: "Ownership record established",
      maintenance: "Service/maintenance performed",
      v2x_alert: "Vehicle-to-everything safety event",
      bgc_verified: "Background check verified",
      bol_issued: "Bill of lading issued",
      sdv_registration: "Software-defined vehicle registered",
      ota_update: "Over-the-air software update applied",
    };

    proofEvents.push({
      timestamp: entry.timestamp,
      type: entry.type,
      actor: maskPii(entry.actor, "name"),
      description: descMap[entry.type] ?? `Event: ${entry.type}`,
      verified: true,
      sha256: entry.sha256,
      ethTxHash: entry.ethTxHash ?? null,
      blockIndex: entry.blockIndex,
      source: "ONYX Chain-of-Custody",
      category: "blockchain",
    });
  }

  let dbEventCount = 0;
  let vehicleLabel: string | null = null;
  const commerceSummary = {
    warranties: 0,
    deals: 0,
    referrals: 0,
    totalFunded: "$0",
    commissionsPaid: "$0",
  };

  try {
    const [warranties, bundles, referrals] = await Promise.all([
      db.select().from(warrantyRecordsTable).where(eq(warrantyRecordsTable.vin, vin)),
      db.select().from(documentVaultTable).where(eq(documentVaultTable.vin, vin)),
      db.select().from(referralLedgerTable).where(eq(referralLedgerTable.vin, vin)),
    ]);

    commerceSummary.warranties = warranties.length;
    commerceSummary.deals = bundles.length;
    commerceSummary.referrals = referrals.length;

    if (bundles[0]?.vehicleLabel) vehicleLabel = bundles[0].vehicleLabel;
    else if (warranties[0]?.vehicleLabel) vehicleLabel = warranties[0].vehicleLabel;

    for (const w of warranties) {
      dbEventCount++;
      const expired = w.expiresDate ? w.expiresDate <= new Date() : false;
      proofEvents.push({
        timestamp: (w.inServiceDate ?? w.createdAt)?.toISOString() ?? new Date().toISOString(),
        type: "warranty",
        actor: maskPii(w.providerName, "name"),
        description: `${w.warrantyType} warranty registered`,
        verified: !!w.guardianVerified,
        source: "Warranty Engine",
        category: "warranty",
        amount: w.deductibleUsd ? `$${w.deductibleUsd} deductible` : null,
      });

      if (w.guardianVerified && w.lastCheckedAt) {
        dbEventCount++;
        proofEvents.push({
          timestamp: w.lastCheckedAt.toISOString(),
          type: "warranty_verified",
          actor: "Guardian Agent",
          description: `Warranty contract — guardian verified, coverage ${expired ? "expired" : "active"}`,
          verified: true,
          source: "Guardian Agent",
          category: "warranty",
        });
      }
    }

    for (const b of bundles) {
      dbEventCount++;
      proofEvents.push({
        timestamp: b.createdAt?.toISOString() ?? new Date().toISOString(),
        type: "deal_created",
        actor: "F&I Agent",
        description: "Deal bundle created",
        verified: false,
        source: "Document Vault",
        category: "funding",
        amount: b.dealAmountUsd ? fmt(b.dealAmountUsd) : null,
      });

      if (b.sealedAt) {
        dbEventCount++;
        proofEvents.push({
          timestamp: b.sealedAt.toISOString(),
          type: "deal_sealed",
          actor: "Vault Agent",
          description: `SHA-256 integrity seal applied — ${b.bundleHash?.substring(0, 16)}...`,
          verified: true,
          sha256: b.bundleHash ?? undefined,
          source: "Vault Agent",
          category: "funding",
        });
      }

      if (b.fundedAt) {
        dbEventCount++;
        proofEvents.push({
          timestamp: b.fundedAt.toISOString(),
          type: "deal_funded",
          actor: maskPii(b.fundingRep ?? "Bank Rep", "name"),
          description: `Deal funded — ${fmt(b.dealAmountUsd ?? 0)}. CIT delay eliminated.`,
          verified: true,
          source: "Bank Node → Stripe",
          category: "funding",
          amount: fmt(b.dealAmountUsd ?? 0),
        });
      }
    }

    commerceSummary.totalFunded = fmt(
      bundles.filter(b => b.status === "Funded").reduce((s, b) => s + parseFloat(String(b.dealAmountUsd ?? 0)), 0),
    );

    for (const r of referrals) {
      dbEventCount++;
      const commission = parseFloat(String(r.commissionUsd ?? 0));
      proofEvents.push({
        timestamp: (r.settledAt ?? r.createdAt)?.toISOString() ?? new Date().toISOString(),
        type: r.status === "Settled" ? "commission_settled" : "referral_active",
        actor: maskPii(r.referringNodeName, "name"),
        description: r.status === "Settled"
          ? `Commission settled — ${fmt(commission)}`
          : "Bird-dog referral active",
        verified: r.status === "Settled",
        source: "Bird-Dog Engine",
        category: "referral",
        amount: commission > 0 ? fmt(commission) : null,
      });
    }

    commerceSummary.commissionsPaid = fmt(
      referrals.filter(r => r.status === "Settled").reduce((s, r) => s + parseFloat(String(r.commissionUsd ?? 0)), 0),
    );
  } catch (err) {
    logger.warn({ err, vin }, "[vehicleProof] DB query failed — returning blockchain-only proof");
  }

  const isSimulated = chain.length === 0 && dbEventCount === 0;

  if (isSimulated) {
    const now = new Date();
    const simEvents: Array<{ type: string; desc: string; days: number }> = [
      { type: "ownership", desc: "Vehicle acquired by authorized dealer", days: 90 },
      { type: "inspection", desc: "Multi-point vehicle inspection completed — 142 checkpoints passed", days: 60 },
      { type: "maintenance", desc: "Full service performed — oil change, tire rotation, brake inspection", days: 30 },
      { type: "transfer", desc: "Ownership transferred to new member — all documents digitally signed", days: 7 },
      { type: "delivery", desc: "Vehicle delivered — QR-verified handoff, photos captured, condition confirmed", days: 2 },
    ];

    for (let i = 0; i < simEvents.length; i++) {
      const s = simEvents[i];
      proofEvents.push({
        timestamp: new Date(now.getTime() - s.days * 86_400_000).toISOString(),
        type: s.type,
        actor: i === 0 ? "Dealer Network" : i === 4 ? "3C Runner" : "3C Certified",
        description: s.desc,
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: i,
        source: "SIMULATED",
        category: "demo",
      });
    }
  }

  const verifiedCount = proofEvents.filter(e => e.verified).length;
  const trustScore = computeTrustScore(verification, verifiedCount, dbEventCount);
  const hasEthAnchoring = chain.some(e => !!e.ethTxHash);
  const cascadeStatus = getCascadeStatus();

  res.json({
    vin,
    vehicleLabel,
    platform: "3C ONYX — Sovereign Automotive Ecosystem OS",
    architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    documentType: "Digital Birth Certificate",
    issuedAt: new Date().toISOString(),
    singularity: "Blockchain + Timeline + Trust + Commerce — unified proof layer",

    trustScore,
    simulated: isSimulated,

    verification: {
      chainIntegrity: verification.valid ? "INTACT" : "BROKEN",
      totalEntries: verification.totalEntries,
      verifiedEvents: verifiedCount,
      totalLifecycleEvents: proofEvents.length,
      hashAlgorithm: "SHA-256",
      signatureAlgorithm: "HMAC-SHA-256",
      ethereumAnchoring: hasEthAnchoring,
      network: hasEthAnchoring ? "ethereum-sepolia" : "local-hash-chain",
    },

    commerce: commerceSummary,

    cascadeEngine: {
      status: cascadeStatus.status,
      totalCascadeSteps: cascadeStatus.totalSteps,
      philosophy: cascadeStatus.philosophy,
    },

    timeline: proofEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

    proofStatement: {
      claim: isSimulated
        ? `Vehicle ${vin} has no verified records on the ONYX trust ledger. Showing simulated lifecycle for demonstration.`
        : `Vehicle ${vin} has ${verifiedCount} verified lifecycle events across ${proofEvents.length} total records — blockchain, warranty, funding, and referral data fused into one proof.`,
      method: "Each blockchain event is hashed (SHA-256), linked to the previous event's hash, and signed (HMAC-SHA-256). Commerce events are verified against the ONYX database layer.",
      differentiator: "CarFax tells you. ONYX proves it.",
    },

    verifyEndpoints: {
      fullChain: `/api/blockchain/chain/${vin}`,
      integrityCheck: `/api/blockchain/verify/${vin}`,
      singleProof: "/api/blockchain/proof/:sha256hash",
      timeline: `/api/timeline/${vin}`,
      cascadeStatus: "/api/vehicle/cascade/status",
    },
  });
});

router.get("/vehicle/cascade/status", (_req: Request, res: Response) => {
  res.json(getCascadeStatus());
});

export default router;
