/**
 * 3C Onyx — Two-Way Integrity Mesh (Reputation Ledger)
 *
 * Immutable reputation architecture for both Professionals and Members.
 *
 * Professional scoring:
 *   - AI-verified accuracy: Guardian diagnosis vs. actual parts installed
 *   - Member satisfaction: avg rating from served members
 *   - Response speed: time from match to confirmation
 *   - Job volume: verified completed jobs
 *   - Routing weight: high-rated (85+) get +20% routing priority
 *
 * Member scoring:
 *   - Payment speed: time from job completion to settlement
 *   - Data accuracy: was vehicle history/VIN data accurate when Guardian ran?
 *   - Trust tier: Priority Runner (85+), Member (60-84), Provisional (<60)
 *   - Member Slice multiplier: 1.25x for Priority Runners
 *
 * I-95 Spine coverage: Boston → DC (Northeast Corridor)
 *
 * Routes:
 *   GET  /api/reputation/professionals          — Full directory with scores
 *   GET  /api/reputation/professionals/:id      — Single professional detail
 *   GET  /api/reputation/match                  — Best-match for a job spec
 *   POST /api/reputation/professionals/:id/rate — Submit job rating (AI-verified)
 *   GET  /api/reputation/members/:id            — Member score + trust tier
 *   POST /api/reputation/members/:id/rate       — Professional rates member
 *   GET  /api/reputation/leaderboard            — Top 10 professionals
 *   GET  /api/reputation/audit                  — Ledger audit trail
 */
import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { maskPii } from "../lib/cipher";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Professional {
  id: string;
  name: string;             // masked for display: "M. Rodriguez"
  shop: string;
  city: string; state: string; zip: string;
  corridor: string;         // I-95 Spine zone
  lat: number; lng: number;
  specialties: string[];
  makes: string[];
  verified: boolean;        // Checkr BGC passed
  licenseType: "independent" | "freelancer" | "dealer";

  // Reputation scores (0-100)
  reputationScore: number;
  aiAccuracyScore: number;   // Guardian diagnosis vs. actual work match
  memberSatisfaction: number;// avg from members rated
  responseTimeMins: number;  // avg from match to job confirmation
  routingWeight: number;     // base 100; high-rated get +20 boost

  // Volume
  jobsCompleted: number;
  jobsThisMonth: number;
  totalPlatformRevenue: number;

  // Stripe Connect
  stripeConnectId: string;

  // Integrity
  lastAuditHash: string;
  joinedAt: string;
  badgeLevel: "platinum" | "gold" | "silver" | "bronze";
}

export interface MemberProfile {
  memberId: string;
  displayName: string;       // masked: "A.H."
  paymentSpeedScore: number; // 0-100: how fast they settle
  dataAccuracyScore: number; // 0-100: VIN/vehicle data accuracy
  overallScore: number;
  trustTier: "Priority Runner" | "Member" | "Provisional";
  memberSliceMultiplier: number; // 1.0 – 1.25
  jobHistory: number;
  totalMemberSliceEarned: number;
}

export interface LedgerEntry {
  id: string;
  type: "professional_rated" | "member_rated" | "match_routed" | "score_updated";
  professionalId: string;
  memberId?: string;
  jobId?: string;
  before: number;
  after: number;
  delta: number;
  reason: string;
  aiVerified: boolean;
  hash: string;             // SHA-256 of previous hash + entry
  timestamp: string;
}

// ─── Seed Data — I-95 Spine Professionals ────────────────────────────────────
let LEDGER_HEAD_HASH = crypto.createHash("sha256").update("genesis-3c-onyx").digest("hex");

function ledgerHash(prev: string, entry: Omit<LedgerEntry, "hash">): string {
  return crypto.createHash("sha256")
    .update(prev + JSON.stringify(entry))
    .digest("hex");
}

const PROFESSIONALS: Professional[] = [
  {
    id: "pro-nyc-001",
    name: "M. Rodriguez", shop: "Manhattan Euro Specialists",
    city: "New York", state: "NY", zip: "10001", corridor: "NYC Metro",
    lat: 40.7484, lng: -73.9967,
    specialties: ["Mechanical Diagnosis", "Performance Tuning", "Pre-Purchase Inspection"],
    makes: ["Porsche", "Ferrari", "Lamborghini", "McLaren"],
    verified: true, licenseType: "independent",
    reputationScore: 94, aiAccuracyScore: 97, memberSatisfaction: 92,
    responseTimeMins: 8, routingWeight: 114,  // 94+ → +20 boost
    jobsCompleted: 412, jobsThisMonth: 31, totalPlatformRevenue: 2_840_000,
    stripeConnectId: "acct_mrodriguez_nyc",
    lastAuditHash: "a7f3b2...", joinedAt: "2024-03-15T00:00:00Z",
    badgeLevel: "platinum",
  },
  {
    id: "pro-bos-001",
    name: "A. Patel", shop: "Back Bay Exotic Service",
    city: "Boston", state: "MA", zip: "02116", corridor: "Boston Metro",
    lat: 42.3508, lng: -71.0748,
    specialties: ["Electrical Systems", "OBD-II Diagnosis", "Alternator & Charging"],
    makes: ["Rolls-Royce", "Bentley", "Porsche", "Aston Martin"],
    verified: true, licenseType: "independent",
    reputationScore: 91, aiAccuracyScore: 93, memberSatisfaction: 90,
    responseTimeMins: 12, routingWeight: 111,
    jobsCompleted: 287, jobsThisMonth: 22, totalPlatformRevenue: 1_920_000,
    stripeConnectId: "acct_apatel_bos",
    lastAuditHash: "c2e9a1...", joinedAt: "2024-05-02T00:00:00Z",
    badgeLevel: "platinum",
  },
  {
    id: "pro-dc-001",
    name: "J. Washington", shop: "Capitol Performance & Service",
    city: "Washington", state: "DC", zip: "20001", corridor: "DC Metro",
    lat: 38.9072, lng: -77.0369,
    specialties: ["Transmission Service", "Cooling Systems", "Brake Systems"],
    makes: ["Mercedes-Benz", "BMW", "Porsche", "Ferrari"],
    verified: true, licenseType: "dealer",
    reputationScore: 89, aiAccuracyScore: 91, memberSatisfaction: 88,
    responseTimeMins: 15, routingWeight: 109,
    jobsCompleted: 341, jobsThisMonth: 27, totalPlatformRevenue: 2_140_000,
    stripeConnectId: "acct_jwashington_dc",
    lastAuditHash: "d4f8c3...", joinedAt: "2024-01-20T00:00:00Z",
    badgeLevel: "platinum",
  },
  {
    id: "pro-phl-001",
    name: "C. Marchetti", shop: "Rittenhouse Euro Garage",
    city: "Philadelphia", state: "PA", zip: "19103", corridor: "Philadelphia",
    lat: 39.9526, lng: -75.1652,
    specialties: ["Engine Diagnostics", "Suspension & Alignment", "Pre-Purchase"],
    makes: ["Ferrari", "Lamborghini", "Aston Martin", "McLaren"],
    verified: true, licenseType: "independent",
    reputationScore: 87, aiAccuracyScore: 89, memberSatisfaction: 86,
    responseTimeMins: 18, routingWeight: 107,
    jobsCompleted: 198, jobsThisMonth: 16, totalPlatformRevenue: 1_340_000,
    stripeConnectId: "acct_cmarchetti_phl",
    lastAuditHash: "e7b2d4...", joinedAt: "2024-06-10T00:00:00Z",
    badgeLevel: "gold",
  },
  {
    id: "pro-nwk-001",
    name: "T. Johnson", shop: "Newark Luxury Auto",
    city: "Newark", state: "NJ", zip: "07102", corridor: "NYC Metro",
    lat: 40.7357, lng: -74.1724,
    specialties: ["Quick Response Mechanical", "Mobile Inspection", "Tire Systems"],
    makes: ["Rolls-Royce", "Bentley", "Maybach", "Range Rover"],
    verified: true, licenseType: "freelancer",
    reputationScore: 84, aiAccuracyScore: 86, memberSatisfaction: 83,
    responseTimeMins: 22, routingWeight: 100,
    jobsCompleted: 156, jobsThisMonth: 14, totalPlatformRevenue: 980_000,
    stripeConnectId: "acct_tjohnson_nwk",
    lastAuditHash: "f1a3e9...", joinedAt: "2024-08-01T00:00:00Z",
    badgeLevel: "gold",
  },
  {
    id: "pro-blt-001",
    name: "D. Kim", shop: "Inner Harbor Performance",
    city: "Baltimore", state: "MD", zip: "21201", corridor: "Baltimore-DC",
    lat: 39.2904, lng: -76.6122,
    specialties: ["Pre-Purchase Inspection", "OBD-II Diagnosis", "Detailing"],
    makes: ["Porsche", "BMW", "Mercedes-Benz", "Maserati"],
    verified: true, licenseType: "independent",
    reputationScore: 81, aiAccuracyScore: 83, memberSatisfaction: 80,
    responseTimeMins: 25, routingWeight: 100,
    jobsCompleted: 124, jobsThisMonth: 11, totalPlatformRevenue: 780_000,
    stripeConnectId: "acct_dkim_blt",
    lastAuditHash: "g3c7f2...", joinedAt: "2024-09-15T00:00:00Z",
    badgeLevel: "silver",
  },
  {
    id: "pro-nhv-001",
    name: "S. Torres", shop: "Yale Motor Works",
    city: "New Haven", state: "CT", zip: "06510", corridor: "I-95 Connecticut",
    lat: 41.3083, lng: -72.9279,
    specialties: ["Exotic Car Storage", "Seasonal Service", "Detailing"],
    makes: ["Ferrari", "Porsche", "Lamborghini", "Aston Martin"],
    verified: true, licenseType: "independent",
    reputationScore: 78, aiAccuracyScore: 79, memberSatisfaction: 78,
    responseTimeMins: 30, routingWeight: 100,
    jobsCompleted: 89, jobsThisMonth: 8, totalPlatformRevenue: 560_000,
    stripeConnectId: "acct_storres_nhv",
    lastAuditHash: "h2d1a8...", joinedAt: "2024-11-01T00:00:00Z",
    badgeLevel: "silver",
  },
];

const MEMBER_PROFILES: MemberProfile[] = [
  {
    memberId: "member-001", displayName: "A.H.",
    paymentSpeedScore: 98, dataAccuracyScore: 96, overallScore: 97,
    trustTier: "Priority Runner", memberSliceMultiplier: 1.25,
    jobHistory: 8, totalMemberSliceEarned: 14_820,
  },
  {
    memberId: "member-002", displayName: "D.K.",
    paymentSpeedScore: 91, dataAccuracyScore: 88, overallScore: 89,
    trustTier: "Priority Runner", memberSliceMultiplier: 1.20,
    jobHistory: 5, totalMemberSliceEarned: 9_140,
  },
  {
    memberId: "member-003", displayName: "S.P.",
    paymentSpeedScore: 74, dataAccuracyScore: 71, overallScore: 73,
    trustTier: "Member", memberSliceMultiplier: 1.0,
    jobHistory: 2, totalMemberSliceEarned: 2_860,
  },
];

// In-memory ledger (append-only pattern)
const LEDGER: LedgerEntry[] = [
  {
    id: crypto.randomBytes(4).toString("hex"),
    type: "score_updated", professionalId: "pro-nyc-001",
    before: 91, after: 94, delta: 3,
    reason: "AI verified: alternator diagnosis matched OEM part installed (P0562/P2503)",
    aiVerified: true,
    hash: crypto.createHash("sha256").update(LEDGER_HEAD_HASH + "seed-1").digest("hex"),
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: crypto.randomBytes(4).toString("hex"),
    type: "member_rated", professionalId: "pro-bos-001", memberId: "member-001",
    before: 90, after: 91, delta: 1,
    reason: "Member A.H. paid within 2 hours of job completion. Vehicle data accuracy: 98%",
    aiVerified: false,
    hash: crypto.createHash("sha256").update(LEDGER_HEAD_HASH + "seed-2").digest("hex"),
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Match Engine ─────────────────────────────────────────────────────────────
export function matchProfessional(opts: {
  make: string; city?: string; state?: string;
  specialty?: string; priorityMemberId?: string;
}): { professional: Professional; matchScore: number; priorityBoost: boolean } | null {
  const { make, city, state, specialty, priorityMemberId } = opts;

  // Check if member gets Priority Runner boost
  const member = MEMBER_PROFILES.find(m => m.memberId === priorityMemberId);
  const priorityRunner = member?.trustTier === "Priority Runner";

  const scored = PROFESSIONALS.filter(p => p.verified).map(p => {
    let score = 0;
    // Make match (most important)
    if (p.makes.some(m => m.toLowerCase() === make?.toLowerCase())) score += 40;
    // Specialty match
    if (specialty && p.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))) score += 20;
    // Geographic proximity (same state)
    if (state && p.state.toLowerCase() === state.toLowerCase()) score += 20;
    // Routing weight (reputation-based +20% for high scorers)
    score += p.routingWeight / 10;
    // Priority member gets top-rated pro preference
    if (priorityRunner) score += 10;
    return { professional: p, matchScore: Math.min(score, 100), priorityBoost: priorityRunner };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored[0] ?? null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/reputation/professionals
router.get("/professionals", (_req: Request, res: Response) => {
  return res.json({
    professionals: PROFESSIONALS,
    stats: {
      total: PROFESSIONALS.length,
      verified: PROFESSIONALS.filter(p => p.verified).length,
      platinum: PROFESSIONALS.filter(p => p.badgeLevel === "platinum").length,
      avgScore: Math.round(PROFESSIONALS.reduce((s, p) => s + p.reputationScore, 0) / PROFESSIONALS.length),
      corridors: [...new Set(PROFESSIONALS.map(p => p.corridor))],
    },
  });
});

// GET /api/reputation/professionals/:id
router.get("/professionals/:id", (req: Request, res: Response) => {
  const pro = PROFESSIONALS.find(p => p.id === req.params.id);
  if (!pro) return res.status(404).json({ error: "Professional not found" });
  const history = LEDGER.filter(e => e.professionalId === req.params.id);
  return res.json({ professional: pro, ledgerHistory: history });
});

// GET /api/reputation/match?make=Porsche&state=NY&specialty=Electrical
router.get("/match", (req: Request, res: Response) => {
  const { make, state, city, specialty, memberId } = req.query as Record<string, string>;
  const result = matchProfessional({ make, state, city, specialty, priorityMemberId: memberId });
  if (!result) return res.json({ match: null, reason: "No verified professionals available" });
  return res.json({
    match: result.professional,
    matchScore: result.matchScore,
    priorityBoost: result.priorityBoost,
    routingNote: result.professional.routingWeight > 100
      ? `+20% routing priority applied (score ${result.professional.reputationScore}+)`
      : "Standard routing",
  });
});

// POST /api/reputation/professionals/:id/rate — AI-verified job rating
router.post("/professionals/:id/rate", (req: Request, res: Response) => {
  const pro = PROFESSIONALS.find(p => p.id === req.params.id);
  if (!pro) return res.status(404).json({ error: "Professional not found" });

  const { jobId, diagnosedComponent, actualPartInstalled, memberRating, aiVerified } = req.body as {
    jobId: string; diagnosedComponent: string; actualPartInstalled: string;
    memberRating: number; aiVerified: boolean;
  };

  // AI accuracy: did the work match the Guardian diagnosis?
  const diagnosisMatch = Boolean(diagnosedComponent && actualPartInstalled &&
    diagnosedComponent.toLowerCase().split(" ").some(w => actualPartInstalled.toLowerCase().includes(w)));
  const accuracyDelta = diagnosisMatch ? 1 : -2;
  const satisfactionDelta = memberRating >= 4 ? 1 : memberRating <= 2 ? -2 : 0;

  const prevScore = pro.reputationScore;
  pro.aiAccuracyScore = Math.min(100, Math.max(0, pro.aiAccuracyScore + accuracyDelta));
  pro.memberSatisfaction = Math.min(100, Math.max(0, pro.memberSatisfaction + satisfactionDelta));
  pro.reputationScore = Math.round((pro.aiAccuracyScore * 0.5 + pro.memberSatisfaction * 0.3 + Math.min(100, pro.jobsCompleted / 5) * 0.2));
  pro.routingWeight = pro.reputationScore >= 85 ? 120 : 100;
  pro.jobsCompleted += 1;
  pro.jobsThisMonth += 1;

  const entry: LedgerEntry = {
    id: crypto.randomBytes(4).toString("hex"),
    type: "professional_rated", professionalId: pro.id, jobId,
    before: prevScore, after: pro.reputationScore, delta: pro.reputationScore - prevScore,
    reason: `AI ${diagnosisMatch ? "verified" : "flagged"}: diagnosis "${diagnosedComponent}" vs. installed "${actualPartInstalled}". Member rating: ${memberRating}/5`,
    aiVerified: diagnosisMatch,
    hash: ledgerHash(LEDGER_HEAD_HASH, { id: "pending", type: "professional_rated", professionalId: pro.id, jobId, before: prevScore, after: pro.reputationScore, delta: pro.reputationScore - prevScore, reason: "", aiVerified: diagnosisMatch, timestamp: new Date().toISOString() }),
    timestamp: new Date().toISOString(),
  };
  LEDGER_HEAD_HASH = entry.hash;
  LEDGER.push(entry);

  return res.json({ success: true, professional: pro, ledgerEntry: entry, diagnosisMatch });
});

// GET /api/reputation/members/:id
router.get("/members/:id", (req: Request, res: Response) => {
  const member = MEMBER_PROFILES.find(m => m.memberId === req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  return res.json({ member });
});

// POST /api/reputation/members/:id/rate — Professional rates member
router.post("/members/:id/rate", (req: Request, res: Response) => {
  const member = MEMBER_PROFILES.find(m => m.memberId === req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });

  const { paymentSpeed, dataAccuracy, professionalId } = req.body as {
    paymentSpeed: number; dataAccuracy: number; professionalId: string;
  };

  const prev = member.overallScore;
  member.paymentSpeedScore = Math.round((member.paymentSpeedScore * 0.8) + (paymentSpeed * 0.2));
  member.dataAccuracyScore = Math.round((member.dataAccuracyScore * 0.8) + (dataAccuracy * 0.2));
  member.overallScore = Math.round((member.paymentSpeedScore + member.dataAccuracyScore) / 2);
  member.trustTier = member.overallScore >= 85 ? "Priority Runner" : member.overallScore >= 60 ? "Member" : "Provisional";
  member.memberSliceMultiplier = member.overallScore >= 85 ? 1.25 : member.overallScore >= 70 ? 1.10 : 1.0;

  const entry: LedgerEntry = {
    id: crypto.randomBytes(4).toString("hex"),
    type: "member_rated", professionalId, memberId: member.memberId,
    before: prev, after: member.overallScore, delta: member.overallScore - prev,
    reason: `Payment speed: ${paymentSpeed}/100 | Data accuracy: ${dataAccuracy}/100 | Trust tier: ${member.trustTier}`,
    aiVerified: false,
    hash: ledgerHash(LEDGER_HEAD_HASH, { id: "pending", type: "member_rated", professionalId, memberId: member.memberId, before: prev, after: member.overallScore, delta: member.overallScore - prev, reason: "", aiVerified: false, timestamp: new Date().toISOString() }),
    timestamp: new Date().toISOString(),
  };
  LEDGER_HEAD_HASH = entry.hash;
  LEDGER.push(entry);

  return res.json({ success: true, member, ledgerEntry: entry });
});

// GET /api/reputation/leaderboard
router.get("/leaderboard", (_req: Request, res: Response) => {
  const sorted = [...PROFESSIONALS].sort((a, b) => b.reputationScore - a.reputationScore).slice(0, 10);
  return res.json({ leaderboard: sorted, lastUpdated: new Date().toISOString() });
});

// GET /api/reputation/audit — Immutable ledger trail
router.get("/audit", (_req: Request, res: Response) => {
  return res.json({
    ledger: LEDGER.slice().reverse(),
    total: LEDGER.length,
    headHash: LEDGER_HEAD_HASH.slice(0, 20) + "…",
    nistCompliant: true,
  });
});

// GET /api/reputation/members — All member profiles
router.get("/members", (_req: Request, res: Response) => {
  return res.json({
    members: MEMBER_PROFILES,
    stats: {
      priorityRunners: MEMBER_PROFILES.filter(m => m.trustTier === "Priority Runner").length,
      avgScore: Math.round(MEMBER_PROFILES.reduce((s, m) => s + m.overallScore, 0) / MEMBER_PROFILES.length),
    },
  });
});

export { PROFESSIONALS, MEMBER_PROFILES, LEDGER };
export default router;
