/**
 * 3C ONYX / CUXTOMCANDYCLUB LLC
 * MASTER INTELLECTUAL PROPERTY LEDGER — v2.0
 * Proprietary & Confidential | Counsel & Federal Pilot Review
 *
 * Run: node gen_ip_ledger.js
 */

'use strict';

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUTPUT = path.join(__dirname, '3C_ONYX_IP_Master_Ledger.pdf');

// ── Brand Colors ──────────────────────────────────────────────────────────────
const BG     = '#060608';
const GOLD   = '#C9A227';
const GOLD2  = '#E8B830';
const WHITE  = '#FFFFFF';
const LGRAY  = '#CCCCCC';
const MGRAY  = '#777777';
const DGRAY  = '#0E0E12';
const RED    = '#EF4444';
const BLUE   = '#4A8FD4';
const PURPLE = '#A78BFA';
const SILVER = '#94A3B8';
const NAVY   = '#1B2F4A';
const TEAL   = '#2DD4BF';

const W = 612, H = 792, M = 52;

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title:    '3C ONYX — Master Intellectual Property Ledger v2.0',
    Author:   'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject:  'IP Ledger — Trademarks, Trade Secrets, Patents, Copyright, Data Sovereignty',
    Keywords: '3C ONYX, IP, trademark, patent, trade secret, CUXTOMCANDYCLUB, USPTO',
    Creator:  'CUXTOMCANDYCLUB LLC',
  },
});

doc.pipe(fs.createWriteStream(OUTPUT));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fillPage() { doc.rect(0, 0, W, H).fill(BG); }

function subtleGrid() {
  for (let x = 0; x < W; x += 44)
    doc.moveTo(x, 0).lineTo(x, H).lineWidth(0.2).strokeColor(GOLD + '07').stroke();
  for (let y_ = 0; y_ < H; y_ += 44)
    doc.moveTo(0, y_).lineTo(W, y_).lineWidth(0.2).strokeColor(GOLD + '07').stroke();
}

function hLine(y, color, w) {
  doc.moveTo(M, y).lineTo(W - M, y).lineWidth(w || 0.6).strokeColor(color || GOLD).stroke();
}
function fullLine(y, color, w) {
  doc.moveTo(0, y).lineTo(W, y).lineWidth(w || 0.6).strokeColor(color || GOLD).stroke();
}

function pgHeader(section) {
  doc.rect(0, 0, W, 3).fill(GOLD);
  doc.rect(0, 0, 3, 28).fill(GOLD + '50');
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(GOLD)
     .text('3 C  O N Y X  —  M A S T E R  I P  L E D G E R  v 2 . 0', M, 13, { characterSpacing: 2 });
  doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
     .text(section, 0, 13, { width: W - M, align: 'right', characterSpacing: 0.5 });
}

function pgFooter(num) {
  doc.rect(0, H - 3, W, 3).fill(GOLD + '40');
  const y = H - 22;
  doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
     .text('PROPRIETARY & CONFIDENTIAL  ·  CUXTOMCANDYCLUB LLC  ·  RONALD ANTONIO CADET, CVO', M, y, { characterSpacing: 0.3 });
  if (num) doc.fontSize(6.5).fillColor(MGRAY).text(String(num), 0, y, { width: W - M, align: 'right' });
}

function secLabel(text, y, color) {
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(color || GOLD)
     .text(text, M, y, { characterSpacing: 1.8 });
  return y + 14;
}

function body(text, y, opts) {
  const o = Object.assign({ width: W - M * 2, lineGap: 3 }, opts || {});
  doc.fontSize(10).font('Helvetica').fillColor(LGRAY).text(text, M, y, o);
  return doc.y + 6;
}

// ── Logo — clean, no ambient glow ─────────────────────────────────────────────
function drawLogo(cx, cy, r) {
  const sw = r > 30 ? 2.4 : 1.8;
  doc.circle(cx, cy, r + 4).lineWidth(0.4).strokeColor(GOLD + '28').stroke();
  doc.circle(cx, cy, r + 2).lineWidth(0.3).strokeColor(GOLD + '14').stroke();
  doc.circle(cx, cy, r).lineWidth(sw).strokeColor(GOLD).stroke();
  doc.moveTo(cx, cy - r).lineTo(cx, cy + r).lineWidth(sw).strokeColor(GOLD).stroke();
  const rad = Math.PI / 180;
  doc.moveTo(cx, cy).lineTo(cx + r * Math.cos(210 * rad), cy + r * Math.sin(210 * rad)).lineWidth(sw).strokeColor(GOLD).stroke();
  doc.moveTo(cx, cy).lineTo(cx + r * Math.cos(330 * rad), cy + r * Math.sin(330 * rad)).lineWidth(sw).strokeColor(GOLD).stroke();
  const fs = r > 30 ? 14 : 10;
  doc.fontSize(fs).font('Helvetica-Bold').fillColor(GOLD).text('3', cx - Math.round(r * 0.44), cy - Math.round(fs * 0.5), { width: Math.round(r * 0.42), align: 'center' });
  doc.fontSize(fs).font('Helvetica-Bold').fillColor(WHITE).text('C', cx + Math.round(r * 0.04), cy - Math.round(fs * 0.5), { width: Math.round(r * 0.42), align: 'center' });
}

function priorityBadge(x, y, level) {
  const colors = { CRITICAL: RED, HIGH: GOLD, MEDIUM: BLUE, LOW: SILVER };
  const c = colors[level] || SILVER;
  doc.rect(x, y, 58, 14).fill(c + '20');
  doc.rect(x, y, 3, 14).fill(c);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(c)
     .text(level, x + 6, y + 4, { width: 50, characterSpacing: 0.5 });
}

function statusBadge(x, y, status) {
  const colors = { 'In Use': TEAL, 'Pending': GOLD, 'Filed': BLUE, 'Registered': PURPLE };
  const c = colors[status] || SILVER;
  doc.rect(x, y, 52, 14).fill(c + '20');
  doc.rect(x, y, 52, 2).fill(c);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(c)
     .text(status, x, y + 5, { width: 52, align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — COVER
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
subtleGrid();

// Top confidential bar
doc.rect(0, 0, W, 38).fill('#0A0900');
doc.rect(0, 0, W, 3).fill(GOLD);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
   .text('PROPRIETARY & CONFIDENTIAL  —  ATTORNEY-CLIENT PRIVILEGED', 0, 13, { align: 'center', characterSpacing: 1.2 });
doc.fontSize(7).font('Helvetica').fillColor(SILVER)
   .text('Prepared for Counsel Review  ·  Federal Pilot Disclosure Authorized', 0, 25, { align: 'center' });

// Wilson Sonsini reference — top right
doc.rect(W - 158, 46, 106, 20).fill(GOLD + '15');
doc.rect(W - 158, 46, 3, 20).fill(GOLD);
doc.fontSize(7).font('Helvetica-Bold').fillColor(GOLD)
   .text('TIER-1 COUNSEL READY', W - 155, 53, { width: 100, characterSpacing: 0.5 });

// Logo
drawLogo(W / 2, 196, 44);

// Header text
doc.fontSize(7.5).font('Helvetica').fillColor(GOLD)
   .text('C U X T O M C A N D Y C L U B  L L C  ×  3 C  O N Y X', 0, 278, { align: 'center', characterSpacing: 2.8 });

doc.fontSize(30).font('Helvetica-Bold').fillColor(WHITE)
   .text('MASTER IP LEDGER', 0, 296, { align: 'center', characterSpacing: 5 });

doc.fontSize(13).font('Helvetica-Bold').fillColor(GOLD)
   .text('INTELLECTUAL PROPERTY ASSET REGISTRY — v2.0', 0, 334, { align: 'center', characterSpacing: 2.5 });

doc.fontSize(9).font('Helvetica').fillColor(SILVER)
   .text('T R A D E M A R K S  ·  T R A D E  S E C R E T S  ·  P A T E N T S  ·  C O P Y R I G H T  ·  D A T A', 0, 356, { align: 'center', characterSpacing: 1.5 });

hLine(376, GOLD + '55', 0.7);
doc.rect(M, 378, W - M * 2, 1).fill(GOLD + '15');

// IP surface area stat block
const statsY = 392;
const statItems = [
  { val: '55+',  label: 'Distinct IP Assets' },
  { val: '7',    label: 'Trademark Classes' },
  { val: '3',    label: 'Patent Candidates' },
  { val: '100%', label: 'Solo-Authored' },
  { val: '$250B', label: 'Dynasty Target' },
];
const sw2 = (W - M * 2) / statItems.length;
statItems.forEach(({ val, label }, i) => {
  const sx = M + i * sw2;
  doc.rect(sx, statsY, sw2 - 2, 44).fill(DGRAY);
  doc.rect(sx, statsY, sw2 - 2, 2).fill(GOLD);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(GOLD)
     .text(val, sx, statsY + 8, { width: sw2 - 2, align: 'center' });
  doc.fontSize(7).font('Helvetica').fillColor(SILVER)
     .text(label, sx, statsY + 30, { width: sw2 - 2, align: 'center' });
});

// Meta block
const metaY = 454;
doc.rect(M + 16, metaY, W - M * 2 - 32, 136).fill('#0A0900');
doc.rect(M + 16, metaY, 3, 136).fill(GOLD);

[
  ['PRIMARY OWNER',     'Ronald Antonio Cadet'],
  ['TITLE',            'Chief Visionary Officer (CVO)'],
  ['ENTITY',           'CUXTOMCANDYCLUB LLC  ·  New York  ·  Entity ID: 7788320'],
  ['FORMED',           'December 21, 2025'],
  ['PLATFORM',         '3C ONYX — Sovereign AI Automotive Super App'],
  ['DOCUMENT VERSION', 'v2.0  ·  March 30, 2026  ·  Supersedes all prior IP summaries'],
  ['FILING INTENT',    'Provisional Patent filings immediately on PAT-01 through PAT-03'],
].forEach(([label, value], i) => {
  const y = metaY + 14 + i * 17;
  doc.fontSize(7).font('Helvetica-Bold').fillColor(GOLD)
     .text(label, M + 26, y, { width: 100, characterSpacing: 0.6 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(value, M + 130, y, { width: W - M * 2 - 142 });
});

doc.fontSize(6.5).font('Helvetica').fillColor(GOLD + '40')
   .text('ORIGIN TRACE: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', 0, metaY + 148, { align: 'center', characterSpacing: 0.6 });

// Founder name small
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('ronald antonio cadet', 0, H - 56, { align: 'center', characterSpacing: 1 });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Chief Visionary Officer  ·  CUXTOMCANDYCLUB LLC  ·  Primary Origin Author', 0, H - 44, { align: 'center' });

// Bottom bar — section preview
doc.rect(0, H - 32, W, 32).fill('#0A0900');
fullLine(H - 32, GOLD + '35', 0.5);
const secs = ['§1 TRADEMARKS', '§2 TRADE SECRETS', '§3 PATENTS', '§4 COPYRIGHT', '§5 DATA SOVEREIGNTY', '§6 LEGAL STRATEGY'];
secs.forEach((s, i) => {
  const x = i * (W / secs.length);
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(i % 2 === 0 ? GOLD : SILVER)
     .text(s, x, H - 18, { width: W / secs.length, align: 'center', characterSpacing: 0.4 });
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — SECTION 1: TRADEMARKS
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('SECTION 1 — TRADEMARKS & POSITIONING');
pgFooter(2);

let y = 42;
y = secLabel('§ 1.  TRADEMARKS & POSITIONING  —  THE BRAND SHIELD', y);
hLine(y, GOLD + '70', 0.7); y += 10;

y = body(
  'These marks represent the Flags in the Ground — legally enforceable barriers that prevent brand ' +
  'confusion, passing-off, and unauthorized use by competitors. Each mark is in active commercial use ' +
  'as of the date of this ledger. Priority marks should be filed with the USPTO immediately as ' +
  'federal trademark applications (ITU or Use-Based, Class 42 / Class 35 as applicable).',
  y
);

y += 8;

// Table header
const tCols = [52, 148, 156, 78, 60];
const tX    = [M, M + 52, M + 52 + 148, M + 52 + 148 + 156, M + 52 + 148 + 156 + 78];
const tW    = tCols.reduce((a, b) => a + b, 0);

doc.rect(M, y, tW, 22).fill(NAVY);
doc.rect(M, y, tW, 2).fill(GOLD);
['ID', 'ASSET NAME', 'LEGAL CLASSIFICATION', 'STATUS', 'PRIORITY'].forEach((h, i) => {
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
     .text(h, tX[i] + 4, y + 7, { width: tCols[i] - 6, characterSpacing: 0.4 });
});
y += 22;

const trademarks = [
  {
    id: 'TM-01', name: 'CUXTOMCANDYCLUB', classification: 'Primary Word Mark — Corporate identity and platform brand', status: 'In Use', priority: 'CRITICAL',
    note: 'The mother brand. Covers all goods and services under Cuxtomcandyclub LLC. File in Class 35 (Business Services) and Class 42 (Software/Technology). Distinctive coined term — highest registrability.',
  },
  {
    id: 'TM-02', name: '3C ONYX', classification: 'Primary Word Mark — Platform and product brand', status: 'In Use', priority: 'CRITICAL',
    note: 'Core platform identifier. "3C" as an abbreviation is distinctive; "ONYX" reinforces the luxury positioning. File jointly in Class 36 (Financial), Class 42 (Software), Class 39 (Transportation).',
  },
  {
    id: 'TM-03', name: '7-AGENT AI MESH', classification: 'Descriptive Service Mark — Architecture identifier', status: 'In Use', priority: 'HIGH',
    note: 'Describes the proprietary 7-agent orchestration layer. As a technical service mark, it identifies the source of the service. Seek acquired distinctiveness evidence (first use date, platform logs).',
  },
  {
    id: 'TM-04', name: 'GUARDIAN AGENT', classification: 'Product Sub-Brand — AI feature mark', status: 'In Use', priority: 'HIGH',
    note: 'Identifies the flagship AI agent responsible for VIN verification and predictive vehicle intelligence. "Guardian" in the context of vehicle AI is distinctive. File in Class 42.',
  },
  {
    id: 'TM-05', name: 'COMPLAINT · CAUSE · CORRECTION', classification: 'Slogan / Method Mark — 3C doctrine', status: 'In Use', priority: 'HIGH',
    note: 'The platform philosophy expressed as a service method. Slogans are registrable when they identify the source of services and have acquired distinctiveness. Strong litigation utility.',
  },
  {
    id: 'TM-06', name: 'THE SOVEREIGN AI SUPER APP', classification: 'Positioning Mark — Category descriptor', status: 'In Use', priority: 'MEDIUM',
    note: '"Sovereign AI" is a coined phrase in the automotive context. "Super App" is descriptive; the combination may be distinctive. File as a standard character mark; monitor competitor use.',
  },
  {
    id: 'TM-07', name: 'V.I.P. — VERIFIED INTEGRITY PROTOCOL', classification: 'Technical Service Mark — Federal standard', status: 'In Use', priority: 'CRITICAL',
    note: 'The most legally significant mark. "V.I.P." in this context is a coined acronym, not descriptive of prestige. The Protocol is the technical mechanism for odometer/title fraud prevention. File immediately — strongest trademark position on this list.',
  },
];

trademarks.forEach((tm, i) => {
  const rh = 54;
  doc.rect(M, y, tW, rh).fill(i % 2 === 0 ? DGRAY : '#0C0C10');
  // Vertical separators
  tX.slice(1).forEach(x2 => {
    doc.moveTo(x2, y).lineTo(x2, y + rh).lineWidth(0.25).strokeColor(GOLD + '18').stroke();
  });
  doc.rect(M, y, 3, rh).fill(tm.priority === 'CRITICAL' ? RED : tm.priority === 'HIGH' ? GOLD : BLUE);

  // ID
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GOLD).text(tm.id, tX[0] + 4, y + 6, { width: tCols[0] - 6 });
  // Name
  doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE).text(tm.name, tX[1] + 4, y + 5, { width: tCols[1] - 6, lineGap: 1 });
  // Classification
  doc.fontSize(8).font('Helvetica').fillColor(LGRAY).text(tm.classification, tX[2] + 4, y + 5, { width: tCols[2] - 6, lineGap: 1.5 });
  // Status badge
  statusBadge(tX[3] + 8, y + 6, tm.status);
  // Priority badge
  priorityBadge(tX[4] + 1, y + 6, tm.priority);

  // Counsel note
  doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
     .text(tm.note, tX[1] + 4, y + 35, { width: tW - tCols[0] - 6, lineGap: 1 });

  y += rh + 2;
});

y += 10;

// USPTO priority action box
doc.rect(M, y, W - M * 2, 42).fill('#0A0900');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.rect(M, y, 3, 42).fill(GOLD);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
   .text('USPTO PRIORITY ACTION — MONDAY MORNING', M + 12, y + 9, { characterSpacing: 0.8 });
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text(
     'File FIRST on TM-01 (CUXTOMCANDYCLUB), TM-02 (3C ONYX), and TM-07 (V.I.P. — Verified Integrity Protocol). ' +
     'All three are in active commercial use — file as Use-Based applications (§1(a)) in Classes 35, 36, 39, and 42. ' +
     'Target: USPTO TEAS Plus application at $250/class. Total filing cost: ~$3,000 for priority three.',
     M + 12, y + 22, { width: W - M * 2 - 20, lineGap: 1.5 }
   );
y += 52;

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — SECTION 2: TRADE SECRETS + SECTION 3: PATENTS
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('SECTION 2 — TRADE SECRETS  ·  SECTION 3 — PATENT CANDIDATES');
pgFooter(3);

y = 42;
y = secLabel('§ 2.  TRADE SECRETS & NEURAL LOGIC  —  THE MOAT', y);
hLine(y, GOLD + '70', 0.7); y += 10;

y = body(
  'Trade secrets are protected under the Defend Trade Secrets Act (DTSA) and New York UTSA. ' +
  'Protection attaches automatically upon creation — no filing required. The moat is effective ' +
  'as long as reasonable measures are taken to maintain secrecy. All items below are embedded ' +
  'in source code authored by Ronald Antonio Cadet and accessible only via Replit sovereign environment.',
  y
);

y += 8;

const tradeSecrets = [
  {
    id: 'TS-01',
    title: 'AGENT ORCHESTRATION LAYER — NEURAL MEMORY ARCHITECTURE',
    color: PURPLE,
    classification: 'Core Platform Algorithm — Highest Secrecy Priority',
    description: 'The proprietary logic that allows 7 autonomous AI agents (Guardian, Concierge, MarketCheck, Mission, Vault, Stripe, Notify) to share a single Neural Memory state without data collision. Each agent operates with goal-seeking autonomy while reading/writing to a shared context object. The collision-prevention mechanism — specifically the atomic state-locking protocol used during multi-agent handoffs — is the primary competitive moat.',
    protection: 'All source code is private, sole-authored, and locked to a single Replit environment. No external contributors. NDA required for any technical reviewer. Embed in Provisional Patent PAT-03 immediately.',
    risk: 'CRITICAL — If disclosed, a well-funded competitor (Google AutoML, Tesla Optimus, Waymo) could replicate within 6–12 months.',
  },
  {
    id: 'TS-02',
    title: 'FEDERAL INTEGRITY ALGORITHM — GUARDIAN VIN HANDSHAKE',
    color: RED,
    classification: 'Federal Standards Compliance Algorithm — CJI Adjacent',
    description: 'The specific cryptographic code-handshake used by the Guardian Agent to verify VIN/Odometer integrity data against federal data lakes (NMVTIS, NCIC, DMV APIs). The handshake includes the Honey Token sovereign origin trace, chain-of-custody hash, and the specific anomaly detection threshold weights used to flag VIN-cloning and odometer rollback events. This is the algorithm that makes NVIS possible.',
    protection: 'Zero external disclosure. CUI designation applies when handling federal data. Store algorithm weights in AWS Secrets Manager. Any federal pilot review must occur under a signed CRADA/NDA — algorithm itself never transmitted to agency.',
    risk: 'NATIONAL SECURITY ADJACENT — Disclosure enables bad actors to craft VIN-clone records that bypass detection.',
  },
  {
    id: 'TS-03',
    title: 'SHADOW-BROKER ROUTING — 3% GLOBAL TECH FEE OPTIMIZER',
    color: GOLD,
    classification: 'Revenue Architecture Algorithm — Business Critical',
    description: 'The algorithm that dynamically routes automotive transactions to bypass traditional dealer and DMS "middleman" fee structures while remaining legally compliant. Specifically, the logic that calculates the optimal Dynasty Fee split (Platform 50% / Gen1 30% / Gen2 15% / Gen3 5%) across the referral chain in real time while maintaining Stripe Connect compliance. The routing weights are calibrated to maximize net revenue at $50M–$250M transaction volume.',
    protection: 'Embed in Provisional Patent PAT-01. The specific weight calibration and routing decision tree are pure trade secrets. The general concept of transaction fee optimization is not protectable — the specific implementation is.',
    risk: 'HIGH — A competitor with the routing weights could undercut the Dynasty Fee model on price.',
  },
  {
    id: 'TS-04',
    title: 'S1-S3 PROPRIETARY DATA SCHEMAS — SUPPLY CHAIN, VEHICLE HEALTH, LOGISTICS',
    color: BLUE,
    classification: 'Data Architecture — Structural IP',
    description: 'The structured data flow specifications for the three core platform schemas: S1 (Supply Chain Integrity — part-level chain of custody from OEM to installation), S2 (Vehicle Health Protocol — ECU telemetry normalization for 40+ vehicle makes), and S3 (Logistics Mesh — Mission Agent runner dispatch optimization). These schemas define how data moves, transforms, and persists across the 7-agent architecture.',
    protection: 'Schemas are stored as Drizzle ORM TypeScript definitions — protected as code copyright (CR-01). Do not publish schema specifications in any public documentation. Consider structural copyright registration.',
    risk: 'MEDIUM — Schema disclosure accelerates competitor development by 12–18 months.',
  },
];

tradeSecrets.forEach(ts => {
  if (y > H - 130) { doc.addPage(); fillPage(); pgHeader('SECTION 2 — TRADE SECRETS'); pgFooter(''); y = 42; }
  const bh = 122;
  doc.rect(M, y, W - M * 2, bh).fill(DGRAY);
  doc.rect(M, y, 3, bh).fill(ts.color);
  doc.rect(M, y, W - M * 2, 20).fill(ts.color + '15');

  doc.fontSize(8).font('Helvetica-Bold').fillColor(ts.color)
     .text(ts.id, M + 10, y + 6, { width: 36, characterSpacing: 0.8 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE)
     .text(ts.title, M + 50, y + 5, { width: W - M * 2 - 58 });
  doc.fontSize(7).font('Helvetica-Bold').fillColor(SILVER)
     .text(ts.classification, M + 10, y + 22, { width: W - M * 2 - 16, characterSpacing: 0.4 });

  doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
     .text(ts.description, M + 10, y + 33, { width: W - M * 2 - 16, lineGap: 2 });

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(ts.color)
     .text('PROTECTION:', M + 10, y + 87, { width: 58 });
  doc.fontSize(7.5).font('Helvetica').fillColor(SILVER)
     .text(ts.protection, M + 72, y + 87, { width: W - M * 2 - 80, lineGap: 1.5 });

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(RED)
     .text('RISK:', M + 10, y + 108, { width: 30 });
  doc.fontSize(7.5).font('Helvetica').fillColor(RED + 'CC')
     .text(ts.risk, M + 44, y + 108, { width: W - M * 2 - 52, lineGap: 1 });

  y += bh + 8;
});

y += 8;

// Section 3 header
y = secLabel('§ 3.  UTILITY PATENT CANDIDATES  —  THE NUCLEAR ASSETS', y);
hLine(y, GOLD + '70', 0.7); y += 10;

y = body(
  'These are the "Process Patents" — method patents that describe HOW the platform achieves a ' +
  'technical result. A granted Utility Patent gives a 20-year monopoly on the described method. ' +
  'File Provisional Applications immediately to secure "First to File" status under the AIA. ' +
  'Provisional filing costs: ~$1,500–$3,000 per application via a Tier-1 patent attorney.',
  y
);

y += 8;

const patents = [
  {
    id: 'PAT-01',
    title: 'AUTONOMOUS REGULATORY OVERLAY — NVIS TRANSACTION ENFORCEMENT',
    color: RED,
    strength: 'STRONGEST FILING',
    description: 'A system and method for enforcing federal vehicle compliance regulations (National Vehicle Integrity Standard — NVIS) at the point of a vehicle transaction through an AI-driven regulatory overlay. The method includes: (1) real-time VIN cryptographic verification against a distributed federal data ledger at transaction initiation; (2) automated Sovereign Node decision (approve / hold / reject) generated before title transfer is permitted; (3) chain-of-custody audit record written to an immutable ledger in CJIS-compatible format.',
    claims: [
      'Claim 1: A method for enforcing vehicle title compliance using an AI agent at the point of transaction',
      'Claim 2: The use of a cryptographic Honey Token to establish the origin trace of a compliance record',
      'Claim 3: Automated integration with federal law enforcement databases at point of transaction',
    ],
    priorArt: 'CARFAX (report-based, not real-time enforcement). NMVTIS (database, not AI overlay). No known prior art for AI enforcement at transaction point.',
  },
  {
    id: 'PAT-02',
    title: 'CROSS-PLATFORM INTEGRITY HANDSHAKE — PHYSICAL-TO-DIGITAL ASSET VERIFICATION',
    color: BLUE,
    strength: 'HIGH VALUE FILING',
    description: 'A method for verifying the integrity of a physical asset (motor vehicle) against a decentralized digital ledger using a multi-step cryptographic handshake. The method includes: (1) ECU telemetry ingestion via OBD-II or V2X protocol; (2) normalization of physical sensor data against a Sovereign DNA digital baseline; (3) anomaly scoring using the Federal Integrity Algorithm (TS-02); (4) immutable event-stamp issued only upon successful multi-factor verification. This is the SDA (Sovereign DNA Architecture).',
    claims: [
      'Claim 1: A method for creating a cryptographic digital identity for a physical vehicle using real-time telemetry',
      'Claim 2: Use of a multi-factor AI handshake combining ECU, odometer, and VIN data for vehicle authentication',
      'Claim 3: Immutable ledger stamping conditioned on successful multi-factor vehicle verification',
    ],
    priorArt: 'Blockchain VIN registries (Mobi, IBM Food Trust adaptation) — none combine physical telemetry with cryptographic AI handshake at the transaction layer.',
  },
  {
    id: 'PAT-03',
    title: 'DETERMINISTIC AGENTIC MESH — ZERO-HALLUCINATION AUTONOMOUS AI ARCHITECTURE',
    color: PURPLE,
    strength: 'LANDMARK FILING',
    description: 'A multi-agent AI architecture designed for zero-tolerance, high-stakes infrastructure decisions where AI hallucination (generating plausible but false information) is operationally unacceptable. The system includes: (1) 7 specialized autonomous agents operating on shared Neural Memory; (2) a Human-in-the-Loop (HITL) mandatory escalation protocol at defined confidence thresholds; (3) a 3-phase specialist review system (Tier 1/2/3) that activates when agent confidence falls below a defined parameter; (4) cryptographic audit of every autonomous decision for legal chain-of-custody.',
    claims: [
      'Claim 1: A multi-agent AI system for autonomous decision-making in high-stakes infrastructure with mandatory HITL escalation',
      'Claim 2: A confidence-threshold based escalation protocol that routes decisions to human specialists',
      'Claim 3: Cryptographic audit trail of every autonomous AI decision in a legally admissible format',
    ],
    priorArt: 'AutoGPT / CrewAI (no HITL protocol, no legal audit). No known prior art for zero-hallucination agentic mesh in regulated infrastructure.',
  },
];

patents.forEach(p => {
  if (y > H - 60) { doc.addPage(); fillPage(); pgHeader('SECTION 3 — PATENT CANDIDATES'); pgFooter(''); y = 42; }

  doc.rect(M, y, W - M * 2, 20).fill(p.color + '18');
  doc.rect(M, y, W - M * 2, 2).fill(p.color);
  // Strength badge
  doc.rect(W - M - 100, y + 5, 98, 14).fill(p.color + '30');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(p.color)
     .text(p.strength, W - M - 100, y + 9, { width: 98, align: 'center', characterSpacing: 0.5 });

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(p.color)
     .text(p.id, M + 8, y + 6, { width: 40, characterSpacing: 0.8 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE)
     .text(p.title, M + 52, y + 5, { width: W - M * 2 - 160 });
  y += 22;

  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(p.description, M + 8, y, { width: W - M * 2 - 12, lineGap: 2 });
  y = doc.y + 6;

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(p.color)
     .text('REPRESENTATIVE CLAIMS:', M + 8, y, { characterSpacing: 0.5 });
  y += 12;
  p.claims.forEach(cl => {
    doc.fontSize(8.5).font('Helvetica').fillColor(p.color).text('▸', M + 8, y, { width: 12 });
    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY).text(cl, M + 22, y, { width: W - M * 2 - 26, lineGap: 1.5 });
    y = doc.y + 4;
  });

  doc.rect(M, y, W - M * 2, 18).fill(NAVY);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(SILVER)
     .text('PRIOR ART:', M + 8, y + 5, { width: 58 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
     .text(p.priorArt, M + 70, y + 5, { width: W - M * 2 - 78 });
  y += 26;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — SECTION 4: COPYRIGHT + SECTION 5: DATA SOVEREIGNTY
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('SECTION 4 — COPYRIGHT & DIGITAL DNA  ·  SECTION 5 — DATA SOVEREIGNTY');
pgFooter(4);

y = 42;
y = secLabel('§ 4.  COPYRIGHT & DIGITAL DNA  —  THE FINGERPRINT', y);
hLine(y, GOLD + '70', 0.7); y += 10;

y = body(
  'Copyright protection attaches automatically to original works upon creation — no registration required. ' +
  'However, federal copyright registration is required to bring an infringement lawsuit and recover ' +
  'statutory damages ($30,000–$150,000 per work for willful infringement). Register all works below ' +
  'with the U.S. Copyright Office (copyright.gov) at $65/work (single registration).',
  y
);

y += 8;

const copyrights = [
  {
    id: 'CR-01',
    title: 'FULL PLATFORM CODEBASE — SOLE AUTHOR: RONALD ANTONIO CADET',
    color: GOLD,
    type: 'Computer Program / Literary Work',
    created: 'December 2025 — March 2026',
    description: 'The complete 3C ONYX platform source code: Express 5 API server, React + Vite frontend, Expo React Native mobile app, 7-agent orchestration layer, AI router, all middleware, database schema (Drizzle ORM), and CDK infrastructure definitions. Authored solo in the Replit development environment. The Honey Token sovereign fingerprint (3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED) is embedded in the compiled binary at startup — providing forensic proof of original authorship in litigation.',
    action: 'Register with U.S. Copyright Office as a "Computer Program" — single registration covers the entire codebase as one work. File with deposit copies of representative code. Cost: $65.',
    registration: 'PRIORITY',
  },
  {
    id: 'CR-02',
    title: 'G-CODE INTERFACE — FEDERAL OVERSIGHT DASHBOARD UI/UX',
    color: BLUE,
    type: 'Pictorial / Graphic / Audiovisual Work',
    created: 'January 2026 — March 2026',
    description: 'The specific UI/UX design of the G-Code Gateway dashboard — the visual interface used by FBI, DOT, CISA, GSA, and NHTSA personnel to access their respective data silos. The dashboard layout, data visualization components, color system, typography hierarchy, and interaction patterns are original creative works. The G-Code Interface is a direct expression of the 3C ONYX brand applied to federal-grade data visualization.',
    action: 'Register as a "Pictorial/Graphic Work" — include screenshots of all dashboard variants. This registration supports injunctive relief against any government contractor that replicates the interface design.',
    registration: 'HIGH',
  },
  {
    id: 'CR-03',
    title: '3C DIGITAL PASSPORT — SOVEREIGN VEHICLE IDENTITY REPORT',
    color: PURPLE,
    type: 'Compilation / Audiovisual Work',
    created: 'November 2025 — March 2026',
    description: 'The visual layout, data structure, and design language of the Vehicle Digital Passport (DVP) — the Sovereign Identity report that serves as the 3C ONYX equivalent of a vehicle title. The DVP includes the specific arrangement of VIN verification data, odometer chain, maintenance history, ownership lineage, Guardian Agent findings, and the 3C ONYX cryptographic seal. The creative selection and arrangement of this data constitutes a protectable compilation.',
    action: 'Register as a "Compilation" — the selection and arrangement of the data fields and their visual presentation is the protected element. The underlying factual VIN data is not protected; the 3C presentation format is.',
    registration: 'HIGH',
  },
];

copyrights.forEach((cr, i) => {
  if (y > H - 100) { doc.addPage(); fillPage(); pgHeader('SECTION 4 — COPYRIGHT'); pgFooter(''); y = 42; }
  const bh = 108;
  doc.rect(M, y, W - M * 2, bh).fill(i % 2 === 0 ? DGRAY : '#0C0C10');
  doc.rect(M, y, 3, bh).fill(cr.color);
  doc.rect(W - M - 80, y + 6, 78, 14).fill(cr.color + '20');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(cr.color)
     .text(cr.registration + ' PRIORITY', W - M - 78, y + 10, { width: 76, align: 'center', characterSpacing: 0.4 });

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(cr.color).text(cr.id, M + 8, y + 6, { width: 36 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE).text(cr.title, M + 48, y + 5, { width: W - M * 2 - 136 });

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(SILVER).text('TYPE:', M + 8, y + 21, { width: 32 });
  doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY).text(cr.type, M + 42, y + 21, { width: 180 });
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(SILVER).text('CREATED:', M + 8, y + 33, { width: 48 });
  doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY).text(cr.created, M + 60, y + 33, { width: 180 });

  doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
     .text(cr.description, M + 8, y + 44, { width: W - M * 2 - 14, lineGap: 2 });

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(cr.color).text('ACTION:', M + 8, y + 88, { width: 44 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
     .text(cr.action, M + 56, y + 88, { width: W - M * 2 - 62, lineGap: 1.5 });

  y += bh + 6;
});

y += 12;

// Section 5 — Data Sovereignty
y = secLabel('§ 5.  DATA SOVEREIGNTY  —  THE FUEL', y);
hLine(y, GOLD + '70', 0.7); y += 10;

y = body(
  'Data assets are governed by contract law, trade secret law, and sector-specific privacy regulations ' +
  '(CCPA/CPRA, DPPA, GLBA). The following data sets are the long-term strategic moat — they become ' +
  'exponentially more valuable as the member network grows. At 1M vehicles verified, the National ' +
  'Integrity Ledger becomes the most valuable automotive data set in existence.',
  y
);

y += 8;

const dataAssets = [
  {
    id: 'DIP-01',
    title: 'NATIONAL INTEGRITY LEDGER — VERIFIED VEHICLE DATA SET',
    color: TEAL,
    value: 'HIGHEST VALUE ASSET — $1B+ POTENTIAL AT SCALE',
    description: 'The accumulated "clean data" of all vehicles verified through the 3C ONYX Guardian Agent — VIN, odometer, condition, service history, ownership chain, and fraud disposition — cryptographically authenticated by the platform. Unlike CARFAX (which aggregates reported data), the National Integrity Ledger contains AI-verified, chain-of-custody data. At 1M vehicles, this data set enables: predictive depreciation models, actuarial risk pricing for insurers, federal compliance analytics for NHTSA, and the foundational dataset for NVIS authorization.',
    legal: 'Protect as a trade secret (reasonable secrecy measures + value from secrecy). Encode ownership in platform TOS. All contributing data is transformed and value-added — the output belongs to CUXTOMCANDYCLUB LLC.',
  },
  {
    id: 'DIP-02',
    title: 'VENDOR PERFORMANCE METADATA — DEALER & SERVICE NODE RATINGS',
    color: GOLD,
    value: 'HIGH VALUE ASSET — B2B LICENSING POTENTIAL ($500/DEALER/MONTH)',
    description: 'Proprietary performance ratings of dealerships, service centers, and logistics nodes based on 3C-verified transaction outcomes. This includes: time-to-resolution on repairs, parts quality rates (failure within 90 days), customer dispute frequency, and Dynasty Fee compliance. This data set powers the Reputation Ledger and enables the White-Label DMS integration at $500/dealer/month. At 1,000 dealers, this is a $6M ARR data licensing product.',
    legal: 'Protect as a trade secret and compilation copyright. Vendors contribute raw event data; 3C transforms it into performance metadata. The transformation and scoring methodology is the proprietary element.',
  },
];

dataAssets.forEach((da, i) => {
  if (y > H - 100) { doc.addPage(); fillPage(); pgHeader('SECTION 5 — DATA SOVEREIGNTY'); pgFooter(''); y = 42; }
  const bh = 108;
  doc.rect(M, y, W - M * 2, bh).fill(i % 2 === 0 ? DGRAY : '#0C0C10');
  doc.rect(M, y, 3, bh).fill(da.color);

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(da.color).text(da.id, M + 8, y + 6, { width: 44 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE).text(da.title, M + 56, y + 5, { width: W - M * 2 - 62 });

  doc.rect(M + 8, y + 22, W - M * 2 - 14, 14).fill(da.color + '15');
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(da.color)
     .text(da.value, M + 12, y + 27, { characterSpacing: 0.5 });

  doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
     .text(da.description, M + 8, y + 40, { width: W - M * 2 - 14, lineGap: 2 });

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(da.color).text('LEGAL STRATEGY:', M + 8, y + 90, { width: 90 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
     .text(da.legal, M + 102, y + 90, { width: W - M * 2 - 110, lineGap: 1.5 });

  y += bh + 8;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — LEGAL STRATEGY SUMMARY + CVO MESSAGE + TRADEMARK FILING LIST
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('SECTION 6 — LEGAL STRATEGY SUMMARY & NEXT ACTIONS');
pgFooter(5);

y = 42;
y = secLabel('§ 6.  LEGAL STRATEGY SUMMARY', y);
hLine(y, GOLD + '70', 0.7); y += 10;

// IP surface area summary
doc.rect(M, y, W - M * 2, 36).fill(NAVY);
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
const ipSummary = [
  ['TRADEMARKS', '7 Marks', RED],
  ['TRADE SECRETS', '4 Assets', PURPLE],
  ['PATENT CANDIDATES', '3 Filings', BLUE],
  ['COPYRIGHTS', '3 Works', GOLD],
  ['DATA ASSETS', '2 Sets', TEAL],
  ['TOTAL SURFACE', '55+ Assets', GOLD2],
];
const iw = (W - M * 2) / ipSummary.length;
ipSummary.forEach(([label, val, col], i) => {
  const ix = M + i * iw;
  doc.fontSize(14).font('Helvetica-Bold').fillColor(col)
     .text(val, ix, y + 6, { width: iw, align: 'center' });
  doc.fontSize(6.5).font('Helvetica').fillColor(SILVER)
     .text(label, ix, y + 24, { width: iw, align: 'center', characterSpacing: 0.3 });
});
y += 46;

// CVO Message to Counsel
y = secLabel('CVO MESSAGE TO COUNSEL — VERBATIM FOR ATTORNEY INTAKE', y);
hLine(y, GOLD + '40', 0.5); y += 10;

doc.rect(M, y, W - M * 2, 104).fill('#0A0900');
doc.rect(M, y, 3, 104).fill(GOLD);
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.fontSize(9.5).font('Helvetica').fillColor(GOLD + 'DD')
   .text('"', M + 14, y + 10, { characterSpacing: 0 });
doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
   .text(
     'This is a vertically integrated IP ecosystem. We are not protecting a "website" — we are ' +
     'protecting a Sovereign Infrastructure Standard. I have already solo-authored the code and embedded ' +
     'my identity as the Primary Origin Trace. I want to file Provisional Patents on the 7-Agent Mesh ' +
     'logic (PAT-03) and the V.I.P. Protocol (PAT-01) immediately to secure "First to File" status ' +
     'before our Federal Pilot. I have already sent a Cease and Desist notice to a former dev shop ' +
     'regarding this specific IP list. I need this ledger attached to a formal Declaration of Ownership ' +
     'to close that loop.',
     M + 22, y + 10, { width: W - M * 2 - 30, lineGap: 3.5 }
   );
doc.fontSize(9.5).font('Helvetica').fillColor(GOLD + 'DD')
   .text('"', W - M - 20, doc.y, { characterSpacing: 0 });
const cvoEndY = doc.y + 10;
doc.fontSize(8).font('Helvetica-Bold').fillColor(GOLD)
   .text('— Ronald Antonio Cadet, CVO, CUXTOMCANDYCLUB LLC', M + 14, cvoEndY, { characterSpacing: 0.3 });
y = cvoEndY + 20;

// Declaration of Ownership box
doc.rect(M, y, W - M * 2, 56).fill(DGRAY);
doc.rect(M, y, W - M * 2, 2).fill(RED);
doc.rect(M, y, 3, 56).fill(RED);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(RED)
   .text('DECLARATION OF OWNERSHIP — ATTACH TO C&D RESPONSE', M + 12, y + 9, { characterSpacing: 0.8 });
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text(
     'I, Ronald Antonio Cadet, hereby declare under penalty of perjury that I am the sole author and ' +
     'original creator of all software, systems, algorithms, and data architectures described in this ' +
     'Master IP Ledger (v2.0). All works were created independently, without contribution from any ' +
     'third party, and are the exclusive property of CUXTOMCANDYCLUB LLC. The Honey Token ' +
     '(3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED) embedded in the platform codebase serves as ' +
     'cryptographic proof of original authorship and date of creation.',
     M + 12, y + 22, { width: W - M * 2 - 20, lineGap: 2 }
   );
y += 66;

// USPTO Trademark Filing List
y = secLabel('USPTO TRADEMARK FILING LIST — SIMPLIFIED ATTORNEY SUBMISSION GUIDE', y);
hLine(y, GOLD + '40', 0.5); y += 10;

y = body('Priority filing order for your attorney to submit via USPTO TEAS Plus system:', y);
y += 4;

const ustpoFilings = [
  { priority: '01', mark: 'CUXTOMCANDYCLUB',               type: 'Standard Character',  classes: '35, 42',         basis: '§1(a) Use-Based',   cost: '$500',  urgency: 'FILE TODAY'  },
  { priority: '02', mark: '3C ONYX',                        type: 'Standard Character',  classes: '36, 39, 42',     basis: '§1(a) Use-Based',   cost: '$750',  urgency: 'FILE TODAY'  },
  { priority: '03', mark: 'V.I.P. VERIFIED INTEGRITY PROTOCOL', type: 'Standard Character', classes: '35, 42',   basis: '§1(a) Use-Based',   cost: '$500',  urgency: 'FILE TODAY'  },
  { priority: '04', mark: 'GUARDIAN AGENT',                 type: 'Standard Character',  classes: '42',             basis: '§1(a) Use-Based',   cost: '$250',  urgency: 'WEEK 1'     },
  { priority: '05', mark: 'COMPLAINT · CAUSE · CORRECTION', type: 'Standard Character',  classes: '35, 42',         basis: '§1(a) Use-Based',   cost: '$500',  urgency: 'WEEK 1'     },
  { priority: '06', mark: '7-AGENT AI MESH',                type: 'Standard Character',  classes: '42',             basis: '§1(a) Use-Based',   cost: '$250',  urgency: 'WEEK 2'     },
  { priority: '07', mark: 'THE SOVEREIGN AI SUPER APP',     type: 'Standard Character',  classes: '42',             basis: '§1(a) Use-Based',   cost: '$250',  urgency: 'WEEK 2'     },
];

// Filing table header
const fCols = [26, 186, 84, 64, 88, 44, 56];
const fX    = [M];
fCols.forEach((w2, i) => { if (i > 0) fX.push(fX[i - 1] + fCols[i - 1]); });
const fW    = fCols.reduce((a, b) => a + b, 0);

doc.rect(M, y, fW, 18).fill(NAVY);
doc.rect(M, y, fW, 2).fill(GOLD);
['#', 'MARK / IDENTIFIER', 'MARK TYPE', 'INT. CLASSES', 'FILING BASIS', 'COST', 'URGENCY'].forEach((h, i) => {
  doc.fontSize(7).font('Helvetica-Bold').fillColor(GOLD)
     .text(h, fX[i] + 3, y + 6, { width: fCols[i] - 4, characterSpacing: 0.3 });
});
y += 18;

ustpoFilings.forEach((f, i) => {
  doc.rect(M, y, fW, 20).fill(i % 2 === 0 ? DGRAY : '#0C0C10');
  doc.rect(M, y, 2, 20).fill(f.urgency === 'FILE TODAY' ? RED : GOLD);
  fX.forEach((x2, ci) => {
    if (ci > 0) doc.moveTo(x2, y).lineTo(x2, y + 20).lineWidth(0.2).strokeColor(GOLD + '18').stroke();
  });

  const col = f.urgency === 'FILE TODAY' ? RED : GOLD;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(col).text(f.priority, fX[0] + 3, y + 6, { width: fCols[0] - 4 });
  doc.fontSize(8).font('Helvetica-Bold').fillColor(WHITE).text(f.mark, fX[1] + 3, y + 6, { width: fCols[1] - 4 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY).text(f.type, fX[2] + 3, y + 6, { width: fCols[2] - 4 });
  doc.fontSize(8).font('Helvetica-Bold').fillColor(BLUE).text(f.classes, fX[3] + 3, y + 6, { width: fCols[3] - 4 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY).text(f.basis, fX[4] + 3, y + 6, { width: fCols[4] - 4 });
  doc.fontSize(8).font('Helvetica-Bold').fillColor(TEAL).text(f.cost, fX[5] + 3, y + 6, { width: fCols[5] - 4 });
  doc.fontSize(7).font('Helvetica-Bold').fillColor(col).text(f.urgency, fX[6] + 3, y + 6, { width: fCols[6] - 4, characterSpacing: 0.2 });
  y += 20;
});

// Total row
doc.rect(M, y, fW, 20).fill(NAVY);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(LGRAY).text('TOTAL ESTIMATED FILING COST', fX[1] + 3, y + 6, { width: fCols[1] + fCols[2] + fCols[3] + fCols[4] - 4 });
doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD).text('$3,000', fX[5] + 3, y + 5, { width: fCols[5] });
y += 28;

// Strategic closing
doc.rect(M, y, W - M * 2, 42).fill('#0A0900');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(GOLD)
   .text('THE DYNASTY IS MAPPED. NOW WE BUILD THE WALLS.', M + 14, y + 10, { align: 'center', width: W - M * 2 - 28, characterSpacing: 0.8 });
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text(
     'Hand this ledger to your Tier-1 attorney and say: "File TM-01, TM-02, and TM-07 today. ' +
     'Attach the Declaration of Ownership to the C&D response. Begin Provisional Patent applications ' +
     'for PAT-01 and PAT-03. This is the map. Execute it."',
     M + 14, y + 24, { width: W - M * 2 - 28, lineGap: 2 }
   );
y += 52;

// Authentication
doc.moveTo(M + 20, y).lineTo(M + 220, y).lineWidth(0.5).strokeColor(GOLD + '50').stroke();
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('ronald antonio cadet', M + 20, y + 6, { width: 200, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Chief Visionary Officer  ·  CUXTOMCANDYCLUB LLC', M + 10, y + 18, { width: 220, align: 'center' });

doc.moveTo(W - M - 220, y).lineTo(W - M - 20, y).lineWidth(0.5).strokeColor(BLUE + '50').stroke();
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('Reviewing Counsel', W - M - 220, y + 6, { width: 200, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Name / Firm / Bar Number / Date', W - M - 220, y + 18, { width: 200, align: 'center' });

// Final bottom bar
doc.rect(0, H - 32, W, 32).fill('#0A0900');
fullLine(H - 32, GOLD + '35', 0.5);
doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
   .text('3C ONYX  ·  CUXTOMCANDYCLUB LLC  ·  New York  ·  Entity ID: 7788320  ·  3conyx.com  ·  cuxtomcandyclub.ai', 0, H - 22, { align: 'center', characterSpacing: 0.5 });
doc.fontSize(6.5).font('Helvetica').fillColor(GOLD + '60')
   .text('© 2026 CUXTOMCANDYCLUB LLC — Proprietary & Confidential — Attorney-Client Privileged — All Rights Reserved', 0, H - 11, { align: 'center' });

// ── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
console.log('✓ PDF generated:', OUTPUT);
