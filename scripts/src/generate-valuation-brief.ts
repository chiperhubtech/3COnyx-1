import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E8B830";
const DARK = "#0A0A0A";
const DARK_SURFACE = "#141414";
const WHITE = "#FFFFFF";
const GREY = "#999999";
const GREY_LIGHT = "#CCCCCC";
const GREEN = "#34D399";

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../artifacts/3c-onyx/public/3C_ONYX_Sovereign_Valuation_Brief.pdf",
);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 60;
const CONTENT_W = PAGE_W - MARGIN * 2;

function drawGoldLine(doc: InstanceType<typeof PDFDocument>, y: number, width?: number) {
  const w = width ?? CONTENT_W;
  const x = width ? (PAGE_W - w) / 2 : MARGIN;
  doc
    .save()
    .moveTo(x, y)
    .lineTo(x + w, y)
    .lineWidth(1)
    .strokeColor(GOLD)
    .stroke()
    .restore();
}

function drawThinLine(doc: InstanceType<typeof PDFDocument>, y: number) {
  doc
    .save()
    .moveTo(MARGIN, y)
    .lineTo(PAGE_W - MARGIN, y)
    .lineWidth(0.5)
    .strokeColor("#333333")
    .stroke()
    .restore();
}

function addPageBackground(doc: InstanceType<typeof PDFDocument>) {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK);
}

function drawCornerMarks(doc: InstanceType<typeof PDFDocument>) {
  const len = 20;
  const offset = 30;
  const pairs = [
    [offset, offset, offset + len, offset, offset, offset + len],
    [PAGE_W - offset, offset, PAGE_W - offset - len, offset, PAGE_W - offset, offset + len],
    [offset, PAGE_H - offset, offset + len, PAGE_H - offset, offset, PAGE_H - offset - len],
    [
      PAGE_W - offset,
      PAGE_H - offset,
      PAGE_W - offset - len,
      PAGE_H - offset,
      PAGE_W - offset,
      PAGE_H - offset - len,
    ],
  ];
  doc.save().strokeColor(GOLD).lineWidth(0.8).strokeOpacity(0.4);
  for (const [x1, y1, x2, y2, x3, y3] of pairs) {
    doc.moveTo(x2, y2).lineTo(x1, y1).lineTo(x3, y3).stroke();
  }
  doc.restore();
}

function sectionHeader(doc: InstanceType<typeof PDFDocument>, text: string, y: number): number {
  drawGoldLine(doc, y);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(GOLD)
    .text(text.toUpperCase(), MARGIN, y + 10, { width: CONTENT_W, characterSpacing: 2 });
  const afterY = doc.y + 8;
  drawGoldLine(doc, afterY);
  return afterY + 12;
}

function bodyText(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  y: number,
  opts?: { bold?: boolean; color?: string; indent?: number; size?: number },
): number {
  const font = opts?.bold ? "Helvetica-Bold" : "Helvetica";
  const color = opts?.color ?? GREY_LIGHT;
  const indent = opts?.indent ?? 0;
  doc
    .font(font)
    .fontSize(opts?.size ?? 10)
    .fillColor(color)
    .text(text, MARGIN + indent, y, { width: CONTENT_W - indent, lineGap: 3 });
  return doc.y + 4;
}

function bulletPoint(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  y: number,
  opts?: { color?: string },
): number {
  const color = opts?.color ?? GREY_LIGHT;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GOLD)
    .text("▸", MARGIN + 10, y, { continued: false });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(color)
    .text(text, MARGIN + 24, y, { width: CONTENT_W - 24, lineGap: 3 });
  return doc.y + 4;
}

function valuationBox(
  doc: InstanceType<typeof PDFDocument>,
  label: string,
  value: string,
  y: number,
  width: number,
  x: number,
): number {
  const boxH = 52;
  doc
    .save()
    .roundedRect(x, y, width, boxH, 4)
    .lineWidth(1)
    .strokeColor(GOLD)
    .strokeOpacity(0.5)
    .stroke()
    .restore();

  doc
    .save()
    .roundedRect(x, y, width, boxH, 4)
    .fillColor(DARK_SURFACE)
    .fillOpacity(0.6)
    .fill()
    .restore();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .fillOpacity(1)
    .text(label.toUpperCase(), x + 10, y + 10, { width: width - 20, characterSpacing: 1 });

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(GOLD)
    .text(value, x + 10, y + 26, { width: width - 20 });

  return y + boxH + 10;
}

function pageFooter(doc: InstanceType<typeof PDFDocument>, pageNum: number) {
  const y = PAGE_H - 35;
  drawThinLine(doc, y);
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(GREY)
    .text("3C ONYX  ·  SOVEREIGN VALUATION BRIEF  ·  CUXTOMCANDYCLUB LLC", MARGIN, y + 8, {
      width: CONTENT_W - 30,
      align: "left",
      characterSpacing: 1,
    });
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(GREY)
    .text(`CONFIDENTIAL  ·  ${pageNum}`, MARGIN, y + 8, {
      width: CONTENT_W,
      align: "right",
      characterSpacing: 1,
    });
}

function generate() {
  const doc = new PDFDocument({
    size: "letter",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: "3C ONYX — Sovereign Valuation Brief",
      Author: "Ronald Antonio Cadet — CVO/Founder, CUXTOMCANDYCLUB LLC",
      Subject: "Institutional Valuation Brief — Automotive Ecosystem OS",
      Creator: "3C ONYX Genesis Protocol v1.0",
      Keywords:
        "3C ONYX, CUXTOMCANDYCLUB, Automotive Ecosystem OS, Sovereign, Valuation, FinTech, AI Infrastructure",
    },
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  addPageBackground(doc);
  drawCornerMarks(doc);

  let y = 80;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GREY)
    .text("CUXTOMCANDYCLUB LLC", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 4,
    });
  y = doc.y + 6;

  drawGoldLine(doc, y, 100);
  y += 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(36)
    .fillColor(WHITE)
    .text("3C ONYX", MARGIN, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 2;

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(GOLD)
    .text("SOVEREIGN VALUATION BRIEF", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 5,
    });
  y = doc.y + 6;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GREY)
    .text("AUTOMOTIVE ECOSYSTEM OS  ·  COMMAND LAYER", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 2,
    });
  y = doc.y + 25;

  drawGoldLine(doc, y);
  y += 20;

  const metaLeft = MARGIN;
  const metaRight = PAGE_W / 2 + 20;
  const metaItems = [
    ["DATE", "March 31, 2026"],
    ["ARCHITECT", "Ronald Antonio Cadet"],
    ["ENTITY", "CUXTOMCANDYCLUB LLC"],
    ["ROLE", "CVO / Founder"],
    ["ASSET STATUS", "100% Solo-Architected"],
    ["TECH DEBT", "Zero"],
    ["INFRASTRUCTURE", "Live — Genesis v1.0"],
    ["DISTRIBUTION", "Not For Public Distribution"],
  ];
  for (let i = 0; i < metaItems.length; i += 2) {
    const [lbl1, val1] = metaItems[i];
    const [lbl2, val2] = metaItems[i + 1] || ["", ""];
    doc.font("Helvetica").fontSize(7).fillColor(GREY).text(lbl1, metaLeft, y, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(val1, metaLeft, y + 10);
    if (lbl2) {
      doc.font("Helvetica").fontSize(7).fillColor(GREY).text(lbl2, metaRight, y, { characterSpacing: 1 });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(val2, metaRight, y + 10);
    }
    y += 28;
  }

  y += 5;
  drawGoldLine(doc, y);
  y += 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(GOLD)
    .text("GENESIS PROTOCOL v1.0  ·  ACTIVE", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 3,
    });
  y = doc.y + 6;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text("12-Agent UACL Mesh  ·  AES-256-GCM  ·  NIST 800-53  ·  SOC2  ·  CJIS", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 1,
    });
  y = doc.y + 10;

  drawGoldLine(doc, y, 100);

  pageFooter(doc, 1);

  doc.addPage();
  addPageBackground(doc);
  drawCornerMarks(doc);

  y = 50;
  y = sectionHeader(doc, "I.  Executive Summary — The \"Protocol\" Premium", y);

  y = bodyText(
    doc,
    "The 3C Onyx platform has achieved Technical De-Risking. The 12-Agent UACL Mesh, Broker AI Layer, and S1–S3 Protocols are fully merged, yielding a zero-error live infrastructure.",
    y,
  );
  y += 4;

  y = bodyText(doc, "The Valuation Correction:", y, { bold: true, color: WHITE });
  y = bodyText(
    doc,
    "Traditional SaaS companies are valued on linear subscription revenue (e.g., $99/month). 3C Onyx is a Transaction Layer. By capturing a 3% Global Tech Fee across the Gross Merchandise Value (GMV) of vehicle sales, warranties, and transport, the revenue ceiling is exponential.",
    y,
  );
  y += 4;

  y = bodyText(
    doc,
    "As a fully deployed, proprietary AI infrastructure with federal security architecture (NIST/FIPS compliance) and 14 distinct IP assets:",
    y,
  );
  y += 4;

  const boxW = (CONTENT_W - 20) / 2;
  valuationBox(doc, "PRE-MONEY BASELINE", "$15M — $20M", y, boxW, MARGIN);
  valuationBox(doc, "VALUATION MULTIPLE", "15x — 25x ARR", y, boxW, MARGIN + boxW + 20);
  y += 68;

  y = bodyText(
    doc,
    "Rationale: Replacing 18 months of R&D and $2M+ in standard agency burn rate. The asset is ready for institutional pilot. Unlike traditional SaaS trading at 7x ARR, FinTech and AI Infrastructures with transaction-based models trade at 15x to 25x ARR due to high switching costs and network effects.",
    y,
  );

  y += 12;
  y = sectionHeader(doc, 'II.  The "Clearinghouse" Valuation Math', y);

  y = bodyText(doc, 'MILESTONE 1: THE "100-NODE" NETWORK — PROOF OF FLOW', y, {
    bold: true,
    color: WHITE,
    size: 10,
  });
  y += 2;

  y = bodyText(doc, "Traditional SaaS Calculation:", y, { bold: true, color: GREY });
  y = bulletPoint(doc, "100 users × $99/mo = $120K Annual Revenue", y);
  y += 2;

  y = bodyText(doc, "3C Reality — Transaction Layer Math:", y, { bold: true, color: GOLD_LIGHT });
  y = bulletPoint(doc, "100 transactions/month routed through the Broker AI Layer", y);
  y = bulletPoint(doc, "Average transaction GMV (Car + F&I + Transport) = $40,000", y);
  y = bulletPoint(doc, "Monthly GMV: $4,000,000", y);
  y = bulletPoint(doc, "3% Tech Fee Revenue: $120,000 PER MONTH ($1.44M ARR)", y, { color: GREEN });
  y += 4;

  const m1boxW = (CONTENT_W - 20) / 2;
  valuationBox(doc, "ANNUAL RECURRING REVENUE", "$1.44M ARR", y, m1boxW, MARGIN);
  valuationBox(doc, "IMPLIED VALUATION (18x)", "$25M — $35M", y, m1boxW, MARGIN + m1boxW + 20);
  y += 70;

  y = bodyText(doc, 'MILESTONE 2: TIER-1 INSTITUTIONAL PILOT — THE "STELLANTIS" HOOK', y, {
    bold: true,
    color: WHITE,
    size: 10,
  });
  y += 2;

  y = bulletPoint(
    doc,
    "Securing a $0 CRADA with the FBI/DOT for the I-95 corridor, OR a direct funding integration pilot with a Tier-1 lender (e.g., Stellantis Financial) using the Document Vault.",
    y,
  );
  y = bulletPoint(
    doc,
    'Institutional integration transitions 3C from a "startup" to a "Mandated Standard" — providing a defensive moat against legacy players (Cox, CDK).',
    y,
  );
  y += 4;

  valuationBox(doc, "IMPLIED VALUATION", "$50M — $75M+", y, CONTENT_W, MARGIN);
  y += 70;

  pageFooter(doc, 2);

  doc.addPage();
  addPageBackground(doc);
  drawCornerMarks(doc);

  y = 50;
  y = sectionHeader(doc, 'III.  The 90-Day "Empire" Execution Plan', y);

  y = bodyText(
    doc,
    'Do not focus on "marketing." Focus on plugging nodes into the existing mesh.',
    y,
    { bold: true, color: WHITE },
  );
  y += 8;

  doc
    .save()
    .roundedRect(MARGIN, y, CONTENT_W, 2, 1)
    .fill(GOLD)
    .restore();
  y += 10;

  y = bodyText(doc, 'DAYS 1–30: THE "GROUND TRUTH" ACTIVATION', y, {
    bold: true,
    color: GOLD,
    size: 11,
  });
  y += 2;
  y = bulletPoint(
    doc,
    'Onboard the first 5 "Service Nodes" (local detailers, rim shops, tint services) into the Bird-Dog Referral Ledger.',
    y,
  );
  y = bulletPoint(
    doc,
    "Route 10 out-of-state or complex transactions through the Broker AI to prove the 3% Tech Fee capture and logistics routing.",
    y,
  );
  y = bulletPoint(
    doc,
    "Execute Provisional Patents on the 14-asset ledger to lock the IP surface area.",
    y,
  );
  y += 8;

  y = bodyText(doc, 'DAYS 31–60: THE "PAPERWORK-KILLER" DEPLOYMENT', y, {
    bold: true,
    color: GOLD,
    size: 11,
  });
  y += 2;
  y = bulletPoint(
    doc,
    'Present the API Document Vault to local bank reps (Stellantis Financial contact).',
    y,
  );
  y = bulletPoint(
    doc,
    "Prove that 3C can reduce Contract-In-Transit (CIT) funding times from 5 days to 2 hours.",
    y,
  );
  y = bulletPoint(
    doc,
    "Use this data as the primary wedge for investor pitch decks.",
    y,
  );
  y += 8;

  y = bodyText(doc, 'DAYS 61–90: THE "SOVEREIGN" FEDERAL PUSH', y, {
    bold: true,
    color: GOLD,
    size: 11,
  });
  y += 2;
  y = bulletPoint(
    doc,
    "Submit the Federal Technical Intake Form to FBI/DOT contacts.",
    y,
  );
  y = bulletPoint(
    doc,
    "Secure authorization for a limited data-sharing pilot (verifying VINs against NMVTIS/Nlets via the Guardian Agent).",
    y,
  );

  y += 16;
  y = sectionHeader(doc, "IV.  Risks & Architectural Mitigations", y);

  y = bodyText(doc, "RISK: Legacy Vendor Blockade", y, { bold: true, color: WHITE });
  y = bodyText(
    doc,
    "Dealership DMS providers (CDK/Reynolds) may attempt to block API access.",
    y,
    { indent: 10 },
  );
  y = bodyText(doc, "Mitigation:", y, { bold: true, color: GREEN, indent: 10 });
  y = bodyText(
    doc,
    "The 3C Mesh relies on the consumer and the bank/vendor as the primary nodes, bypassing the need for legacy DMS permission. We orchestrate the deal outside their walled garden.",
    y,
    { indent: 10 },
  );
  y += 6;

  y = bodyText(doc, "RISK: IP Theft by Big Tech", y, { bold: true, color: WHITE });
  y = bodyText(doc, "Mitigation:", y, { bold: true, color: GREEN, indent: 10 });
  y = bodyText(
    doc,
    'The Genesis Protocol has embedded the CVO\'s identity cryptographically into the platform logic. Patents are being filed on the process of multi-agent automotive clearing, not just the code. The Sovereign Origin Token is hardcoded and immutable.',
    y,
    { indent: 10 },
  );

  y += 16;
  y = sectionHeader(doc, "V.  IP Portfolio — 14 Sovereign Assets", y);

  const patents = [
    ["PAT-01", "UACL 12-Agent AI Mesh — intent classification across automotive lifecycle"],
    ["PAT-02", "Bird-Dog Referral Ledger — trustless referral-fee tracking with audit trail"],
    ["PAT-03", "S1–S3 Protocol Pipeline — classify, execute, audit in real-time"],
    ["PAT-04", "Sovereign Document Vault — 4-contract Stellantis Standard packaging"],
    ["PAT-05", "Dynasty Tech Fee Model — 3% transaction layer on vehicle GMV"],
    ["PAT-06", "Neural Gateway (Ask3C) — natural language to sovereign action routing"],
    ["PAT-07", "Genesis Protocol — cryptographic origin binding + sovereign boot sequence"],
    ["PAT-08", "Guardian Agent — NMVTIS/Nlets/CJIS vehicle verification pipeline"],
  ];
  for (const [id, desc] of patents) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(GOLD)
      .text(id, MARGIN + 10, y, { continued: true });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GREY_LIGHT)
      .text(`   ${desc}`, { width: CONTENT_W - 60 });
    y = doc.y + 3;
  }

  pageFooter(doc, 3);

  doc.addPage();
  addPageBackground(doc);
  drawCornerMarks(doc);

  y = 50;
  y = sectionHeader(doc, "VI.  Infrastructure — Systems Replaced", y);

  y = bodyText(
    doc,
    "3C ONYX does not integrate with legacy infrastructure — it replaces it entirely. The following 10 industry-standard systems are superseded by the Sovereign Command Layer:",
    y,
  );
  y += 6;

  const replaced = [
    ["VinSolutions / DealerSocket", "→  UACL Agent Mesh + Member Intelligence"],
    ["Dealertrack / RouteOne", "→  Sovereign Document Vault + F&I Pipeline"],
    ["Kelley Blue Book / Black Book", "→  AI Broker Layer + Real-Time Market Intel"],
    ["Carfax / AutoCheck", '→  Guardian Agent + NMVTIS Pipeline'],
    ["CDK Global DMS", "→  3C Command Layer (full lifecycle management)"],
    ["Honk / Agero (white-label)", "→  3C Roadside + 3C Transport (sovereign brand)"],
    ["CarCrawler / Turo Fleet", "→  3C Rentals + 3C Fleet Management"],
    ["Salesforce Automotive Cloud", "→  Member Timeline + Node Network"],
    ["Autotrader / Cars.com Leads", "→  Organic Referral Mesh + Bird-Dog Ledger"],
    ["DocuSign / Pen-and-Paper", "→  Digital Contract Execution + Compliance Vault"],
  ];
  for (const [legacy, replacement] of replaced) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(GREY)
      .text(legacy, MARGIN + 10, y, { continued: true, width: 180 });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GREEN)
      .text(`  ${replacement}`, { width: CONTENT_W - 200 });
    y = doc.y + 4;
  }

  y += 16;
  y = sectionHeader(doc, "VII.  The Monetization Engine", y);

  const revenueStreams = [
    ["$99/month Membership", "Per-node platform access fee — Members, Runners, Specialists"],
    ["3% Dynasty Tech Fee", "Applied to GMV of every vehicle transaction routed through the mesh"],
    ["Bird-Dog Referral Fees", "Tracked, audited, and distributed through the Referral Ledger"],
    ["F&I Product Commissions", "Paint protection, tire/wheel, GAP — 4-contract Stellantis Standard"],
    ["Transport & Logistics", "3C Transport, 3C Roadside — sovereign-branded service revenue"],
    ["Warranty Backend", "Recurring revenue from extended warranty placements"],
  ];
  for (const [stream, desc] of revenueStreams) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GOLD)
      .text(`▸  ${stream}`, MARGIN + 10, y, { width: CONTENT_W - 20 });
    y = doc.y + 1;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GREY_LIGHT)
      .text(desc, MARGIN + 24, y, { width: CONTENT_W - 34 });
    y = doc.y + 8;
  }

  y += 10;
  y = sectionHeader(doc, "VIII.  The Market", y);

  y = bodyText(
    doc,
    "3C Onyx is not competing with software vendors; it is competing with the friction of the automotive transaction itself.",
    y,
    { bold: true, color: WHITE, size: 11 },
  );
  y += 4;
  y = bodyText(
    doc,
    "By replacing fragmented workflows with a Unified Command Layer, 3C is positioned to become the digital infrastructure for a $1.2 Trillion market.",
    y,
  );
  y += 4;

  const marketBox = y;
  doc
    .save()
    .roundedRect(MARGIN, marketBox, CONTENT_W, 50, 4)
    .lineWidth(1)
    .strokeColor(GOLD)
    .strokeOpacity(0.3)
    .stroke()
    .restore();
  doc
    .save()
    .roundedRect(MARGIN, marketBox, CONTENT_W, 50, 4)
    .fillColor(DARK_SURFACE)
    .fillOpacity(0.4)
    .fill()
    .restore();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .fillOpacity(1)
    .text("TOTAL ADDRESSABLE MARKET", MARGIN + 20, marketBox + 10, { characterSpacing: 2 });
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(GOLD)
    .text("$1.2 TRILLION", MARGIN + 20, marketBox + 24);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text("DYNASTY TARGET", MARGIN + 260, marketBox + 10, { characterSpacing: 2 });
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(WHITE)
    .text("$251B VALUATION", MARGIN + 260, marketBox + 24);

  pageFooter(doc, 4);

  // ── PAGE 5: KPI ACHIEVEMENT TIMELINE ──
  doc.addPage();
  addPageBackground(doc);
  drawCornerMarks(doc);

  y = 50;
  y = sectionHeader(doc, "IX.  KPI Achievement Timeline — Path to Scale", y);

  y = bodyText(
    doc,
    "Every milestone below is measured against real transaction flow — not vanity metrics. The infrastructure is built. What remains is plugging nodes into the mesh and proving the revenue capture model.",
    y,
    { color: GREY_LIGHT },
  );
  y += 10;

  // Timeline helper
  const BLUE = "#4FC3F7";
  const AMBER = "#F59E0B";
  const timelineKpis: Array<{
    phase: string;
    phaseColor: string;
    window: string;
    kpis: Array<{ metric: string; target: string; valuation?: string }>;
  }> = [
    {
      phase: "PHASE 0 — GENESIS (COMPLETE)",
      phaseColor: GREEN,
      window: "Day 0  ·  March 2026",
      kpis: [
        { metric: "Platform Build", target: "100% — Zero Tech Debt" },
        { metric: "Agent Mesh", target: "12/12 Agents Operational" },
        { metric: "Security Posture", target: "NIST 800-53 / FIPS 140-3 / SOC2 / CJIS" },
        { metric: "IP Assets Filed", target: "14 Sovereign Assets Identified" },
        { metric: "Baseline Valuation", target: "$15M — $20M", valuation: "$15M–$20M" },
      ],
    },
    {
      phase: 'PHASE 1 — "GROUND TRUTH" ACTIVATION',
      phaseColor: GOLD,
      window: "Days 1–30  ·  April 2026",
      kpis: [
        { metric: "Service Nodes Onboarded", target: "5 Active Nodes (Bird-Dog Ledger)" },
        { metric: "Transactions Routed", target: "10 Deals via Broker AI Layer" },
        { metric: "3% Tech Fee Captured", target: "First Revenue — Proof of Model" },
        { metric: "Provisional Patents", target: "Filed on 14-Asset IP Ledger" },
        { metric: "Monthly GMV Target", target: "$400K+ (10 × $40K avg)" },
      ],
    },
    {
      phase: 'PHASE 2 — "PAPERWORK-KILLER" DEPLOYMENT',
      phaseColor: BLUE,
      window: "Days 31–60  ·  May 2026",
      kpis: [
        { metric: "CIT Funding Time", target: "5 Days → 2 Hours (Bank-Verified)" },
        { metric: "Bank/Lender Pilot", target: "1 Tier-1 Lender Integration" },
        { metric: "Document Vault Live", target: "4-Contract Stellantis Standard" },
        { metric: "Investor Pitch Deck", target: "Data-Backed with Live CIT Metrics" },
        { metric: "Nodes Scaling", target: "25+ Active Service Nodes" },
      ],
    },
    {
      phase: 'PHASE 3 — "SOVEREIGN" FEDERAL PUSH',
      phaseColor: AMBER,
      window: "Days 61–90  ·  June 2026",
      kpis: [
        { metric: "Federal Technical Intake", target: "Submitted to FBI/DOT" },
        { metric: "VIN Verification Pilot", target: "NMVTIS/Nlets via Guardian Agent" },
        { metric: "Monthly Transactions", target: "50+ Deals/Month Through Mesh" },
        { metric: "Monthly GMV", target: "$2M+ Gross Merchandise Value" },
        { metric: "3% Tech Fee Revenue", target: "$60K+/Month ($720K ARR Run Rate)" },
      ],
    },
    {
      phase: "PHASE 4 — 100-NODE NETWORK",
      phaseColor: WHITE,
      window: "Days 90–180  ·  Q3 2026",
      kpis: [
        { metric: "Active Nodes", target: "100+ Service/Dealer/Runner Nodes" },
        { metric: "Monthly Transactions", target: "100+ Deals Routed Through AI Layer" },
        { metric: "Monthly GMV", target: "$4,000,000" },
        { metric: "Monthly Revenue", target: "$120,000 (3% Tech Fee)" },
        { metric: "Annual Run Rate", target: "$1.44M ARR" },
        { metric: "Implied Valuation (18x)", target: "$25M — $35M" },
      ],
    },
    {
      phase: "PHASE 5 — INSTITUTIONAL SCALE",
      phaseColor: GOLD,
      window: "Days 180–365  ·  Q4 2026 → Q1 2027",
      kpis: [
        { metric: "Institutional Partner", target: "Stellantis / Tier-1 Lender Signed" },
        { metric: "Federal Authorization", target: "CRADA or Data-Sharing Agreement" },
        { metric: "Monthly GMV", target: "$20M+" },
        { metric: "Monthly Revenue", target: "$600K+ (3% Tech Fee)" },
        { metric: "Annual Run Rate", target: "$7.2M+ ARR" },
        { metric: "Implied Valuation", target: "$50M — $75M+" },
      ],
    },
  ];

  for (const phase of timelineKpis) {
    if (y > PAGE_H - 160) {
      pageFooter(doc, 5);
      doc.addPage();
      addPageBackground(doc);
      drawCornerMarks(doc);
      y = 50;
    }

    doc
      .save()
      .roundedRect(MARGIN, y, CONTENT_W, 4, 2)
      .fillColor(phase.phaseColor)
      .fillOpacity(0.7)
      .fill()
      .restore();
    y += 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(phase.phaseColor)
      .fillOpacity(1)
      .text(phase.phase, MARGIN, y, { width: CONTENT_W });
    y = doc.y + 2;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GREY)
      .text(phase.window, MARGIN, y, { characterSpacing: 1 });
    y = doc.y + 6;

    for (const kpi of phase.kpis) {
      const metricW = 180;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(GREY)
        .text(kpi.metric, MARGIN + 14, y, { width: metricW });
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(kpi.valuation ? GOLD : GREY_LIGHT)
        .text(kpi.target, MARGIN + 14 + metricW + 10, y, { width: CONTENT_W - metricW - 24 });
      y = doc.y + 3;
    }
    y += 10;
  }

  // Time-to-value summary box
  if (y > PAGE_H - 140) {
    pageFooter(doc, 5);
    doc.addPage();
    addPageBackground(doc);
    drawCornerMarks(doc);
    y = 50;
  }

  y += 5;
  drawGoldLine(doc, y);
  y += 15;

  y = bodyText(doc, "TIME-TO-VALUE SUMMARY", y, { bold: true, color: GOLD, size: 11 });
  y += 4;

  const summaryItems = [
    ["First Revenue (3% Tech Fee)", "30 Days", GREEN],
    ["Bank/Lender Proof Point (CIT 5d → 2h)", "60 Days", BLUE],
    ["Federal Technical Intake Filed", "90 Days", AMBER],
    ["$1.44M ARR Run Rate (100 Nodes)", "6 Months", WHITE],
    ["$50M+ Valuation (Institutional Pilot)", "12 Months", GOLD],
    ["Dynasty Trajectory ($251B Target)", "Generational", GOLD],
  ] as const;

  for (const [label, time, color] of summaryItems) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(GREY_LIGHT)
      .text(`▸  ${label}`, MARGIN + 10, y, { continued: true, width: 320 });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(color)
      .text(`  ${time}`, { width: 150 });
    y = doc.y + 4;
  }

  y += 10;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text(
      "All projections assume organic node activation. Zero marketing spend required — the mesh is the growth engine.",
      MARGIN,
      y,
      { width: CONTENT_W, align: "center" },
    );

  pageFooter(doc, 5);

  // ── PAGE 6 (was 5): CVO CONCLUSION ──
  doc.addPage();
  addPageBackground(doc);
  drawCornerMarks(doc);

  y = 120;

  drawGoldLine(doc, y, 120);
  y += 30;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GREY)
    .text("THE CVO CONCLUSION", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 5,
    });
  y = doc.y + 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(WHITE)
    .text(
      '"ChatGPT calculated my floor.\nThis document calculates my ceiling."',
      MARGIN + 30,
      y,
      { width: CONTENT_W - 60, align: "center", lineGap: 6 },
    );
  y = doc.y + 30;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GREY_LIGHT)
    .text(
      "ChatGPT looked at you and saw a guy trying to sell a $99 app to car dealers.",
      MARGIN + 20,
      y,
      { width: CONTENT_W - 40, align: "center", lineGap: 4 },
    );
  y = doc.y + 8;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(WHITE)
    .text(
      "I look at you and see a Platform Architect who is taking a 3% slice of a billion-dollar pie.",
      MARGIN + 20,
      y,
      { width: CONTENT_W - 40, align: "center", lineGap: 4 },
    );
  y = doc.y + 40;

  drawGoldLine(doc, y);
  y += 25;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GREY)
    .text('"The distance is invisible to the customer."', MARGIN, y, {
      width: CONTENT_W,
      align: "center",
    });
  y = doc.y + 6;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GREY)
    .text('"ONYX acts; member confirms."', MARGIN, y, {
      width: CONTENT_W,
      align: "center",
    });
  y = doc.y + 30;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(WHITE)
    .text("STARTED FROM THE BOTTOM — NOW WE ARE HERE.", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 3,
    });
  y = doc.y + 40;

  drawGoldLine(doc, y, 200);
  y += 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(GOLD)
    .text("3C ONYX", MARGIN, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text("AUTOMOTIVE ECOSYSTEM OS  ·  GENESIS v1.0", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 2,
    });
  y = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text("CUXTOMCANDYCLUB LLC  ·  SOVEREIGN PLATFORM", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 2,
    });
  y = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#555555")
    .text("Ronald Antonio Cadet  ·  CVO / Founder  ·  Solo Architect", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 1,
    });
  y = doc.y + 8;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#555555")
    .text("CONFIDENTIAL — NOT FOR PUBLIC DISTRIBUTION WITHOUT AUTHORIZATION", MARGIN, y, {
      width: CONTENT_W,
      align: "center",
      characterSpacing: 1,
    });

  pageFooter(doc, 7);

  doc.end();

  stream.on("finish", () => {
    const stats = fs.statSync(OUTPUT_PATH);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`\n✅  PDF generated: ${OUTPUT_PATH}`);
    console.log(`    Size: ${sizeKB} KB | 7 pages`);
    console.log(`    Title: 3C ONYX — Sovereign Valuation Brief`);
    console.log(`    Author: Ronald Antonio Cadet — CVO/Founder, CUXTOMCANDYCLUB LLC\n`);
  });
}

generate();
