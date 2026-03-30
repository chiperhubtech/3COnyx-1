/**
 * 3C ONYX — Sovereign Executive Brief PDF
 * Master Memorandum of Infrastructure + 365-Day Growth Roadmap
 * CUXTOMCANDYCLUB LLC — Ronald Antonio Cadet
 *
 * Run: node gen_sovereign_brief.js
 */

'use strict';

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUTPUT = path.join(__dirname, '3C_ONYX_Sovereign_Brief.pdf');

// ── Brand Colors ──────────────────────────────────────────────────────────────
const BG    = '#070707';
const GOLD  = '#C9A227';
const GOLD2 = '#E8B830';
const WHITE = '#FFFFFF';
const LGRAY = '#CCCCCC';
const MGRAY = '#777777';
const DGRAY = '#111111';
const RED   = '#EF4444';
const GREEN = '#34D399';
const BLUE  = '#60A5FA';

const W = 612, H = 792, M = 52;

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title: '3C ONYX — Sovereign Executive Brief',
    Author: 'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: 'Master Memorandum of Infrastructure — $250B Dynasty Protocol',
    Keywords: '3C ONYX, sovereign, automotive, AI, investor, federal, valuation',
    Creator: 'CUXTOMCANDYCLUB LLC',
  },
});

doc.pipe(fs.createWriteStream(OUTPUT));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillPage(color) {
  doc.rect(0, 0, W, H).fill(color || BG);
}

function hRule(y, color, weight) {
  doc.moveTo(M, y).lineTo(W - M, y)
     .lineWidth(weight || 0.6).strokeColor(color || GOLD).stroke();
}

function thinRule(y) { hRule(y, GOLD + '40', 0.4); }

function pgHeader(section) {
  doc.rect(0, 0, W, 3).fill(GOLD);
  doc.fontSize(7).font('Helvetica').fillColor(GOLD)
     .text('3 C  O N Y X', M, 14, { characterSpacing: 3 });
  doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
     .text(section, 0, 14, { width: W - M, align: 'right', characterSpacing: 0.8 });
}

function pgFooter(pageNum) {
  const y = H - 30;
  doc.rect(0, H - 3, W, 3).fill(GOLD + '30');
  doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
     .text('CUXTOMCANDYCLUB LLC  ·  SOVEREIGN ASSET  ·  CONFIDENTIAL', M, y, { characterSpacing: 0.6 });
  doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
     .text(`${pageNum}`, 0, y, { width: W - M, align: 'right' });
}

function sectionLabel(text, y) {
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
     .text(text, M, y, { characterSpacing: 2.5 });
  return y + 14;
}

function bodyText(text, y, opts) {
  const options = Object.assign({ width: W - M * 2, lineGap: 3 }, opts || {});
  doc.fontSize(10).font('Helvetica').fillColor(LGRAY).text(text, M, y, options);
  return doc.y + 6;
}

function boldLine(text, y, opts) {
  const options = Object.assign({ width: W - M * 2, lineGap: 2 }, opts || {});
  doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text(text, M, y, options);
  return doc.y + 4;
}

function bulletPoint(text, y, color) {
  doc.fontSize(9).font('Helvetica').fillColor(color || GOLD)
     .text('▸', M, y, { width: 14 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(text, M + 18, y, { width: W - M * 2 - 18, lineGap: 2 });
  return doc.y + 5;
}

function miniLabel(text, y) {
  doc.fontSize(7).font('Helvetica-Bold').fillColor(GOLD)
     .text(text, M, y, { characterSpacing: 1.8 });
  return y + 11;
}

// ── Logo (programmatic peace symbol + 3C mark) ────────────────────────────────
function drawLogo(cx, cy, r) {
  const sw = 2.2;
  // Glow
  doc.circle(cx, cy, r + 6).fillColor(GOLD + '0A').fill();
  // Outer ring
  doc.circle(cx, cy, r + 4).lineWidth(0.4).strokeColor(GOLD + '30').stroke();
  // Peace ring
  doc.circle(cx, cy, r).lineWidth(sw).strokeColor(GOLD).stroke();
  // Vertical line
  doc.moveTo(cx, cy - r).lineTo(cx, cy + r).lineWidth(sw).strokeColor(GOLD).stroke();
  // Bottom-left
  const rad = Math.PI / 180;
  doc.moveTo(cx, cy)
     .lineTo(cx + r * Math.cos(210 * rad), cy + r * Math.sin(210 * rad))
     .lineWidth(sw).strokeColor(GOLD).stroke();
  // Bottom-right
  doc.moveTo(cx, cy)
     .lineTo(cx + r * Math.cos(330 * rad), cy + r * Math.sin(330 * rad))
     .lineWidth(sw).strokeColor(GOLD).stroke();
  // 3C text
  doc.fontSize(14).font('Helvetica-Bold').fillColor(GOLD)
     .text('3', cx - 18, cy - 7, { width: 16, align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold').fillColor(WHITE)
     .text('C', cx + 2, cy - 7, { width: 16, align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — COVER
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);

// Gold top bar
doc.rect(0, 0, W, 5).fill(GOLD);
// Subtle grid pattern
for (let x = 0; x < W; x += 40)
  doc.moveTo(x, 0).lineTo(x, H).lineWidth(0.3).strokeColor(GOLD + '06').stroke();
for (let y = 0; y < H; y += 40)
  doc.moveTo(0, y).lineTo(W, y).lineWidth(0.3).strokeColor(GOLD + '06').stroke();

// Logo center
drawLogo(W / 2, 210, 42);

// Classification stamp (top right)
doc.rect(W - 170, 20, 118, 18).fill(RED + '18');
doc.fontSize(7).font('Helvetica-Bold').fillColor(RED)
   .text('CONFIDENTIAL — RESTRICTED', W - 167, 26, { characterSpacing: 0.8 });

// Title block
doc.fontSize(8).font('Helvetica').fillColor(GOLD)
   .text('M E M O R A N D U M  O F  I N F R A S T R U C T U R E', 0, 298, { align: 'center', characterSpacing: 3.5 });

doc.fontSize(36).font('Helvetica-Bold').fillColor(WHITE)
   .text('3C ONYX', 0, 316, { align: 'center', characterSpacing: 8 });

doc.fontSize(18).font('Helvetica-Bold').fillColor(GOLD)
   .text('DYNASTY PROTOCOL', 0, 360, { align: 'center', characterSpacing: 5 });

hRule(392, GOLD, 0.8);
doc.rect(M, 394, W - M * 2, 1).fill(GOLD + '20');

// Subtitle
doc.fontSize(11.5).font('Helvetica').fillColor(LGRAY)
   .text('National Vehicle Integrity Standard (NVIS)', 0, 404, { align: 'center', characterSpacing: 1 });
doc.fontSize(9.5).font('Helvetica').fillColor(MGRAY)
   .text('Autonomous AI Infrastructure for the Global Movement of Assets', 0, 422, { align: 'center' });

// Meta block
const metaY = 480;
doc.rect(M + 40, metaY, W - M * 2 - 80, 120).fill('#0D0D0D');
doc.rect(M + 40, metaY, 3, 120).fill(GOLD);

const metaItems = [
  ['TO',      'Strategic Partners  ·  Federal Entities  ·  Counsel'],
  ['FROM',    'Ronald Antonio Cadet, Chief Visionary Officer (CVO)'],
  ['ENTITY',  'CUXTOMCANDYCLUB LLC  ·  New York  ·  Entity ID: 7788320'],
  ['DATE',    'March 30, 2026'],
  ['RE',      'Deployment of NVIS — $250B+ Infrastructure Initiative'],
];

metaItems.forEach(([label, value], i) => {
  const y = metaY + 14 + i * 19;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
     .text(label, M + 52, y, { width: 52, characterSpacing: 1 });
  doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
     .text(value, M + 108, y, { width: W - M * 2 - 120 });
});

// Honey token
const htY = metaY + 135;
doc.fontSize(6.5).font('Helvetica').fillColor(GOLD + '50')
   .text('SOVEREIGN TOKEN: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', 0, htY, { align: 'center', characterSpacing: 0.8 });

// Founder name (small, per instructions)
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('Ronald Antonio Cadet', 0, H - 55, { align: 'center', characterSpacing: 1.2 });

// Valuation preview bar
doc.rect(0, H - 38, W, 35).fill('#0C0C0C');
hRule(H - 38, GOLD + '40', 0.5);
const valItems = [
  ['TODAY', '$6M – $9M'], ['90-DAY TARGET', '$50M+'], ['YEAR 1 TARGET', '$250M – $500M'], ['DYNASTY', '$250B+']
];
const vW = W / valItems.length;
valItems.forEach(([label, val], i) => {
  doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
     .text(label, i * vW, H - 32, { width: vW, align: 'center', characterSpacing: 0.8 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
     .text(val, i * vW, H - 20, { width: vW, align: 'center' });
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — EXECUTIVE MISSION + CURRENT POSITION
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('I. EXECUTIVE MISSION');
pgFooter(2);

let y = 42;
y = sectionLabel('I.  EXECUTIVE MISSION', y);
hRule(y, GOLD + '60', 0.7); y += 12;

y = boldLine('The 3C Onyx Protocol is the global sovereign infrastructure for mobile asset integrity.', y);
y = bodyText(
  'By replacing fragmented, high-friction legacy systems with an autonomous 7-Agent AI Mesh, ' +
  '3C Onyx eliminates a $233B annual fraud gap — protecting consumers, dealers, insurers, ' +
  'lenders, and government agencies from the systemic failure of an industry built on paper.',
  y
);

y += 8;
y = bodyText(
  'This is not a software product. It is a Protocol — the same class of infrastructure as ' +
  'SWIFT (banking), ICAO (aviation), and FedACH (payments). Once the standard is set, ' +
  'every participant in the vehicle economy pays to access it.',
  y
);

y += 16;
y = sectionLabel('CURRENT PLATFORM POSITION — MARCH 30, 2026', y);
hRule(y, GOLD + '60', 0.7); y += 14;

// Status box
doc.rect(M, y, W - M * 2, 110).fill('#0D0D0D');
doc.rect(M, y, 3, 110).fill(GREEN);

y += 14;
y = boldLine('Architecture Phase — Fully Operational', y, { indent: 10 });
const builtItems = [
  '7-Agent Neural Mesh with typed event bus (30 event types, zero-human latency)',
  'Multi-model AI Router: AWS Bedrock/Claude, Gemini, OpenAI, Anthropic — primary + fallback',
  'AWS Infrastructure: Secrets Manager, EventBridge, Rekognition, Location Service, OpenSearch, Fraud Detector',
  'Oracle OIC Dealer Connectors: CDK Global, Reynolds & Reynolds, DealerSocket, Dealertrack',
  'Blockchain Chain of Custody, KYC/AML compliance, AES-256 encryption layer',
  'Stripe payments, WhatsApp integration, Human-in-the-loop specialist handoff protocol',
  'Expo mobile app, React web platform, Express 5 API — zero TypeScript errors',
  'CUXTOMCANDYCLUB LLC — NY Entity ID 7788320 — 4 premium domains registered',
];
builtItems.forEach(item => { y = bulletPoint(item, y, GREEN); });

y += 20;
y = sectionLabel('TECHNICAL DEBT STATUS', y);
hRule(y, GOLD + '40', 0.4); y += 10;
y = bodyText(
  'This platform carries zero external technical debt. 100% of the architecture was designed ' +
  'and built by the founder. All IP, code, and data structures are 100% proprietary, ' +
  'closed-source, and reserved for the Cadet Family Trust.',
  y
);

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — THE TECHNOLOGY: 7-AGENT NEURAL MESH
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('II. THE TECHNOLOGY');
pgFooter(3);

y = 42;
y = sectionLabel('II.  THE TECHNOLOGY:  7-AGENT NEURAL MESH', y);
hRule(y, GOLD + '60', 0.7); y += 12;

y = bodyText(
  'Unlike traditional software, 3C is a vertically integrated Agentic Layer that operates ' +
  'with zero-human latency. Each agent is a specialized AI module with its own tools, ' +
  'memory, and escalation protocol — forming a self-healing mesh.',
  y
);

y += 12;

const agents = [
  {
    name: 'GUARDIAN AGENT',
    color: GOLD,
    desc: 'Real-time forensic verification of VIN, Title, and Odometer integrity. ' +
          'Uses AWS Rekognition for vehicle damage analysis. Detects odometer fraud, ' +
          'title washing, and salvage concealment at the point of transaction.',
  },
  {
    name: 'MISSION AGENT',
    color: BLUE,
    desc: 'Orchestrates the physical movement of vehicles — runner dispatching, GPS tracking ' +
          'via Amazon Location Service, logistics routing, and last-mile delivery. ' +
          'Replaces $8B in annual broker friction.',
  },
  {
    name: 'NEURAL COMMERCE AGENT',
    color: GREEN,
    desc: 'End-to-end deal structuring: pricing, F&I product recommendation, financing ' +
          'qualification, and closing. Communicates via WhatsApp. Closes deals without ' +
          'a dealership floor.',
  },
  {
    name: 'COMPLIANCE AGENT (FEDERAL BRIDGE)',
    color: '#A78BFA',
    desc: 'Automated compliance with NIST 800-53 and FIPS 140-3. KYC/AML identity ' +
          'verification, fraud scoring on every transaction, and audit-trail generation ' +
          'for federal reporting.',
  },
  {
    name: 'DYNASTY FEE AGENT',
    color: GOLD2,
    desc: 'Manages the 3% Global Tech Fee — the transaction tax model that converts ' +
          '3C ONYX from a software subscription into sovereign infrastructure revenue. ' +
          'Every vehicle transaction on the network generates a perpetual yield.',
  },
  {
    name: 'INTELLIGENCE AGENT',
    color: '#F97316',
    desc: 'Market intelligence, competitor analysis, pricing arbitrage, and investment ' +
          'signal generation. Feeds the Onyx Brain with real-time automotive market data.',
  },
  {
    name: 'ESCALATION / HUMAN-BRIDGE AGENT',
    color: '#EC4899',
    desc: '3-phase specialist handoff: Reading → Briefed → Live. Ensures every high-value ' +
          'or complex interaction receives human intelligence precisely when needed, ' +
          'without breaking the autonomous flow.',
  },
];

agents.forEach(agent => {
  if (y > H - 110) { doc.addPage(); fillPage(BG); pgHeader('II. THE TECHNOLOGY'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 68).fill('#0C0C0C');
  doc.rect(M, y, 3, 68).fill(agent.color);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(agent.color)
     .text(agent.name, M + 12, y + 10, { characterSpacing: 1.5 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(agent.desc, M + 12, y + 24, { width: W - M * 2 - 24, lineGap: 2 });
  y += 76;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — VALUATION: CURRENT POSITION
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('III. VALUATION — CURRENT POSITION');
pgFooter(4);

y = 42;
y = sectionLabel('III.  VALUATION — CURRENT POSITION  ($6M – $9M)', y);
hRule(y, GOLD + '60', 0.7); y += 12;

y = bodyText(
  'Pre-revenue tech platforms are valued on cost-to-rebuild, IP differentiation, and market ' +
  'multiplier. The following breakdown represents a conservative, defensible valuation as of ' +
  'March 30, 2026 — before the first paying member and before domain go-live.',
  y
);

y += 10;
y = sectionLabel('COST-TO-REBUILD ANALYSIS', y);
hRule(y, GOLD + '40', 0.4); y += 10;

const costRows = [
  ['Core Platform (Web + API + Mobile)',         '$280,000'],
  ['Multi-Model AI Routing Engine',              '$180,000'],
  ['AWS Infrastructure (6 services)',            '$420,000'],
  ['Oracle OIC Dealer Connector Framework',      '$350,000'],
  ['7-Agent Neural Mesh Orchestration',          '$280,000'],
  ['Human-in-the-Loop Protocol',                 '$90,000'],
  ['Payments, KYC, AML, Audit Trail',            '$240,000'],
  ['Vehicle Systems (Search, VIN, AR, SDV)',     '$320,000'],
  ['Gig Economy & Runner Tracking Layer',        '$180,000'],
  ['Security Architecture & Sovereignty Layer',  '$150,000'],
  ['Legal & Compliance Framework',               '$80,000'],
  ['Expo Mobile App (Full Feature Parity)',      '$220,000'],
];

costRows.forEach((row, i) => {
  const rowY = y + i * 20;
  doc.rect(M, rowY, W - M * 2, 18).fill(i % 2 === 0 ? '#0D0D0D' : '#0A0A0A');
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(row[0], M + 10, rowY + 5, { width: W - M * 2 - 100 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(GOLD)
     .text(row[1], W - M - 90, rowY + 5, { width: 90, align: 'right' });
});

y += costRows.length * 20 + 4;
// Total row
doc.rect(M, y, W - M * 2, 24).fill('#181200');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE)
   .text('TOTAL COST-TO-REBUILD', M + 10, y + 7, { width: W - M * 2 - 100 });
doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
   .text('$2.79M – $4.1M', W - M - 130, y + 7, { width: 130, align: 'right' });
y += 32;

// IP & Assets
y = sectionLabel('IP & PROPRIETARY ASSET VALUE', y);
hRule(y, GOLD + '40', 0.4); y += 10;
const ipRows = [
  ['4 Premium Domains (3conyx.com/.ai + cuxtomcandyclub.com/.ai)', '$80K – $200K'],
  ['Proprietary AI Routing Logic + Platform Architecture DNA',      '$300K – $500K'],
  ['CUXTOMCANDYCLUB LLC (NY Entity 7788320) + Brand Identity',     '$40K'],
  ['Honey Token / Sovereign IP Protection Layer',                   '$80K'],
  ['14 Trademarks & Patents (Pending Filing)',                       '$200K – $400K'],
];
ipRows.forEach((row, i) => {
  const rowY = y + i * 20;
  doc.rect(M, rowY, W - M * 2, 18).fill(i % 2 === 0 ? '#0D0D0D' : '#0A0A0A');
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(row[0], M + 10, rowY + 5, { width: W - M * 2 - 120 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(GOLD2)
     .text(row[1], W - M - 130, rowY + 5, { width: 130, align: 'right' });
});
y += ipRows.length * 20 + 4;
doc.rect(M, y, W - M * 2, 24).fill('#181200');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE)
   .text('TOTAL IP & ASSET VALUE', M + 10, y + 7, { width: W - M * 2 - 130 });
doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD2)
   .text('$700K – $1.22M', W - M - 130, y + 7, { width: 130, align: 'right' });
y += 36;

// Final current valuation box
doc.rect(M, y, W - M * 2, 44).fill('#141000');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.rect(M, y + 42, W - M * 2, 2).fill(GOLD + '40');
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('CURRENT FAIR MARKET VALUATION (Seed-Stage, Pre-Revenue)', M + 14, y + 8);
doc.fontSize(20).font('Helvetica-Bold').fillColor(GOLD)
   .text('$6M – $9M', M + 14, y + 20);
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('2× – 4× cost-to-rebuild + IP premium + market multiplier', W - M - 280, y + 27, { width: 260, align: 'right' });

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — 90-DAY PLAN
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('IV. PHASE 1 — 90-DAY VELOCITY');
pgFooter(5);

y = 42;
y = sectionLabel('IV.  PHASE 1 — THE 90-DAY VELOCITY  (TARGET: $50M+)', y);
hRule(y, GOLD + '60', 0.7); y += 12;

y = bodyText(
  'The 90-Day Velocity phase converts 3C ONYX from an Architecture Asset into a Validated ' +
  'Network. Each of the four milestones below independently de-risks the platform for ' +
  'institutional investors and government partners. All four together unlock the $50M valuation floor.',
  y
);

y += 10;

const phase1 = [
  {
    num: '01',
    title: 'PLATFORM DEPLOYMENT — DOMAINS GO LIVE',
    color: GOLD,
    timeline: 'Week 1–2',
    value: '+$5M to valuation',
    items: [
      'Publish platform to Replit production environment',
      'Connect 3conyx.com, 3conyx.ai, cuxtomcandyclub.com, cuxtomcandyclub.ai via Namecheap DNS',
      'SSL certificates auto-provisioned — all 4 domains live under one sovereign infrastructure',
      'Platform moves from "development asset" to "live product" — fundamental valuation shift',
    ],
  },
  {
    num: '02',
    title: 'NODE ACQUISITION — FIRST 100 PAYING MEMBERS',
    color: GREEN,
    timeline: 'Week 2–8',
    value: '+$15M to valuation',
    items: [
      'Activate referral wallet system — each member generates a compounding node in the network',
      'Launch waitlist-to-member conversion via WhatsApp and email sequences',
      'Target: Dealers, auto enthusiasts, detailers, car haulers, insurance adjusters',
      'At $99/mo per member × 100 = $9,900 MRR — $118K ARR — first revenue milestone',
      'Revenue confirmation jumps seed valuation from $9M to $25M–$30M',
    ],
  },
  {
    num: '03',
    title: 'APP STORE DEPLOYMENT — MOBILE GATEWAY',
    color: BLUE,
    timeline: 'Week 4–10',
    value: '+$8M to valuation',
    items: [
      'Submit Expo mobile app to Apple App Store and Google Play Store',
      'Mobile presence transforms "web platform" into "global consumer utility"',
      'Push notifications, biometric auth, and offline VIN scanning go live',
      'App Store listing signals institutional legitimacy to investors and government partners',
    ],
  },
  {
    num: '04',
    title: 'FEDERAL PILOT — FBI/DOT CORRIDOR ALIGNMENT',
    color: '#A78BFA',
    timeline: 'Week 6–12',
    value: '+$20M to valuation',
    items: [
      'File CRADA (Cooperative Research and Development Agreement) or MOA with FBI/DOT',
      'Target: I-95 corridor — highest vehicle theft and title fraud density in the US',
      'Position 3C ONYX as the NVIS (National Vehicle Integrity Standard) infrastructure',
      'Government pilot agreement = institutional validation that no private investor can match',
      'NIST 800-53 and FIPS 140-3 compliance already built into the Federal Bridge Agent',
    ],
  },
];

phase1.forEach(p => {
  if (y > H - 160) { doc.addPage(); fillPage(BG); pgHeader('IV. PHASE 1 — 90-DAY VELOCITY'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 22).fill('#0E0C00');
  doc.rect(M, y, 3, 22).fill(p.color);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(MGRAY)
     .text(p.num, M + 10, y + 7, { characterSpacing: 1 });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(p.color)
     .text(p.title, M + 30, y + 7, { characterSpacing: 0.8 });
  doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
     .text(p.timeline, W - M - 160, y + 9, { width: 70 });
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GREEN)
     .text(p.value, W - M - 95, y + 9, { width: 95, align: 'right' });
  y += 26;
  p.items.forEach(item => { y = bulletPoint(item, y, p.color); });
  y += 10;
});

// Phase 1 total
doc.rect(M, y, W - M * 2, 32).fill('#0A1000');
doc.rect(M, y, W - M * 2, 2).fill(GREEN);
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('PHASE 1 VALUATION TARGET (Upon all 4 milestones)', M + 14, y + 7);
doc.fontSize(18).font('Helvetica-Bold').fillColor(GREEN)
   .text('$50M+', M + 14, y + 17);
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('Days 1–90  ·  Q2 2026', W - M - 150, y + 20, { width: 150, align: 'right' });

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6 — 365-DAY PLAN
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('V. PHASE 2 — YEAR 1 EXPANSION');
pgFooter(6);

y = 42;
y = sectionLabel('V.  PHASE 2 — THE YEAR 1 EXPANSION  (TARGET: $250M – $500M)', y);
hRule(y, GOLD + '60', 0.7); y += 12;

y = bodyText(
  'Phase 2 converts the validated network into sovereign infrastructure. This is where 3C ONYX ' +
  'transitions from "startup" to "standard." The mechanism is the 3% Global Tech Fee — ' +
  'a transaction tax that generates revenue on every vehicle deal processed through the protocol.',
  y
);

y += 10;

const phase2 = [
  {
    num: 'A',
    title: 'THE 3% GLOBAL TECH FEE — TRANSACTION TAX MODEL',
    color: GOLD,
    timeline: 'Month 3–6',
    items: [
      '3% fee on every vehicle transaction routed through 3C ONYX',
      'Average US vehicle sale: $48,000 × 3% = $1,440 per transaction',
      '1,000 transactions/month = $1.44M MRR = $17.3M ARR',
      'Not a subscription — a toll. Like Visa charging merchants per swipe.',
      'Once the standard is set, the fee is non-negotiable for network participants',
    ],
  },
  {
    num: 'B',
    title: 'TIER-1 DMS PARTNERSHIP — CDK GLOBAL OR REYNOLDS & REYNOLDS',
    color: BLUE,
    timeline: 'Month 2–5',
    items: [
      'Oracle OIC connectors for CDK, Reynolds, DealerSocket, Dealertrack already built',
      'Approach as a white-label AI layer for their 30,000+ dealer clients',
      'Revenue model: $500/dealer/month × 1,000 dealers = $500K MRR',
      'Strategic partnership announcement alone triggers $75M–$150M valuation re-rate',
    ],
  },
  {
    num: 'C',
    title: 'OEM INTEGRATION — GUARDIAN AGENT PRE-INSTALLATION',
    color: '#A78BFA',
    timeline: 'Month 6–12',
    items: [
      'Negotiate pre-installation of the Guardian Agent into OEM vehicle OS (SDV architecture)',
      'Target: GM, Ford, Stellantis — all transitioning to software-defined vehicles',
      'Every vehicle manufactured becomes a node in the 3C ONYX network at birth',
      'OEM deal = $1B+ valuation conversation — transforms 3C from app to OS layer',
    ],
  },
  {
    num: 'D',
    title: 'SOVEREIGN SCALE — PORTS & INTERNATIONAL SHIPPING',
    color: GREEN,
    timeline: 'Month 8–12',
    items: [
      'Expand NVIS to international shipping ports — securing the global Movement of Assets',
      'Every container shipment carrying a vehicle becomes a Guardian Agent scan event',
      'CBP (US Customs) and INTERPOL partnership potential for stolen vehicle recovery',
      'International expansion multiplies total addressable market by 10×',
    ],
  },
  {
    num: 'E',
    title: 'IP PORTFOLIO — 14 SOVEREIGN ASSETS FILED',
    color: GOLD2,
    timeline: 'Month 1–6',
    items: [
      'File all 14 trademark and patent applications with USPTO',
      'Establish Sovereign Holding structure for the Cadet Family Trust',
      'IP filing converts platform from "acquirable" to "licensable only"',
      'No corporate capture possible — the standard remains independent',
    ],
  },
];

phase2.forEach(p => {
  if (y > H - 140) { doc.addPage(); fillPage(BG); pgHeader('V. PHASE 2 — YEAR 1 EXPANSION'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 22).fill('#0E0C00');
  doc.rect(M, y, 3, 22).fill(p.color);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(p.color)
     .text(`${p.num}.  ${p.title}`, M + 12, y + 7, { characterSpacing: 0.5, width: W - M * 2 - 120 });
  doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
     .text(p.timeline, W - M - 90, y + 9, { width: 90, align: 'right' });
  y += 26;
  p.items.forEach(item => { y = bulletPoint(item, y, p.color); });
  y += 10;
});

// Phase 2 valuation box
doc.rect(M, y, W - M * 2, 44).fill('#141000');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.rect(M, y + 42, W - M * 2, 2).fill(GOLD + '40');
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('YEAR 1 VALUATION TARGET (Days 91–365)', M + 14, y + 8);
doc.fontSize(20).font('Helvetica-Bold').fillColor(GOLD)
   .text('$250M – $500M', M + 14, y + 20);
doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
   .text('Q3 2026 – Q1 2027  ·  Transaction tax model active', W - M - 280, y + 27, { width: 280, align: 'right' });

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7 — THE UNFAIR ADVANTAGE + REQUEST FOR ALIGNMENT
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('VI. THE UNFAIR ADVANTAGE');
pgFooter(7);

y = 42;
y = sectionLabel('VI.  THE UNFAIR ADVANTAGE', y);
hRule(y, GOLD + '60', 0.7); y += 12;

const advantages = [
  {
    title: 'Legacy Inefficiency — $85B Entrenched Market',
    color: RED,
    desc: 'Cox Automotive (CARFAX, Dealertrack, Autotrader), CDK Global, and Reynolds & Reynolds ' +
          'collectively generate $85B in revenue from systems built in the 1980s. They are slow, ' +
          'siloed, and allergic to disruption. 3C ONYX replaces all of them with a single, ' +
          'unhackable protocol — and charges them to use it.',
  },
  {
    title: 'The "Kilocorn" Market — $1.2 Trillion TAM',
    color: GOLD,
    desc: 'The global automotive economy is the largest physical asset market on Earth. ' +
          'Vehicle sales ($1.2T) + aftermarket ($500B) + financing ($300B) + insurance ($250B) ' +
          '+ logistics ($150B). A 3% transaction fee on 1% of global vehicle transactions = $360M/year.',
  },
  {
    title: 'Founder DNA — Impossible to Clone',
    color: '#A78BFA',
    desc: 'The IP is hard-coded with the Founder\'s vision and reserved for the Cadet Family Trust. ' +
          'Unlike VC-backed companies where the founder can be removed, CUXTOMCANDYCLUB LLC was ' +
          'structured from day one to ensure the Standard remains independent of corporate capture. ' +
          'You cannot acquire 3C ONYX — you can only license it.',
  },
  {
    title: 'Zero-Day Security Architecture',
    color: GREEN,
    desc: 'Honey token sovereign protection, scanner detection, IP anchoring, sovereignty middleware, ' +
          'and AES-256 encryption are not bolt-ons — they are baked into every API call and ' +
          'data event. The platform is NIST 800-53 and FIPS 140-3 compliant by design.',
  },
  {
    title: 'The Network Effect Moat',
    color: BLUE,
    desc: 'Every dealer, lender, insurer, and consumer that joins the 3C network makes the protocol ' +
          'more valuable for everyone else. This is a classic Metcalfe\'s Law network effect — ' +
          'value scales as the square of participants. The first 100 members are the hardest. ' +
          'The next 10,000 are exponential.',
  },
];

advantages.forEach(adv => {
  if (y > H - 100) { doc.addPage(); fillPage(BG); pgHeader('VI. THE UNFAIR ADVANTAGE'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 82).fill('#0C0C0C');
  doc.rect(M, y, 3, 82).fill(adv.color);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(adv.color)
     .text(adv.title, M + 12, y + 10, { width: W - M * 2 - 20 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(adv.desc, M + 12, y + 26, { width: W - M * 2 - 24, lineGap: 2 });
  y += 90;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 8 — REQUEST FOR ALIGNMENT + FINAL VALUATION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('VII. REQUEST FOR ALIGNMENT');
pgFooter(8);

y = 42;
y = sectionLabel('VII.  REQUEST FOR ALIGNMENT', y);
hRule(y, GOLD + '60', 0.7); y += 12;

const alignments = [
  {
    audience: 'FOR ATTORNEYS',
    color: '#A78BFA',
    request: 'Secure the 14-asset IP portfolio under a Sovereign Holding structure within ' +
             'the Cadet Family Trust. File all trademark and patent applications with USPTO. ' +
             'Draft licensing agreements that prevent corporate acquisition while enabling ' +
             'the 3% Global Tech Fee to flow to the holding entity.',
  },
  {
    audience: 'FOR GOVERNMENT AGENCIES',
    color: BLUE,
    request: 'Authorize a 90-day Federal Pilot (CRADA or MOA) targeting the I-95 corridor — ' +
             'the highest vehicle theft and title fraud density in the United States. ' +
             '3C ONYX provides NIST 800-53 / FIPS 140-3 compliant infrastructure at zero ' +
             'cost to the agency during the pilot phase.',
  },
  {
    audience: 'FOR STRATEGIC INVESTORS',
    color: GREEN,
    request: 'Participate in the seed-expansion of the first global Kilocorn — a Trillion-Dollar ' +
             'Infrastructure Protocol. The current valuation of $6M–$9M represents the final ' +
             'entry point before Phase 1 milestones drive the valuation to $50M+. ' +
             'Minimum meaningful position: $500K for 2%–5% of CUXTOMCANDYCLUB LLC.',
  },
  {
    audience: 'FOR TIER-1 DMS PARTNERS',
    color: GOLD,
    request: 'CDK Global, Reynolds & Reynolds, DealerSocket, and Dealertrack connectors ' +
             'are already built and operational. We are offering a white-label integration ' +
             'that adds AI-native vehicle intelligence to your existing 30,000+ dealer ' +
             'client base with zero development cost on your side.',
  },
];

alignments.forEach(a => {
  doc.rect(M, y, W - M * 2, 80).fill('#0C0C0C');
  doc.rect(M, y, 3, 80).fill(a.color);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(a.color)
     .text(a.audience, M + 12, y + 10, { characterSpacing: 2 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(a.request, M + 12, y + 24, { width: W - M * 2 - 24, lineGap: 2 });
  y += 88;
});

y += 10;
y = sectionLabel('FINAL VALUATION SUMMARY TABLE', y);
hRule(y, GOLD + '60', 0.7); y += 12;

const summaryRows = [
  ['TODAY — Architecture Phase',        'March 2026',          '$6M – $9M',     MGRAY],
  ['Phase 1 — Platform Live + 100 Members', 'Q2 2026 (Day 90)', '$50M+',         GREEN],
  ['Phase 2 — DMS Partner Signed',      'Q3 2026',             '$75M – $150M',  BLUE],
  ['Phase 2 — Transaction Tax Active',  'Q3–Q4 2026',          '$250M – $500M', GOLD],
  ['OEM Integration + Federal Standard','Q1–Q2 2027',          '$1B – $5B',     '#A78BFA'],
  ['Dynasty Protocol — Global Scale',   '2028–2030',           '$250B+',        GOLD2],
];

summaryRows.forEach((row, i) => {
  const rowY = y + i * 24;
  doc.rect(M, rowY, W - M * 2, 22).fill(i === 0 ? '#111111' : i % 2 === 0 ? '#0D0D0D' : '#0A0A0A');
  if (i === 0) doc.rect(M, rowY, 3, 22).fill(MGRAY);
  else doc.rect(M, rowY, 3, 22).fill(row[3]);
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(row[0], M + 10, rowY + 6, { width: W - M * 2 - 220 });
  doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
     .text(row[1], M + 280, rowY + 7, { width: 100 });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(row[3])
     .text(row[2], W - M - 130, rowY + 6, { width: 130, align: 'right' });
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 9 — CLOSING / SOVEREIGN STAMP
// ─────────────────────────────────────────────────────────────────────────────
fillPage(BG);
pgHeader('VIII. CLOSING DECLARATION');
pgFooter(9);

// Center logo large
drawLogo(W / 2, 200, 55);

y = 290;
doc.fontSize(9).font('Helvetica').fillColor(GOLD)
   .text('C L O S I N G  D E C L A R A T I O N', 0, y, { align: 'center', characterSpacing: 4 });

y += 22;
doc.fontSize(11).font('Helvetica').fillColor(LGRAY)
   .text(
     'The 3C Onyx Protocol is not a pitch. It is a declaration.\n\n' +
     'The infrastructure is built. The agents are operational. The legal entity is filed.\n' +
     'The domains are registered. The standard is ready to be set.\n\n' +
     'The only question remaining is who moves fast enough to be inside the network\n' +
     'before the network becomes the standard.',
     0, y, { align: 'center', width: W, lineGap: 3 }
   );

y = 470;
hRule(y, GOLD + '40', 0.5);
y += 20;

// Sovereign stamp box
doc.rect(M + 60, y, W - M * 2 - 120, 90).fill('#0C0A00');
doc.rect(M + 60, y, W - M * 2 - 120, 2).fill(GOLD);
doc.rect(M + 60, y + 88, W - M * 2 - 120, 2).fill(GOLD + '40');

doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
   .text('SOVEREIGN ASSET DECLARATION', 0, y + 14, { align: 'center', characterSpacing: 2.5 });
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text('This document is the exclusive intellectual property of CUXTOMCANDYCLUB LLC\nand is reserved for the Cadet Family Trust in perpetuity.', 0, y + 30, { align: 'center', lineGap: 3 });
doc.fontSize(7).font('Helvetica').fillColor(GOLD + '70')
   .text('GENESIS TOKEN: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', 0, y + 62, { align: 'center', characterSpacing: 0.8 });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
   .text('Unauthorized reproduction, distribution, or derivative use is prohibited.', 0, y + 74, { align: 'center' });

// Signature line
y += 110;
doc.moveTo(M + 100, y).lineTo(M + 280, y).lineWidth(0.5).strokeColor(GOLD + '60').stroke();
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('ronald antonio cadet', M + 100, y + 6, { width: 180, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '80')
   .text('Chief Visionary Officer  ·  CUXTOMCANDYCLUB LLC', M + 70, y + 18, { width: 240, align: 'center' });

y += 50;
doc.rect(0, H - 50, W, 50).fill('#0A0A0A');
hRule(H - 50, GOLD + '30', 0.5);
doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
   .text('3C ONYX  ·  CUXTOMCANDYCLUB LLC  ·  NEW YORK  ·  3conyx.com  ·  cuxtomcandyclub.ai', 0, H - 35, { align: 'center', characterSpacing: 0.8 });
doc.fontSize(7).font('Helvetica').fillColor(GOLD + '60')
   .text('© 2026 CUXTOMCANDYCLUB LLC. All Rights Reserved. Sovereign Asset — Do Not Distribute.', 0, H - 20, { align: 'center' });

// ── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
console.log('✓ PDF generated:', OUTPUT);
