'use strict';

/**
 * 3C ONYX — Growth & Capital Brief
 * Audience: VC · Bank · Government · Legal
 * Copy-paste friendly · Print ready
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUT = path.join(__dirname, '3C_ONYX_Growth_Brief.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  compress: false,          // keeps text fully selectable / copy-paste
  margins: { top: 54, bottom: 54, left: 64, right: 64 },
  info: {
    Title:   '3C ONYX — Growth & Capital Brief',
    Author:  'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: 'Path to 10 Million Members · $18M Total Capital Required',
  },
});

doc.pipe(fs.createWriteStream(OUT));

const W  = 612;
const M  = 64;
const CW = W - M * 2;

// ── Color palette ────────────────────────────────────────────────────────────
const BLK  = '#0A0A0A';
const GLD  = '#B8860B';
const DARK = '#1A1A1A';
const GRY  = '#555555';
const LGY  = '#888888';
const LGBG = '#F7F7F7';
const WHT  = '#FFFFFF';
const ACC  = '#0A0A0A';   // dark accent for section headers

// ── Helpers ──────────────────────────────────────────────────────────────────

function newPage() { doc.addPage(); }

function rule(y, color, weight) {
  color  = color  || '#CCCCCC';
  weight = weight || 0.6;
  doc.moveTo(M, y).lineTo(M + CW, y)
     .lineWidth(weight).strokeColor(color).stroke();
}

function sectionHeader(title, subtitle) {
  doc.rect(M, doc.y, CW, 36).fill(BLK);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(WHT)
     .text(title, M + 14, doc.y - 28, { characterSpacing: 1 });
  if (subtitle) {
    doc.fontSize(8.5).font('Helvetica').fillColor('#AAAAAA')
       .text(subtitle, M + 14, doc.y - 13, { characterSpacing: 0.5 });
  }
  doc.moveDown(0.4);
}

function audienceTag(label, color) {
  color = color || GLD;
  doc.rect(M, doc.y, CW, 28).fill(color);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
     .text(label, M + 14, doc.y - 20, { characterSpacing: 2 });
  doc.moveDown(0.6);
}

function kv(label, value, labelColor) {
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(labelColor || GLD)
     .text(label.toUpperCase() + '  ', M, doc.y, { continued: true, characterSpacing: 1 });
  doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
     .text(value);
  doc.moveDown(0.15);
}

function bullet(text, indent) {
  indent = indent || 0;
  var x = M + 10 + indent;
  doc.circle(x - 5, doc.y + 5.5, 2.5).fill(GLD);
  doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
     .text(text, x + 2, doc.y, { width: CW - 12 - indent });
  doc.moveDown(0.25);
}

function para(text, opts) {
  opts = opts || {};
  doc.fontSize(opts.size || 9.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(opts.color || DARK)
     .text(text, M, doc.y, { width: CW, lineGap: 3, align: opts.align || 'left' });
  doc.moveDown(0.5);
}

function spacer(amt) { doc.moveDown(amt || 0.5); }

function tableRow(col1, col2, col3, col4, isHeader) {
  var rh   = isHeader ? 20 : 18;
  var ry   = doc.y;
  var bg   = isHeader ? BLK : (tableRow._alt ? LGBG : WHT);
  tableRow._alt = !tableRow._alt;

  doc.rect(M, ry, CW, rh).fill(bg);

  var c1 = M + 6,   w1 = 100;
  var c2 = c1 + w1, w2 = 110;
  var c3 = c2 + w2, w3 = 110;
  var c4 = c3 + w3, w4 = CW - (c4 - M) - 6;

  var fc = isHeader ? WHT : DARK;
  var fn = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  var fs = isHeader ? 8.5 : 9;

  doc.fontSize(fs).font(fn).fillColor(fc)
     .text(col1, c1, ry + (isHeader ? 5 : 4), { width: w1 - 4 });
  if (col2 !== undefined)
    doc.fontSize(fs).font(fn).fillColor(isHeader ? '#AAAAAA' : GRY)
       .text(col2, c2, ry + (isHeader ? 5 : 4), { width: w2 - 4 });
  if (col3 !== undefined)
    doc.fontSize(fs).font(fn).fillColor(fc)
       .text(col3, c3, ry + (isHeader ? 5 : 4), { width: w3 - 4 });
  if (col4 !== undefined)
    doc.fontSize(fs).font(fn).fillColor(isHeader ? WHT : GLD)
       .text(col4, c4, ry + (isHeader ? 5 : 4), { width: w4, align: 'right', bold: true });

  doc.y = ry + rh + 1;
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, W, 120).fill(BLK);
doc.rect(0, 0, W, 4).fill(GLD);

doc.fontSize(30).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('3C ONYX', M, 22, { characterSpacing: 6 });

doc.fontSize(11).font('Helvetica').fillColor('#CCCCCC')
   .text('GROWTH & CAPITAL BRIEF', M, 60, { characterSpacing: 4 });

doc.fontSize(9).font('Helvetica').fillColor('#888888')
   .text('Path to 10 Million Members  ·  $18M Total Capital Required  ·  30–36 Month Timeline',
     M, 78, { characterSpacing: 0.5 });

doc.fontSize(8.5).font('Helvetica').fillColor('#666666')
   .text('Prepared for: Venture Capital  ·  Banking  ·  Government  ·  Legal',
     M, 96, { characterSpacing: 0.5 });

doc.y = 136;

// Audience badges
var badges = [
  { label: 'VENTURE CAPITAL',  color: '#0A0A0A' },
  { label: 'BANK',             color: '#1A3A5C' },
  { label: 'GOVERNMENT',       color: '#1A4A1A' },
  { label: 'LEGAL / LAW FIRM', color: '#4A1A00' },
];
var bx = M;
badges.forEach(function(b) {
  doc.rect(bx, 136, 108, 22).fill(b.color);
  doc.rect(bx, 136, 3, 22).fill(GLD);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(WHT)
     .text(b.label, bx + 8, 143, { width: 96, characterSpacing: 0.8 });
  bx += 114;
});

doc.y = 172;
rule(172, GLD, 1);
doc.y = 180;

// About section
para(
  'This brief presents the growth plan, capital requirements, and business case for 3C ONYX ' +
  '— a fully built, AI-powered automotive and financial services platform. The platform is live today. ' +
  'No members have been onboarded yet. This document explains what it will take to reach 10 million members, ' +
  'how long it will take, and exactly how much capital is required at each stage.',
  { size: 10 }
);

spacer(0.5);

// Key facts grid
var facts = [
  ['Platform Status',   'Fully built and operational — live as of March 2026'],
  ['Current Members',   '0 (pre-launch — invite-only launch pending capital)'],
  ['Target Members',    '10,000,000 (10 million)'],
  ['Timeline',          '30 to 36 months from first capital close'],
  ['Total Capital',     '$18,000,000 across three phases'],
  ['Seed Round Ask',    '$2,000,000 – $10,000,000 (Phase 1 + Phase 2 start)'],
  ['Platform Valuation','$150,000,000 (pre-revenue, builder\'s valuation basis)'],
  ['Founder',           'Ronald Antonio Cadet · Ron3C · CUXTOMCANDYCLUB LLC'],
  ['Entity',            'CUXTOMCANDYCLUB LLC · Florida, USA · Est. 2026'],
  ['Contact',           'ron@3conyx.com · www.3conyx.com'],
];

facts.forEach(function(f) { kv(f[0], f[1]); });

spacer(0.6);
rule(doc.y, GLD, 0.6);
spacer(0.4);

doc.fontSize(8.5).font('Helvetica').fillColor(LGY)
   .text(
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR AND PROFESSIONAL REVIEW ONLY\n' +
     '© 2026 CUXTOMCANDYCLUB LLC. ALL RIGHTS RESERVED. PROPRIETARY AND CONFIDENTIAL.',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — WHAT IS BUILT / THE PLATFORM
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader('SECTION 1 — WHAT IS ALREADY BUILT',
  'The platform exists. This is not a business plan. This is a capital deployment plan.');

spacer(0.3);
para(
  '3C ONYX is a fully operational technology platform. Every feature described below is built, ' +
  'tested, and live as of March 2026. Capital is required to launch, not to build.',
  { size: 10 }
);
spacer(0.3);

var built = [
  ['73-page platform',       'Complete web application with marketplace, member dashboard, finance hub, insurance center, creator economy, KYC onboarding, runner dispatch, and admin tools.'],
  ['Native mobile app',      'Full iOS and Android application built with Expo — same features as the web platform, available on both major mobile operating systems.'],
  ['12 AI agents deployed',  'Proprietary multi-agent system: AI Concierge (car buying), Trust Agent, Insurance Agent, Finance Agent, Runner Agent, Wisdom Engine, Creator Agent, KYC Agent, and more.'],
  ['Payment processing',     'Stripe integration — membership subscriptions, one-time transactions, and the 3% Dynasty Tech Fee collected automatically on qualifying transactions.'],
  ['WhatsApp messaging',     'Automated member communication, referral notifications, and support pipeline — fully operational.'],
  ['KYC compliance',         'Identity verification flow — members can verify and transact legally on day one.'],
  ['2,200+ lender network',  'Credit intelligence and loan pre-qualification connected to over 2,200 lending partners — matched by financial profile, not zip code.'],
  ['Insurance & GAP',        'Real auto insurance and GAP coverage quotes delivered inside the platform — no redirect to a third-party site.'],
  ['Blockchain VIN records', 'Tamper-proof vehicle ownership and service history stored on-chain — permanent, unalterable records.'],
  ['Runner economy',         'Gig runner dispatch system for automotive service delivery — verified operators, GPS routing, and task management.'],
];

built.forEach(function(b) {
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
     .text(b[0], M + 10, doc.y, { continued: true, width: 148 });
  doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
     .text('  —  ' + b[1], { width: CW - 158 });
  doc.moveDown(0.3);
});

spacer(0.5);
sectionHeader('SECTION 2 — THE 13 REVENUE STREAMS',
  'Revenue begins the day the first member transacts.');

spacer(0.3);

var streams = [
  ['1', 'ONYX Membership Subscriptions',      'Monthly or annual membership fees — tiered by access level.'],
  ['2', 'Dynasty Tech Fee (3%)',               'A 3% fee collected on every qualifying automotive transaction processed through the platform. This is the core toll-road revenue model.'],
  ['3', 'Automotive Finance Origination',      'Referral and origination fees from 2,200+ lending partners when members secure financing.'],
  ['4', 'Insurance & GAP Referral Fees',       'Carrier referral commissions when members purchase insurance or GAP coverage through the platform.'],
  ['5', 'Runner Task Commissions',             'Commission on every gig runner task dispatched — vehicle delivery, DMV runs, title transfers, logistics.'],
  ['6', 'Dealer & Fleet B2B Licensing',        'Monthly licensing fees paid by dealerships, fleet operators, and automotive businesses to access the platform.'],
  ['7', 'ONYX Source Procurement',             'Margin on wholesale parts and vehicle procurement sourced through the ONYX supplier network.'],
  ['8', 'Parts Marketplace',                   'Retail margin on automotive parts sold through the platform marketplace.'],
  ['9', 'Custom Build Configuration',          'Revenue from members configuring custom vehicles — build fees and configuration access.'],
  ['10','Creator Affiliate Network',           'Percentage of creator-driven transactions — content creators who bring members earn a share of the Dynasty Fee.'],
  ['11','Premium Concierge Services',          'White-glove automotive and financial advisory services billed per engagement.'],
  ['12','Data Intelligence',                   'Anonymized, consented market data sold to automotive industry partners and lenders (with member permission).'],
  ['13','Extended Warranty Referral',          'Referral commissions on extended warranty products matched to members during the vehicle purchase flow.'],
];

streams.forEach(function(s) {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GLD)
     .text(s[0] + '.', M + 4, doc.y, { continued: true, width: 18 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
     .text('  ' + s[1] + '  ', { continued: true });
  doc.fontSize(9).font('Helvetica').fillColor(GRY)
     .text('— ' + s[2], { width: CW - 28 });
  doc.moveDown(0.28);
});

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — GROWTH PLAN
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader('SECTION 3 — PATH TO 10 MILLION MEMBERS',
  'Three phases. 30 to 36 months. $18 million total.');

spacer(0.4);
para(
  'Growth is driven by three compounding forces already built into the platform: ' +
  '(1) WhatsApp referral infrastructure, (2) the Dynasty Fee creator incentive model, ' +
  'and (3) a mobile-first experience optimized for the communities we serve. ' +
  'Every member who benefits has a financial incentive to refer the next member.',
  { size: 10 }
);
spacer(0.5);

// Phase blocks
var phases = [
  {
    label:    'PHASE 1 — IGNITION',
    range:    'Months 1 – 6',
    target:   '0 to 10,000 Members',
    capital:  '$1,500,000',
    color:    '#1A1A1A',
    actions: [
      'Legal activation complete: Dynasty Trust, LLC structure, automotive dealer license, money transmitter exemption, insurance referral compliance.',
      'Invite-only ONYX Access Key launch — first 1,000 members seeded personally by founder and initial creator partners.',
      'Activate 10 automotive content creators and influencers with existing audiences in the target community.',
      'WhatsApp referral engine live — every member gets a unique referral link; Dynasty Fee creators earn on every referred transaction.',
      'At a K-factor of 1.5 (each member refers 1.5 more), 1,000 seeds reach 10,000 members within 4–6 months organically.',
      'First revenue dollar: first deal closed, first runner task dispatched, first finance origination completed.',
    ],
    funds: [
      'Legal activation (trust, licenses, compliance): $300,000',
      'First 10 creator partnerships and launch marketing: $250,000',
      'Cloud infrastructure and platform operations: $200,000',
      'First 2 hires (trust/compliance, customer success): $350,000',
      'Reserve / contingency: $400,000',
    ],
  },
  {
    label:    'PHASE 2 — EXPANSION',
    range:    'Months 6 – 18',
    target:   '10,000 to 500,000 Members',
    capital:  '$6,500,000',
    color:    '#1A3A5C',
    actions: [
      'Paid social acquisition begins: $500–$1,000/day targeting underserved automotive buyers in top 10 US markets.',
      'Runner network goes live in 5 major US cities — verified operators, GPS routing, DMV and title services operational.',
      'B2B dealer and fleet onboarding: dealerships and fleet operators pay monthly licensing fees to access the platform.',
      'Creator affiliate network expanded to 50+ partners — each driving their audience into the platform referral chain.',
      'All 13 revenue streams active — platform is generating measurable monthly recurring revenue.',
      'Series A preparation: traction metrics, unit economics documented, investor materials updated with live data.',
    ],
    funds: [
      'Paid social and influencer acquisition (12 months): $2,500,000',
      'Runner network launch — 5 cities, operator onboarding, logistics: $1,200,000',
      'Team expansion to 8–12 people (ops, compliance, sales, CS): $1,800,000',
      'Infrastructure scaling (cloud, security, monitoring): $600,000',
      'Reserve / contingency: $400,000',
    ],
  },
  {
    label:    'PHASE 3 — SOVEREIGNTY',
    range:    'Months 18 – 36',
    target:   '500,000 to 10,000,000 Members',
    capital:  '$10,000,000',
    color:    '#1A4A1A',
    actions: [
      'Series A raised at $20M–$50M on live traction metrics — institutional automotive or fintech fund leads.',
      'Geographic expansion into Latin America and the Caribbean — WhatsApp-native markets perfectly suited to this platform.',
      'Runner network expanded to 25+ cities nationally and internationally.',
      'ONYX Source parts wholesale marketplace live — direct B2B procurement pipeline operational.',
      'Platform grows largely on its own referral flywheel — Dynasty Fee model self-funds creator acquisition at scale.',
      '10 million members reached. 3% Dynasty Fee on $8T addressable annual automotive transaction volume.',
    ],
    funds: [
      'Geographic expansion (Latin America, Caribbean, Europe): $4,000,000',
      'Team growth to 30+ people — sales, legal, international ops: $3,500,000',
      'Infrastructure and security at global scale: $1,500,000',
      'Reserve / Series B preparation: $1,000,000',
    ],
  },
];

phases.forEach(function(ph) {
  doc.rect(M, doc.y, CW, 24).fill(ph.color);
  doc.rect(M, doc.y, 4, 24).fill(GLD);

  var ly = doc.y;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
     .text(ph.label, M + 14, ly + 5, { continued: true });
  doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
     .text('  ·  ' + ph.range);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#D4AF37')
     .text(ph.target + '   |   Capital: ' + ph.capital,
       W - M - 220, ly + 5, { width: 216, align: 'right' });
  doc.y = ly + 28;

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text('KEY ACTIONS', M + 10, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.25);

  ph.actions.forEach(function(a) {
    bullet(a, 4);
  });

  doc.moveDown(0.2);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text('USE OF ' + ph.capital + ' CAPITAL', M + 10, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.25);

  ph.funds.forEach(function(f) {
    var parts = f.split(':');
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
       .text(parts[0] + ':', M + 18, doc.y, { continued: true });
    doc.fontSize(9).font('Helvetica').fillColor(GRY)
       .text(parts[1] || '', { width: CW - 24 });
    doc.moveDown(0.2);
  });

  spacer(0.5);
  rule(doc.y, '#CCCCCC', 0.5);
  spacer(0.5);
});

// Capital summary table
sectionHeader('CAPITAL SUMMARY', 'Total required across all three phases.');

spacer(0.3);
tableRow._alt = false;
tableRow('Phase',   'Timeline',       'Members',           'Capital Required', true);
tableRow('Phase 1 — Ignition',   'Months 1–6',    '0 → 10,000',      '$1,500,000');
tableRow('Phase 2 — Expansion',  'Months 6–18',   '10K → 500,000',   '$6,500,000');
tableRow('Phase 3 — Sovereignty','Months 18–36',  '500K → 10,000,000','$10,000,000');

// Total row
doc.rect(M, doc.y, CW, 22).fill(BLK);
doc.rect(M, doc.y, 4, 22).fill(GLD);
var tr = doc.y;
doc.fontSize(10.5).font('Helvetica-Bold').fillColor(WHT)
   .text('TOTAL — 0 to 10 Million Members', M + 10, tr + 5, { continued: true });
doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('$18,000,000', W - M - 100, tr + 5, { width: 92, align: 'right' });
doc.y = tr + 26;

// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — AUDIENCE-SPECIFIC SECTIONS
// ════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeader('SECTION 4 — AUDIENCE-SPECIFIC SUMMARIES',
  'The same facts, framed for each reader.');

spacer(0.5);

// ── FOR VENTURE CAPITAL ──────────────────────────────────────────────────────
doc.rect(M, doc.y, CW, 22).fill('#0A0A0A');
doc.rect(M, doc.y, 4, 22).fill(GLD);
var ay = doc.y;
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('FOR VENTURE CAPITAL INVESTORS', M + 14, ay + 5, { characterSpacing: 1 });
doc.y = ay + 28;

para('This is a pre-revenue, pre-member seed investment in a fully built platform. The raise is $2M–$10M at a $150M founder\'s valuation. The platform addresses a $1.5T annual automotive transaction market, a $300B auto insurance market, and 100M+ underserved American consumers who have no comparable tool available to them today.', { size: 9.5 });

var vcPoints = [
  'Moat: 100% proprietary, closed-source platform with zero direct competitors in this category.',
  'AI-native: 12 autonomous agents replace $70M+/yr in human specialist cost — labor arbitrage is the business model.',
  'Revenue model: 13 streams including the 3% Dynasty Tech Fee — a toll-road that captures value on every transaction without holding inventory.',
  'Viral flywheel: WhatsApp referral + creator affiliate model built into the platform — CAC declines as the network grows.',
  'Exit paths: Strategic acquisition by a major OEM, insurance carrier, fintech, or financial institution. Comparable platforms: Carvana ($9B peak), OAK Street Health ($5.3B), Nubank ($30B).',
  'Series A trigger: 10,000 verified members + first $10,000 monthly recurring revenue unlocks institutional Series A at $20M–$50M.',
];
vcPoints.forEach(function(p) { bullet(p); });
spacer(0.5);
rule(doc.y);
spacer(0.5);

// ── FOR BANKS / SBA ──────────────────────────────────────────────────────────
doc.rect(M, doc.y, CW, 22).fill('#1A3A5C');
doc.rect(M, doc.y, 4, 22).fill(GLD);
var by = doc.y;
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('FOR BANKS & SBA LENDERS', M + 14, by + 5, { characterSpacing: 1 });
doc.y = by + 28;

para('3C ONYX is seeking an SBA Express loan of $150,000 to $350,000 as the initial capital bridge to activate Phase 1. The founder has $12,000 on deposit at Citizens Bank and a fully operational technology platform with documented replacement value exceeding $3.5 million. The loan proceeds fund legal activation, initial operational costs, and the first creator partnerships required to reach the first 1,000 members.', { size: 9.5 });

var bankPoints = [
  'Loan purpose: Legal activation, operating expenses, and initial go-to-market for a live technology platform.',
  'Collateral basis: The platform has documented replacement cost of $3.5M+ — the IP is the collateral.',
  'Repayment source: Membership subscription revenue and Dynasty Fee transaction income — begins at first member onboarding.',
  'Business model: Software as a service (SaaS) + marketplace transaction fee — predictable, recurring revenue structure.',
  'NAICS classification: 522390 (Other Activities Related to Credit Intermediation) and 541511 (Custom Computer Programming Services).',
  'Entity: CUXTOMCANDYCLUB LLC, Florida-registered, single-member LLC, Founder Ronald Antonio Cadet.',
  'Risk mitigation: The platform is fully built — loan funds are for market activation, not product development. Build risk is zero.',
];
bankPoints.forEach(function(p) { bullet(p); });
spacer(0.5);
rule(doc.y);
spacer(0.5);

// ── FOR GOVERNMENT ────────────────────────────────────────────────────────────
doc.rect(M, doc.y, CW, 22).fill('#1A4A1A');
doc.rect(M, doc.y, 4, 22).fill(GLD);
var gy = doc.y;
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('FOR GOVERNMENT AGENCIES & GRANT PROGRAMS', M + 14, gy + 5, { characterSpacing: 1 });
doc.y = gy + 28;

para('3C ONYX is a mission-driven technology platform that directly addresses systemic economic inequality in automotive access, financial services, and community wealth creation. It is founded by a Black entrepreneur and designed specifically to serve underserved communities — the populations most impacted by predatory lending, discriminatory insurance pricing, and lack of access to fair automotive financing.', { size: 9.5 });

var govPoints = [
  'Economic impact: Platform creates a direct pathway to wealth for underserved communities through the Dynasty Fee creator model — members earn income by growing the network.',
  'Financial inclusion: Connects members to 2,200+ lenders without bias by zip code, race, or neighborhood — matching by actual financial profile.',
  'Insurance equity: AI-powered insurance matching eliminates discriminatory rate-setting that costs underserved communities billions annually.',
  'Job creation: Runner economy and creator affiliate network create flexible income opportunities for community members with no startup cost.',
  'Grant alignment: Eligible for CDFI (Community Development Financial Institution) grants, SBA Community Navigator Program, MBDA (Minority Business Development Agency) programs, and state-level fintech innovation grants.',
  'Relevant SDGs: SDG 1 (No Poverty), SDG 8 (Decent Work and Economic Growth), SDG 10 (Reduced Inequalities), SDG 11 (Sustainable Communities).',
  'Founder: Black entrepreneur, 10+ years of industry experience, building for the community he comes from.',
];
govPoints.forEach(function(p) { bullet(p); });
spacer(0.5);
rule(doc.y);
spacer(0.5);

// ── FOR LAWYERS ──────────────────────────────────────────────────────────────
doc.rect(M, doc.y, CW, 22).fill('#4A1A00');
doc.rect(M, doc.y, 4, 22).fill(GLD);
var lwy = doc.y;
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('FOR LEGAL COUNSEL & LAW FIRMS', M + 14, lwy + 5, { characterSpacing: 1 });
doc.y = lwy + 28;

para('The following legal matters require immediate attention and are directly tied to Phase 1 capital deployment. Legal counsel is needed across five areas. This document is prepared to facilitate efficient legal onboarding and scope-of-work alignment.', { size: 9.5 });

var legalPoints = [
  'Entity structure: Conversion of CUXTOMCANDYCLUB LLC to optimal structure for seed investment (S-Corp, C-Corp, or holding company with operating LLC). Florida jurisdiction. Dynasty Trust overlay for founder IP protection.',
  'Automotive dealer licensing: Evaluation of dealer license requirements by state for the ONYX marketplace model — whether a dealer license is required for AI-facilitated introductions vs. direct transactions.',
  'Money transmitter compliance: Analysis of whether the Dynasty Tech Fee (3% transaction fee) and Runner payment flow require money transmitter licensing under FinCEN, Florida OFR, or state-by-state MSB rules.',
  'Insurance referral compliance: Confirmation of permissible referral fee structures with licensed insurance carriers in each state of operation — distinguishing referral from brokerage activity.',
  'ONYX Source agreement review: Supplier and procurement agreements for the parts marketplace and wholesale vehicle sourcing — UCC Article 2 compliance, indemnification, and warranty terms.',
  'Seed round documentation: SAFE note or preferred equity term sheet review, cap table structuring, and investor rights agreement — counsel needed for both founder and investor sides.',
  'IP ownership and assignment: All intellectual property (code, agents, trademarks, brand assets) must be formally assigned from founder to operating entity prior to any investment close.',
];
legalPoints.forEach(function(p) { bullet(p); });

// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — CLOSING / NEXT STEPS
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader('SECTION 5 — THE IMMEDIATE NEXT STEP',
  'The platform is built. The only variable is capital to activate it.');

spacer(0.5);

para(
  'Everything described in this document is built, tested, and operational. ' +
  'The platform is not seeking capital to build a product — it is seeking capital to deploy a product that already exists. ' +
  'This distinction separates 3C ONYX from nearly every other pre-launch investment you will review this year.',
  { size: 10 }
);

spacer(0.5);

// What happens at each capital tier
sectionHeader('WHAT YOUR CAPITAL DOES', '');
spacer(0.3);

var tiers = [
  {
    amount: '$150,000 – $350,000',
    source: 'SBA Express Loan / Bridge Capital',
    outcome: 'Legal activation complete. First 1,000 members onboarded. First revenue transaction completed. Platform publicly accessible for the first time.',
  },
  {
    amount: '$2,000,000',
    source: 'Minimum Seed Round',
    outcome: 'Phase 1 fully funded. Legal done. First 10 creator partners activated. WhatsApp referral live. First 10,000 members within 6 months. Runner network in 2 cities.',
  },
  {
    amount: '$5,000,000',
    source: 'Mid-Range Seed Round',
    outcome: 'Phase 1 and partial Phase 2 funded. 50,000+ members reachable within 12 months. Runner network in 5 cities. Full team of 8–10 people. First institutional data on CAC and LTV.',
  },
  {
    amount: '$10,000,000',
    source: 'Full Seed Round',
    outcome: 'Phase 1 and Phase 2 fully funded. 500,000 member target within 18 months. All 13 revenue streams fully operational. Series A ready with live traction metrics.',
  },
];

tiers.forEach(function(t) {
  doc.rect(M, doc.y, CW, 20).fill(LGBG);
  doc.rect(M, doc.y, 4, 20).fill(GLD);
  var ty = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
     .text(t.amount, M + 10, ty + 4, { continued: true });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGY)
     .text('  ·  ' + t.source);
  doc.y = ty + 24;
  doc.fontSize(9).font('Helvetica').fillColor(GRY)
     .text(t.outcome, M + 10, doc.y, { width: CW - 14, lineGap: 2 });
  doc.moveDown(0.6);
});

spacer(0.5);
rule(doc.y, GLD, 0.75);
spacer(0.5);

// Single bottleneck
doc.rect(M, doc.y, CW, 52).fill(BLK);
doc.rect(M, doc.y, 4, 52).fill(GLD);
var bny = doc.y;
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('THE SINGLE BOTTLENECK', M + 14, bny + 8, { characterSpacing: 2 });
doc.fontSize(13).font('Helvetica-Bold').fillColor(WHT)
   .text('The platform is built. The bottleneck is the first 1,000 members.', M + 14, bny + 22, { width: CW - 20 });
doc.fontSize(9).font('Helvetica').fillColor('#888888')
   .text('Everything else — revenue, Series A, 10 million members — flows from that single milestone.', M + 14, bny + 40, { width: CW - 20 });
doc.y = bny + 58;

spacer(0.6);

// Contact / CTA
sectionHeader('CONTACT & NEXT STEPS', '');
spacer(0.4);

kv('Founder',        'Ronald Antonio Cadet  ·  Ron3C');
kv('Title',          'Founder & CEO');
kv('Entity',         'CUXTOMCANDYCLUB LLC');
kv('Email',          'ron@3conyx.com');
kv('Website',        'www.3conyx.com');
kv('Platform Demo',  'Available upon request — live platform, all features operational');
kv('Seed Round',     '$2,000,000 – $10,000,000  ·  Raising now');
kv('Next Step',      'Reply to schedule a 30-minute live platform walkthrough');

spacer(0.8);
rule(doc.y, GLD, 0.75);
spacer(0.5);

doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
   .text(
     '"One person built this. ONYX is the platform this industry never knew it needed.\n' +
     'The communities that were overlooked are about to be served — in luxury."',
     M, doc.y, { width: CW, align: 'center', lineGap: 4 }
   );
spacer(0.4);
doc.fontSize(8).font('Helvetica-Bold').fillColor(LGY)
   .text('— Ronald Antonio Cadet, Founder & CEO, CUXTOMCANDYCLUB LLC',
     M, doc.y, { width: CW, align: 'center' });

spacer(0.8);

doc.fontSize(7.5).font('Helvetica').fillColor('#999999')
   .text(
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR AND PROFESSIONAL REVIEW ONLY  ·  © 2026 CUXTOMCANDYCLUB LLC\n' +
     'ALL RIGHTS RESERVED. PROPRIETARY AND CONFIDENTIAL. DO NOT DISTRIBUTE WITHOUT WRITTEN AUTHORIZATION.\n' +
     'FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );

doc.end();
console.log('Growth brief written to', OUT);
