/**
 * 3C ONYX — The Automotive Union Layer
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * "We all feel the pain inside the industry — every last one of us.
 *  The glass repair company that's a one-man show or the biggest
 *  dealership groups. We all work with one another but we need that
 *  union that builds the proper ecosystem for the product — the automotive,
 *  the end consumer, and industry professionals."
 *
 *  — Ronald Antonio Cadet, CVO, CUXTOMCANDYCLUB LLC · March 30, 2026
 *
 * This is not an app. This is the infrastructure that makes the industry official.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/union/manifesto        The founding doctrine — why the Union exists
 * GET  /api/union/members          All guild members across every category
 * GET  /api/union/directory        Full industry professional directory
 * POST /api/union/join             Any professional applies to join the mesh
 * GET  /api/union/pain-map         The documented pain points across the industry
 * GET  /api/union/ecosystem        The full ecosystem map — every connected dot
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Router, type Request, type Response } from "express";
import { desc } from "drizzle-orm";
import { db, serviceNodesTable, bankNodesTable } from "@workspace/db";
import { eventBus } from "../lib/eventBus";
import crypto from "crypto";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// THE MANIFESTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/union/manifesto
 * The founding doctrine of the 3C ONYX Automotive Union.
 * Every word of this came from real industry experience.
 */
router.get("/manifesto", (_req: Request, res: Response) => {
  return res.json({
    title:    "THE 3C ONYX AUTOMOTIVE UNION — FOUNDING MANIFESTO",
    version:  "1.0",
    author:   "Ronald Antonio Cadet, CVO — CUXTOMCANDYCLUB LLC",
    date:     "March 30, 2026",
    entity:   "CUXTOMCANDYCLUB LLC · New York · Entity ID: 7788320",
    honeyToken: "3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED",

    coreStatement: "We all feel the pain inside the industry — every last one of us. The glass repair company that's a one-man show or the biggest dealership groups. We all work with one another but we need that union that builds the proper ecosystem for the product — the automotive, the end consumer, and industry professionals.",

    theProduct: {
      title:   "The Product Is the Automotive Ecosystem — Not Just a Car",
      content: "The product is not a vehicle. The product is the entire ecosystem surrounding the vehicle — from the moment a consumer has an intent to buy, through the finance closing, into ownership, through every service, repair, customization, and eventual resale. Every professional in this ecosystem is already working together informally. We just never built the infrastructure to make that union official — until now.",
    },

    thePain: {
      title:   "The Shared Pain — Everyone Feels It",
      professionals: [
        {
          role:      "The One-Man Glass Repair Shop",
          pain:      "Finds work through word of mouth and informal referrals. Earns nothing when a deal he touched turns into a sale. Gets paid weeks late, sometimes not at all. No platform represents him.",
          solution:  "3C Service Node. Every job routed to him through the mesh earns a tracked commission. 3% Dynasty Tech Fee auto-settles on completion. He becomes part of the network — not outside it.",
        },
        {
          role:      "The Rim Repair Specialist (Jim's Rims — Rehoboth, MA)",
          pain:      "A customer comes in for rims. The conversation leads to a car purchase. Jim refers the customer to a dealer — but gets nothing. The dealer makes $3,000. Jim makes $0.",
          solution:  "Bird-Dog Referral Engine. Jim pings the 3C Mesh. A Referral ID is tied to the VIN. When the deal closes, Jim gets his commission in seconds — not 6 weeks later through a back-office check.",
        },
        {
          role:      "The Dealer Finance Manager",
          pain:      "Contracts scattered across four desks. Simoniz here, Sonsio there, the retail agreement somewhere else, the odometer statement on a sticky note. The bank won't fund because one signature is blurry. The deal sits for 3–7 days. Cash flow choked.",
          solution:  "Bank-Ready Document Vault. Every contract bundled, SHA-256 sealed, submitted to the lender in one click. The bank rep sees everything verified. He hits Fund in minutes.",
        },
        {
          role:      "The Bank Rep (Ned Surman — Stellantis Financial Services US)",
          pain:      "Waiting on scanned PDFs that never arrive. Calling dealers. Emailing. Calling again. Meanwhile the deal ages, the rate lock expires, the customer gets frustrated. He can't hit his numbers because the industry runs on paper.",
          solution:  "Rep Portal Key. Ned pings the 3C Mesh with one key. The Guardian Agent returns the VIN integrity report, the sealed document bundle, and the coverage confirmation. He hits Fund. He becomes the most productive rep in the country. He tells the Family.",
        },
        {
          role:      "The Warranty Administrator (Simoniz, Sonsio)",
          pain:      "A claim comes in. The admin manually looks up the contract. Calls the dealer to verify the odometer. Waits for a fax. Calls back. Verifies in-service date manually. Same 4-step loop for every single claim. Thousands of claims. Thousands of loops.",
          solution:  "Warranty Admin Node. One ping with a VIN returns every contract status — in-service date, current odometer, coverage active/expired, claim eligibility — in real time. Guardian Agent confirmed. No callbacks.",
        },
        {
          role:      "The End Consumer",
          pain:      "Overpays because they don't know what they don't know. Gets sold a warranty that doesn't cover what they think it covers. Buys a car with a hidden odometer rollback. Has a service history gap because no one tracked it. Pays for repairs that should be warranty. No advocate.",
          solution:  "The 3C Digital Passport. Every vehicle has a Sovereign Identity — VIN integrity, warranty status, service history, inspection record, chain of custody — all verified by the Guardian Agent. The consumer finally has truth.",
        },
        {
          role:      "The Independent Mechanic",
          pain:      "Does the work. Gets paid for the labor. Has no way to capture the downstream revenue when his repair recommendation leads to a trade-in, a new car purchase, or a warranty upgrade. The dealer captures it all. He gets none.",
          solution:  "Service Node with Bird-Dog Referral. Every recommendation he makes that leads to a transaction earns him a tracked commission. The 3C Mesh makes invisible value visible — and pays it.",
        },
        {
          role:      "The Biggest Dealer Groups",
          pain:      "Running Reynolds & Reynolds, CDK Global, DealerSocket across hundreds of rooftops. Data siloed per DMS. No unified intelligence. Can't identify cross-rooftop trends. Can't verify supply chain integrity. Each rooftop is an island.",
          solution:  "Oracle OIC Dealer Connector. Every rooftop connected to the 3C Mesh. Unified inventory, unified reputation score, unified transaction layer. The group finally sees the whole network — not just individual islands.",
        },
      ],
    },

    theEcosystem: {
      title:   "The Proper Ecosystem — Every Dot Connected",
      layers: [
        { layer: "Consumer Layer",      description: "End member with Digital Passport, real-time warranty status, Guardian alerts, verified vehicle history" },
        { layer: "Service Node Layer",  description: "Every independent professional — glass, rims, paint, PPF, tint, detailing, mechanics — registered, rated, and revenue-connected" },
        { layer: "Dealer Layer",        description: "All DMS systems (CDK, Reynolds, DealerSocket, Dealertrack) connected via Oracle OIC. Inventory, reputation, leads — unified" },
        { layer: "Finance Layer",       description: "Bank-Ready Document Vault. Every lender (Stellantis, Ally, Chase, Capital One) as a Verified Bank Node with instant access" },
        { layer: "Warranty Layer",      description: "Every warranty administrator (Simoniz, Sonsio, JM&A, Protective) as a Warranty Admin Node — instant claim eligibility, no callbacks" },
        { layer: "Intelligence Layer",  description: "7-Agent Mesh — Guardian, Concierge, MarketCheck, Mission, Vault, Stripe, Notify — running in real time across every transaction" },
        { layer: "Sovereign Layer",     description: "Immutable audit trail, CJIS-compatible, federal-grade. Every decision is logged, hashed, and admissible" },
      ],
    },

    theUnion: {
      title:   "Why This Is a Union — Not Just an App",
      content: "A union is a structure that organizes workers in the same industry to protect their shared interests, ensure fair compensation, and establish common standards. The automotive industry has never had one — not a real one that works for the one-man shop and the 500-rooftop dealer group equally. 3C ONYX is that union. The 3% Dynasty Tech Fee is the union dues — charged automatically on every transaction the mesh facilitates. The Guardian Agent is the union's standards enforcement body. The reputation score is the union's certification system. No one gets left out.",
      techFee: "3% of every transaction routed through the mesh",
      enforcement: "Guardian Agent — VIN integrity, odometer verification, fraud detection",
      certification: "Reputation Score + AI Accuracy Rating — visible to the whole network",
      settlement: "Stripe Connect — auto-settles commissions within seconds of deal close",
    },

    theVision: {
      memberTarget:   "1 Billion Members",
      valuationTarget: "$250 Billion Dynasty",
      path:           "Start with the Northeast Corridor pilot. One bank rep (Ned) tells the Family. The Family mandates the app. Dealers join because banks require it. Service nodes join because dealers route work to them. Consumers join because their vehicle has a Sovereign Identity. The union grows from the inside out.",
      timeline: [
        { period: "Day 1",    milestone: "Jim's Rims — Service Node #1. Ned Surman — Bank Node #1." },
        { period: "90 Days",  milestone: "Northeast Corridor pilot. 50 service nodes, 10 bank reps, 5 dealer groups." },
        { period: "Year 1",   milestone: "NVIS federal authorization. National expansion. $50M+ valuation." },
        { period: "Dynasty",  milestone: "1B members. $250B transaction volume. The industry runs on 3C." },
      ],
    },

    founderStatement: {
      author:    "Ronald Antonio Cadet",
      title:     "Chief Visionary Officer — CUXTOMCANDYCLUB LLC",
      statement: "I built this because I lived it. I know every person in this ecosystem. The glass guy, the rim guy, the bank rep, the warranty admin, the dealer GM, the one-man shop. We all work together every day but we work in the dark — no accountability, no record, no union. I'm building the union. The 3C Mesh is the infrastructure. The Dynasty is the goal.",
      date:      "March 30, 2026",
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAIN MAP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/union/pain-map
 * Documented pain points across the entire industry — the investor proof sheet.
 */
router.get("/pain-map", (_req: Request, res: Response) => {
  return res.json({
    title:    "3C ONYX INDUSTRY PAIN MAP",
    subtitle: "Documented real-world friction points that 3C Onyx eliminates",
    groundTruth: "Every item below was validated through direct industry contact — not theoretical.",
    painPoints: [
      {
        id:           "PAIN-01",
        title:        "CIT Paperwork Delay — Contract in Transit",
        source:       "Ned Surman, Stellantis Financial Services US (Dealer Relationship Manager)",
        industry:     "Automotive Finance",
        painLevel:    "CRITICAL",
        currentDelay: "3–7 business days",
        causeRoot:    "Physical contracts scattered across dealer back office. Simoniz, Sonsio, retail agreement, odometer statement — all on different desks. One missing staple or blurry signature halts funding.",
        dollarImpact: "Billions in CIT float across the industry daily. Every day of delay = lost dealer cash flow + lost lender yield",
        solution3c:   "Bank-Ready Document Vault + Rep Portal Key. SHA-256 sealed bundle. Rep sees everything verified. Fund in minutes.",
        timeEliminated: "3–7 days → < 2 hours",
      },
      {
        id:           "PAIN-02",
        title:        "Invisible Bird-Dog Referrals",
        source:       "Jim's Rims — Rehoboth, MA (Service Node, Wheel Repair Specialists)",
        industry:     "Service & Referral",
        painLevel:    "HIGH",
        currentDelay: "0 compensation (value created, never captured)",
        causeRoot:    "A service professional (rim shop, glass company, mechanic) refers a customer to a dealer. The dealer closes a $40,000 deal. The service professional earns nothing. No system exists to track the referral.",
        dollarImpact: "Hundreds of millions in referral commissions go unpaid industry-wide every year",
        solution3c:   "Bird-Dog Referral Engine. VIN-tied Referral ID generated at lead ping. Auto-settlement on deal close via Stripe Connect.",
        timeEliminated: "0 compensation → 3% commission in seconds",
      },
      {
        id:           "PAIN-03",
        title:        "Warranty Status 4-Step Manual Lookup",
        source:       "Every dealership service advisor — universal industry experience",
        industry:     "Warranty Administration",
        painLevel:    "HIGH",
        currentDelay: "20–45 minutes per claim verification",
        causeRoot:    "Service advisor must: (1) Find the contract, (2) Call the warranty company, (3) Verify odometer, (4) Confirm coverage — manually, every time, for every claim.",
        dollarImpact: "Thousands of advisor hours wasted annually per dealership. Warranty company overhead enormous. Consumer experience damaged.",
        solution3c:   "Guardian Agent Warranty Engine. One API call with VIN + odometer. All contracts resolved — active/expired/expiring. Claim eligibility instant.",
        timeEliminated: "20–45 min → < 5 seconds",
      },
      {
        id:           "PAIN-04",
        title:        "Odometer Fraud & VIN Cloning",
        source:       "NHTSA data + FBI NCIC reports + industry-wide awareness",
        industry:     "Vehicle Integrity",
        painLevel:    "CRITICAL",
        currentDelay: "Often undiscovered until post-sale — if ever",
        causeRoot:    "No real-time VIN integrity check at point of transaction. Odometer rollbacks go undetected. Title fraud passes through manual systems.",
        dollarImpact: "$1B+ annually in consumer losses from odometer fraud alone (NHTSA)",
        solution3c:   "Guardian Agent Federal Integrity Algorithm. VIN handshake against NMVTIS, NCIC. Anomaly detection at transaction point. Zero-Touch NVIS enforcement.",
        timeEliminated: "Post-discovery (too late) → Pre-transaction prevention",
      },
      {
        id:           "PAIN-05",
        title:        "The One-Man Shop Invisibility Problem",
        source:       "Universal — every independent professional in automotive",
        industry:     "All Service Categories",
        painLevel:    "HIGH",
        currentDelay: "Permanent — no system exists to represent them",
        causeRoot:    "The independent glass company, mobile mechanic, detailer, rim specialist — does excellent work, has no infrastructure to capture downstream revenue, has no reputation system, has no way to grow beyond word of mouth.",
        dollarImpact: "Estimated $50B+ in independent automotive services annually with near-zero digital infrastructure",
        solution3c:   "Service Node Vendor Portal. Any professional registers in minutes. Reputation score built from verified job completions. Logistics Agent routes work by proximity and score. Dynasty Tech Fee earns the platform on every job.",
        timeEliminated: "Permanent invisibility → Full network visibility + auto-settlement",
      },
    ],
    summary: {
      totalPainPoints:   5,
      industriesCovered: ["Automotive Finance", "Service & Referral", "Warranty Administration", "Vehicle Integrity", "Independent Professionals"],
      groundTruthSources: ["Ned Surman — Stellantis Financial (direct verbal)", "Jim's Rims — Rehoboth, MA (direct contact)", "NHTSA federal data", "Universal industry experience"],
      investorMessage:   "Every pain point is validated by a real person in the industry. This is not a theoretical market opportunity. The Complaint is documented. The Cause is identified. The Correction is built and running.",
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ECOSYSTEM MAP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/union/ecosystem
 * Full live ecosystem map — every node category, count, and status.
 */
router.get("/ecosystem", async (_req: Request, res: Response) => {
  try {
    const serviceNodes = await db.select().from(serviceNodesTable);
    const partnerNodes = await db.select().from(bankNodesTable);

    const bankNodes      = partnerNodes.filter(n => n.nodeCategory === "Bank");
    const warrantyNodes  = partnerNodes.filter(n => n.nodeCategory === "WarrantyAdmin");
    const insureNodes    = partnerNodes.filter(n => n.nodeCategory === "Insurance");
    const titleNodes     = partnerNodes.filter(n => n.nodeCategory === "TitleAgency");
    const govNodes       = partnerNodes.filter(n => n.nodeCategory === "Government");

    const serviceByType: Record<string, number> = {};
    for (const n of serviceNodes) {
      serviceByType[n.nodeType] = (serviceByType[n.nodeType] ?? 0) + 1;
    }

    return res.json({
      ecosystem: {
        title:     "3C ONYX AUTOMOTIVE UNION — LIVE ECOSYSTEM MAP",
        architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
        timestamp: new Date().toISOString(),
      },
      layers: {
        serviceNodes: {
          label:       "Industry Professionals (Service Layer)",
          description: "One-man shops to multi-location specialists — glass, rims, paint, PPF, mechanics, detailers",
          total:       serviceNodes.length,
          active:      serviceNodes.filter(n => n.status === "Active" || n.status === "Verified").length,
          byType:      serviceByType,
          pilotNode:   serviceNodes.find(n => n.email === "jimsrimsma@gmail.com")
            ? { name: "Jim's Rims", location: "Rehoboth, MA", type: "Rims", status: "Active", note: "SERVICE NODE #1 — Bird-Dog Referral pioneer" }
            : null,
        },
        bankNodes: {
          label:       "Lenders (Finance Layer)",
          description: "Tier-1 lenders with Rep Portal access — Stellantis, Ally, Chase, Capital One",
          total:       bankNodes.length,
          active:      bankNodes.filter(n => n.status === "Active" || n.status === "Invited").length,
          pilotNode:   bankNodes.find(n => n.repEmail === "ned.surman@stellantis-fs.com")
            ? { name: "Ned Surman", institution: "Stellantis Financial Services US", status: "Invited", note: "BANK NODE #1 — Ground Truth: verbal confirmation of CIT bottleneck" }
            : null,
        },
        warrantyNodes: {
          label:       "Warranty Administrators (Coverage Layer)",
          description: "Simoniz PPF, Sonsio T&W, JM&A, Protective — instant claim eligibility via Rep Portal",
          total:       warrantyNodes.length,
          active:      warrantyNodes.filter(n => n.status === "Active" || n.status === "Invited").length,
          pilotNodes:  warrantyNodes.filter(n => n.isPilotNode).map(n => ({ name: n.institutionName, status: n.status })),
        },
        governmentNodes: {
          label:       "Federal Nodes (Integrity Layer)",
          description: "NHTSA, DOT, FBI, CISA, GSA — G-Code Gateway access for agency oversight",
          total:       govNodes.length,
          note:        "Federal pilot pending — Northeast Corridor CRADA/MOA in progress",
        },
        agentMesh: {
          label:       "7-Agent Intelligence Mesh",
          description: "Autonomous agents running in real time across every transaction",
          agents: [
            { id: 1, name: "Guardian Agent",    role: "VIN integrity, warranty verification, predictive alerts" },
            { id: 2, name: "Concierge Agent",   role: "Luxury prose, member communication, white-glove experience" },
            { id: 3, name: "MarketCheck Agent", role: "Wholesale pricing, inventory velocity, strike detection" },
            { id: 4, name: "Mission Agent",     role: "Runner dispatch, logistics routing, CUXTOMCANDY scheduling" },
            { id: 5, name: "Vault Agent",       role: "Immutable audit, chain of custody, NIST compliance" },
            { id: 6, name: "Stripe Agent",      role: "Dynasty Fee split, referral settlement, multi-party payouts" },
            { id: 7, name: "Notify Agent",      role: "Push alerts, member briefings, mesh-wide communication" },
          ],
        },
      },
      totals: {
        allNodes:          serviceNodes.length + partnerNodes.length,
        pilotNodes:        serviceNodes.filter(n => n.isHubNode).length + partnerNodes.filter(n => n.isPilotNode).length,
        industriesCovered: 7,
        transactionFee:    "3% Dynasty Tech Fee on every mesh-routed transaction",
        architect:         "Ronald Antonio Cadet — solo-authored, Replit sovereign environment",
      },
      unionMessage: "Every dot is being connected. From the one-man glass shop to the Tier-1 lender. The infrastructure is live. The union is forming. The Dynasty is in motion.",
    });
  } catch (err) {
    console.error("[union/ecosystem]", err);
    return res.status(500).json({ error: "Ecosystem map unavailable" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UNION JOIN — Any Professional Applies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/union/join
 * Any industry professional applies to join the 3C Mesh.
 * The union is open to everyone — one-man shops to enterprise groups.
 */
router.post("/join", async (req: Request, res: Response) => {
  const {
    name, businessName, role, category, city, state, phone, email,
    website, description, referredBy,
  } = req.body as Record<string, unknown>;

  if (!name || !businessName || !role) {
    return res.status(400).json({ error: "name, businessName, and role are required" });
  }

  const applicationId = `UNION-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  await eventBus.emit("node.registered", {
    name:     String(businessName),
    nodeType: String(category ?? role),
    city:     String(city ?? "Unknown"),
  });

  const categoryStr = String(category ?? role).toLowerCase();
  const isServicePro = ["glass", "rim", "rims", "paint", "ppf", "mechanic", "detailing", "tint", "audio", "body", "tire", "tires", "storage", "upholstery", "wrap"].some(k => categoryStr.includes(k));
  const isFinance    = ["bank", "lender", "finance", "credit", "financial"].some(k => categoryStr.includes(k));
  const isWarranty   = ["warranty", "simoniz", "sonsio", "protection", "jm&a"].some(k => categoryStr.includes(k));

  const nextSteps = isServicePro
    ? ["Register as a Service Node via POST /api/lifecycle/nodes/register", "Start earning Bird-Dog referral commissions via the Referral Engine", "Get rated and routed by the Logistics Agent"]
    : isFinance
    ? ["Register as a Bank Node via POST /api/banks/register", "Get your Rep Portal Key — instant access to verified deal bundles", "Fund deals in minutes instead of days"]
    : isWarranty
    ? ["Register as a Warranty Admin Node via POST /api/banks/register (nodeCategory: WarrantyAdmin)", "Get your Rep Portal Key — instant warranty status on any VIN", "Approve claims in seconds instead of days"]
    : ["Your application is logged — 3C ONYX team will reach out to place you in the correct layer of the union"];

  return res.status(201).json({
    success:       true,
    applicationId,
    message:       `Welcome to the 3C ONYX Automotive Union, ${String(name)} — ${String(businessName)}. Your application ID is ${applicationId}. You are not alone in this industry. The union is building the proper ecosystem for every professional — from the one-man shop to the biggest dealer groups.`,
    applicant: {
      name:        String(name),
      businessName: String(businessName),
      role:        String(role),
      category:    category ? String(category) : null,
      city:        city ? String(city) : null,
      state:       state ? String(state) : null,
      phone:       phone ? String(phone) : null,
      email:       email ? String(email) : null,
      website:     website ? String(website) : null,
      description: description ? String(description) : null,
      referredBy:  referredBy ? String(referredBy) : null,
    },
    nextSteps,
    unionStatement: "We all feel the pain inside the industry — every last one of us. This is the infrastructure that makes the ecosystem official.",
    architect:      "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
  });
});

/**
 * GET /api/union/members
 * Full directory of all union members — every node across all categories.
 */
router.get("/members", async (_req: Request, res: Response) => {
  try {
    const [serviceNodes, partnerNodes] = await Promise.all([
      db.select().from(serviceNodesTable).orderBy(desc(serviceNodesTable.reputationScore)),
      db.select().from(bankNodesTable).orderBy(desc(bankNodesTable.createdAt)),
    ]);

    const members = [
      ...serviceNodes.map(n => ({
        type:        "ServiceProfessional",
        id:          `SVC-${n.id}`,
        name:        n.name,
        role:        n.nodeType,
        location:    `${n.city}, ${n.state}`,
        status:      n.status,
        reputation:  n.reputationScore,
        jobsDone:    n.totalJobsCompleted,
        isPilot:     n.isHubNode,
        joinedAt:    n.createdAt,
      })),
      ...partnerNodes.map(n => ({
        type:        n.nodeCategory,
        id:          `PTR-${n.id}`,
        name:        n.institutionName,
        role:        n.repTitle ?? n.nodeCategory,
        repName:     n.repName,
        location:    n.region ?? "National",
        status:      n.status,
        isPilot:     n.isPilotNode,
        dealsFunded: n.dealsFunded,
        joinedAt:    n.createdAt,
      })),
    ];

    return res.json({
      totalMembers: members.length,
      members,
      breakdown: {
        serviceProfessionals: serviceNodes.length,
        bankNodes:            partnerNodes.filter(n => n.nodeCategory === "Bank").length,
        warrantyAdmins:       partnerNodes.filter(n => n.nodeCategory === "WarrantyAdmin").length,
        other:                partnerNodes.filter(n => !["Bank", "WarrantyAdmin"].includes(n.nodeCategory ?? "")).length,
      },
      message: "The union is forming. Every member is a dot in the ecosystem. Every dot earns from every connection the mesh makes.",
    });
  } catch (err) {
    console.error("[union/members]", err);
    return res.status(500).json({ error: "Members directory unavailable" });
  }
});

export default router;
