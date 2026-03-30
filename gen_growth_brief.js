'use strict';

/**
 * 3C ONYX — Real Growth Plan v2
 * 4 Engines to 10 Million Members · $4.2M · Self-Funding at Scale
 * Audience: VC · Bank · Government · Legal
 * compress: false — fully copy-paste / print-ready
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUT = path.join(__dirname, '3C_ONYX_Growth_Brief.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  compress: false,
  margins: { top: 54, bottom: 54, left: 64, right: 64 },
  info: {
    Title:   '3C ONYX — Real Growth Plan: 4 Engines to 10 Million Members',
    Author:  'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: '$4.2M Total Capital Required · 30–36 Months · Self-Funding at Scale',
  },
});

doc.pipe(fs.createWriteStream(OUT));

const W  = 612;
const M  = 64;
const CW = W - M * 2;

// ── Color palette ──────────────────────────────────────────────────────────
const BLK   = '#0A0A0A';
const GLD   = '#B8860B';
const DARK  = '#1A1A1A';
const GRY   = '#555555';
const LGY   = '#888888';
const LGBG  = '#F5F5F5';
const WHT   = '#FFFFFF';
const NAVY  = '#1A3A5C';
const FOREST= '#1A4A1A';
const RUST  = '#4A1A00';

// ── Helpers ────────────────────────────────────────────────────────────────

function newPage() { doc.addPage(); }

function rule(y, color, weight) {
  color  = color  || '#CCCCCC';
  weight = weight || 0.6;
  doc.moveTo(M, y).lineTo(M + CW, y)
     .lineWidth(weight).strokeColor(color).stroke();
}

function sectionHeader(title, subtitle) {
  var sy = doc.y;
  doc.rect(M, sy, CW, subtitle ? 40 : 30).fill(BLK);
  doc.rect(M, sy, 4, subtitle ? 40 : 30).fill(GLD);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHT)
     .text(title, M + 14, sy + 7, { characterSpacing: 0.8 });
  if (subtitle) {
    doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
       .text(subtitle, M + 14, sy + 23, { characterSpacing: 0.3 });
  }
  doc.y = sy + (subtitle ? 40 : 30) + 8;
}

function audienceTag(label, color) {
  color = color || GLD;
  var ay = doc.y;
  doc.rect(M, ay, CW, 26).fill(color);
  doc.rect(M, ay, 4, 26).fill(GLD);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(WHT)
     .text(label, M + 14, ay + 7, { characterSpacing: 1.5 });
  doc.y = ay + 26 + 8;
}

function kv(label, value) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
     .text(label.toUpperCase(), M, doc.y, { continued: true, characterSpacing: 0.8, width: 160 });
  doc.fontSize(9).font('Helvetica').fillColor(DARK)
     .text('  ' + value, { width: CW - 164 });
  doc.moveDown(0.15);
}

function bullet(text, indent, goldDot) {
  indent  = indent  || 0;
  goldDot = goldDot !== false;
  var x = M + 12 + indent;
  if (goldDot) doc.circle(x - 6, doc.y + 5.5, 2.2).fill(GLD);
  doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
     .text(text, x, doc.y, { width: CW - 14 - indent, lineGap: 2 });
  doc.moveDown(0.25);
}

function boldBullet(label, text, indent) {
  indent = indent || 0;
  var x = M + 12 + indent;
  doc.circle(x - 6, doc.y + 5.5, 2.2).fill(GLD);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
     .text(label + ' ', x, doc.y, { continued: true });
  doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
     .text(text, { width: CW - 14 - indent - doc.widthOfString(label + ' ') });
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

function engineBlock(num, title, tagline, color, rows) {
  var ey = doc.y;
  // Engine header bar
  doc.rect(M, ey, CW, 32).fill(color);
  doc.rect(M, ey, 5, 32).fill(GLD);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GLD)
     .text('ENGINE ' + num, M + 14, ey + 5, { characterSpacing: 1.5 });
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHT)
     .text(title, M + 14, ey + 16);
  doc.fontSize(8.5).font('Helvetica').fillColor('#AAAAAA')
     .text(tagline, M + CW - 220, ey + 5, { width: 212, align: 'right' });
  doc.y = ey + 36;
}

function mathBox(lines) {
  var by = doc.y;
  var bh = lines.length * 16 + 14;
  doc.rect(M, by, CW, bh).fill(LGBG);
  doc.rect(M, by, 3, bh).fill(GLD);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
     .text('THE MATH', M + 10, by + 5, { characterSpacing: 1.5 });
  var my = by + 17;
  lines.forEach(function(l) {
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
       .text(l, M + 10, my, { width: CW - 20 });
    my += 16;
  });
  doc.y = by + bh + 8;
}

function phaseBlock(label, range, target, capital, color, actions, funds) {
  var py = doc.y;
  doc.rect(M, py, CW, 28).fill(color);
  doc.rect(M, py, 4, 28).fill(GLD);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
     .text(label, M + 14, py + 5);
  doc.fontSize(8.5).font('Helvetica').fillColor('#AAAAAA')
     .text(range + '  ·  ' + target, M + 14, py + 18);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#D4AF37')
     .text(capital, W - M - 110, py + 9, { width: 102, align: 'right' });
  doc.y = py + 32;

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text('KEY ACTIONS', M + 10, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.25);
  actions.forEach(function(a) { bullet(a, 4); });

  doc.moveDown(0.1);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text('USE OF ' + capital, M + 10, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.25);
  funds.forEach(function(f) {
    var colon = f.indexOf(':');
    var lbl = colon >= 0 ? f.slice(0, colon) : f;
    var val = colon >= 0 ? f.slice(colon + 1) : '';
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
       .text(lbl + ':', M + 18, doc.y, { continued: true });
    doc.fontSize(9).font('Helvetica').fillColor(GRY)
       .text(val, { width: CW - 24 });
    doc.moveDown(0.2);
  });

  spacer(0.4);
  rule(doc.y, '#CCCCCC', 0.5);
  spacer(0.4);
}

function tableRow4(c1, c2, c3, c4, isHeader) {
  var rh = isHeader ? 20 : 18;
  var ry = doc.y;
  var bg = isHeader ? BLK : (tableRow4._alt ? LGBG : WHT);
  tableRow4._alt = !tableRow4._alt;
  doc.rect(M, ry, CW, rh).fill(bg);

  var fc  = isHeader ? WHT : DARK;
  var fn  = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  var fs  = isHeader ? 8 : 9;
  var w1  = 150, w2 = 90, w3 = 100, w4 = CW - 150 - 90 - 100;
  var x1  = M + 6, x2 = x1 + w1, x3 = x2 + w2, x4 = x3 + w3;

  doc.fontSize(fs).font(fn).fillColor(fc).text(c1, x1, ry + (isHeader ? 5 : 4), { width: w1 - 4 });
  doc.fontSize(fs).font(fn).fillColor(isHeader ? '#AAAAAA' : GRY).text(c2, x2, ry + (isHeader ? 5 : 4), { width: w2 - 4 });
  doc.fontSize(fs).font(fn).fillColor(fc).text(c3, x3, ry + (isHeader ? 5 : 4), { width: w3 - 4 });
  doc.fontSize(fs).font(isHeader ? 'Helvetica-Bold' : 'Helvetica-Bold').fillColor(isHeader ? WHT : GLD)
     .text(c4, x4, ry + (isHeader ? 5 : 4), { width: w4, align: 'right' });

  doc.y = ry + rh + 1;
}

function checkPage(needed) {
  needed = needed || 120;
  var pageH = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > pageH) newPage();
}


// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, W, 130).fill(BLK);
doc.rect(0, 0, W, 5).fill(GLD);
doc.rect(0, 125, W, 1).fill(GLD);

doc.fontSize(34).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('3C ONYX', M, 20, { characterSpacing: 7 });

doc.fontSize(12).font('Helvetica').fillColor('#CCCCCC')
   .text('REAL GROWTH PLAN', M, 62, { characterSpacing: 4 });

doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
   .text('4 Engines to 10 Million Members', M, 80, { characterSpacing: 0.5 });

doc.fontSize(8.5).font('Helvetica').fillColor('#888888')
   .text('$4.2M Total Capital Required  ·  30–36 Months  ·  Self-Funding at Scale',
     M, 96, { characterSpacing: 0.5 });

doc.fontSize(8).font('Helvetica').fillColor('#666666')
   .text('Prepared for: VC  ·  Bank  ·  Government  ·  Legal',
     M, 112, { characterSpacing: 0.5 });

doc.y = 146;

// Audience badges
var badges = [
  { label: 'VENTURE CAPITAL',  color: BLK    },
  { label: 'BANK / SBA',       color: NAVY   },
  { label: 'GOVERNMENT',       color: FOREST },
  { label: 'LEGAL / LAW FIRM', color: RUST   },
];
var bx = M;
badges.forEach(function(b) {
  doc.rect(bx, 146, 108, 22).fill(b.color);
  doc.rect(bx, 146, 3, 22).fill(GLD);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(WHT)
     .text(b.label, bx + 8, 153, { width: 96, characterSpacing: 0.8 });
  bx += 114;
});

doc.y = 182;
rule(182, GLD, 1);
doc.y = 192;

para(
  'This document presents the real growth plan for 3C ONYX — a fully built, AI-powered automotive ' +
  'and financial services platform. The platform is live today, with zero outside members. Growth is ' +
  'driven by four built-in engines that require almost no paid acquisition. Total outside capital ' +
  'required: $4.2M across two funded phases. Phase 3 is self-funded by the business.',
  { size: 10 }
);

spacer(0.4);

var facts = [
  ['Platform Status',   'Fully built and operational — live as of March 2026'],
  ['Current Members',   '0 (pre-launch — invite-only launch pending capital)'],
  ['Target Members',    '10,000,000 (10 million)'],
  ['Timeline',          '30 to 36 months from first capital close'],
  ['Total Outside Capital', '$4,200,000 across Phase 1 and Phase 2 only'],
  ['Phase 3',           'Self-funded — platform revenue covers full operating costs'],
  ['Seed Round Ask',    '$2,000,000 – $4,200,000 (Phase 1 + Phase 2)'],
  ['Platform Valuation','$150,000,000 (pre-revenue, builder\'s valuation basis)'],
  ['Founder',           'Ronald Antonio Cadet · Ron3C · CUXTOMCANDYCLUB LLC'],
  ['Entity',            'CUXTOMCANDYCLUB LLC · Florida, USA · Est. 2026'],
  ['Contact',           'ron@3conyx.com · www.3conyx.com'],
];
facts.forEach(function(f) { kv(f[0], f[1]); });

spacer(0.5);
rule(doc.y, GLD, 0.6);
spacer(0.3);

doc.fontSize(8).font('Helvetica').fillColor(LGY)
   .text(
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR AND PROFESSIONAL REVIEW ONLY\n' +
     '© 2026 CUXTOMCANDYCLUB LLC. ALL RIGHTS RESERVED. PROPRIETARY AND CONFIDENTIAL.',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );


// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — SECTION 1: THE 4 GROWTH ENGINES (overview)
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader(
  'SECTION 1 — THE 4 GROWTH ENGINES',
  'How 3C ONYX reaches 10 million members at near-zero paid acquisition cost.'
);

spacer(0.2);
para(
  'Most tech startups grow by spending money: paid social, Google Ads, agency retainers, ' +
  'and generic campaigns. This platform does not. Every growth mechanism below is structural — ' +
  'built directly into the product, the revenue model, or the community. ' +
  'The result: a cost-per-acquisition that declines as the network grows.',
  { size: 10 }
);
spacer(0.3);

// Engine summary cards
var engines = [
  {
    num:   '01',
    title: 'Micro-Influencer Network',
    desc:  '50 automotive creators seed 50,000 members in 6 months. 70% work rev-share, not cash.',
    cost:  '$30K–$50K total cash outlay',
    color: '#141414',
  },
  {
    num:   '02',
    title: 'UGC Content Flywheel',
    desc:  'Members who get real results post their stories. Dynasty Fee makes every share profitable for them.',
    cost:  '$0–$3 CAC from organic content',
    color: '#1A2A3A',
  },
  {
    num:   '03',
    title: 'Runner Ambassador Ground Game',
    desc:  '500 branded runners generate 1,000 new member signups per month from physical touchpoints.',
    cost:  '$20,000/month at scale (500 runners)',
    color: '#1A3A1A',
  },
  {
    num:   '04',
    title: 'WhatsApp Referral Chain',
    desc:  'K-factor 2.0 target. 1,000 seeds → 10,000 → 100,000 → 1M in 3 doubling cycles.',
    cost:  '$0 marginal — built into platform',
    color: '#3A1A00',
  },
];

engines.forEach(function(e) {
  var ey = doc.y;
  doc.rect(M, ey, CW, 44).fill(e.color);
  doc.rect(M, ey, 4, 44).fill(GLD);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text('ENGINE ' + e.num, M + 12, ey + 6, { characterSpacing: 1.5 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
     .text(e.title, M + 12, ey + 18);
  doc.fontSize(9).font('Helvetica').fillColor('#BBBBBB')
     .text(e.desc, M + 12, ey + 30, { width: CW - 24 - 130 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#D4AF37')
     .text(e.cost, W - M - 130, ey + 30, { width: 122, align: 'right' });
  doc.y = ey + 48;
  spacer(0.15);
});

spacer(0.5);

// Key principle callout
var callY = doc.y;
doc.rect(M, callY, CW, 42).fill(LGBG);
doc.rect(M, callY, 4, 42).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('The Critical Insight:', M + 12, callY + 8, { continued: true });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     '  Traditional platforms pay to acquire customers. 3C ONYX pays customers to ' +
     'acquire customers — through Dynasty Fee rev-share. The incentive structure IS the growth engine.',
     { width: CW - 20 }
   );
doc.y = callY + 46;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — ENGINE 1: MICRO-INFLUENCER NETWORK
// ════════════════════════════════════════════════════════════════════════════

newPage();

engineBlock('01', 'Micro-Influencer Network',
  'Rev-share > cash · $30K–$50K seeds 50,000 members', '#141414');

spacer(0.3);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What It Is and How It Works', M, doc.y);
doc.moveDown(0.2);
para(
  'The platform partners with 50 automotive micro-influencers — creators with 10,000 to 200,000 ' +
  'followers in the automotive, car-buying, and personal finance communities. ' +
  'These creators produce authentic content about real member experiences: loan approvals, ' +
  'money saved, vehicles delivered. They do not produce ads. They document results.',
  { size: 9.5 }
);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('Why It Costs Almost Nothing', M, doc.y);
doc.moveDown(0.2);
[
  '30% of influencer partners receive cash payments: $300–$500 per post or campaign.',
  '70% of influencer partners work on Dynasty Fee rev-share: they earn 3% permanently on every transaction their referred members ever complete. No cash upfront. Lifetime income instead.',
  'A micro-influencer who brings in 1,000 members who average 2 transactions per year at $1,000 blended value earns $60,000/year — passively, indefinitely. That is a better deal than a $1,000 campaign fee.',
  'The rev-share model turns influencers into long-term distribution partners, not one-time ad placements.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

mathBox([
  '50 influencers × avg. audience reach: 20,000 engaged followers each = 1,000,000 engaged impressions',
  '5% conversion rate on engaged automotive audience → 1,000 members per influencer',
  '50 influencers × 1,000 members each = 50,000 members in 6 months',
  'Cash cost for 15 paid influencers × $400/post × 3 posts = $18,000 total',
  'Rev-share cost for 35 unpaid influencers = $0 upfront · only pays when members transact',
  'TOTAL CASH COST TO SEED 50,000 MEMBERS: $30,000 – $50,000',
]);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What Is Already Built in the Platform', M, doc.y);
doc.moveDown(0.2);
[
  'Creator Agent: dedicated AI agent that manages creator onboarding, link generation, performance tracking, and Dynasty Fee attribution.',
  'Unique referral links: every influencer partner gets a trackable WhatsApp and web referral link — no manual tracking required.',
  'Automated Dynasty Fee calculation: the Stripe integration automatically calculates, collects, and credits the 3% Dynasty Fee split.',
  'Creator dashboard: real-time earnings, member count, and transaction history visible to every creator partner.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

var callY2 = doc.y;
doc.rect(M, callY2, CW, 32).fill(LGBG);
doc.rect(M, callY2, 4, 32).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('Benchmark:', M + 12, callY2 + 8, { continued: true });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     '  DoorDash seeded its earliest markets with local food influencer partnerships. ' +
     'Airbnb used host influencers. The 3C ONYX model is the same structure — authentic community advocates, not ads.',
     { width: CW - 20 }
   );
doc.y = callY2 + 36;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — ENGINE 2: UGC FLYWHEEL
// ════════════════════════════════════════════════════════════════════════════

newPage();

engineBlock('02', 'UGC Content Flywheel',
  '$0–$3 CAC · 30–40% of total member growth', '#1A2A3A');

spacer(0.3);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What It Is and How It Works', M, doc.y);
doc.moveDown(0.2);
para(
  'User-generated content (UGC) is the most trusted form of marketing that exists — and ' +
  'it cannot be purchased. When a member gets their first car loan approved after being ' +
  'rejected everywhere else, they post. When the runner delivers their vehicle and they ' +
  'never had to take a day off work, they post. When they save $3,400 on insurance because ' +
  'the AI agent found a carrier that matches their actual risk profile — they post. ' +
  '3C ONYX does not need to create this content. It creates the conditions for members to create it.',
  { size: 9.5 }
);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('Why It Costs Almost Nothing', M, doc.y);
doc.moveDown(0.2);
[
  'Content cost: $0. Members produce content voluntarily because the results are real and shareable.',
  'Incentive: Dynasty Fee. Every member who refers another member via their content earns 3% on that member\'s transactions — forever. Sharing is financially rational.',
  'Platform amplification: the Creator Agent identifies high-performing UGC and surfaces it to the creator affiliate network for resharing.',
  'TikTok, Instagram Reels, and YouTube Shorts: short-form automotive content is one of the highest-engagement niches on every platform. One viral video can deliver 5,000 signups at $0 cost.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

mathBox([
  'UGC contribution estimate: 30–40% of total member growth at zero paid acquisition cost',
  'At 500,000 members: 150,000–200,000 members sourced from organic UGC',
  'CAC from UGC: $0 content cost ÷ 150,000 members = $0.00 marginal cost per member',
  'Dynasty Fee incentive cost: 3% paid only when that member transacts — not upfront',
  'Effective UGC CAC (including rev-share): $1.50–$3.00 per member at scale',
  'BENCHMARK: Nubank grew to 300M+ users at under $5 CAC using this exact model in Brazil',
]);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What Is Already Built in the Platform', M, doc.y);
doc.moveDown(0.2);
[
  'WhatsApp referral link generation: every member gets a unique trackable link embedded in the app — one tap to share.',
  'Dynasty Fee auto-attribution: the platform automatically tracks which member referred which signup and routes the 3% split accordingly.',
  'Creator Community hub: a dedicated section of the platform where member stories, vehicle reviews, and automotive content are curated and shared.',
  'Social sharing integrations: native share buttons for TikTok, Instagram, and YouTube inside the member dashboard.',
  'AI-powered story prompts: the Wisdom Engine identifies members with notable results and prompts them to share — opt-in, frictionless.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

var callY3 = doc.y;
doc.rect(M, callY3, CW, 32).fill(LGBG);
doc.rect(M, callY3, 4, 32).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('The Nubank Model:', M + 12, callY3 + 8, { continued: true });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     '  Nubank built 300M+ users in Latin America primarily through WhatsApp sharing and ' +
     'word-of-mouth. Same target communities. Same channels. Same economic profile. ' +
     '3C ONYX\'s target market is WhatsApp-primary and referral-receptive.',
     { width: CW - 20 }
   );
doc.y = callY3 + 36;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — ENGINE 3: RUNNER AMBASSADOR GROUND GAME
// ════════════════════════════════════════════════════════════════════════════

newPage();

engineBlock('03', 'Runner Ambassador Ground Game',
  '1,000 members/month · $20K/month at 500 runners', '#1A3A1A');

spacer(0.3);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What It Is and How It Works', M, doc.y);
doc.moveDown(0.2);
para(
  'The ONYX Runner Network is a gig economy layer inside the platform — verified operators ' +
  'who perform automotive service tasks: vehicle delivery, DMV runs, title transfers, ' +
  'inspection escorts, and logistics. Every runner is a walking brand presence in the physical world. ' +
  'They wear ONYX-branded gear, drive ONYX-branded vehicles, and carry ONYX-branded devices. ' +
  'Every job is an ad impression. Every conversation is a conversion opportunity.',
  { size: 9.5 }
);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('Why It Costs Almost Nothing', M, doc.y);
doc.moveDown(0.2);
[
  'Runners earn their primary income from task commissions — not from the referral bonus.',
  'The $20 referral bonus per verified member signup is paid only on conversion, never on attempts.',
  'Runners who refer members also earn Dynasty Fee rev-share on those members\' future transactions — compounding their income.',
  'ONYX-branded gear has a one-time cost of approximately $150–$200 per runner. It is an investment, not an expense — it keeps working every day.',
  'No agency fees, no media buys, no CPM costs. The runner network replaces out-of-home advertising at a fraction of the cost.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

mathBox([
  '500 runners × 20 jobs/month = 10,000 physical brand touchpoints per month',
  '10% of job touchpoints convert to app download/inquiry = 1,000 leads/month',
  '100% of leads who complete KYC verification = verified member signup',
  'Conservative assumption: 1,000 verified signups/month from Runner Engine alone',
  'Cost: 1,000 signups × $20 referral bonus = $20,000/month',
  'Effective CAC from Runner Engine: $20.00 per member (vs. $50–$200 industry average for paid social)',
  'PLUS: runners who refer members earn Dynasty Fee forever — incentive compounds over time',
]);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What Is Already Built in the Platform', M, doc.y);
doc.moveDown(0.2);
[
  'Runner dispatch system: full gig economy backend — verified runner profiles, GPS routing, task management, and real-time status tracking.',
  'Runner Agent: dedicated AI agent that assigns tasks, optimizes routing, manages runner performance, and flags issues.',
  'Referral attribution: runner-specific referral links tied to their runner ID — every signup they generate is automatically tracked and compensated.',
  'Runner dashboard: earnings tracker, task queue, referral performance, and Dynasty Fee accumulation — all visible in-app.',
  'Onboarding flow: runners complete background check, vehicle verification, and brand kit pickup through the platform — no manual coordination required.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

var callY4 = doc.y;
doc.rect(M, callY4, CW, 32).fill(LGBG);
doc.rect(M, callY4, 4, 32).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('Benchmark:', M + 12, callY4 + 8, { continued: true });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     '  Uber and DoorDash used driver/courier networks as their primary acquisition channel in ' +
     'new markets. The runner is both a product fulfillment operator and a field sales rep — ' +
     'two functions at the cost of one.',
     { width: CW - 20 }
   );
doc.y = callY4 + 36;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 6 — ENGINE 4: WHATSAPP REFERRAL CHAIN
// ════════════════════════════════════════════════════════════════════════════

newPage();

engineBlock('04', 'WhatsApp Referral Chain',
  'K-factor 2.0 · 1,000 seeds → 1M in 3 cycles · $0 marginal', '#3A1A00');

spacer(0.3);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What It Is and How It Works', M, doc.y);
doc.moveDown(0.2);
para(
  'WhatsApp is the primary communication platform for 3C ONYX\'s target communities — ' +
  'Caribbean diaspora, Latin American households, and underserved urban populations across the US. ' +
  'These communities do not discover financial services through Google ads. They discover them ' +
  'through trusted contacts in group chats. A referral from a cousin is worth more than ' +
  'a 30-second TV spot. The platform is built natively for this distribution channel.',
  { size: 9.5 }
);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('Why It Costs Almost Nothing', M, doc.y);
doc.moveDown(0.2);
[
  'WhatsApp messaging infrastructure: already built and operational — automated referral notifications, signup confirmations, and member communications run through the platform today.',
  'Referral links are one-tap from the app to WhatsApp — no friction, no separate tool required.',
  'Dynasty Fee is the viral incentive. Every member who shares earns 3% on what their referred contacts spend. Financial self-interest drives sharing.',
  'No paid amplification required. The community distributes itself when the product delivers real results.',
  'Marginal cost per additional member referred via WhatsApp: $0.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

mathBox([
  'K-factor target: 2.0 (each member brings 2 more members on average)',
  'Seed: 1,000 members seeded → each refers 2 → 2,000 new members (Cycle 1 total: 3,000)',
  'Cycle 1 → 10,000 members: 1,000 seeds × K=2.0 compounding → 10,000 in first doubling cycle',
  'Cycle 2 → 100,000 members: 10,000 × K=2.0 compounding → 100,000 in second doubling cycle',
  'Cycle 3 → 1,000,000 members: 100,000 × K=2.0 compounding → 1,000,000 in third doubling cycle',
  'RESULT: 1,000 seeds → 10,000 → 100,000 → 1,000,000 in 3 doubling cycles at K=2.0',
  'NUBANK BENCHMARK: 300M+ users at under $5 CAC using WhatsApp + referral in same target markets',
  'COST: $0 marginal per referred member — incentive is Dynasty Fee (paid only on transaction)',
]);

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('What Is Already Built in the Platform', M, doc.y);
doc.moveDown(0.2);
[
  'WhatsApp Business API integration: automated messages for referral confirmations, signup nudges, member milestones, and Dynasty Fee earning alerts.',
  'Unique referral link system: every member gets a personal referral URL that tracks all downstream signups and transactions across WhatsApp, SMS, and social.',
  'Group chat sharing optimization: referral messages are pre-formatted for WhatsApp group distribution — tap, share, done.',
  'K-factor tracking dashboard: admin visibility into real-time viral coefficient across member cohorts — we know the K-factor daily.',
  'Multi-language support: platform and referral messages available in English, Spanish, and Haitian Creole — no translation barrier for target communities.',
].forEach(function(b) { bullet(b); });

spacer(0.3);

var callY5 = doc.y;
doc.rect(M, callY5, CW, 32).fill(LGBG);
doc.rect(M, callY5, 4, 32).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('Why K=2.0 Is Conservative:', M + 12, callY5 + 8, { continued: true });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     '  In tight-knit community networks where every car purchase is a social event, where ' +
     'family members co-sign on loans and shop together — a single satisfied member influences ' +
     '3 to 5 household decisions. K=2.0 assumes only 2. The ceiling is higher.',
     { width: CW - 20 }
   );
doc.y = callY5 + 36;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 7 — SECTION 2: THE REAL CAPITAL PLAN
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader(
  'SECTION 2 — THE REAL CAPITAL PLAN',
  '$4.2M total outside capital · Phase 3 is self-funded by the business.'
);

spacer(0.2);
para(
  'The previous version of this document described $18M in capital requirements across three funded phases. ' +
  'That number was wrong — it reflected generic startup thinking, not this platform\'s actual growth model. ' +
  'This platform does not need $18M because it does not grow the way generic startups grow. ' +
  'The 4 engines above replace most of the acquisition spend. ' +
  'Total outside capital required: $4.2M. Phase 3 is funded entirely by platform revenue.',
  { size: 9.5 }
);

spacer(0.3);

phaseBlock(
  'PHASE 1 — IGNITION',
  'Months 1–6',
  '0 to 50,000 Members',
  '$1,200,000',
  '#141414',
  [
    'Legal activation: Dynasty Trust structure, automotive dealer license, money transmitter exemption, and insurance referral compliance in place before first member transaction.',
    'Micro-influencer seed: 50 partnerships activated (15 cash, 35 rev-share) — 50,000 member target via influencer network alone.',
    'Runner network launch: 100 runners onboarded, branded, and dispatched across 2 initial markets.',
    'WhatsApp referral engine live: every member gets a referral link on day one — K-factor tracking begins from first signup.',
    'UGC seeding: initial challenge and contest launched to generate first wave of organic member content.',
    'First 3 hires: operations lead, trust/compliance officer, community manager — roles that directly support growth engines.',
    'Revenue target by Month 6: first $100,000 in combined Dynasty Fee + subscription revenue.',
  ],
  [
    'Legal activation (trust, licenses, compliance): $250,000',
    '50 micro-influencer seed partnerships (mix of cash + rev-share): $100,000',
    'Runner network launch — 100 runners, branded kit, onboarding: $150,000',
    'Cloud infrastructure and platform operations (6 months): $100,000',
    'First 3 hires (ops, trust/compliance, community manager) (6 months): $400,000',
    'UGC campaign seeding (challenge, contest, initial creator content): $50,000',
    'Working capital reserve: $150,000',
  ]
);

phaseBlock(
  'PHASE 2 — EXPANSION',
  'Months 6–18',
  '50,000 to 500,000 Members',
  '$3,000,000',
  NAVY,
  [
    'Micro-influencer network expanded to 200+ partners — deeper penetration in automotive and fintech creator communities.',
    'Runner network scaled to 500 runners across 5 US cities — the ground game becomes a consistent 1,000-member/month acquisition channel.',
    'WhatsApp referral chain in full flywheel: K-factor data from Phase 1 informs targeting — highest-K communities get additional seeding.',
    'UGC community events and activation: 2–3 in-person automotive events per year generate concentrated content, press, and signups.',
    'Team scaled to 10–12 people: sales, compliance, support, data, and international ops added.',
    'Geographic groundwork: legal and compliance preparation for Latin American and Caribbean market entry begins in Month 15.',
    'Revenue target by Month 18: $3M–$8M/month in combined revenue across all streams — triggering Phase 3 self-funding.',
  ],
  [
    'Micro-influencer network expansion (200+ influencers, 12 months): $400,000',
    'Runner network expansion — 500 runners, 5 cities, gear, and onboarding: $600,000',
    'Team growth to 10–12 people (12 months of salaries): $1,200,000',
    'UGC community events and activation (3 events, 12 months): $200,000',
    'Platform infrastructure scaling (cloud, security, monitoring): $300,000',
    'Legal/compliance expansion (multi-state and international prep): $150,000',
    'Reserve / contingency: $150,000',
  ]
);

// Phase 3 — Self-Funded
var p3y = doc.y;
doc.rect(M, p3y, CW, 28).fill(FOREST);
doc.rect(M, p3y, 4, 28).fill(GLD);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 3 — SCALE', M + 14, p3y + 5);
doc.fontSize(8.5).font('Helvetica').fillColor('#AAAAAA')
   .text('Months 18–36  ·  500,000 to 10,000,000 Members', M + 14, p3y + 18);
doc.fontSize(10).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('SELF-FUNDED', W - M - 110, p3y + 9, { width: 102, align: 'right' });
doc.y = p3y + 32;

doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
   .text('HOW PHASE 3 FUNDS ITSELF', M + 10, doc.y, { characterSpacing: 1 });
doc.moveDown(0.3);
[
  'At 500,000 members: Dynasty Fee + subscriptions = $3M–$8M/month in platform revenue.',
  'Monthly operating cost at scale: $500,000–$800,000/month (team of 12, infrastructure, runners, legal).',
  'Self-funding gap: revenue ($3M–$8M) exceeds cost ($500K–$800K) — surplus funds Phase 3 expansion with no outside capital.',
  'Geographic expansion: Latin America, Caribbean, and international markets entered from Phase 3 cash flow.',
  'Runner network scaled to 2,000+ operators nationally and internationally — funded by runner commission revenue.',
  '10,000,000 member target reached by Month 36 — entirely from internal cash generation after Month 18.',
].forEach(function(b) { bullet(b, 4); });

spacer(0.4);
rule(doc.y, '#CCCCCC', 0.5);
spacer(0.4);

// Capital summary table
sectionHeader('CAPITAL SUMMARY', 'Total outside capital across all phases.');
spacer(0.25);
tableRow4._alt = false;
tableRow4('Phase',                'Timeline',     'Members',              'Capital Required', true);
tableRow4('Phase 1 — Ignition',   'Months 1–6',   '0 → 50,000',          '$1,200,000');
tableRow4('Phase 2 — Expansion',  'Months 6–18',  '50K → 500,000',       '$3,000,000');
tableRow4('Phase 3 — Scale',      'Months 18–36', '500K → 10,000,000',   'SELF-FUNDED');

// Total row
var tr = doc.y;
doc.rect(M, tr, CW, 24).fill(BLK);
doc.rect(M, tr, 4, 24).fill(GLD);
doc.fontSize(10.5).font('Helvetica-Bold').fillColor(WHT)
   .text('TOTAL OUTSIDE CAPITAL — 0 to 10 Million Members', M + 10, tr + 7);
doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('$4,200,000', W - M - 106, tr + 7, { width: 98, align: 'right' });
doc.y = tr + 28;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 8 — SECTION 3: SELF-FUNDING PROOF
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader(
  'SECTION 3 — SELF-FUNDING PROOF',
  'Why Phase 3 requires $0 in outside capital.'
);

spacer(0.2);
para(
  'The claim that Phase 3 self-funds is not a projection — it is a function of the revenue model. ' +
  'At 500,000 members, the Dynasty Fee alone covers all operating costs. ' +
  'Every additional member after that is pure leverage. Here is the math.',
  { size: 9.5 }
);

spacer(0.3);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('Dynasty Fee Revenue at 500,000 Members', M, doc.y);
doc.moveDown(0.25);

mathBox([
  '500,000 members × 15% active and transacting monthly = 75,000 transactions per month',
  'Blended average transaction value: $1,000 (mix of $8K auto purchases and $200 service/insurance)',
  '3% Dynasty Tech Fee on $1,000 = $30 per transaction',
  '75,000 transactions × $30 per transaction = $2,250,000/month from Dynasty Fee alone',
  '',
  'ADDITIONAL REVENUE STREAMS AT 500K MEMBERS:',
  'Subscriptions (75K active × $29.99/month) = ~$2,200,000/month',
  'Finance origination fees + insurance referrals + runner commissions = $500,000–$1,000,000/month',
  '',
  'TOTAL CONSERVATIVE MONTHLY REVENUE AT 500K MEMBERS: $3,000,000 – $5,000,000/month',
]);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('Monthly Operating Cost at 500K Members', M, doc.y);
doc.moveDown(0.25);

var opRows = [
  ['Team of 12 (salaries, benefits)',       '$350,000'],
  ['Cloud infrastructure and platform ops', '$80,000'],
  ['Runner network operations (500 runners)','$120,000'],
  ['Legal, compliance, insurance',          '$60,000'],
  ['Marketing and community events',        '$50,000'],
  ['Reserve and miscellaneous',             '$40,000'],
  ['TOTAL MONTHLY COST',                    '$700,000'],
];

opRows.forEach(function(r, i) {
  var oy = doc.y;
  var isLast = i === opRows.length - 1;
  var bg = isLast ? BLK : (i % 2 === 0 ? LGBG : WHT);
  doc.rect(M, oy, CW, 18).fill(bg);
  doc.fontSize(9).font(isLast ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(isLast ? WHT : DARK)
     .text(r[0], M + 8, oy + 4, { width: CW - 90 });
  doc.fontSize(9).font('Helvetica-Bold')
     .fillColor(isLast ? '#D4AF37' : GLD)
     .text(r[1], W - M - 82, oy + 4, { width: 74, align: 'right' });
  doc.y = oy + 19;
});

spacer(0.5);

// Self-funding gap callout
var sfY = doc.y;
doc.rect(M, sfY, CW, 50).fill(LGBG);
doc.rect(M, sfY, 4, 50).fill(GLD);
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
   .text('The Self-Funding Gap', M + 12, sfY + 8);
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     'Revenue ($3M–$5M/month) minus Cost ($700K/month) = $2.3M–$4.3M monthly surplus at 500K members. ' +
     'This surplus funds geographic expansion, team growth, and runner network scaling in Phase 3 — ' +
     'with no outside capital required. The business funds itself.',
     M + 12, sfY + 22, { width: CW - 20, lineGap: 2 }
   );
doc.y = sfY + 54;

spacer(0.4);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('Revenue Scaling Logic: 500K to 10M Members', M, doc.y);
doc.moveDown(0.25);
para(
  'The Dynasty Fee model scales with the transaction volume, not the headcount. ' +
  'The platform does not need 10x the employees to serve 10x the members. ' +
  'Infrastructure scales horizontally. AI agents handle member service. ' +
  'The 3% toll collects automatically on every qualifying transaction regardless of volume. ' +
  'At 10 million members — even at only 10% active monthly — that is 1 million transactions per month ' +
  'at a blended $30 fee = $30,000,000/month in Dynasty Fee revenue alone. ' +
  'No outside capital can do what compounding network effects and a built-in transaction toll can do.',
  { size: 9.5 }
);

spacer(0.3);

mathBox([
  '10,000,000 members × 10% active monthly = 1,000,000 transactions/month',
  '1,000,000 transactions × $30 Dynasty Fee = $30,000,000/month from Dynasty Fee alone',
  'Operating cost at 10M members (team of 30, global infra): ~$2,000,000/month',
  'Net monthly profit from Dynasty Fee alone at 10M members: $28,000,000/month',
  'Annual: $336,000,000+ from the Dynasty Fee alone — not counting subscriptions or other streams',
]);


// ════════════════════════════════════════════════════════════════════════════
// PAGE 9 — SECTION 4: AUDIENCE-SPECIFIC SECTIONS
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader(
  'SECTION 4 — AUDIENCE-SPECIFIC SUMMARIES',
  'The same facts, framed for each reader.'
);

spacer(0.3);

// ── FOR VENTURE CAPITAL ───────────────────────────────────────────────────
audienceTag('FOR VENTURE CAPITAL INVESTORS', BLK);

para(
  'This is a pre-revenue, pre-member seed investment in a fully built platform. ' +
  'The platform is live. The code exists. The 4 growth engines are operational. ' +
  'The ask is $2M–$4.2M at a $150M founder\'s valuation. ' +
  'The platform addresses a $1.5T annual automotive transaction market, a $300B auto insurance market, ' +
  'and 100M+ underserved American consumers.',
  { size: 9.5 }
);

[
  ['Unit economics', 'Blended CAC from 4 engines: $8–$22 per member. LTV at 3% Dynasty Fee on $1K avg. transaction = $30/transaction. Member LTV over 3 years (4 transactions/yr at $30): $360. LTV:CAC > 16:1.'],
  ['K-factor model', 'K=2.0 WhatsApp target. Every 1,000 seeds → 1M members in 10 cycles at zero marginal cost. Nubank achieved K=3.0+ in same target demographic.'],
  ['CAC comparison', 'Industry paid social CAC: $50–$200. Our blended CAC from 4 engines: $8–$22. Dynasty Fee incentive cost is deferred (paid on transaction, not acquisition).'],
  ['Comparables', 'Nubank: 300M users, $30B valuation, under $5 CAC. DoorDash early markets: driver/ambassador ground game seeded 80% of initial growth. Uber: city-by-city runner network drove first 10,000 users per market.'],
  ['Exit paths', 'Strategic acquisition by OEM, insurance carrier, fintech, or financial institution. IPO path at $1B+ at 2M+ members and $100M ARR.'],
  ['Series A trigger', '50,000 verified members + $500K MRR unlocks institutional Series A at $50M–$200M.'],
].forEach(function(r) { boldBullet(r[0] + ':', r[1]); });

spacer(0.4);
rule(doc.y);
spacer(0.4);

// ── FOR BANKS / SBA ──────────────────────────────────────────────────────
audienceTag('FOR BANKS & SBA LENDERS', NAVY);

para(
  '3C ONYX is seeking a bridge loan of $150,000–$350,000 as initial capital for Phase 1 activation. ' +
  'Alternatively, a full Phase 1 funding of $1.2M from an SBA-backed lender or CDFI. ' +
  'The platform is fully operational. The loan funds legal activation, initial operations, ' +
  'and the first growth engine deployments required to reach 50,000 paying members.',
  { size: 9.5 }
);

[
  ['Loan purpose', 'Legal activation, platform operations, micro-influencer seeding, runner network launch, and first 3 hires.'],
  ['Collateral basis', 'The platform has documented replacement cost of $3.5M+ — fully built, proprietary, closed-source technology. The IP is the collateral.'],
  ['Repayment source', 'Membership subscription revenue and Dynasty Fee transaction income — both begin at first member onboarding and scale predictably.'],
  ['Revenue model', 'SaaS subscription + 3% marketplace transaction fee — the most bankable revenue structure in technology: predictable, recurring, auditable.'],
  ['NAICS classification', '522390 (Other Activities Related to Credit Intermediation) and 541511 (Custom Computer Programming Services). Eligible for SBA Express, SBA 7(a), and CDFI programs.'],
  ['Mission alignment', 'Financial inclusion for underserved communities — meets CRA requirements and CDFI mission criteria.'],
].forEach(function(r) { boldBullet(r[0] + ':', r[1]); });

spacer(0.4);
rule(doc.y);
spacer(0.4);

// ── FOR GOVERNMENT ────────────────────────────────────────────────────────
audienceTag('FOR GOVERNMENT & ECONOMIC DEVELOPMENT', FOREST);

para(
  '3C ONYX directly addresses two critical policy priorities: economic inclusion for underserved ' +
  'communities and gig economy job creation. The platform is built for communities that are ' +
  'currently locked out of the automotive financial system — communities that are overpaying ' +
  'for insurance, being denied credit, and losing economic mobility because of systemic friction ' +
  'in the car-buying process. 3C ONYX removes that friction.',
  { size: 9.5 }
);

[
  ['Job creation', 'Runner network creates 500–2,000 verified gig economy positions in Phases 2 and 3 — in the communities the platform serves.'],
  ['Financial inclusion', '2,200+ lender network matched by financial profile, not zip code. Members who were denied everywhere else get a real path to vehicle ownership.'],
  ['Community impact', 'Target markets: Caribbean diaspora, Latin American households, and underserved urban communities in Florida, New York, Texas, and Georgia.'],
  ['Tax base contribution', 'Platform-facilitated vehicle purchases generate sales tax, title transfer fees, and registration revenue for state and local governments.'],
  ['Grant and program eligibility', 'Eligible for SBA Community Advantage, CDFI Fund grants, state economic development grants, and workforce development funding for runner onboarding.'],
  ['MBDA and minority business', 'Founder is a minority business owner. Platform qualifies for Minority Business Development Agency programs and HUBZone benefits.'],
].forEach(function(r) { boldBullet(r[0] + ':', r[1]); });

spacer(0.4);
rule(doc.y);
spacer(0.4);

// ── FOR LEGAL ─────────────────────────────────────────────────────────────
audienceTag('FOR LEGAL COUNSEL & LAW FIRMS', RUST);

para(
  'The platform is operational. Legal infrastructure is the next critical path item. ' +
  'Five open legal items must be resolved before the first outside member is onboarded. ' +
  'Engagement with outside counsel is a Phase 1 capital line item ($250,000 of Phase 1 budget). ' +
  'Below is the priority order and scope for legal engagement.',
  { size: 9.5 }
);

var legalItems = [
  ['1 — Entity Structure', 'HIGH', 'Formalize CUXTOMCANDYCLUB LLC as the operating entity. Establish the Dynasty Trust structure. Set up the IP holding entity. Confirm Florida LLC structure for investor intake.'],
  ['2 — Investment Documentation', 'HIGH', 'Prepare SAFE note or convertible note documentation for the seed round. Prepare investor disclosure documents. Confirm accredited investor verification process.'],
  ['3 — Revenue Compliance', 'HIGH', 'Legal review of the 3% Dynasty Tech Fee as a technology facilitation fee (not a securities product or money transmission). Confirm this is not a regulated instrument under state or federal law.'],
  ['4 — Dealer and Referral Licensing', 'MEDIUM', 'Automotive dealer license or referral exemption confirmation in Florida. Insurance referral compliance review. Finance origination referral agreement review with lending partners.'],
  ['5 — Runner Contractor Agreements', 'MEDIUM', 'Independent contractor agreements for the runner network. Proper classification under Florida and federal gig economy law. Liability and insurance framework for runner operations.'],
];

legalItems.forEach(function(item) {
  var ily = doc.y;
  var priorityColor = item[1] === 'HIGH' ? '#8B0000' : '#4A5A00';
  doc.rect(M, ily, CW, 16).fill(LGBG);
  doc.rect(M, ily, 3, 16).fill(GLD);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
     .text(item[0], M + 10, ily + 3, { continued: true });
  doc.fontSize(8).font('Helvetica-Bold').fillColor(WHT)
     .text('  ', { continued: true });
  // Priority badge
  var pw = 42;
  var px = W - M - pw - 6;
  doc.rect(px, ily + 2, pw, 12).fill(priorityColor);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(WHT)
     .text(item[1], px + 2, ily + 4, { width: pw - 4, align: 'center' });
  doc.y = ily + 18;
  doc.fontSize(9).font('Helvetica').fillColor(GRY)
     .text(item[2], M + 10, doc.y, { width: CW - 16, lineGap: 2 });
  doc.moveDown(0.4);
  rule(doc.y, '#DDDDDD', 0.4);
  doc.moveDown(0.3);
});


// ════════════════════════════════════════════════════════════════════════════
// PAGE 10 — SECTION 5: THE BOTTLENECK AND THE ASK
// ════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeader(
  'SECTION 5 — THE BOTTLENECK AND THE ASK',
  'One constraint stands between today and 10 million members.'
);

spacer(0.3);

doc.fontSize(13).font('Helvetica-Bold').fillColor(BLK)
   .text('The Bottleneck: The First 1,000 Members', M, doc.y);
doc.moveDown(0.3);

para(
  'Every number in this document flows from a single starting point: the first 1,000 verified members. ' +
  'Not 10,000. Not 50,000. One thousand. Once the platform has 1,000 real members using it — ' +
  'getting car loans approved, booking runners, sharing results on TikTok, forwarding links on WhatsApp — ' +
  'the 4 engines engage. The flywheel starts. The K-factor compounds. The Dynasty Fee attracts creators. ' +
  'The runners become recruiters. Everything flows from 1,000.',
  { size: 10 }
);

spacer(0.3);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('Why Capital Is the Bottleneck (Not the Product)', M, doc.y);
doc.moveDown(0.2);
[
  'The platform is built. The AI agents are deployed. The Stripe integration is live. The WhatsApp system is operational.',
  'The runner dispatch system works. The KYC flow is functional. The mobile app is available on iOS and Android.',
  'Legal activation (trust, licenses, compliance) requires upfront professional fees — these cannot be deferred.',
  'The first 3 hires cannot be deferred — an operations lead, a compliance officer, and a community manager are required before mass member onboarding.',
  'The micro-influencer seed partnerships require an initial cash commitment — even at 70% rev-share, 30% must be paid.',
  'The runner brand kit, onboarding, and verification process requires capital before runners can generate referrals.',
  'Without these prerequisites completed, the 4 engines cannot engage. Capital is the ignition switch.',
].forEach(function(b) { bullet(b); });

spacer(0.4);

// The Ask box
var askY = doc.y;
doc.rect(M, askY, CW, 80).fill(BLK);
doc.rect(M, askY, 5, 80).fill(GLD);

doc.fontSize(10).font('Helvetica-Bold').fillColor('#AAAAAA')
   .text('THE ASK', M + 14, askY + 10, { characterSpacing: 2 });
doc.fontSize(22).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('$2,000,000 – $4,200,000', M + 14, askY + 24, { characterSpacing: 0.5 });
doc.fontSize(9.5).font('Helvetica').fillColor('#CCCCCC')
   .text(
     'Seed round covering Phase 1 ($1.2M) and Phase 2 ($3M) completely. ' +
     'Phase 3 is funded by the business. No follow-on capital required beyond $4.2M total.',
     M + 14, askY + 52, { width: CW - 28, lineGap: 3 }
   );
doc.y = askY + 84;

spacer(0.5);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('What Happens at Each Funding Level', M, doc.y);
doc.moveDown(0.25);

var fundingLevels = [
  ['$150,000 – $350,000 (SBA Bridge)',     'Legal activation and first hire. Compliance infrastructure in place. Platform legally cleared to onboard members. Runway to close the full seed round.'],
  ['$1,200,000 (Phase 1 Complete)',        '0 to 50,000 members. All 4 growth engines activated. First $100K in monthly revenue. Seed round metrics documented for Phase 2 raise.'],
  ['$2,000,000 (Phase 1 + Phase 2 Start)','50,000 to 150,000 members. Runner network at 200 operators. Influencer network at 100+ partners. First $500K MRR. Series A preparation begins.'],
  ['$4,200,000 (Full Phase 1 + Phase 2)', '0 to 500,000 members. All 4 engines at full capacity. $3M–$8M/month revenue. Phase 3 self-funded. No additional outside capital ever required.'],
];

fundingLevels.forEach(function(fl, i) {
  var fly = doc.y;
  doc.rect(M, fly, CW, 40).fill(i % 2 === 0 ? LGBG : WHT);
  doc.rect(M, fly, 4, 40).fill(GLD);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(BLK)
     .text(fl[0], M + 12, fly + 6, { width: CW - 20 });
  doc.fontSize(9).font('Helvetica').fillColor(GRY)
     .text(fl[1], M + 12, fly + 20, { width: CW - 20, lineGap: 2 });
  doc.y = fly + 44;
});

spacer(0.5);
rule(doc.y, GLD, 0.6);
spacer(0.4);

// Closing statement
var closeY = doc.y;
doc.rect(M, closeY, CW, 60).fill(LGBG);
doc.rect(M, closeY, 4, 60).fill(GLD);
doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('The platform exists. The engines are built. The community is waiting.', M + 12, closeY + 10, { width: CW - 20 });
doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text(
     'Capital is the only variable between today and 10 million members. ' +
     'Every day without funding is a day the 4 engines sit idle. ' +
     'The first investor to close funds the ignition sequence — and earns the position that every subsequent investor will pay a premium to access.',
     M + 12, closeY + 28, { width: CW - 20, lineGap: 2 }
   );
doc.y = closeY + 64;

spacer(0.5);

// Footer
rule(doc.y, GLD, 0.6);
spacer(0.3);
doc.fontSize(8).font('Helvetica').fillColor(LGY)
   .text(
     'Ronald Antonio Cadet · Ron3C · ron@3conyx.com · www.3conyx.com\n' +
     'CUXTOMCANDYCLUB LLC · Florida, USA · Est. 2026\n' +
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR AND PROFESSIONAL REVIEW ONLY · © 2026 CUXTOMCANDYCLUB LLC',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );

doc.end();

doc.on('end', function() {
  console.log('PDF written to: ' + OUT);
});
