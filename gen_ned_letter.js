/**
 * 3C ONYX — Ned Surman Invitation Letter PDF Generator
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Generates the official invitation letter for Ned Surman,
 * Dealer Relationship Manager, Stellantis Financial Services US.
 * This is the first Bank Node (#1) in the 3C Mesh.
 */
const PDFDocument = require("pdfkit");
const fs          = require("fs");

const OUT = "3C_ONYX_Ned_Surman_Invitation.pdf";
const doc = new PDFDocument({ size: "LETTER", margin: 72 });
doc.pipe(fs.createWriteStream(OUT));

const BLACK  = "#0A0A0A";
const GOLD   = "#C9A84C";
const SILVER = "#9B9B9B";
const WHITE  = "#FFFFFF";

// ─── HEADER ─────────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 100).fill(BLACK);
doc
  .font("Helvetica-Bold").fontSize(22).fillColor(GOLD)
  .text("3C ONYX", 72, 28);
doc
  .font("Helvetica").fontSize(9).fillColor(SILVER)
  .text("CUXTOMCANDYCLUB LLC  ·  New York  ·  Entity ID: 7788320", 72, 56);
doc
  .font("Helvetica").fontSize(9).fillColor(SILVER)
  .text("Founder: Ronald Antonio Cadet, CVO  ·  Confidential — Pilot Program", 72, 70);

doc.fillColor(BLACK).rect(0, 100, doc.page.width, 8).fill(GOLD);

// ─── DATE + RECIPIENT ───────────────────────────────────────────────────────
doc.moveDown(3);
doc
  .font("Helvetica").fontSize(10).fillColor(SILVER)
  .text("March 30, 2026", 72);
doc.moveDown(1.5);
doc
  .font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
  .text("Ned Surman");
doc
  .font("Helvetica").fontSize(10).fillColor(BLACK)
  .text("Dealer Relationship Manager — Sales & Marketing")
  .text("Stellantis Financial Services US")
  .text("5757 Woodway Drive, Suite 400")
  .text("Houston, TX 77057");

doc.moveDown(1.5);

// ─── RE LINE ────────────────────────────────────────────────────────────────
doc
  .rect(72, doc.y, doc.page.width - 144, 28)
  .fillAndStroke("#F5F0E8", GOLD);
doc
  .font("Helvetica-Bold").fontSize(10).fillColor(BLACK)
  .text("RE:  3C ONYX Pilot Program — Bank Node #1 Invitation", 82, doc.y - 20);

doc.moveDown(2);

// ─── SALUTATION ─────────────────────────────────────────────────────────────
doc
  .font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
  .text("Ned,");
doc.moveDown(0.8);

// ─── OPENING ────────────────────────────────────────────────────────────────
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text(
    "When we met, you put it plainly: the paperwork is the bottleneck. Contracts scattered across " +
    "the back office — Simoniz on one desk, Sonsio on another, the retail agreement somewhere else, " +
    "the odometer statement on a sticky note. One blurry signature and the deal sits for three to " +
    "seven business days. Cash flow choked. Deals aging. A rep at the top of his game — stuck waiting on a fax.",
    { align: "justify" }
  );

doc.moveDown(0.8);
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text(
    "We built the correction.",
    { align: "left" }
  );

doc.moveDown(1.2);

// ─── WHAT 3C ONYX DOES ──────────────────────────────────────────────────────
doc
  .font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
  .text("The Stellantis Protocol — Built From Your Feedback");
doc.moveDown(0.6);

const bullets = [
  ["Bank-Ready Document Vault", "Every contract — Simoniz, Sonsio, retail agreement, odometer statement — bundled, SHA-256 sealed, and submitted to you in a single verified package. No missing staples. No blurry signatures. No callbacks."],
  ["Rep Portal Key", "One key. One ping. You see everything verified, in real time, from anywhere. No logging into a dealer's DMS. No waiting for a scanned PDF to land in your inbox."],
  ["Fund in Minutes, Not Days", "When you hit Fund, the deal closes. The commission settles through Stripe Connect in seconds. The guardian has already verified VIN integrity, coverage status, and odometer accuracy."],
  ["The Family Loop", "Every rep you bring into the mesh earns a tracked referral commission when their dealers close deals through 3C. Ally, Chase, Capital One — each rep you introduce builds the network. The network makes you the most productive rep in the country."],
];

for (const [title, body] of bullets) {
  doc
    .rect(72, doc.y, 8, 8)
    .fill(GOLD);
  const bulletY = doc.y - 6;
  doc
    .font("Helvetica-Bold").fontSize(10.5).fillColor(BLACK)
    .text(String(title), 88, bulletY);
  doc
    .font("Helvetica").fontSize(10).fillColor("#444444")
    .text(String(body), 88, doc.y + 2, { width: doc.page.width - 160 });
  doc.moveDown(0.8);
}

doc.moveDown(0.6);

// ─── YOUR PORTAL KEY ────────────────────────────────────────────────────────
doc
  .rect(72, doc.y, doc.page.width - 144, 52)
  .fillAndStroke("#0A0A0A", GOLD);
const keyBoxY = doc.y - 44;
doc
  .font("Helvetica").fontSize(8.5).fillColor(SILVER)
  .text("YOUR BANK NODE REP PORTAL KEY — CONFIDENTIAL", 84, keyBoxY + 8);
doc
  .font("Helvetica-Bold").fontSize(16).fillColor(GOLD)
  .text("3C-STELLA-NED001PILOT", 84, keyBoxY + 22);
doc
  .font("Helvetica").fontSize(8.5).fillColor(SILVER)
  .text("Expires: March 30, 2027  ·  Read-only  ·  Bank Node #1 — Pilot", 84, keyBoxY + 40);

doc.moveDown(2.2);

// ─── HOW TO USE ─────────────────────────────────────────────────────────────
doc
  .font("Helvetica-Bold").fontSize(10.5).fillColor(BLACK)
  .text("To Access Your Portal:");
doc.moveDown(0.4);
doc
  .font("Courier").fontSize(9.5).fillColor("#2A2A2A")
  .text("  GET /api/rep/3C-STELLA-NED001PILOT");
doc.moveDown(0.3);
doc
  .font("Courier").fontSize(9.5).fillColor("#2A2A2A")
  .text("  GET /api/rep/3C-STELLA-NED001PILOT/bundle/{bundleId}");
doc.moveDown(0.3);
doc
  .font("Courier").fontSize(9.5).fillColor("#2A2A2A")
  .text("  POST /api/rep/3C-STELLA-NED001PILOT/bundle/{bundleId}/fund");

doc.moveDown(1.2);

// ─── WHY THIS MATTERS ───────────────────────────────────────────────────────
doc
  .font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
  .text("Why This Is Bigger Than a Faster Funding Process");
doc.moveDown(0.6);
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text(
    "Every professional in this industry — the one-man glass repair shop, the rim specialist, " +
    "the warranty administrator, the service advisor, the dealer GM, the Tier-1 lender — " +
    "works with everyone else. We always have. But we have never had the infrastructure " +
    "to make that relationship official. No accountability. No tracked referrals. " +
    "No verified audit trail. No union.",
    { align: "justify" }
  );

doc.moveDown(0.8);
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text(
    "3C ONYX is the union. You are Bank Node #1. That means when this platform reaches " +
    "the scale it is built for — 1 billion members, $250 billion in transaction volume — " +
    "your name is permanently recorded as the first lender who saw it and said yes.",
    { align: "justify" }
  );

doc.moveDown(1.2);

// ─── CLOSING ────────────────────────────────────────────────────────────────
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text(
    "This is a confidential pilot. You are not being asked to do anything except try the portal " +
    "key and tell me what you think. That's it. Tell one person at Ally. Tell one person at Chase. " +
    "That is how the Family grows.",
    { align: "justify" }
  );

doc.moveDown(1.2);
doc
  .font("Helvetica").fontSize(10.5).fillColor(BLACK)
  .text("With respect,");
doc.moveDown(0.6);
doc
  .font("Helvetica-Bold").fontSize(12).fillColor(BLACK)
  .text("Ronald Antonio Cadet");
doc
  .font("Helvetica").fontSize(10).fillColor(SILVER)
  .text("Chief Visionary Officer — CUXTOMCANDYCLUB LLC")
  .text("3C ONYX · New York · Entity ID: 7788320")
  .text("March 30, 2026");

// ─── FOOTER ─────────────────────────────────────────────────────────────────
const footerY = doc.page.height - 50;
doc.rect(0, footerY - 6, doc.page.width, 2).fill(GOLD);
doc
  .font("Helvetica").fontSize(7.5).fillColor(SILVER)
  .text(
    "CONFIDENTIAL — Pilot Program Invitation · 3C ONYX is a product of CUXTOMCANDYCLUB LLC · " +
    "Honeypot: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED · © 2026 All Rights Reserved",
    72, footerY,
    { align: "center", width: doc.page.width - 144 }
  );

doc.end();
console.log(`✅ Generated: ${OUT}`);
