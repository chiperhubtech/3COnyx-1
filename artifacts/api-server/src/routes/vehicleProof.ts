import { Router, type Request, type Response } from "express";
import { getChain, verifyChain } from "../lib/chainOfCustody";
import { maskPii } from "../lib/cipher";

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
}

function computeTrustScore(chain: { valid: boolean; totalEntries: number }, eventCount: number): {
  score: number;
  grade: string;
  label: string;
  color: string;
} {
  let score = 0;

  if (chain.totalEntries > 0) score += 30;
  if (chain.valid) score += 25;

  score += Math.min(25, chain.totalEntries * 5);
  score += Math.min(20, eventCount * 3);

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
    });
  }

  const isSimulated = chain.length === 0;

  if (isSimulated) {
    const now = new Date();
    proofEvents.push(
      {
        timestamp: new Date(now.getTime() - 90 * 86_400_000).toISOString(),
        type: "ownership",
        actor: "Dealer Network",
        description: "Vehicle acquired by authorized dealer",
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: 0,
        source: "SIMULATED — no chain-of-custody records exist for this VIN",
      },
      {
        timestamp: new Date(now.getTime() - 60 * 86_400_000).toISOString(),
        type: "inspection",
        actor: "3C Certified Inspector",
        description: "Multi-point vehicle inspection completed — 142 checkpoints passed",
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: 1,
        source: "SIMULATED — no chain-of-custody records exist for this VIN",
      },
      {
        timestamp: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
        type: "maintenance",
        actor: "3C Service Center",
        description: "Full service performed — oil change, tire rotation, brake inspection",
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: 2,
        source: "SIMULATED — no chain-of-custody records exist for this VIN",
      },
      {
        timestamp: new Date(now.getTime() - 7 * 86_400_000).toISOString(),
        type: "transfer",
        actor: "ONYX Platform",
        description: "Ownership transferred to new member — all documents digitally signed",
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: 3,
        source: "SIMULATED — no chain-of-custody records exist for this VIN",
      },
      {
        timestamp: new Date(now.getTime() - 2 * 86_400_000).toISOString(),
        type: "delivery",
        actor: "3C Runner",
        description: "Vehicle delivered — QR-verified handoff, photos captured, condition confirmed",
        verified: false,
        sha256: undefined,
        ethTxHash: null,
        blockIndex: 4,
        source: "SIMULATED — no chain-of-custody records exist for this VIN",
      },
    );
  }

  const verifiedCount = proofEvents.filter(e => e.verified).length;
  const trustScore = computeTrustScore(verification, verifiedCount);

  const hasEthAnchoring = chain.some(e => !!e.ethTxHash);

  res.json({
    vin,
    platform: "3C ONYX — Sovereign Automotive Ecosystem OS",
    architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    documentType: "Digital Birth Certificate",
    issuedAt: new Date().toISOString(),

    trustScore,
    simulated: isSimulated,

    verification: {
      chainIntegrity: verification.valid ? "INTACT" : "BROKEN",
      totalEntries: verification.totalEntries,
      verifiedEvents: verifiedCount,
      hashAlgorithm: "SHA-256",
      signatureAlgorithm: "HMAC-SHA-256",
      ethereumAnchoring: hasEthAnchoring,
      network: hasEthAnchoring ? "ethereum-sepolia" : "local-hash-chain",
    },

    timeline: proofEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

    proofStatement: {
      claim: isSimulated
        ? `Vehicle ${vin} has no verified records on the ONYX trust ledger. Showing simulated lifecycle for demonstration.`
        : `Vehicle ${vin} has ${verifiedCount} verified lifecycle events recorded on the ONYX trust ledger.`,
      method: "Each event is hashed (SHA-256), linked to the previous event's hash, and signed (HMAC-SHA-256). The chain is independently verifiable.",
      differentiator: "CarFax tells you. ONYX proves it.",
    },

    verifyEndpoints: {
      fullChain: `/api/blockchain/chain/${vin}`,
      integrityCheck: `/api/blockchain/verify/${vin}`,
      singleProof: "/api/blockchain/proof/:sha256hash",
    },
  });
});

export default router;
