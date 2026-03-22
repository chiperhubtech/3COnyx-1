/**
 * 3C Onyx — NIST-MCP 2026 Security Layer
 *
 * Routes:
 *   GET  /api/security/shield                   — PII field encryption status
 *   POST /api/security/encrypt                  — Encrypt a value (AES-256-GCM)
 *   POST /api/security/decrypt                  — Decrypt a value (with access log)
 *   POST /api/security/transient-access/grant   — Issue transient agent token (15 min)
 *   GET  /api/security/transient-access/:token/vitals — Sanitised vehicle vitals (no PII)
 *   GET  /api/security/transient-access/active  — List active tokens
 *   GET  /api/security/agent-audit              — Immutable agent decision ledger
 *   POST /api/security/agent-audit/entry        — Append a new AI decision entry
 *   GET  /api/security/agent-audit/verify       — Verify hash chain integrity
 *   GET  /api/security/agent-audit/export       — Export full ledger as JSON
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  encrypt, decrypt, encryptString, decryptString,
  maskPii, sanitiseForAgent, chainHash, GENESIS_HASH,
  type EncryptedField,
} from "../lib/cipher";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgentAuditEntry {
  id: string;
  seq: number;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentType: "part_sourcing" | "risk_assessment" | "valuation_model" | "concierge" | "finance_routing" | "inspection_ai" | "market_timing" | "compliance_scan";
  action: string;
  decision: string;
  reasoning: string;
  alternativesConsidered: string[];
  outcomeType: "accepted" | "overridden" | "flagged" | "deferred";
  vehicleIdMasked: string | null;
  ownerVisible: false;  // never true — agents never see owner PII
  prevHash: string;
  hash: string;
}

export interface TransientToken {
  token: string;
  agentId: string;
  agentName: string;
  agentType: string;
  vehicleId: string;
  vehicleName: string;
  purpose: string;
  grantedAt: string;
  expiresAt: string;
  used: boolean;
  usageLog: string[];
}

interface PiiField {
  fieldId: string;
  label: string;
  piiType: "vin" | "ssn" | "address" | "name" | "email" | "phone";
  displayMasked: string;
  encryptedToken: string;
  algorithm: "AES-256-GCM";
  keyVersion: "v1";
  encryptedAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

// Encrypted PII field registry
const PII_FIELDS: PiiField[] = [
  {
    fieldId: "pii-vin-001",
    label: "VIN — 2023 Rolls-Royce Ghost",
    piiType: "vin",
    displayMasked: maskPii("SCA664S51PUX98123", "vin"),
    encryptedToken: encryptString("SCA664S51PUX98123"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    accessCount: 3,
  },
  {
    fieldId: "pii-vin-002",
    label: "VIN — 2023 Ferrari Roma",
    piiType: "vin",
    displayMasked: maskPii("ZFF97XJA8N0267841", "vin"),
    encryptedToken: encryptString("ZFF97XJA8N0267841"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    lastAccessedAt: null,
    accessCount: 0,
  },
  {
    fieldId: "pii-ssn-001",
    label: "SSN — Buyer Application #44821",
    piiType: "ssn",
    displayMasked: maskPii("847-22-6601", "ssn"),
    encryptedToken: encryptString("847-22-6601"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    accessCount: 1,
  },
  {
    fieldId: "pii-addr-001",
    label: "Home Address — Account #3C-0044821",
    piiType: "address",
    displayMasked: maskPii("1240 Sunset Plaza Dr, West Hollywood, CA 90069", "address"),
    encryptedToken: encryptString("1240 Sunset Plaza Dr, West Hollywood, CA 90069"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    lastAccessedAt: null,
    accessCount: 0,
  },
  {
    fieldId: "pii-name-001",
    label: "Owner Name — Account #3C-0044821",
    piiType: "name",
    displayMasked: maskPii("Alexander Harrington", "name"),
    encryptedToken: encryptString("Alexander Harrington"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    accessCount: 2,
  },
  {
    fieldId: "pii-email-001",
    label: "Email — Account #3C-0044821",
    piiType: "email",
    displayMasked: maskPii("a.harrington@sterling.com", "email"),
    encryptedToken: encryptString("a.harrington@sterling.com"),
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    lastAccessedAt: null,
    accessCount: 0,
  },
];

// Active transient tokens
const ACTIVE_TOKENS: TransientToken[] = [];

// ─── Seed: Agent Audit Trail (Immutable Hash Chain) ───────────────────────────
const auditEntries: AgentAuditEntry[] = [];

function appendAuditEntry(raw: Omit<AgentAuditEntry, "id" | "seq" | "prevHash" | "hash" | "timestamp">): AgentAuditEntry {
  const seq = auditEntries.length;
  const prevHash = seq === 0 ? GENESIS_HASH : auditEntries[seq - 1].hash;
  const timestamp = new Date(Date.now() - (8 - seq) * 3_600_000).toISOString();
  const data = JSON.stringify({ ...raw, seq, timestamp });
  const hash = chainHash(prevHash, data);
  const entry: AgentAuditEntry = {
    ...raw,
    id: `aat-${crypto.randomBytes(4).toString("hex")}`,
    seq,
    timestamp,
    prevHash,
    hash,
    ownerVisible: false,
  };
  auditEntries.push(entry);
  return entry;
}

// Seed 8 realistic AI decisions
appendAuditEntry({
  agentId: "agent-val-001",
  agentName: "Valuation_Model",
  agentType: "valuation_model",
  action: "PRICE_SET",
  decision: "Set asking price $124,900 for VIN •••••••••••8123",
  reasoning: "Comp set of 7 similar vehicles (YMM match, <2k miles variance) yielded avg $127,400. Applied 2.0% liquidity discount for faster-turn target. Final: $124,900.",
  alternativesConsidered: ["$127,400 (raw avg)", "$119,000 (aggressive)"],
  outcomeType: "accepted",
  vehicleIdMasked: "•••••••••••8123",
});

appendAuditEntry({
  agentId: "agent-part-001",
  agentName: "Part_Sourcing",
  agentType: "part_sourcing",
  action: "SUPPLIER_SELECT",
  decision: "Selected Wholesale_A (SKU W-44882) over Retail_B (SKU R-22741) for OEM brake rotor set",
  reasoning: "Wholesale_A unit price $312 vs Retail_B $1,159. Both OEM-certified. Lead time 2d vs 1d. $847 saving per unit — buyer margin improvement 0.68%. Decision boundary exceeded (>$500 threshold).",
  alternativesConsidered: ["Retail_B $1,159 (faster)", "Aftermarket_C $198 (not OEM)"],
  outcomeType: "accepted",
  vehicleIdMasked: "•••••••••••8123",
});

appendAuditEntry({
  agentId: "agent-risk-001",
  agentName: "Risk_Assessment",
  agentType: "risk_assessment",
  action: "FLAG_VEHICLE",
  decision: "Flagged VIN •••••••••••3902 — flood zone proximity 2.1 mi, FEMA Zone AE",
  reasoning: "Cross-referenced registration address with FEMA FIRM maps. Property sits within 2.1 miles of Zone AE boundary. Historical flooding: 2x in 10yr. Estimated depreciation risk: 8–14%.",
  alternativesConsidered: ["No action (risk < 3mi)", "Full rejection (risk > 5mi)"],
  outcomeType: "flagged",
  vehicleIdMasked: "•••••••••••3902",
});

appendAuditEntry({
  agentId: "agent-conc-001",
  agentName: "Concierge",
  agentType: "concierge",
  action: "PII_ACCESS_DENIED",
  decision: "Denied disclosure of owner home address to external API request",
  reasoning: "Request origin: third-party logistics API (unverified). NIST-MCP 2026 Policy 4.3.2(a): owner address may not be disclosed to unauthenticated external agents. Transient token not presented. Access denied, event logged.",
  alternativesConsidered: ["Partial disclosure (city only)", "Full disclosure (policy violation)"],
  outcomeType: "overridden",
  vehicleIdMasked: null,
});

appendAuditEntry({
  agentId: "agent-fin-001",
  agentName: "Finance_Routing",
  agentType: "finance_routing",
  action: "LENDER_SELECT",
  decision: "Routed to Ally Bank (6.20% APR, 72mo) over Capital One (7.10% APR, 60mo)",
  reasoning: "Buyer credit score 742 (prime). Ally Bank pre-approval confirmed at 6.20% on $98,000 balance. Capital One counter at 7.10%. Ally saves buyer $4,120 over loan term at comparable monthly payment (+$18/mo for 12 additional months). Net: Ally preferred.",
  alternativesConsidered: ["Capital One 7.1% / 60mo", "Chase 6.8% / 72mo (pending pre-approval)"],
  outcomeType: "accepted",
  vehicleIdMasked: null,
});

appendAuditEntry({
  agentId: "agent-insp-001",
  agentName: "Inspection_AI",
  agentType: "inspection_ai",
  action: "CONDITION_SCORE",
  decision: "Assigned condition score 8.4/10 to VIN •••••••••••8123",
  reasoning: "360° scan analysis: paint oxidation detected on rear quarter panel (2.1% surface area, severity: minor). All glass intact. No structural deformation. Tire tread: 7–8/32 all corners. Interior: Grade A. Score: 8.4 — eligible for 3C Certified listing.",
  alternativesConsidered: ["8.0/10 (conservative)", "8.7/10 (if oxidation ignored)"],
  outcomeType: "accepted",
  vehicleIdMasked: "•••••••••••8123",
});

appendAuditEntry({
  agentId: "agent-mkt-001",
  agentName: "Market_Timing",
  agentType: "market_timing",
  action: "LISTING_TIMING",
  decision: "Recommended hold 14 days before active listing for VIN •••••••••••7841",
  reasoning: "Seasonal demand model (Q1 2026): luxury coupe segment trending +12% WoW. Current inventory: 4 competing units in 50-mi radius. Forecast: 2 units clearing within 7 days. Holding 14 days maximises price realisation by ~3.1% ($3,860 on $124,900).",
  alternativesConsidered: ["List immediately (faster turn)", "Hold 30 days (diminishing return)"],
  outcomeType: "deferred",
  vehicleIdMasked: "•••••••••••7841",
});

appendAuditEntry({
  agentId: "agent-comp-001",
  agentName: "Compliance_Scan",
  agentType: "compliance_scan",
  action: "VIN_CLEARANCE",
  decision: "Cleared VIN •••••••••••8123 — no liens, no theft flag, no open recalls",
  reasoning: "Queried NMVTIS (lien check: clear), NCIC (theft: no match), NHTSA (open recalls: 0 active). Title history: 2 owners, clean title all states. DMV odometer disclosure: consistent ±0.3%. AML: transaction amount within threshold. 3C Certified: APPROVED.",
  alternativesConsidered: ["Manual review (if any hit)", "Rejection (if lien found)"],
  outcomeType: "accepted",
  vehicleIdMasked: "•••••••••••8123",
});

// ─── Vehicle vitals for transient access (PII-free) ──────────────────────────
const VEHICLE_VITALS: Record<string, Record<string, unknown>> = {
  "task-001": {
    vehicleId: "task-001",
    make: "Rolls-Royce", model: "Ghost Extended", year: 2023,
    vin: "SCA664S51PUX98123",   // will be masked per sanitiseForAgent
    color: "Midnight Sapphire",
    odometer: 4_812,
    condition: 8.7,
    fuelType: "gasoline",
    transmissionType: "automatic",
    driveType: "AWD",
    horsepower: 591,
    // PII that agents must NEVER see:
    ownerName: "Alexander Harrington",
    ownerAddress: "1240 Sunset Plaza Dr, West Hollywood, CA 90069",
    ownerEmail: "a.harrington@sterling.com",
    ownerPhone: "+1 (310) 555-0192",
  },
  "task-002": {
    vehicleId: "task-002",
    make: "Ferrari", model: "Roma Coupe", year: 2023,
    vin: "ZFF97XJA8N0267841",
    color: "Grigio Ingrid",
    odometer: 2_109,
    condition: 9.1,
    fuelType: "gasoline",
    transmissionType: "automatic",
    driveType: "RWD",
    horsepower: 612,
    ownerName: "Victoria Ashworth",
    ownerAddress: "845 Pacific Heights Blvd, San Francisco, CA 94115",
    ownerEmail: "v.ashworth@ashworth.vc",
    ownerPhone: "+1 (415) 555-0277",
  },
};

// ─── GET /api/security/shield ─────────────────────────────────────────────────
router.get("/security/shield", (_req: Request, res: Response) => {
  res.json({
    fields: PII_FIELDS.map((f) => ({
      fieldId: f.fieldId,
      label: f.label,
      piiType: f.piiType,
      displayMasked: f.displayMasked,
      algorithm: f.algorithm,
      keyVersion: f.keyVersion,
      encryptedAt: f.encryptedAt,
      lastAccessedAt: f.lastAccessedAt,
      accessCount: f.accessCount,
      // Never expose the token itself in shield view
    })),
    stats: {
      totalFields: PII_FIELDS.length,
      byType: PII_FIELDS.reduce<Record<string, number>>((acc, f) => {
        acc[f.piiType] = (acc[f.piiType] ?? 0) + 1;
        return acc;
      }, {}),
      totalDecryptions: PII_FIELDS.reduce((s, f) => s + f.accessCount, 0),
      algorithm: "AES-256-GCM",
      keyVersion: "v1",
      nistCompliance: "NIST-MCP 2026",
    },
  });
});

// ─── POST /api/security/encrypt ───────────────────────────────────────────────
router.post("/security/encrypt", (req: Request, res: Response) => {
  const { value, piiType, label } = req.body as {
    value: string; piiType?: string; label?: string;
  };
  if (!value || typeof value !== "string") {
    res.status(400).json({ error: "value required" });
    return;
  }

  const enc = encrypt(value);
  const token = encryptString(value);
  const masked = piiType ? maskPii(value, piiType as any) : "•".repeat(Math.min(value.length, 12));

  // Register in PII field registry
  const field: PiiField = {
    fieldId: `pii-${crypto.randomBytes(4).toString("hex")}`,
    label: label ?? `Encrypted Field (${piiType ?? "custom"})`,
    piiType: (piiType as any) ?? "name",
    displayMasked: masked,
    encryptedToken: token,
    algorithm: "AES-256-GCM",
    keyVersion: "v1",
    encryptedAt: new Date().toISOString(),
    lastAccessedAt: null,
    accessCount: 0,
  };
  PII_FIELDS.push(field);

  res.json({
    fieldId: field.fieldId,
    displayMasked: masked,
    algorithm: "AES-256-GCM",
    iv: enc.iv,
    tagLength: 128,
    ciphertextLength: enc.ct.length,
    encryptedAt: field.encryptedAt,
  });
});

// ─── POST /api/security/decrypt ───────────────────────────────────────────────
router.post("/security/decrypt", (req: Request, res: Response) => {
  const { fieldId, reason } = req.body as { fieldId: string; reason?: string };
  const field = PII_FIELDS.find((f) => f.fieldId === fieldId);
  if (!field) { res.status(404).json({ error: "Field not found" }); return; }
  if (!reason) { res.status(400).json({ error: "Access reason required (audit log)" }); return; }

  field.lastAccessedAt = new Date().toISOString();
  field.accessCount++;

  // Log to agent audit trail
  appendAuditEntry({
    agentId: "agent-human-001",
    agentName: "Human_Operator",
    agentType: "compliance_scan",
    action: "PII_DECRYPT",
    decision: `Decrypted field "${field.label}" — reason: ${reason}`,
    reasoning: `Human operator request. Reason provided: "${reason}". Access logged for NIST-MCP 2026 compliance.`,
    alternativesConsidered: [],
    outcomeType: "accepted",
    vehicleIdMasked: null,
  });

  const plaintext = decryptString(field.encryptedToken);
  res.json({ plaintext, fieldId, piiType: field.piiType, accessedAt: field.lastAccessedAt });
});

// ─── POST /api/security/transient-access/grant ───────────────────────────────
router.post("/security/transient-access/grant", (req: Request, res: Response) => {
  const { agentId, agentName, agentType, vehicleId, purpose } = req.body as {
    agentId: string; agentName: string; agentType: string;
    vehicleId: string; purpose: string;
  };
  if (!agentId || !vehicleId || !purpose) {
    res.status(400).json({ error: "agentId, vehicleId, purpose required" });
    return;
  }

  const vehicleVitals = VEHICLE_VITALS[vehicleId];
  const vehicleName = vehicleVitals
    ? `${vehicleVitals.year} ${vehicleVitals.make} ${vehicleVitals.model}`
    : "Unknown Vehicle";

  const expiresAt = new Date(Date.now() + 15 * 60_000);
  const token: TransientToken = {
    token: `TAT-${agentId}-${vehicleId}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    agentId,
    agentName,
    agentType,
    vehicleId,
    vehicleName: vehicleName as string,
    purpose,
    grantedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
    usageLog: [],
  };
  ACTIVE_TOKENS.push(token);

  // Audit log the grant
  appendAuditEntry({
    agentId,
    agentName,
    agentType: agentType as any,
    action: "TRANSIENT_TOKEN_GRANT",
    decision: `Granted 15-min transient access token to ${agentName} for vehicle ${vehicleId}`,
    reasoning: `Purpose: "${purpose}". Token expires ${expiresAt.toLocaleTimeString()}. PII fields excluded per NIST-MCP 4.3.2(a).`,
    alternativesConsidered: ["Permanent access (policy violation)", "No access"],
    outcomeType: "accepted",
    vehicleIdMasked: vehicleId,
  });

  res.json({ token: token.token, expiresAt: token.expiresAt, vehicleName });
});

// ─── GET /api/security/transient-access/active ───────────────────────────────
router.get("/security/transient-access/active", (_req: Request, res: Response) => {
  const now = Date.now();
  const active = ACTIVE_TOKENS.filter((t) => new Date(t.expiresAt).getTime() > now);
  res.json({
    tokens: active.map((t) => ({
      token: t.token.slice(0, 20) + "…", // truncated for security
      agentId: t.agentId,
      agentName: t.agentName,
      agentType: t.agentType,
      vehicleId: t.vehicleId,
      vehicleName: t.vehicleName,
      purpose: t.purpose,
      grantedAt: t.grantedAt,
      expiresAt: t.expiresAt,
      used: t.used,
      secondsRemaining: Math.max(0, Math.floor((new Date(t.expiresAt).getTime() - now) / 1000)),
    })),
  });
});

// ─── GET /api/security/transient-access/:token/vitals ────────────────────────
router.get("/security/transient-access/:token/vitals", (req: Request, res: Response) => {
  const rawToken = req.params.token;
  const tokenRecord = ACTIVE_TOKENS.find((t) => t.token === rawToken);

  if (!tokenRecord) {
    res.status(404).json({ error: "Token not found" });
    return;
  }
  if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
    res.status(401).json({ error: "Token expired — request a new transient token" });
    return;
  }

  const rawVitals = VEHICLE_VITALS[tokenRecord.vehicleId] ?? {};
  const sanitised = sanitiseForAgent(rawVitals);

  tokenRecord.used = true;
  tokenRecord.usageLog.push(`Vitals accessed at ${new Date().toISOString()}`);

  // Audit
  appendAuditEntry({
    agentId: tokenRecord.agentId,
    agentName: tokenRecord.agentName,
    agentType: tokenRecord.agentType as any,
    action: "VITALS_ACCESS",
    decision: `Agent ${tokenRecord.agentName} accessed vehicle vitals (PII stripped) for ${tokenRecord.vehicleId}`,
    reasoning: `Valid transient token presented. VIN masked, owner PII redacted. Vitals: make/model/year/condition/odometer/color delivered.`,
    alternativesConsidered: [],
    outcomeType: "accepted",
    vehicleIdMasked: tokenRecord.vehicleId,
  });

  res.json({
    vitals: sanitised,
    accessedAt: new Date().toISOString(),
    piiStripped: true,
    ownerVisible: false,
    nistPolicy: "NIST-MCP 2026 §4.3.2(a)",
    tokenExpiresAt: tokenRecord.expiresAt,
  });
});

// ─── GET /api/security/agent-audit ───────────────────────────────────────────
router.get("/security/agent-audit", (_req: Request, res: Response) => {
  res.json({
    entries: [...auditEntries].reverse(), // newest first
    total: auditEntries.length,
    genesisHash: GENESIS_HASH,
    latestHash: auditEntries[auditEntries.length - 1]?.hash ?? GENESIS_HASH,
    chainLength: auditEntries.length,
  });
});

// ─── POST /api/security/agent-audit/entry ────────────────────────────────────
router.post("/security/agent-audit/entry", (req: Request, res: Response) => {
  const { agentId, agentName, agentType, action, decision, reasoning, alternativesConsidered, outcomeType, vehicleIdMasked } = req.body as Partial<AgentAuditEntry>;
  if (!agentId || !agentName || !action || !decision) {
    res.status(400).json({ error: "agentId, agentName, action, decision required" });
    return;
  }
  const entry = appendAuditEntry({
    agentId: agentId!,
    agentName: agentName!,
    agentType: (agentType ?? "compliance_scan") as any,
    action: action!,
    decision: decision!,
    reasoning: reasoning ?? "",
    alternativesConsidered: alternativesConsidered ?? [],
    outcomeType: (outcomeType ?? "accepted") as any,
    vehicleIdMasked: vehicleIdMasked ?? null,
  });
  res.json({ entry });
});

// ─── GET /api/security/agent-audit/verify ────────────────────────────────────
router.get("/security/agent-audit/verify", (_req: Request, res: Response) => {
  let valid = true;
  let tamperDetectedAt: number | null = null;
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < auditEntries.length; i++) {
    const e = auditEntries[i];
    if (e.prevHash !== prevHash) {
      valid = false;
      tamperDetectedAt = i;
      break;
    }
    const data = JSON.stringify({
      agentId: e.agentId, agentName: e.agentName, agentType: e.agentType,
      action: e.action, decision: e.decision, reasoning: e.reasoning,
      alternativesConsidered: e.alternativesConsidered, outcomeType: e.outcomeType,
      vehicleIdMasked: e.vehicleIdMasked, seq: e.seq, timestamp: e.timestamp,
    });
    const expectedHash = chainHash(prevHash, data);
    if (e.hash !== expectedHash) {
      valid = false;
      tamperDetectedAt = i;
      break;
    }
    prevHash = e.hash;
  }

  res.json({
    chainValid: valid,
    entriesChecked: auditEntries.length,
    tamperDetectedAt,
    genesisHash: GENESIS_HASH,
    latestHash: auditEntries[auditEntries.length - 1]?.hash ?? GENESIS_HASH,
    verifiedAt: new Date().toISOString(),
  });
});

// ─── GET /api/security/agent-audit/export ────────────────────────────────────
router.get("/security/agent-audit/export", (_req: Request, res: Response) => {
  res.setHeader("Content-Disposition", `attachment; filename="3c-agent-audit-${Date.now()}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    standard: "NIST-MCP 2026",
    genesisHash: GENESIS_HASH,
    totalEntries: auditEntries.length,
    entries: auditEntries,
  });
});

export default router;
