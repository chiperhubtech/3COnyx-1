/**
 * 3C ONYX — FBI & Federal Master Brief (Definitive Edition)
 * Combines: Federal Technical Addendum + FBI Compliance Addendum
 * CUXTOMCANDYCLUB LLC — Ronald Antonio Cadet
 *
 * Run: node gen_federal_master.js
 */

'use strict';

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUTPUT = path.join(__dirname, '3C_ONYX_Federal_Master_Brief.pdf');

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
const NAVY   = '#1B2F4A';
const PURPLE = '#A78BFA';
const SILVER = '#94A3B8';

const W = 612, H = 792, M = 52;

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title: '3C ONYX — FBI & Federal Master Brief (Definitive Edition)',
    Author: 'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: 'NVIS — National Vehicle Integrity Standard — CUI Federal Specification',
    Keywords: '3C ONYX, FBI, CJIS, NIST 800-53, FIPS 140-3, federal pilot, NVIS, ZTA',
    Creator: 'CUXTOMCANDYCLUB LLC',
  },
});

doc.pipe(fs.createWriteStream(OUTPUT));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fillPage() { doc.rect(0, 0, W, H).fill(BG); }

function subtleGrid() {
  for (let x = 0; x < W; x += 44)
    doc.moveTo(x, 0).lineTo(x, H).lineWidth(0.2).strokeColor(BLUE + '09').stroke();
  for (let y = 0; y < H; y += 44)
    doc.moveTo(0, y).lineTo(W, y).lineWidth(0.2).strokeColor(BLUE + '09').stroke();
}

function hLine(y, color, w) {
  doc.moveTo(M, y).lineTo(W - M, y).lineWidth(w || 0.6).strokeColor(color || GOLD).stroke();
}
function fullLine(y, color, w) {
  doc.moveTo(0, y).lineTo(W, y).lineWidth(w || 0.6).strokeColor(color || GOLD).stroke();
}

function pgHeader(section) {
  doc.rect(0, 0, W, 3).fill(BLUE);
  doc.rect(0, 0, 3, 28).fill(GOLD + '50');
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(BLUE)
     .text('3 C  O N Y X  —  N V I S', M, 13, { characterSpacing: 2.5 });
  doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
     .text(section, 0, 13, { width: W - M, align: 'right', characterSpacing: 0.5 });
}

function pgFooter(num) {
  doc.rect(0, H - 3, W, 3).fill(BLUE + '40');
  const y = H - 22;
  doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
     .text('CUI // INFRA-SEC  ·  AUTHENTICATED: RONALD ANTONIO CADET  ·  CUXTOMCANDYCLUB LLC', M, y, { characterSpacing: 0.3 });
  if (num) doc.fontSize(6.5).fillColor(MGRAY).text(String(num), 0, y, { width: W - M, align: 'right' });
}

function secLabel(text, y) {
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(BLUE)
     .text(text, M, y, { characterSpacing: 1.8 });
  return y + 14;
}

function body(text, y, opts) {
  const o = Object.assign({ width: W - M * 2, lineGap: 3 }, opts || {});
  doc.fontSize(10).font('Helvetica').fillColor(LGRAY).text(text, M, y, o);
  return doc.y + 6;
}

function bold(text, y, col, opts) {
  const o = Object.assign({ width: W - M * 2, lineGap: 2 }, opts || {});
  doc.fontSize(10).font('Helvetica-Bold').fillColor(col || WHITE).text(text, M, y, o);
  return doc.y + 4;
}

function bullet(text, y, col, indent) {
  const dx = indent || 0;
  doc.fontSize(8.5).font('Helvetica').fillColor(col || GOLD).text('▸', M + dx, y, { width: 14 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(text, M + dx + 18, y, { width: W - M * 2 - 18 - dx, lineGap: 2 });
  return doc.y + 5;
}

function subBullet(text, y) {
  doc.fontSize(8).font('Helvetica').fillColor(MGRAY).text('–', M + 22, y, { width: 10 });
  doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
     .text(text, M + 34, y, { width: W - M * 2 - 34, lineGap: 1.5 });
  return doc.y + 3;
}

function badge(x, y, label, color) {
  const bw = 90, bh = 22;
  doc.rect(x, y, bw, bh).fill(color + '1A');
  doc.rect(x, y, bw, 2).fill(color);
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(color)
     .text(label, x, y + 8, { width: bw, align: 'center', characterSpacing: 0.5 });
}

// ── Logo — clean, no ambient glow ─────────────────────────────────────────────
function drawLogo(cx, cy, r) {
  const sw = r > 30 ? 2.4 : 1.8;
  // Outer decorative ring only — no fill/glow
  doc.circle(cx, cy, r + 4).lineWidth(0.4).strokeColor(GOLD + '28').stroke();
  doc.circle(cx, cy, r + 2).lineWidth(0.3).strokeColor(GOLD + '14').stroke();
  // Peace ring
  doc.circle(cx, cy, r).lineWidth(sw).strokeColor(GOLD).stroke();
  // Vertical line
  doc.moveTo(cx, cy - r).lineTo(cx, cy + r).lineWidth(sw).strokeColor(GOLD).stroke();
  // Bottom-left spoke
  const rad = Math.PI / 180;
  doc.moveTo(cx, cy)
     .lineTo(cx + r * Math.cos(210 * rad), cy + r * Math.sin(210 * rad))
     .lineWidth(sw).strokeColor(GOLD).stroke();
  // Bottom-right spoke
  doc.moveTo(cx, cy)
     .lineTo(cx + r * Math.cos(330 * rad), cy + r * Math.sin(330 * rad))
     .lineWidth(sw).strokeColor(GOLD).stroke();
  // 3C lettering
  const fs = r > 30 ? 14 : 10;
  doc.fontSize(fs).font('Helvetica-Bold').fillColor(GOLD)
     .text('3', cx - Math.round(r * 0.44), cy - Math.round(fs * 0.5), { width: Math.round(r * 0.42), align: 'center' });
  doc.fontSize(fs).font('Helvetica-Bold').fillColor(WHITE)
     .text('C', cx + Math.round(r * 0.04), cy - Math.round(fs * 0.5), { width: Math.round(r * 0.42), align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — COVER
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
subtleGrid();

// Top CUI bar
doc.rect(0, 0, W, 38).fill('#08101C');
doc.rect(0, 0, W, 3).fill(BLUE);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(BLUE)
   .text('CONTROLLED UNCLASSIFIED INFORMATION  (CUI)  //  INFRASTRUCTURE SECURITY', 0, 13, { align: 'center', characterSpacing: 1.2 });
doc.fontSize(7).font('Helvetica').fillColor(SILVER)
   .text('Distribution Authorized to Federal Entities, Law Enforcement & Cleared Partners Only', 0, 26, { align: 'center' });

// CUI RESTRICTED box — top right
doc.rect(W - 152, 46, 100, 20).fill(RED + '15');
doc.rect(W - 152, 46, 3, 20).fill(RED);
doc.fontSize(7).font('Helvetica-Bold').fillColor(RED)
   .text('CUI // INFRA-SEC', W - 149, 53, { width: 94, align: 'center', characterSpacing: 0.8 });

// Logo centered
drawLogo(W / 2, 198, 44);

// Header text block
doc.fontSize(7.5).font('Helvetica').fillColor(BLUE)
   .text('F B I  &  F E D E R A L  M A S T E R  B R I E F  —  D E F I N I T I V E  E D I T I O N', 0, 278, { align: 'center', characterSpacing: 2.8 });

doc.fontSize(34).font('Helvetica-Bold').fillColor(WHITE)
   .text('3C ONYX', 0, 296, { align: 'center', characterSpacing: 8 });

doc.fontSize(14).font('Helvetica-Bold').fillColor(GOLD)
   .text('NATIONAL VEHICLE INTEGRITY STANDARD', 0, 338, { align: 'center', characterSpacing: 3 });

doc.fontSize(9).font('Helvetica').fillColor(BLUE)
   .text('N V I S  ·  C J I S  ·  N I S T  8 0 0 - 5 3  ·  F I P S  1 4 0 - 3  ·  Z T A  ·  F e d R A M P', 0, 360, { align: 'center', characterSpacing: 1.5 });

hLine(380, GOLD + '55', 0.7);
doc.rect(M, 382, W - M * 2, 1).fill(GOLD + '15');

// Compliance badge row
const badgeItems = [
  ['NIST 800-53 Rev.5', BLUE], ['FIPS 140-3', GOLD], ['CJIS COMPLIANT', PURPLE],
  ['ZERO-TRUST ZTA', SILVER], ['FedRAMP READY', RED],
];
const bw = 90, bgap = (W - M * 2 - badgeItems.length * bw) / (badgeItems.length - 1);
badgeItems.forEach(([label, color], i) => badge(M + i * (bw + bgap), 394, label, color));

// Meta block
const metaY = 440;
doc.rect(M + 16, metaY, W - M * 2 - 32, 132).fill('#08101C');
doc.rect(M + 16, metaY, 3, 132).fill(BLUE);

[
  ['PROJECT',        'National Vehicle Integrity Standard (NVIS) / 3C Onyx Protocol'],
  ['CLASSIFICATION', 'Controlled Unclassified Information (CUI) // Infrastructure Security'],
  ['PREPARED BY',   'Ronald Antonio Cadet, CVO — CUXTOMCANDYCLUB LLC'],
  ['ENTITY',        'Cuxtomcandyclub LLC  ·  New York  ·  Entity ID: 7788320  ·  Formed: 12/21/2025'],
  ['DATE',          'March 30, 2026'],
  ['SUBMITTED TO',  'FBI / DOT / HSI / GSA / CISA / DoD / NHTSA / State AGs'],
].forEach(([label, value], i) => {
  const y = metaY + 14 + i * 18;
  doc.fontSize(7).font('Helvetica-Bold').fillColor(BLUE)
     .text(label, M + 26, y, { width: 78, characterSpacing: 0.7 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(value, M + 108, y, { width: W - M * 2 - 120 });
});

doc.fontSize(6.5).font('Helvetica').fillColor(GOLD + '40')
   .text('SOVEREIGN TOKEN: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', 0, metaY + 148, { align: 'center', characterSpacing: 0.6 });

// Founder name — small per instructions
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('ronald antonio cadet', 0, H - 56, { align: 'center', characterSpacing: 1 });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Chief Visionary Officer  ·  CUXTOMCANDYCLUB LLC', 0, H - 44, { align: 'center' });

// Bottom valuation strip
doc.rect(0, H - 32, W, 32).fill('#08101C');
fullLine(H - 32, BLUE + '35', 0.5);
const vals = [['TODAY', '$6M–$9M'], ['90-DAY', '$50M+'], ['YEAR 1', '$250M–$500M'], ['DYNASTY', '$250B+']];
vals.forEach(([l, v], i) => {
  const vx = i * (W / 4);
  doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY).text(l, vx, H - 28, { width: W / 4, align: 'center', characterSpacing: 0.8 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD).text(v, vx, H - 18, { width: W / 4, align: 'center' });
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — EXECUTIVE SUMMARY + THREAT MODEL
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('EXECUTIVE SUMMARY & THREAT MODEL');
pgFooter(2);

let y = 42;
y = secLabel('EXECUTIVE SUMMARY', y);
hLine(y, BLUE + '60', 0.7); y += 12;

y = body(
  'This brief addresses how 3C ONYX aligns with U.S. federal law enforcement mandates and agency operational needs. ' +
  'The platform operates as a sovereign telematics and vehicle integrity layer — designed from inception to handle ' +
  'Criminal Justice Information (CJI) and critical vehicle data under the strictest federal security requirements.',
  y
);
y = body(
  'Key compliance targets: FBI CJIS Security Policy (for CJI), NIST SP 800-53/171 (for federal systems and CUI), ' +
  'FIPS 140-3 (cryptographic standards), Zero-Trust Architecture (ZTA), and applicable privacy frameworks ' +
  '(CCPA/CPRA, DPPA, GLBA). The platform is deployment-ready — no foundational security rework is required.',
  y
);

y += 10;
y = secLabel('THREAT MODEL — DATA & SYSTEM RISKS', y);
hLine(y, BLUE + '60', 0.7); y += 12;

const threats = [
  {
    title: 'EXTERNAL ATTACKERS',
    color: RED,
    risk: 'Remote compromise of vehicle telemetry or platform infrastructure (malware, MITM, ransomware). ' +
          'Connected vehicles present an expanded attack surface — compromised ECUs can trigger safety incidents and data breaches.',
    control: 'Zero-Trust Architecture enforces cryptographic verification at every vehicle node. TLS 1.3 for all transit. ' +
             'Network segmentation (SC-7) isolates vehicle data from operational systems.',
  },
  {
    title: 'INSIDER THREATS',
    color: GOLD,
    risk: 'Rogue employees or partners with privileged access. CJIS mandates FBI fingerprint background checks for all ' +
          'personnel and contractors handling Criminal Justice Information (CJI).',
    control: 'Least-privilege RBAC enforced at API level. All administrative sessions logged via IP anchor system. ' +
             'Insider threat program required prior to CJI data access. Contractor vetting aligned with NIST SA-12.',
  },
  {
    title: 'DATA LEAKAGE & IMPROPER DISCLOSURE',
    color: PURPLE,
    risk: 'Unauthorized sharing of PII (location data) or CJI without warrants. Senators have flagged automakers ' +
          'for releasing telematics data without judicial process. DPPA strictly governs driver identity and location.',
    control: 'G-Code Gateway enforces strict data silos — FBI sees forensic data only; DOT sees compliance data only. ' +
             'Warrant/subpoena verification required before any CJI disclosure. All disclosures DPPA-logged.',
  },
  {
    title: 'REGULATORY & PRIVACY LIABILITY',
    color: SILVER,
    risk: 'Non-compliance with CCPA/CPRA, DPPA, or GLBA could generate material fines. ' +
          'California enforces consumer access/delete rights on vehicle-collected data. Financial data invokes GLBA safeguards.',
    control: 'CCPA/CPRA opt-out mechanisms built into the consumer-facing platform. ' +
             'Privacy notices drafted by counsel. Disclosure request logs maintained per CCPA requirements.',
  },
  {
    title: 'SUPPLY CHAIN & THIRD-PARTY RISK',
    color: BLUE,
    risk: 'Unvetted third-party software or devices in vehicle systems introduce cyber risks. ' +
          'CISA explicitly warns against unknown devices on autonomous vehicle and telematics systems.',
    control: 'S1 Supply Chain Protocol creates an immutable ledger of every component installed. ' +
             'Vendor contracts require CJIS/NIST compliance. Oracle OIC connectors enforce credentialed-only DMS access.',
  },
];

threats.forEach(t => {
  if (y > H - 120) { doc.addPage(); fillPage(); pgHeader('EXECUTIVE SUMMARY & THREAT MODEL'); pgFooter(''); y = 42; }
  const bh = 78;
  doc.rect(M, y, W - M * 2, bh).fill(DGRAY);
  doc.rect(M, y, 3, bh).fill(t.color);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(t.color)
     .text(t.title, M + 12, y + 9, { width: W - M * 2 - 20, characterSpacing: 1 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(SILVER)
     .text('RISK:', M + 12, y + 23, { width: 34, characterSpacing: 0.5 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(t.risk, M + 48, y + 23, { width: W - M * 2 - 56, lineGap: 1.5 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(t.color)
     .text('CONTROL:', M + 12, y + 52, { width: 50, characterSpacing: 0.3 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(t.control, M + 66, y + 52, { width: W - M * 2 - 74, lineGap: 1.5 });
  y += bh + 8;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — COMPLIANCE FRAMEWORK TABLE + TECHNICAL CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('COMPLIANCE REQUIREMENTS & TECHNICAL CONTROLS');
pgFooter(3);

y = 42;
y = secLabel('COMPLIANCE REQUIREMENTS — FRAMEWORK COMPARISON', y);
hLine(y, BLUE + '60', 0.7); y += 12;

// Table header
const cols = [182, 140, 140, 90]; // widths
const colX = [M, M + 182, M + 182 + 140, M + 182 + 140 + 140];
const tableW = cols.reduce((a, b) => a + b, 0);

doc.rect(M, y, tableW, 22).fill(NAVY);
['REQUIREMENT / CONTROL', 'FBI CJIS', 'NIST SP 800-53/171', 'PRIVACY LAWS'].forEach((h, i) => {
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(BLUE)
     .text(h, colX[i] + 4, y + 7, { width: cols[i] - 6, characterSpacing: 0.4 });
});
y += 22;

const tableRows = [
  {
    ctrl: 'Access Control (MFA)',
    cjis: 'MFA required for ALL users — privileged and non-privileged',
    nist: 'IA-2: MFA mandatory for all sensitive system access',
    priv: 'No direct mandate; strong auth is industry standard',
  },
  {
    ctrl: 'Encryption (CJI/PII)',
    cjis: 'AES-128+ FIPS-approved for CJI in transit & at rest',
    nist: 'SC-13/SC-28: FIPS-validated crypto for all CUI data',
    priv: 'PII must be secured; CCPA "do not sell" for personal data',
  },
  {
    ctrl: 'Audit & Logging',
    cjis: 'Record-access logs; strict auditing of all CJI access',
    nist: 'AU-2, AU-6: Retain audit records; review logs regularly',
    priv: 'CCPA: maintain disclosure request records; DPPA: LE data logs',
  },
  {
    ctrl: 'Personnel Vetting',
    cjis: 'FBI background checks for all CJI-handling staff + contractors',
    nist: 'SA-12: Supply-chain risk management; vet all contractors',
    priv: 'Vendor contracts must honor consumer opt-outs; DMV bonds',
  },
  {
    ctrl: 'Incident Response',
    cjis: 'Mandatory FBI reporting for any CJI breach event',
    nist: 'IR-4/IR-6: Formal reporting and root-cause analysis',
    priv: 'CCPA: breach notification; NHTSA/CISA AV incident reporting',
  },
  {
    ctrl: 'Privacy Rights',
    cjis: 'CJI protected under CJIS Compact Act — LE use only',
    nist: 'Privacy Act + E-Gov Act protects agency-held PII',
    priv: 'CCPA/CPRA: notice, access, deletion rights for consumers',
  },
  {
    ctrl: 'Chain of Custody',
    cjis: 'Digitally signed, tamper-evident audit records required',
    nist: 'AU-10: Non-repudiation; SC-13: cryptographic hashing',
    priv: 'DPPA: digital logs for all LE vehicle data disclosures',
  },
];

tableRows.forEach((row, i) => {
  const rh = 30;
  const ry = y + i * rh;
  doc.rect(M, ry, tableW, rh).fill(i % 2 === 0 ? '#0C0C12' : '#0A0A0E');
  // Left border on ctrl col
  doc.rect(M, ry, 3, rh).fill(BLUE + '50');
  // Vertical separators
  doc.moveTo(colX[1], ry).lineTo(colX[1], ry + rh).lineWidth(0.3).strokeColor(BLUE + '25').stroke();
  doc.moveTo(colX[2], ry).lineTo(colX[2], ry + rh).lineWidth(0.3).strokeColor(BLUE + '25').stroke();
  doc.moveTo(colX[3], ry).lineTo(colX[3], ry + rh).lineWidth(0.3).strokeColor(BLUE + '25').stroke();

  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
     .text(row.ctrl, colX[0] + 5, ry + 5, { width: cols[0] - 8 });
  doc.fontSize(7).font('Helvetica').fillColor(LGRAY)
     .text(row.cjis, colX[1] + 4, ry + 5, { width: cols[1] - 6, lineGap: 1 });
  doc.fontSize(7).font('Helvetica').fillColor(LGRAY)
     .text(row.nist, colX[2] + 4, ry + 5, { width: cols[2] - 6, lineGap: 1 });
  doc.fontSize(7).font('Helvetica').fillColor(SILVER)
     .text(row.priv, colX[3] + 4, ry + 5, { width: cols[3] - 6, lineGap: 1 });
});

y += tableRows.length * 30 + 16;

y = secLabel('TECHNICAL CONTROLS IMPLEMENTATION', y);
hLine(y, BLUE + '60', 0.7); y += 12;

const techControls = [
  {
    label: 'AUTHENTICATION & ACCESS',
    color: BLUE,
    items: [
      'MFA enforced for all users via JWT + TOTP — no single-factor access to any CJI-adjacent route',
      'RBAC (Role-Based Access Control) enforced at API middleware level — least privilege by default',
      'Session invalidation on anomaly detection — IP anchor system locks sessions to verified origins',
    ],
  },
  {
    label: 'CRYPTOGRAPHY & ENCRYPTION',
    color: GOLD,
    items: [
      'AES-256 encryption at rest for all vehicle telemetry, PII, and CJI-adjacent data',
      'TLS 1.3 enforced for all data in transit — FIPS-validated cipher suites only',
      'AWS Secrets Manager (FIPS 140-2 Level 2 validated HSM) for all key management',
      'Tamper-evident audit logs using FIPS-compliant hashing (chain-of-custody integrity)',
    ],
  },
  {
    label: 'AUDIT, LOGGING & FORENSICS',
    color: PURPLE,
    items: [
      'Immutable blockchain audit trail on every Guardian Agent VIN verification event',
      'All CJI access requests logged with timestamp, user ID, source IP, and justification',
      'SIEM-compatible event stream via EventBridge (30 typed event types for continuous monitoring)',
      'Chain-of-custody records formatted for CJIS evidence admissibility standards',
    ],
  },
  {
    label: 'NETWORK & INFRASTRUCTURE SECURITY',
    color: SILVER,
    items: [
      'Network segmentation (SC-7): vehicle data, law enforcement data, and consumer data in isolated segments',
      'Scanner detection middleware blocks unauthorized reconnaissance in real time',
      'Sovereignty middleware enforces origin policy on every inbound API call',
      'AWS GovCloud deployment pathway mapped for FedRAMP Moderate authorization',
    ],
  },
];

techControls.forEach(tc => {
  if (y > H - 100) { doc.addPage(); fillPage(); pgHeader('TECHNICAL CONTROLS'); pgFooter(''); y = 42; }
  const bh = 22 + tc.items.length * 16;
  doc.rect(M, y, W - M * 2, bh).fill(DGRAY);
  doc.rect(M, y, 3, bh).fill(tc.color);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(tc.color)
     .text(tc.label, M + 10, y + 8, { characterSpacing: 1.2 });
  let iy = y + 22;
  tc.items.forEach(item => {
    doc.fontSize(8.5).font('Helvetica').fillColor(tc.color).text('·', M + 10, iy, { width: 10 });
    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY).text(item, M + 22, iy, { width: W - M * 2 - 28, lineGap: 1 });
    iy += 16;
  });
  y = iy + 10;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — PLATFORM ARCHITECTURE + GOVERNMENT USE CASES
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('PLATFORM ARCHITECTURE & GOVERNMENT USE CASES');
pgFooter(4);

y = 42;
y = secLabel('PLATFORM ARCHITECTURE — DATA FLOW', y);
hLine(y, BLUE + '60', 0.7); y += 12;

// Architecture diagram (rendered as boxes + arrows)
const arcW = W - M * 2;
const arcH = 140;
doc.rect(M, y, arcW, arcH).fill('#08101C');
doc.rect(M, y, arcW, 2).fill(BLUE);

// Layer labels
const layers = [
  { label: 'VEHICLE NETWORK', color: GOLD, x: M + 8, nodes: ['Vehicle Telematics', 'ECU / OBD-II', 'GPS Telemetry'] },
  { label: '3C ONYX CLOUD', color: BLUE, x: M + 8 + 160, nodes: ['Ingestion Service', 'Data Warehouse', 'Analytics/AI Layer', 'Audit/Log DB', 'Chain-of-Custody'] },
  { label: 'GOVERNMENT AGENCIES', color: PURPLE, x: M + 8 + 160 + 200, nodes: ['FBI (CJIS-Cleared)', 'DOT / NHTSA', 'CISA / GSA', 'State DMVs'] },
];

layers.forEach(layer => {
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(layer.color)
     .text(layer.label, layer.x, y + 10, { characterSpacing: 1 });
  layer.nodes.forEach((node, ni) => {
    const ny = y + 26 + ni * 22;
    doc.rect(layer.x, ny, 148, 16).fill(layer.color + '15');
    doc.rect(layer.x, ny, 2, 16).fill(layer.color);
    doc.fontSize(8).font('Helvetica').fillColor(LGRAY).text(node, layer.x + 6, ny + 4, { width: 140 });
  });
});

// Arrows between layers
const arrowY = y + 64;
doc.moveTo(M + 158, arrowY).lineTo(M + 168, arrowY).lineWidth(1).strokeColor(GOLD + '80').stroke();
doc.moveTo(M + 168, arrowY - 4).lineTo(M + 176, arrowY).lineTo(M + 168, arrowY + 4).fill(GOLD + '80');
doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY).text('encrypted', M + 160, arrowY + 6, { width: 30 });

doc.moveTo(M + 358, arrowY).lineTo(M + 368, arrowY).lineWidth(1).strokeColor(BLUE + '80').stroke();
doc.moveTo(M + 368, arrowY - 4).lineTo(M + 376, arrowY).lineTo(M + 368, arrowY + 4).fill(BLUE + '80');
doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY).text('secure API', M + 358, arrowY + 6, { width: 40 });

doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
   .text('↙ Warrants / Subpoenas required for CJI disclosure  ·  G-Code Gateway enforces strict data silos', M + 8, y + arcH - 16, { width: arcW - 16 });

y += arcH + 16;

y = secLabel('PRIMARY GOVERNMENT USE CASES', y);
hLine(y, BLUE + '60', 0.7); y += 12;

const useCases = [
  {
    num: '01', title: 'LAW ENFORCEMENT VEHICLE TRACKING & TOC INTERDICTION',
    agency: 'FBI / Homeland Security Investigations (HSI)',
    color: RED,
    problem: 'Cartels and export rings use VIN-cloning and "Ghost Vehicles" to move stolen assets across state and international borders. Current DMV/NMVTIS systems cannot detect simultaneous appearances of the same VIN at multiple locations.',
    solution: 'Guardian Agent maintains a cryptographically signed Digital Passport for every vehicle. Simultaneous VIN appearances generate immediate FBI/HSI anomaly alerts. All evidence output is CJIS-compatible with digitally signed chain-of-custody records. Data requests require warrants per DPPA policy.',
    value: '$6.4B annual stolen vehicle recovery  ·  NCIC integration  ·  CJIS-admissible evidence output',
  },
  {
    num: '02', title: 'FEDERAL FLEET INTEGRITY & LIFECYCLE MANAGEMENT',
    agency: 'GSA (General Services Administration) / Department of Defense (DoD)',
    color: BLUE,
    solution: 'S1 Supply Chain Protocol creates an immutable maintenance ledger for all 650,000+ GSA vehicles. Every part installed is logged with supplier chain of custody, installer credential verification, and timestamp under NIST 800-171 controls. Classified as CUI — FedRAMP Moderate pathway defined.',
    problem: 'GSA\'s 650,000+ vehicle fleet loses ~$380M annually to maintenance fraud, odometer manipulation, and unauthorized component substitution. Paper maintenance records can be altered without detection.',
    value: '$380M fraud eliminated  ·  NIST 800-171 compliant  ·  GSA Schedule SIN 485 procurement pathway',
  },
  {
    num: '03', title: 'INTERSTATE ODOMETER FRAUD MITIGATION (DOT/NHTSA)',
    agency: 'DOT (NHTSA) / State Attorneys General',
    color: GOLD,
    problem: 'Odometer fraud costs consumers $1B+ annually. 50 isolated, non-interoperable state DMV databases allow "title washing" — moving vehicles across state lines to reset fraud history without detection.',
    solution: 'V.I.P. (Verified Integrity Protocol) locks mileage into an immutable ledger at every service interval, sale, and registration event. Title washing becomes detectable in real time. Consumer VIN reports replace CARFAX dependency. DPPA and CCPA/CPRA rights enforced on all consumer data.',
    value: '$1B+ consumer loss eliminated  ·  NHTSA mandate compliance  ·  50-state DMV interoperability',
  },
  {
    num: '04', title: 'EMERGENCY RESPONSE & PUBLIC SAFETY',
    agency: 'FEMA / State Emergency Management / Local PD',
    color: PURPLE,
    problem: 'Real-time vehicle location data is fragmented across carriers and platforms during emergencies. School bus and ambulance tracking systems are siloed. If health data travels through the system, HIPAA PHI controls trigger.',
    solution: 'Mission Agent provides real-time GPS tracking for emergency fleets. High-availability architecture with redundant event bus. HIPAA-aligned data handling if PHI is present (AC/SC NIST families). Encrypted dispatch communications via secure API channel.',
    value: 'Faster dispatch response  ·  School bus + ambulance fleet safety  ·  HIPAA-ready if required',
  },
  {
    num: '05', title: 'PORT SECURITY & CRITICAL INFRASTRUCTURE (CBP/CISA)',
    agency: 'CBP (US Customs & Border Protection) / CISA',
    color: SILVER,
    problem: '250,000 stolen vehicles are exported from US ports annually. Container inspections rely on paper manifests that can be forged. CISA has flagged port vehicle throughput as a critical infrastructure vulnerability.',
    solution: 'Guardian Agent extended to port checkpoints creates cryptographic verification before container seal. Manifest cross-referenced against NVIS in real time — discrepancies trigger immediate CBP holds. CISA infrastructure threat telemetry fed from NVIS event stream. INTERPOL data-sharing pathway defined.',
    value: '250,000 recovered vehicles/year  ·  $8.7B global asset recovery  ·  CISA ConMon integration',
  },
];

useCases.forEach(uc => {
  if (y > H - 110) { doc.addPage(); fillPage(); pgHeader('GOVERNMENT USE CASES'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 20).fill(uc.color + '12');
  doc.rect(M, y, W - M * 2, 2).fill(uc.color);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(uc.color)
     .text(`CASE ${uc.num}`, M + 8, y + 6, { width: 50, characterSpacing: 0.8 });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE)
     .text(uc.title, M + 62, y + 5, { width: W - M * 2 - 70 });
  y += 22;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(MGRAY).text('AGENCY:', M, y, { width: 46, characterSpacing: 0.5 });
  doc.fontSize(8.5).font('Helvetica').fillColor(uc.color).text(uc.agency, M + 48, y, { width: W - M * 2 - 50 });
  y += 13;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(MGRAY).text('NEED:', M, y, { width: 36 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY).text(uc.problem, M + 40, y, { width: W - M * 2 - 42, lineGap: 1.5 });
  y = doc.y + 5;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(MGRAY).text('SOLUTION:', M, y, { width: 55 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY).text(uc.solution, M + 58, y, { width: W - M * 2 - 60, lineGap: 1.5 });
  y = doc.y + 5;
  doc.rect(M, y, W - M * 2, 18).fill(uc.color + '0C');
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(uc.color).text('VALUE:', M + 8, y + 5, { width: 44 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(WHITE).text(uc.value, M + 54, y + 5, { width: W - M * 2 - 62 });
  y += 26;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — 90-DAY FEDERAL PILOT + G-CODE GATEWAY
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('90-DAY FEDERAL PILOT — THE NORTHEAST CORRIDOR');
pgFooter(5);

y = 42;
y = secLabel('PROPOSED 90-DAY FEDERAL PILOT — "THE NORTHEAST CORRIDOR"', y);
hLine(y, BLUE + '60', 0.7); y += 10;

// Pilot objective box
doc.rect(M, y, W - M * 2, 38).fill('#08101C');
doc.rect(M, y, W - M * 2, 2).fill(BLUE);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE)
   .text('Objective', M + 12, y + 8);
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text(
     'Deploy 3C Protocol as a Regulatory Overlay across the I-95 corridor (MA, RI, CT, NY, NJ, PA, MD, DC, VA) — ' +
     'the highest vehicle theft and title fraud density corridor in the US. Mechanism: CRADA or MOA. ' +
     'Zero cost to the agency during the pilot phase.',
     M + 12, y + 22, { width: W - M * 2 - 20, lineGap: 2 }
   );
y += 48;

const pilotPhases = [
  {
    phase: 'PHASE 1', days: 'DAYS 1–30', title: 'Integration & Sovereign Node Deployment',
    color: BLUE,
    tasks: [
      'Install Sovereign Nodes at 3 pilot DMV locations (NY, CT, NJ) — Guardian Agent reads title records',
      'Configure G-Code Gateway with FBI forensic view, DOT compliance view, CISA threat telemetry view',
      'Establish NCIC / NMVTIS API handshake — additive integration, no replacement of existing systems',
      'Complete CUI handling training for all agency pilot personnel accessing G-Code Gateway',
    ],
    deliverable: 'Operational G-Code Gateway with live multi-agency feeds — milestone report filed',
  },
  {
    phase: 'PHASE 2', days: 'DAYS 31–60', title: 'Live Field Testing & Ghost Vehicle Exercise',
    color: GOLD,
    tasks: [
      'Logistics Agent deployed on I-95 commercial corridor — real-time GPS chain-of-custody on all transports',
      '10 participating NY/NJ/CT dealerships receive Guardian Agent integration — every title = CJIS audit record',
      'FBI/HSI controlled Ghost Vehicle test — synthetic VIN-clone inserted into data stream; detection time measured',
      'GSA fleet pilot: 500 federal vehicles enrolled on immutable S1 maintenance ledger',
    ],
    deliverable: 'Detection accuracy report, false-positive rate, fleet ROI projection — submitted to DOT/GSA/FBI',
  },
  {
    phase: 'PHASE 3', days: 'DAYS 61–90', title: 'Congressional Report & NVIS Authorization Request',
    color: PURPLE,
    tasks: [
      'Full statistical analysis: fraud detected, vehicles recovered, fleet savings — vs. pre-pilot baseline',
      'Congressional briefing document prepared for House Transportation & Senate Commerce Committees',
      'NVIS Authorization request submitted to Executive Branch — formal designation as federal vehicle standard',
      'Phase 2 national 50-state expansion proposal presented with cost, timeline, and revenue-neutral model',
    ],
    deliverable: 'Final pilot report to Congress + NVIS authorization request filed — Phase 2 approved',
  },
];

pilotPhases.forEach(p => {
  if (y > H - 130) { doc.addPage(); fillPage(); pgHeader('90-DAY FEDERAL PILOT'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 22).fill(p.color + '14');
  doc.rect(M, y, 3, 22).fill(p.color);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(p.color)
     .text(p.phase, M + 10, y + 7, { characterSpacing: 1 });
  doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
     .text(p.days, M + 72, y + 8, { characterSpacing: 0.5 });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE)
     .text(p.title, M + 148, y + 6, { width: W - M * 2 - 158 });
  y += 26;
  p.tasks.forEach((t, i) => {
    doc.rect(M, y, W - M * 2, 28).fill(i % 2 === 0 ? '#0C0C12' : '#0A0A0E');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(p.color).text(`${i + 1}.`, M + 8, y + 5, { width: 14 });
    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
       .text(t, M + 24, y + 5, { width: W - M * 2 - 30, lineGap: 1.5 });
    y += 30;
  });
  doc.rect(M, y, W - M * 2, 20).fill(p.color + '08');
  doc.rect(M, y, W - M * 2, 1).fill(p.color + '40');
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(p.color)
     .text('DELIVERABLE:', M + 8, y + 6, { width: 82, characterSpacing: 0.4 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(p.deliverable, M + 94, y + 6, { width: W - M * 2 - 102 });
  y += 28;
});

// G-Code Gateway
y += 6;
y = secLabel('INTER-AGENCY G-CODE GATEWAY — DATA SILOS', y);
hLine(y, BLUE + '60', 0.7); y += 10;

const gAgencies = [
  { a: 'FBI',   c: RED,    v: 'VIN anomaly · Ghost vehicle · Cartel export flags · NCIC cross-reference · CJIS audit trail' },
  { a: 'DOT',   c: BLUE,   v: 'Odometer ledger · Recall compliance · Title wash detection · NHTSA enforcement · Interstate monitoring' },
  { a: 'CISA',  c: GOLD,   v: 'Port anomalies · Supply chain threats · Cyber-physical patterns · Sovereignty layer events · Fleet status' },
  { a: 'GSA',   c: PURPLE, v: 'Fleet maintenance ledger · Part chain of custody · Fraud alerts · ROI analytics · DoD disposition' },
  { a: 'NHTSA', c: SILVER, v: 'Odometer fraud alerts · Consumer VIN reports · Recall tracking · Dealer compliance · State AG support' },
];

const gcW = (W - M * 2) / 5 - 4;
gAgencies.forEach((ag, i) => {
  const gx = M + i * (gcW + 5);
  doc.rect(gx, y, gcW, 90).fill(DGRAY);
  doc.rect(gx, y, gcW, 3).fill(ag.c);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(ag.c)
     .text(ag.a, gx + 6, y + 10, { width: gcW - 10 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
     .text(ag.v, gx + 6, y + 28, { width: gcW - 10, lineGap: 4 });
});
y += 100;

doc.rect(M, y, W - M * 2, 18).fill('#08101C');
doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
   .text('Each agency views only their authorized data silo. No cross-agency data visibility. Warrant verification required before any CJI release.', M + 10, y + 5, { width: W - M * 2 - 18 });
y += 26;

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6 — PROCUREMENT & 365-DAY ROADMAP
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('PROCUREMENT, CONTRACTING & NATIONAL EXPANSION ROADMAP');
pgFooter(6);

y = 42;
y = secLabel('PROCUREMENT & CONTRACTING PATHWAYS', y);
hLine(y, BLUE + '60', 0.7); y += 12;

y = body(
  'Federal buyers will use established contract vehicles. 3C ONYX is structured for rapid onboarding through ' +
  'multiple acquisition channels — no sole-source or emergency procurement required.',
  y
);

y += 6;
const procPaths = [
  {
    route: 'GSA MULTIPLE AWARD SCHEDULES (MAS)',
    color: BLUE,
    detail: 'Primary contracting vehicle. Applicable SINs: IT Schedule 70 (SaaS / Cloud Services) and ' +
            'Transportation & Logistics SIN 485 (Ground Transportation) + SIN 532111 (Vehicle Rental/Fleet). ' +
            'Fastest path to agency adoption — pre-competed, no new acquisition required.',
  },
  {
    route: 'CRADA / MOA — COOPERATIVE AGREEMENT',
    color: GOLD,
    detail: 'CRADA (Cooperative Research & Development Agreement) or Memorandum of Agreement enables the ' +
            '90-Day Federal Pilot at zero cost to the agency. No appropriation required during pilot phase. ' +
            'Results inform full procurement action through MAS or GWAC.',
  },
  {
    route: 'FedRAMP AUTHORITY TO OPERATE (ATO)',
    color: PURPLE,
    detail: 'FedRAMP Moderate ATO pathway mapped. AWS GovCloud deployment available immediately. ' +
            'System Security Plan (SSP) can be completed within 60 days of federal partner engagement. ' +
            'FedRAMP Marketplace listing targets Q3 2026.',
  },
  {
    route: 'GWAC / FEDERAL SYSTEMS INTEGRATOR PARTNERSHIP',
    color: SILVER,
    detail: 'Eligible for Government-Wide Acquisition Contracts (GWACs: Alliant 2, SEWP V). ' +
            'Partnership with a cleared federal systems integrator (e.g., Leidos, SAIC, Booz Allen) ' +
            'accelerates agency adoption and provides incumbent relationship access.',
  },
];

procPaths.forEach(pp => {
  if (y > H - 80) { doc.addPage(); fillPage(); pgHeader('PROCUREMENT & ROADMAP'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 56).fill(DGRAY);
  doc.rect(M, y, 3, 56).fill(pp.color);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(pp.color)
     .text(pp.route, M + 10, y + 9, { characterSpacing: 0.8 });
  doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
     .text(pp.detail, M + 10, y + 24, { width: W - M * 2 - 16, lineGap: 2 });
  y += 64;
});

y += 8;
y = secLabel('5-STEP COMPLIANCE ROADMAP — NEXT STEPS', y);
hLine(y, BLUE + '60', 0.7); y += 12;

const steps = [
  { n: '01', title: 'GAP ASSESSMENT', color: RED,
    text: 'Conduct a formal compliance audit against CJIS controls and NIST 800-53/171. Document any missing controls vs. current implementation. Estimated: 2 weeks with agency IT partner.' },
  { n: '02', title: 'PRIORITY CONTROLS IMPLEMENTATION', color: GOLD,
    text: 'MFA deployment (already built), full-disk + TLS encryption (implemented), SIEM logging via EventBridge (operational), CCPA consent UI (in platform). Formal Incident Response and Data Breach plan drafted.' },
  { n: '03', title: 'POLICIES, TRAINING & VETTING', color: BLUE,
    text: 'Draft privacy policy addendum, CJIS security policy supplement, and employee/vendor NDAs. FBI background check process initiated for all CJI-handling personnel. Consumer data rights training for platform staff.' },
  { n: '04', title: 'FEDRAMP ATO & GSA SCHEDULE ENROLLMENT', color: PURPLE,
    text: 'Apply for FedRAMP "Connect" listing using existing AWS infrastructure. Enroll on GSA MAS IT Schedule 70 and Transportation SIN 485. Target: Q3 2026 for both actions.' },
  { n: '05', title: 'LEGAL REVIEW & FEDERAL CONTRACTS COUNSEL', color: SILVER,
    text: 'Engage federal contracts attorney to draft standard terms: CJIS addendum, TOS compliant with CCPA/DPPA/GLBA, and data sharing agreements (MOUs) for each agency partner. Monitor pending DATA Act and state telematics legislation.' },
];

steps.forEach(s => {
  if (y > H - 60) { doc.addPage(); fillPage(); pgHeader('COMPLIANCE ROADMAP'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 48).fill(DGRAY);
  doc.rect(M, y, 3, 48).fill(s.color);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(s.color + '60')
     .text(s.n, M + 8, y + 8, { characterSpacing: 1 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(s.color)
     .text(s.title, M + 36, y + 9, { width: W - M * 2 - 44, characterSpacing: 0.5 });
  doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
     .text(s.text, M + 36, y + 24, { width: W - M * 2 - 44, lineGap: 2 });
  y += 56;
});

y += 8;
y = secLabel('365-DAY NATIONAL EXPANSION ROADMAP', y);
hLine(y, BLUE + '60', 0.7); y += 10;

const rm = [
  { period: 'Week 1–2',   item: 'Publish platform · all 4 domains live · SSL auto-provisioned',                   col: GOLD },
  { period: 'Week 2–4',   item: 'CRADA / MOA filed · Pilot authorization obtained from agency lead',              col: GOLD },
  { period: 'Days 1–30',  item: 'G-Code Gateway operational · Sovereign Nodes at 3 DMV pilot sites',             col: BLUE },
  { period: 'Days 31–60', item: 'I-95 live field test · 10 dealers · Ghost Vehicle FBI exercise',                col: BLUE },
  { period: 'Day 60',     item: 'App Store deployment — Apple + Google Play (global mobile gateway)',             col: PURPLE },
  { period: 'Days 61–90', item: 'Congressional report + NVIS authorization request filed',                        col: BLUE },
  { period: 'Month 3–5',  item: '100 paying members enrolled · $9,900 MRR · first revenue milestone',            col: GOLD },
  { period: 'Month 4–6',  item: 'CDK / Reynolds DMS white-label negotiation · $500/dealer/mo model',             col: PURPLE },
  { period: 'Month 5–8',  item: 'GSA fleet integration: 50,000 vehicles on immutable ledger',                    col: BLUE },
  { period: 'Month 6–9',  item: 'CBP Port of Entry pilot — top 5 US ports  ·  250K vehicle interdiction target', col: RED },
  { period: 'Month 7–10', item: 'OEM negotiation: GM / Ford / Stellantis — Guardian Agent in vehicle OS (SDV)',  col: SILVER },
  { period: 'Month 9–12', item: 'NVIS federal designation received  ·  50-state national rollout begins',         col: RED },
  { period: 'Year 2',     item: 'All US states + territories integrated  ·  NVIS = national law',                col: GOLD2 },
  { period: 'Year 3',     item: 'G7 international ports  ·  INTERPOL / Europol MOU  ·  global standard',         col: GOLD2 },
];

rm.forEach((r, i) => {
  if (y > H - 36) { doc.addPage(); fillPage(); pgHeader('365-DAY ROADMAP'); pgFooter(''); y = 42; }
  doc.rect(M, y, W - M * 2, 19).fill(i % 2 === 0 ? '#0C0C12' : '#0A0A0E');
  doc.rect(M, y, 3, 19).fill(r.col);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(r.col)
     .text(r.period, M + 8, y + 5, { width: 74, characterSpacing: 0.2 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text(r.item, M + 86, y + 5, { width: W - M * 2 - 94 });
  y += 21;
});

doc.addPage();

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7 — TECHNICAL INTAKE FORM + AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────
fillPage();
pgHeader('TECHNICAL INTAKE FORM — AGENCY IT DIRECTOR');
pgFooter(7);

y = 42;
y = secLabel('TECHNICAL INTAKE FORM — FOR AGENCY IT DIRECTORS', y);
hLine(y, BLUE + '60', 0.7); y += 10;

y = body(
  'Complete this form and return to the 3C ONYX team. Integration with the G-Code Gateway ' +
  'can typically be completed within 72 hours of receipt. No vendor onboarding, sole-source ' +
  'justification, or procurement action required during the pilot phase.',
  y
);

y += 8;

doc.rect(M, y, W - M * 2, 290).fill('#08101C');
doc.rect(M, y, W - M * 2, 3).fill(BLUE);
doc.rect(M, y, 3, 290).fill(BLUE);

const formFields = [
  ['AGENCY NAME', ''],
  ['DEPARTMENT / DIVISION', ''],
  ['IT DIRECTOR / POC NAME + TITLE', ''],
  ['SECURITY CLEARANCE LEVEL', '(Unclassified / CUI / Secret / TS-SCI)'],
  ['EXISTING DATABASE PLATFORM', '(Oracle, SQL Server, IBM DB2, AWS GovCloud, other)'],
  ['PRIMARY API PROTOCOL', '(REST, SOAP, GraphQL, SFTP, MQ, other)'],
  ['CJIS POLICY AREA', '(Criminal History  /  Biometric ID  /  NCIC  /  Not applicable)'],
  ['USE CASE PRIORITY', '(Case 01 TOC  /  Case 02 Fleet  /  Case 03 Odometer  /  Case 04 Emergency  /  Case 05 Port)'],
  ['NETWORK CLASSIFICATION', '(Unclassified  /  CUI  /  Secret  /  TS-SCI)'],
  ['PREFERRED PILOT TIMELINE', '(Days 1–30  /  Days 31–60  /  Flexible)'],
  ['PILOT LOCATION(S)', ''],
  ['ADDITIONAL REQUIREMENTS', ''],
];

formFields.forEach(([label, ph], i) => {
  const fy = y + 18 + i * 22;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(BLUE)
     .text(label, M + 12, fy, { width: W - M * 2 - 20, characterSpacing: 0.4 });
  const lineY = fy + 13;
  doc.moveTo(M + 12, lineY).lineTo(W - M - 12, lineY).lineWidth(0.35).strokeColor(BLUE + '28').stroke();
  if (ph) doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '55')
     .text(ph, M + 14, lineY - 8, { width: W - M * 2 - 24 });
});

doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text(
     'Return to:  ronald@cuxtomcandyclub.ai  ·  3conyx.com/federal  ·  Reference: NVIS-PILOT-2026',
     M + 12, y + 280, { width: W - M * 2 - 24 }
   );

y += 308;

// Final authentication block
doc.rect(M, y, W - M * 2, 76).fill('#08101C');
doc.rect(M, y, W - M * 2, 2).fill(GOLD);
doc.rect(M, y + 74, W - M * 2, 2).fill(GOLD + '28');

doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GOLD)
   .text('DOCUMENT AUTHENTICATION', M + 14, y + 12, { characterSpacing: 2 });
doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
   .text(
     'This Federal Master Brief constitutes the official technical and operational specification for ' +
     'the NVIS Federal Pilot proposal by CUXTOMCANDYCLUB LLC. All infrastructure described is operational ' +
     'and deployment-ready as of March 30, 2026. All compliance mappings reference current 2025/2026 ' +
     'published standards: FBI CJIS Security Policy, NIST SP 800-53 Rev.5, FIPS 140-3, and CCPA/CPRA.',
     M + 14, y + 28, { width: W - M * 2 - 28, lineGap: 2 }
   );
doc.fontSize(6.5).font('Helvetica').fillColor(GOLD + '55')
   .text('SOVEREIGN TOKEN: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', M + 14, y + 60, { characterSpacing: 0.6 });

y += 90;

// Signature block — dual
doc.moveTo(M + 20, y).lineTo(M + 220, y).lineWidth(0.5).strokeColor(GOLD + '50').stroke();
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('ronald antonio cadet', M + 20, y + 6, { width: 200, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Chief Visionary Officer  ·  CUXTOMCANDYCLUB LLC', M + 10, y + 18, { width: 220, align: 'center' });

doc.moveTo(W - M - 220, y).lineTo(W - M - 20, y).lineWidth(0.5).strokeColor(BLUE + '50').stroke();
doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
   .text('Authorized Agency Representative', W - M - 220, y + 6, { width: 200, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor(MGRAY + '70')
   .text('Name / Title / Agency / Date', W - M - 220, y + 18, { width: 200, align: 'center' });

// Footer
doc.rect(0, H - 32, W, 32).fill('#08101C');
fullLine(H - 32, BLUE + '35', 0.5);
doc.fontSize(6.5).font('Helvetica').fillColor(MGRAY)
   .text('3C ONYX  ·  NVIS  ·  CUXTOMCANDYCLUB LLC  ·  New York  ·  3conyx.com  ·  cuxtomcandyclub.ai', 0, H - 22, { align: 'center', characterSpacing: 0.5 });
doc.fontSize(6.5).font('Helvetica').fillColor(BLUE + '70')
   .text('© 2026 CUXTOMCANDYCLUB LLC — Sovereign Asset  ·  CUI // INFRA-SEC  ·  Authorized Distribution Only', 0, H - 11, { align: 'center' });

// ── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
console.log('✓ PDF generated:', OUTPUT);
