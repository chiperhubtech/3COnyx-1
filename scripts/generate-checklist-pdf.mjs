import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  bufferPages: true,
});

const output = fs.createWriteStream("./3C_ONYX_Business_Checklist.pdf");
doc.pipe(output);

const BLACK = "#000000";
const GOLD = "#C9A85D";
const DARK_GRAY = "#333333";
const MED_GRAY = "#555555";
const LIGHT_BG = "#F8F6F1";

function drawHeader() {
  doc.rect(0, 0, doc.page.width, 100).fill(BLACK);

  doc.fill(GOLD).fontSize(28).font("Helvetica-Bold")
    .text("3C ONYX", 55, 25, { continued: false });
  doc.fill("#FFFFFF").fontSize(10).font("Helvetica")
    .text("GLOBAL AUTOMOTIVE LIQUIDITY NETWORK", 55, 58);
  doc.fill(GOLD).fontSize(8).font("Helvetica")
    .text("CUXTOMCANDYCLUB LLC  |  Ronald Antonio Cadet, Founder", 55, 75);

  doc.moveTo(55, 108).lineTo(doc.page.width - 55, 108).strokeColor(GOLD).lineWidth(2).stroke();
}

function sectionTitle(text, y) {
  doc.rect(55, y, doc.page.width - 110, 28).fill(BLACK);
  doc.fill(GOLD).fontSize(13).font("Helvetica-Bold").text(text, 65, y + 7);
  return y + 38;
}

function bulletItem(label, detail, y, indent = 70) {
  doc.fill(GOLD).fontSize(10).font("Helvetica-Bold").text("■", indent - 12, y);
  doc.fill(DARK_GRAY).fontSize(10).font("Helvetica-Bold").text(label, indent, y, { continued: true });
  if (detail) {
    doc.fill(MED_GRAY).font("Helvetica").text(` — ${detail}`, { continued: false });
  } else {
    doc.text("", { continued: false });
  }
  return doc.y + 4;
}

function subBullet(text, y, indent = 85) {
  doc.fill(MED_GRAY).fontSize(9).font("Helvetica").text("▸  " + text, indent, y);
  return doc.y + 3;
}

function checkboxItem(text, y, indent = 70) {
  doc.rect(indent - 2, y + 1, 10, 10).lineWidth(1).strokeColor(DARK_GRAY).stroke();
  doc.fill(DARK_GRAY).fontSize(10).font("Helvetica").text(text, indent + 15, y);
  return doc.y + 6;
}

drawHeader();

let y = 120;

doc.fill(BLACK).fontSize(16).font("Helvetica-Bold")
  .text("LAUNCH CHECKLIST & NET 30 VENDOR GUIDE", 55, y);
y += 18;
doc.fill(MED_GRAY).fontSize(9).font("Helvetica")
  .text("Prepared for CUXTOMCANDYCLUB LLC  |  Confidential  |  " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 55, y);
y += 25;

// SECTION 1
y = sectionTitle("PART 1: ACCOUNT SETUP CHECKLIST", y);

y = bulletItem("Stripe", "Payment processing (already integrated in codebase)", y);
y = checkboxItem("Complete Stripe account setup", y);
y = checkboxItem("Verify business identity", y);
y = checkboxItem("Connect bank account for payouts", y);
y += 4;

y = bulletItem("AWS (Amazon Web Services)", "Production deployment infrastructure", y);
y = checkboxItem("Create AWS business account under CUXTOMCANDYCLUB LLC", y);
y = checkboxItem("Set up Route 53, CloudFront, ECS Fargate, RDS PostgreSQL", y);
y = checkboxItem("Request Net 30 billing (see Part 2)", y);
y += 4;

y = bulletItem("Apple Developer Account", "$99/year — required for App Store", y);
y = checkboxItem("Enroll at developer.apple.com", y);
y = checkboxItem("DUNS Number required (free from D&B)", y);
y = checkboxItem("Business verification (CUXTOMCANDYCLUB LLC)", y);
y += 4;

y = bulletItem("Google Play Console", "$25 one-time — required for Google Play", y);
y = checkboxItem("Register at play.google.com/console", y);
y = checkboxItem("Verify business identity", y);
y += 4;

y = bulletItem("Oracle Cloud", "Additional infrastructure", y);
y = checkboxItem("Create Oracle Cloud business account", y);
y += 4;

y = bulletItem("Domain Name", "Production URL for 3C ONYX", y);
y = checkboxItem("Purchase/confirm domain (e.g., 3conyx.com)", y);
y = checkboxItem("SSL certificate (auto via AWS)", y);
y += 4;

y = bulletItem("Business / Legal", "Required for app stores and compliance", y);
y = checkboxItem("EIN / CUXTOMCANDYCLUB LLC registration confirmed", y);
y = checkboxItem("DUNS Number (free from dnb.com)", y);
y = checkboxItem("Privacy Policy & Terms of Service", y);
y += 4;

y = bulletItem("API Keys (When Ready to Go Live)", "Connect third-party services", y);
y = subBullet("Stripe Live Keys  |  Mapbox  |  MarketCheck  |  Plaid", y);
y = subBullet("DocuSign  |  Smartcar  |  Checkr  |  HyperTrack", y);
y += 4;

y = bulletItem("App Store Assets", "Screenshots, descriptions, icons", y);
y = checkboxItem("App Store screenshots (generated from live app)", y);
y = checkboxItem("App icon exported at Apple/Google required sizes", y);

// PAGE 2
doc.addPage();
drawHeader();
y = 120;

y = sectionTitle("PART 2: NET 30 VENDORS FOR BUSINESS CREDIT", y);

doc.fill(MED_GRAY).fontSize(9).font("Helvetica-Oblique")
  .text("These software vendors integrated into 3C ONYX offer Net 30 invoicing, which reports to Dun & Bradstreet (D&B) and helps build your business credit profile.", 55, y, { width: doc.page.width - 110 });
y = doc.y + 15;

// Tier 1
doc.fill(BLACK).fontSize(11).font("Helvetica-Bold").text("TIER 1 — CONFIRMED NET 30 (Best for Credit Building)", 55, y);
y = doc.y + 10;

y = bulletItem("Amazon Web Services (AWS)", "", y);
y = subBullet("Net 30 available on business accounts", y);
y = subBullet("Reports to Dun & Bradstreet — GOLD STANDARD for tech credit", y);
y = subBullet("Request Net 30 after 1-2 months of on-time card payments", y);
y = subBullet("Used for: Production deployment, hosting, databases", y);
y += 6;

y = bulletItem("Oracle Cloud", "", y);
y = subBullet("Enterprise contracts offer Net 30 invoiced billing", y);
y = subBullet("Reports to D&B — strong tradeline for business credit", y);
y = subBullet("Used for: Additional cloud infrastructure", y);
y += 6;

y = bulletItem("DocuSign", "", y);
y = subBullet("Business/Enterprise plans offer Net 30 invoicing", y);
y = subBullet("Works with D&B reporting", y);
y = subBullet("Used for: E-signatures on deals, contracts, title transfers", y);
y += 6;

y = bulletItem("Mapbox", "", y);
y = subBullet("Enterprise tier offers Net 30 invoiced billing", y);
y = subBullet("Used for: Maps, navigation, geo-location services", y);
y += 6;

y = bulletItem("Checkr", "", y);
y = subBullet("Business accounts with volume can get Net 30 terms", y);
y = subBullet("Used for: Background checks on service nodes", y);
y += 6;

y = bulletItem("HyperTrack", "", y);
y = subBullet("Enterprise plans typically invoice Net 30", y);
y = subBullet("Used for: Real-time logistics tracking, runner dispatch", y);
y += 10;

doc.fill(BLACK).fontSize(11).font("Helvetica-Bold").text("TIER 2 — NET 30 AVAILABLE AT SCALE", 55, y);
y = doc.y + 10;

y = bulletItem("Plaid", "Enterprise contracts go Net 30. Used for: Financial linking", y);
y += 3;
y = bulletItem("Smartcar", "Enterprise agreements include Net 30. Used for: Telematics", y);
y += 3;
y = bulletItem("MarketCheck", "API plans can be invoiced at business tier. Used for: Vehicle market data", y);
y += 10;

doc.fill(BLACK).fontSize(11).font("Helvetica-Bold").text("TIER 3 — CREDIT CARD BASED (No Net 30)", 55, y);
y = doc.y + 10;

y = bulletItem("Apple Developer Program", "$99/year, credit card only", y);
y += 3;
y = bulletItem("Google Play Console", "$25 one-time, credit card only", y);
y += 3;
y = bulletItem("Stripe", "They pay you — no credit building opportunity here", y);
y += 3;
y = bulletItem("Browserbase / Gumloop", "Smaller vendors, card billing only", y);
y += 15;

// STRATEGY BOX
doc.rect(55, y, doc.page.width - 110, 105).fill("#0A0A0A");
doc.fill(GOLD).fontSize(12).font("Helvetica-Bold").text("RECOMMENDED CREDIT-BUILDING STRATEGY", 70, y + 12);
doc.fill("#FFFFFF").fontSize(9).font("Helvetica").text(
  "1.  Get your DUNS Number first (free at dnb.com) — this is your business credit identity\n" +
  "2.  Start with AWS — set up business account, pay by card for 1-2 months, then request Net 30\n" +
  "3.  Stack Oracle Cloud and DocuSign Net 30 accounts next\n" +
  "4.  Add Mapbox and Checkr once volume justifies enterprise tiers\n" +
  "5.  Four Net 30 tradelines reporting to D&B = strong business credit profile\n\n" +
  "Confirm specific Net 30 terms directly with each vendor's sales team when signing up.",
  70, y + 30, { width: doc.page.width - 140, lineGap: 4 }
);

// FOOTER
y = doc.page.height - 50;
doc.moveTo(55, y).lineTo(doc.page.width - 55, y).strokeColor(GOLD).lineWidth(1).stroke();
doc.fill(MED_GRAY).fontSize(7).font("Helvetica")
  .text("3C ONYX — Global Automotive Liquidity Network  |  CUXTOMCANDYCLUB LLC  |  Architect: Ronald Antonio Cadet  |  Confidential", 55, y + 8, { align: "center", width: doc.page.width - 110 });

// Footer on page 1
doc.switchToPage(0);
y = doc.page.height - 50;
doc.moveTo(55, y).lineTo(doc.page.width - 55, y).strokeColor(GOLD).lineWidth(1).stroke();
doc.fill(MED_GRAY).fontSize(7).font("Helvetica")
  .text("3C ONYX — Global Automotive Liquidity Network  |  CUXTOMCANDYCLUB LLC  |  Architect: Ronald Antonio Cadet  |  Confidential", 55, y + 8, { align: "center", width: doc.page.width - 110 });

doc.end();

output.on("finish", () => {
  console.log("PDF generated: 3C_ONYX_Business_Checklist.pdf");
});
