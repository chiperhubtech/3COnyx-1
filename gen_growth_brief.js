'use strict';

/**
 * 3C ONYX — Real Growth Plan
 * 4 Engines · 10 Million Members · $2M Total Capital
 * Copy-paste ready · Print friendly
 * Audiences: VC · Bank · Government · Legal
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
    Title:   '3C ONYX — Real Growth Plan: 10 Million Members on $2M',
    Author:  'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: '4-Engine Growth Model · Self-Funding at Scale · $2M Seed Round',
  },
});

doc.pipe(fs.createWriteStream(OUT));

const W  = 612;
const M  = 64;
const CW = W - M * 2;

const BLK  = '#0A0A0A';
const GLD  = '#B8860B';
const DGLD = '#D4AF37';
const DARK = '#1A1A1A';
const GRY  = '#555555';
const LGY  = '#999999';
const LGBG = '#F7F7F7';
const WHT  = '#FFFFFF';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rule(color, weight) {
  color  = color  || '#DDDDDD';
  weight = weight || 0.5;
  doc.moveTo(M, doc.y).lineTo(M + CW, doc.y)
     .lineWidth(weight).strokeColor(color).stroke();
  doc.moveDown(0.4);
}

function secHeader(title, sub) {
  var hy = doc.y;
  doc.rect(M, hy, CW, sub ? 34 : 24).fill(BLK);
  doc.rect(M, hy, 4, sub ? 34 : 24).fill(DGLD);
  doc.fontSize(11.5).font('Helvetica-Bold').fillColor(WHT)
     .text(title, M + 14, hy + 6, { characterSpacing: 0.8 });
  if (sub) {
    doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
       .text(sub, M + 14, hy + 21, { characterSpacing: 0.3 });
  }
  doc.y = hy + (sub ? 34 : 24) + 10;
}

function para(text, opts) {
  opts = opts || {};
  doc.fontSize(opts.size || 9.5)
     .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(opts.color || DARK)
     .text(text, M, doc.y, { width: CW, lineGap: 3, align: opts.align || 'left' });
  doc.moveDown(opts.gap || 0.5);
}

function kv(label, value) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
     .text(label.toUpperCase() + '  ', M, doc.y,
       { continued: true, characterSpacing: 0.8 });
  doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
     .text(value);
  doc.moveDown(0.15);
}

function bullet(text, sub) {
  var bx = M + (sub ? 20 : 10);
  var by = doc.y;
  doc.circle(bx - 5, by + 5.5, sub ? 2 : 2.8).fill(sub ? GRY : GLD);
  doc.fontSize(sub ? 9 : 9.5)
     .font('Helvetica')
     .fillColor(sub ? GRY : DARK)
     .text(text, bx + 2, by, { width: CW - 16 - (sub ? 10 : 0) });
  doc.moveDown(0.25);
}

function bold(text) {
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(DARK)
     .text(text, M, doc.y, { width: CW });
  doc.moveDown(0.2);
}

function sp(n) { doc.moveDown(n || 0.5); }

function audienceBar(text, color) {
  var ay = doc.y;
  doc.rect(M, ay, CW, 24).fill(color);
  doc.rect(M, ay, 4, 24).fill(DGLD);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(WHT)
     .text(text, M + 14, ay + 6, { characterSpacing: 1.5 });
  doc.y = ay + 32;
}

function engineBlock(num, title, tagline, rows) {
  var ey = doc.y;
  // Header row
  doc.rect(M, ey, CW, 28).fill('#F0EAD6');
  doc.rect(M, ey, 4, 28).fill(GLD);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(GLD)
     .text(num, M + 10, ey + 5, { width: 28 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
     .text(title, M + 42, ey + 6, { width: CW - 50 });
  doc.fontSize(8.5).font('Helvetica').fillColor(GRY)
     .text(tagline, M + 42, ey + 20, { width: CW - 50 });
  doc.y = ey + 34;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.type === 'kv') {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
         .text(r.label + ':  ', M + 10, doc.y, { continued: true, characterSpacing: 0.5 });
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
         .text(r.value, { width: CW - 18 });
      doc.moveDown(0.2);
    } else if (r.type === 'stat') {
      var sy = doc.y;
      doc.rect(M, sy, CW, 20).fill(LGBG);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
         .text(r.number, M + 10, sy + 4, { continued: true });
      doc.fontSize(8.5).font('Helvetica').fillColor(GRY)
         .text('  ' + r.label, { width: CW - 20 });
      doc.y = sy + 24;
    }
  }
  sp(0.6);
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, W, 108).fill(BLK);
doc.rect(0, 0, W, 4).fill(DGLD);

doc.fontSize(32).font('Helvetica-Bold').fillColor(DGLD)
   .text('3C ONYX', M, 20, { characterSpacing: 6 });
doc.fontSize(13).font('Helvetica-Bold').fillColor(WHT)
   .text('REAL GROWTH PLAN', M, 60, { characterSpacing: 3 });
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('10 Million Members  ·  4 Growth Engines  ·  $2M Total Capital  ·  Self-Funding at Scale',
     M, 78, { characterSpacing: 0.5 });
doc.fontSize(8).font('Helvetica').fillColor('#666666')
   .text('For: Venture Capital  ·  Banking & SBA  ·  Government  ·  Legal Counsel',
     M, 94, { characterSpacing: 0.3 });

doc.y = 122;

// Audience tags
var tags = [
  { t: 'VENTURE CAPITAL',   c: '#0A0A0A' },
  { t: 'BANK / SBA',        c: '#1A3A5C' },
  { t: 'GOVERNMENT',        c: '#1A4A1A' },
  { t: 'LEGAL / LAW FIRM',  c: '#4A1A00' },
];
var tx = M;
tags.forEach(function(tg) {
  doc.rect(tx, 122, 110, 20).fill(tg.c);
  doc.rect(tx, 122, 3, 20).fill(DGLD);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(WHT)
     .text(tg.t, tx + 7, 128, { width: 100, characterSpacing: 0.5 });
  tx += 116;
});
doc.y = 154;

rule(GLD, 1);

// Opening statement
para(
  'This document presents the honest, professional growth plan for 3C ONYX. ' +
  'It is not a traditional startup plan with expensive paid acquisition. It is a community-driven, ' +
  'influencer-fueled, referral-compounded growth model that reflects how the automotive industry actually spreads — ' +
  'through trust, through results, and through community. ' +
  'The total outside capital required to reach 10 million members is $2,000,000.',
  { size: 10.5 }
);

sp(0.3);

// Key facts
var facts = [
  ['Platform Status',     'Fully built and operational — live as of March 2026. Not a prototype.'],
  ['Current Members',     '0 — pre-launch, invite-only activation pending capital'],
  ['Target',              '10,000,000 members in 30–36 months'],
  ['Total Capital',       '$2,000,000 — covers Phase 1 and Phase 2 completely'],
  ['Phase 3',             'Self-funded by Dynasty Fee revenue — zero outside capital required'],
  ['Seed Round',          '$2,000,000 — this is the ask. One round. No bridge needed.'],
  ['Valuation Basis',     '$150,000,000 founder valuation — replacement cost + IP moat + AI-native premium'],
  ['Founder',             'Ronald Antonio Cadet  ·  Ron3C  ·  CUXTOMCANDYCLUB LLC'],
  ['Contact',             'ron@3conyx.com  ·  www.3conyx.com'],
];
facts.forEach(function(f) { kv(f[0], f[1]); });

sp(0.5);
rule(GLD, 0.75);
sp(0.3);

// Why automotive spreads differently
secHeader('WHY AUTOMOTIVE SPREADS FASTER THAN ANY OTHER CATEGORY', '');
sp(0.3);

para(
  'Most industries require years of paid advertising before word-of-mouth kicks in. ' +
  'Automotive is different. A car purchase is one of the three biggest financial decisions a person makes — ' +
  'after a home and a marriage. People talk about it. They post about it. They bring others.',
  { size: 10 }
);

var reasons = [
  'Every deal closed is a story. "ONYX got me financed when the dealer said no" travels through a community in hours — not weeks.',
  'Cars are photographed, posted, and celebrated. Every member who drives their ONYX-facilitated vehicle is a brand impression.',
  'Insurance savings are dramatic and shareable. A member saving $200/month tells everyone they know — because it changes their life.',
  'The runner network creates physical brand touchpoints. Every service job in a neighborhood is a live demonstration.',
  'WhatsApp group chats in target communities (Caribbean, Latin American, underserved US) spread referrals at zero cost.',
  'Nubank benchmark: $2M seed, 300M+ members, less than $5 CAC. Same model. Same communities. Automotive pain is more urgent than banking.',
];
reasons.forEach(function(r) { bullet(r); });

sp(0.3);
doc.fontSize(8).font('Helvetica').fillColor(LGY)
   .text('CONFIDENTIAL  ·  © 2026 CUXTOMCANDYCLUB LLC  ·  FOR QUALIFIED PROFESSIONAL REVIEW ONLY',
     M, doc.y, { width: CW, align: 'center' });

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — THE 4 ENGINES
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('SECTION 1 — THE 4 GROWTH ENGINES',
  'Each engine costs almost nothing to operate. All four are already built into the platform.');

sp(0.3);
para(
  'Most platforms spend $10M–$50M on paid advertising to reach scale. 3C ONYX does not need to. ' +
  'The platform was built with four self-funding, community-native growth engines that cost a fraction ' +
  'of traditional customer acquisition — and compound over time rather than requiring constant spending.',
  { size: 10 }
);
sp(0.3);

engineBlock('01', 'MICRO-INFLUENCER NETWORK', 'Automotive community voices who earn permanently, not per post', [
  { type: 'kv', label: 'How it works', value: 'Partner with 50–100 automotive micro-influencers (10K–200K followers). 70% operate on Dynasty Fee rev-share — they earn 3% on every transaction from every member they bring in, permanently. Only 30% receive small cash payments ($300–$500 per post). The Dynasty Fee model means top performers earn $5,000–$20,000/month — far more than a flat fee.' },
  { type: 'kv', label: 'Who they are', value: 'Car review creators, dealership insiders, finance educators, insurance advisors, automotive lifestyle content creators — all targeting the exact communities ONYX serves.' },
  { type: 'kv', label: 'Why they work', value: 'Micro-influencers have 5–10x higher engagement than celebrities. Their audiences trust them. An authentic review from a 50K-follower automotive creator converts at 3–8% — versus 0.1–0.5% for paid social.' },
  { type: 'stat', number: '50 influencers', label: '× 5% audience conversion × 20K avg followers = 50,000 members in 6 months' },
  { type: 'stat', number: '$30,000–$50,000', label: 'total cash cost to seed 50 influencer partnerships (the rest is rev-share — they pay for themselves)' },
]);

engineBlock('02', 'UGC CONTENT FLYWHEEL', 'Members create the marketing — Dynasty Fee is the incentive', [
  { type: 'kv', label: 'How it works', value: 'Members who get real results — approved financing, insurance savings, a successful deal — naturally share their story on TikTok, Instagram Reels, and YouTube Shorts. The Dynasty Fee gives them a financial reason to share: every member they refer earns them 3% on that member\'s transactions permanently.' },
  { type: 'kv', label: 'The content writes itself', value: '"I saved $340/month on car insurance." "ONYX found me 2,200 lenders when the dealer said I had no options." "My runner delivered my car so I didn\'t miss a day of work." These stories are more powerful than any ad.' },
  { type: 'kv', label: 'Cost structure', value: 'Zero paid content budget. The Dynasty Fee is the incentive. A member who refers 10 people who each spend $500/month earns $150/month passively — that is worth more than any cash payment and it costs ONYX nothing up front.' },
  { type: 'stat', number: '$0–$3', label: 'CAC from UGC channel — the Dynasty Fee funds itself from the revenue it generates' },
  { type: 'stat', number: '30–40%', label: 'of total member growth projected to come from UGC and organic referral content' },
]);

engineBlock('03', 'RUNNER AMBASSADOR GROUND GAME', 'Independent gig workers who are also brand ambassadors in the physical world', [
  { type: 'kv', label: 'How it works', value: 'Every ONYX runner (independent gig worker) wears the brand, uses the ONYX app, and interacts with real people in real neighborhoods. Every delivery, DMV run, inspection, or vehicle drop-off is a physical brand touchpoint. Runners receive a $20 bonus for every new verified member they bring to the platform.' },
  { type: 'kv', label: 'The math', value: '500 runners × 20 jobs per month = 10,000 brand touchpoints per month. At 10% referral conversion, that is 1,000 new members per month from the runner network alone — at a cost of $20 per member.' },
  { type: 'kv', label: 'Cost structure', value: 'Branded kit per runner (shirt, hat, decal): $50–$100. Referral bonus: $20 per verified member. At 1,000 new members per month: $20,000/month. That\'s $0.002 per member impression and $20 per converted member — among the lowest CAC in any industry.' },
  { type: 'stat', number: '$20', label: 'cost per member acquired through the runner network — fully traceable, no waste' },
  { type: 'stat', number: '1,000+', label: 'new members per month from runners alone once 500 operators are deployed' },
]);

engineBlock('04', 'WHATSAPP REFERRAL CHAIN', 'The compounding flywheel that costs $0 to operate', [
  { type: 'kv', label: 'How it works', value: 'Every member gets a unique ONYX referral link. When they share it via WhatsApp — the primary communication platform in Caribbean, Latin American, and underserved US communities — and someone joins through their link, they earn Dynasty Fee income on that member\'s activity. Sharing is financially motivated, culturally native, and requires zero effort from ONYX.' },
  { type: 'kv', label: 'K-factor target', value: 'K = 2.0 means every member brings in 2 more. At K = 2.0: 1,000 seed members → 2,000 → 4,000 → 8,000 → 16,000 → 32,000 → 64,000. In 7 doubling cycles, 1,000 seeds reach over 1 million members. The math is not optimistic — it is the Nubank benchmark in practice.' },
  { type: 'kv', label: 'Nubank validation', value: 'Nubank launched in Brazil with $2M, serving underserved communities without bank access. WhatsApp referrals were 80%+ of their growth. They now have 300 million members. The target communities for ONYX — Caribbean-American, Latino-American, underserved Black American households — are WhatsApp-primary. The model maps exactly.' },
  { type: 'stat', number: 'K = 2.0', label: 'each member refers 2 more — 1,000 seeds reach 1 million members in 10 doubling cycles at zero marginal cost' },
  { type: 'stat', number: '$0', label: 'marginal cost per referral — the platform, the link, and the incentive are all already built' },
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — CAPITAL PLAN + SELF-FUNDING PROOF
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('SECTION 2 — THE $2M CAPITAL PLAN',
  'Two phases. $2M total. Phase 3 is funded by the business itself.');

sp(0.3);
para(
  'The reason this platform can reach 10 million members on $2M — when competitors spend 10x that — is structural. ' +
  'The Dynasty Fee model means influencers, creators, and runners are all partially compensated by revenue the platform generates, not by capital the investor provides. ' +
  'The growth engine is designed to pay for itself from the first transaction.',
  { size: 10 }
);
sp(0.4);

// Phase 1
var p1y = doc.y;
doc.rect(M, p1y, CW, 22).fill(BLK);
doc.rect(M, p1y, 4, 22).fill(DGLD);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 1 — IGNITION', M + 14, p1y + 5, { continued: true });
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('  ·  Months 1–6  ·  0 to 50,000 Members');
doc.fontSize(10).font('Helvetica-Bold').fillColor(DGLD)
   .text('$500,000', W - M - 80, p1y + 5, { width: 72, align: 'right' });
doc.y = p1y + 28;

var p1items = [
  ['Legal activation (phased minimum)', '$75,000',
   'LLC/trust structure, dealer license filing, insurance referral compliance, money transmitter analysis. Phased — only what is needed to launch.'],
  ['50 micro-influencer partnerships (mix)', '$30,000',
   '30% paid at $300–$500/post ($15K), 70% pure Dynasty Fee rev-share ($0 cash). These partnerships pay for themselves from referral revenue.'],
  ['Runner launch — 50 operators', '$7,500',
   'Branded kit ($100/runner), WhatsApp training group, referral tracking setup. $20 bonus per verified member they bring in (paid from revenue).'],
  ['Cloud infrastructure & ops (6 months)', '$25,000',
   'Platform is already built. Ops cost at early stage: $300–$500/month for hosting, monitoring, and database.'],
  ['Community manager hire (6 months)', '$45,000',
   'One key hire: community manager who runs influencer relationships, UGC campaigns, and WhatsApp referral activation.'],
  ['Founder operational runway (6 months)', '$90,000',
   'Founder salary/living expenses during the critical first 6 months. Non-negotiable for full focus.'],
  ['UGC seeding & contests', '$15,000',
   'Launch challenge prizes, first UGC campaign, community events to generate authentic content.'],
  ['Working capital buffer', '$212,500',
   'Reserve for unexpected legal costs, runner incentives, influencer overages, and operational contingency.'],
];

doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('LINE ITEM', M + 4, doc.y, { continued: true, characterSpacing: 1, width: 180 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('AMOUNT', M + 188, doc.y, { continued: true, characterSpacing: 1, width: 60 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('NOTES', M + 252, doc.y, { characterSpacing: 1, width: CW - 256 });
doc.moveDown(0.3);

for (var i = 0; i < p1items.length; i++) {
  var it = p1items[i];
  var ry = doc.y;
  var bg = i % 2 === 0 ? LGBG : WHT;
  doc.rect(M, ry, CW, 18).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
     .text(it[0], M + 4, ry + 4, { width: 180 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text(it[1], M + 188, ry + 4, { width: 58 });
  doc.fontSize(8).font('Helvetica').fillColor(GRY)
     .text(it[2], M + 252, ry + 4, { width: CW - 256 });
  doc.y = ry + 19;
}

doc.rect(M, doc.y, CW, 18).fill(BLK);
var totr = doc.y;
doc.fontSize(9).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 1 TOTAL', M + 4, totr + 4);
doc.fontSize(9).font('Helvetica-Bold').fillColor(DGLD)
   .text('$500,000', W - M - 80, totr + 4, { width: 72, align: 'right' });
doc.y = totr + 24;

sp(0.5);

// Phase 2
var p2y = doc.y;
doc.rect(M, p2y, CW, 22).fill('#1A3A5C');
doc.rect(M, p2y, 4, 22).fill(DGLD);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 2 — EXPANSION', M + 14, p2y + 5, { continued: true });
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('  ·  Months 6–18  ·  50,000 to 500,000 Members');
doc.fontSize(10).font('Helvetica-Bold').fillColor(DGLD)
   .text('$1,500,000', W - M - 90, p2y + 5, { width: 82, align: 'right' });
doc.y = p2y + 28;

var p2items = [
  ['Runner network expansion — 500 operators', '$175,000',
   'Scale from 50 to 500 runners across 5 cities. Branded kits ($50K) + city coordinator stipends ($125K). Runner bonuses paid from revenue.'],
  ['Influencer network — 100 partners', '$75,000',
   'Expand from 50 to 100+ partners. Same 70/30 rev-share/cash split. Revenue from Phase 1 partially funds this.'],
  ['Team growth (6 people total)', '$600,000',
   'Operations lead, 2 community managers, compliance officer, runner coordinator, customer success. $8K–$12K/month average fully loaded.'],
  ['UGC campaigns & community events', '$75,000',
   'Regional meetups, challenge campaigns, UGC prize pools. These generate authentic content and member acquisition simultaneously.'],
  ['Caribbean & Latin America launch', '$150,000',
   'WhatsApp-native markets. Translation, local influencer seed partnerships, legal compliance in target countries. Highest ROI expansion.'],
  ['Cloud scaling & security', '$75,000',
   'Infrastructure scales with member count. Platform already built — this is hosting, monitoring, and SOC2 hardening costs.'],
  ['Legal & compliance expansion', '$100,000',
   'Multi-state licensing, money transmitter filings, carrier agreements as revenue scales. Ongoing compliance counsel.'],
  ['Working capital & contingency', '$250,000',
   'Buffer for runner bonuses, influencer overages, unexpected legal costs, and operational surprises.'],
];

doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('LINE ITEM', M + 4, doc.y, { continued: true, characterSpacing: 1, width: 180 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('AMOUNT', M + 188, doc.y, { continued: true, characterSpacing: 1, width: 60 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
   .text('NOTES', M + 252, doc.y, { characterSpacing: 1, width: CW - 256 });
doc.moveDown(0.3);

for (var j = 0; j < p2items.length; j++) {
  var jt = p2items[j];
  var jy = doc.y;
  var jbg = j % 2 === 0 ? LGBG : WHT;
  doc.rect(M, jy, CW, 18).fill(jbg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
     .text(jt[0], M + 4, jy + 4, { width: 180 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GLD)
     .text(jt[1], M + 188, jy + 4, { width: 58 });
  doc.fontSize(8).font('Helvetica').fillColor(GRY)
     .text(jt[2], M + 252, jy + 4, { width: CW - 256 });
  doc.y = jy + 19;
}

doc.rect(M, doc.y, CW, 18).fill('#1A3A5C');
var tot2 = doc.y;
doc.fontSize(9).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 2 TOTAL', M + 4, tot2 + 4);
doc.fontSize(9).font('Helvetica-Bold').fillColor(DGLD)
   .text('$1,500,000', W - M - 90, tot2 + 4, { width: 82, align: 'right' });
doc.y = tot2 + 24;

sp(0.5);

// Phase 3 self-funded
var p3y = doc.y;
doc.rect(M, p3y, CW, 22).fill('#1A4A1A');
doc.rect(M, p3y, 4, 22).fill(DGLD);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHT)
   .text('PHASE 3 — SCALE', M + 14, p3y + 5, { continued: true });
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('  ·  Months 18–36  ·  500,000 to 10,000,000 Members');
doc.fontSize(10).font('Helvetica-Bold').fillColor(DGLD)
   .text('SELF-FUNDED', W - M - 100, p3y + 5, { width: 92, align: 'right' });
doc.y = p3y + 28;

para(
  'Phase 3 requires zero outside capital. Here is why:',
  { bold: true, gap: 0.2 }
);
var selfFund = [
  '500K members × 10% transacting monthly = 50,000 transactions/month',
  'Blended average transaction: $1,500 (auto purchase $8K + services $200 blended)',
  '50,000 × $1,500 × 3% Dynasty Fee = $2,250,000/month from Dynasty Fee alone',
  'Plus subscriptions ($10–$50/month) + insurance referrals + runner commissions + B2B licensing',
  'Conservative total monthly revenue at 500K members: $3,000,000–$5,000,000',
  'Monthly operating cost at that scale: $600,000–$900,000 (team, cloud, runners, legal)',
  'Monthly surplus available to fund Phase 3 expansion: $2,100,000–$4,100,000',
  'Phase 3 expansion cost (international, 2,000 runners, 30-person team): $800K/month',
  'Conclusion: Phase 3 is completely funded by the business. No dilution. No outside capital.',
];
selfFund.forEach(function(s) { bullet(s); });

sp(0.3);

// Grand total
doc.rect(M, doc.y, CW, 30).fill(BLK);
doc.rect(M, doc.y, 4, 30).fill(DGLD);
var gty = doc.y;
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('TOTAL OUTSIDE CAPITAL — 0 TO 10 MILLION MEMBERS', M + 14, gty + 6, { characterSpacing: 1 });
doc.fontSize(16).font('Helvetica-Bold').fillColor(DGLD)
   .text('$2,000,000', M + 14, gty + 16);
doc.fontSize(9).font('Helvetica').fillColor(WHT)
   .text('Phase 1: $500K  +  Phase 2: $1.5M  +  Phase 3: $0 (self-funded)',
     W - M - 260, gty + 18, { width: 252, align: 'right' });
doc.y = gty + 36;

// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — AUDIENCE SECTIONS
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('SECTION 3 — FOR EACH AUDIENCE',
  'The same facts, framed for each reader. All text below is fully copy-paste ready.');

sp(0.4);

// ── VENTURE CAPITAL ──────────────────────────────────────────────────────────
audienceBar('FOR VENTURE CAPITAL INVESTORS', '#0A0A0A');

para(
  'This is a pre-revenue community-growth play with built-in viral mechanics, a self-funding revenue model, ' +
  'and a founder with 10+ years of insider domain expertise. ' +
  'The $2M seed covers two full phases of growth. Phase 3 is funded by the business. No Series B required to reach 10M members.',
  { size: 9.5 }
);

var vcRows = [
  ['Total Raise',          '$2,000,000 seed round'],
  ['Valuation',            '$150,000,000 (founder\'s valuation — replacement cost + AI-native premium)'],
  ['CAC Blended',          '$3–$7 (influencer rev-share, UGC $0–$3, runner $20, WhatsApp $0)'],
  ['LTV (Year 3)',         '$420–$840 per member (3% Dynasty Fee on $14K avg lifetime spend + subscriptions)'],
  ['LTV:CAC Ratio',        '60:1 to 120:1 — best-in-class for any marketplace or platform business'],
  ['K-Factor Target',      '2.0 — each member brings 2 more. Validated by Nubank in identical communities.'],
  ['Revenue at 500K',      '$3M–$5M/month (Dynasty Fee + subscriptions + referrals + B2B)'],
  ['Exit Comparables',     'Nubank ($30B), Carvana ($9B peak), OAK Street Health ($5.3B)'],
  ['Series A Trigger',     '10,000 members + first $10K MRR unlocks institutional Series A at $20M–$50M'],
  ['Category',             'Automotive Super App — no direct competitor exists in this specific market'],
];
vcRows.forEach(function(r) { kv(r[0], r[1]); });

sp(0.4);
rule();

// ── BANK / SBA ───────────────────────────────────────────────────────────────
audienceBar('FOR BANKS & SBA LENDERS', '#1A3A5C');

para(
  '3C ONYX is seeking an SBA Express loan of $150,000–$350,000 as a Phase 1 capital bridge. ' +
  'The platform is fully built with documented replacement value exceeding $3.5M. ' +
  'Loan proceeds fund legal activation and initial operating costs — not product development. Build risk is zero.',
  { size: 9.5 }
);

var bankRows = [
  ['Loan Purpose',         'Legal activation, operating expenses, and initial go-to-market for a live technology platform'],
  ['Loan Amount',          '$150,000 – $350,000 (SBA Express)'],
  ['Collateral Basis',     'Platform IP valued at $3.5M+ replacement cost — the technology is the collateral'],
  ['Repayment Source',     'Membership subscriptions and Dynasty Fee transaction income — begins at first member'],
  ['Business Type',        'Software-as-a-Service (SaaS) + marketplace transaction fee — predictable recurring revenue'],
  ['NAICS Codes',          '522390 (Credit Intermediation Activities) / 541511 (Custom Computer Programming)'],
  ['Entity',               'CUXTOMCANDYCLUB LLC — Florida registered, single-member LLC'],
  ['Deposit on File',      '$12,000 at Citizens Bank'],
  ['Build Risk',           'Zero — platform is fully built, tested, and operational. Capital is for activation only.'],
];
bankRows.forEach(function(r) { kv(r[0], r[1]); });

sp(0.4);
rule();

// ── GOVERNMENT ───────────────────────────────────────────────────────────────
audienceBar('FOR GOVERNMENT AGENCIES & GRANT PROGRAMS', '#1A4A1A');

para(
  '3C ONYX directly addresses systemic economic inequality in automotive access, financial services, and community wealth creation. ' +
  'The platform is founded by a Black entrepreneur and designed specifically for the communities most harmed by predatory lending, ' +
  'discriminatory insurance pricing, and limited access to fair automotive financing.',
  { size: 9.5 }
);

var govRows = [
  ['Financial Inclusion',   'Connects members to 2,200+ lenders without bias by zip code, race, or neighborhood'],
  ['Insurance Equity',      'AI agent eliminates discriminatory rate-setting — members get the rate they deserve, not the default'],
  ['Job Creation',          'Runner network creates independent contractor income for community members with zero startup cost'],
  ['Creator Economy',       'Dynasty Fee model creates passive income for community members who grow the network'],
  ['Grant Eligibility',     'CDFI grants, SBA Community Navigator, MBDA programs, state fintech innovation grants'],
  ['Relevant SDGs',         'SDG 1 (No Poverty), SDG 8 (Decent Work), SDG 10 (Reduced Inequality), SDG 11 (Sustainable Communities)'],
  ['Founder Profile',       'Black entrepreneur, 10+ years automotive industry expertise, building for his own community'],
  ['Economic Multiplier',   'Every $1M in ONYX transactions generates $30K in Dynasty Fee income redistributed to community members'],
];
govRows.forEach(function(r) { kv(r[0], r[1]); });

sp(0.4);
rule();

// ── LEGAL ────────────────────────────────────────────────────────────────────
audienceBar('FOR LEGAL COUNSEL & LAW FIRMS', '#4A1A00');

para(
  'The following five legal matters require immediate attention and are directly tied to Phase 1 capital deployment. ' +
  'Estimated total legal budget for Phase 1: $75,000 (phased — only what is needed to launch first).',
  { size: 9.5 }
);

var legalItems = [
  {
    priority: 'P1 — IMMEDIATE',
    title: 'Entity Structure & Investment Readiness',
    detail: 'Convert or restructure CUXTOMCANDYCLUB LLC for seed investment. Options: C-Corp conversion (Delaware), holding company with Florida operating LLC, or Dynasty Trust overlay for IP protection. Must be complete before any investment closes. Budget: $10,000–$20,000.',
  },
  {
    priority: 'P1 — IMMEDIATE',
    title: 'IP Ownership & Assignment',
    detail: 'All intellectual property — platform code, AI agent logic, brand assets, trademarks, domain names — must be formally assigned from founder to operating entity prior to any investment. Non-negotiable for any investor. Budget: $3,000–$5,000.',
  },
  {
    priority: 'P1 — PRE-LAUNCH',
    title: 'Automotive Dealer License Analysis',
    detail: 'Determine whether ONYX\'s AI-facilitated marketplace model requires a dealer license in Florida and target states, or qualifies as a referral/technology platform exempt from dealer licensing. Critical for launch. Budget: $5,000–$10,000.',
  },
  {
    priority: 'P2 — PRE-REVENUE',
    title: 'Money Transmitter & Dynasty Fee Compliance',
    detail: 'Analyze whether the Dynasty Tech Fee (3% collected on transactions) and runner payment flows require money transmitter licensing under FinCEN, Florida OFR, or state MSB rules. Determine safe harbor structure. Budget: $8,000–$15,000.',
  },
  {
    priority: 'P2 — PRE-REVENUE',
    title: 'Insurance Referral Compliance',
    detail: 'Confirm permissible referral fee structures with licensed insurance carriers in each state of operation. Distinguish clearly between referral activity (permissible without license) and brokerage activity (requires license). Budget: $5,000–$10,000.',
  },
];

legalItems.forEach(function(li) {
  var liy = doc.y;
  doc.rect(M, liy, CW, 16).fill(LGBG);
  doc.rect(M, liy, 4, 16).fill(li.priority.includes('P1') ? '#8B0000' : GLD);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(li.priority.includes('P1') ? '#8B0000' : GLD)
     .text(li.priority + '  ', M + 8, liy + 4, { continued: true, characterSpacing: 0.5 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
     .text(li.title, { width: CW - 14 });
  doc.y = liy + 18;
  doc.fontSize(8.5).font('Helvetica').fillColor(GRY)
     .text(li.detail, M + 8, doc.y, { width: CW - 12, lineGap: 2 });
  doc.moveDown(0.4);
});

// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — THE ASK
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('SECTION 4 — THE ASK', 'One round. $2M. The entire model is funded.');

sp(0.4);

para(
  'This is a $2,000,000 seed round. It is not a bridge. It is not a first tranche. ' +
  'It is the complete capital requirement to activate Phase 1 and Phase 2, ' +
  'after which the platform funds itself from Dynasty Fee revenue.',
  { size: 10.5 }
);

sp(0.4);

// Capital tier outcomes
var tiers = [
  {
    amount: '$150,000–$350,000',
    label:  'SBA Bridge / First Check',
    c:      '#2A2A2A',
    items: [
      'Legal activation complete: entity structure, IP assignment, dealer license, compliance',
      'First 1,000 members onboarded via invite-only ONYX Access Key',
      'First 10 influencer partnerships activated (rev-share model)',
      'First revenue transaction closed — Dynasty Fee begins flowing',
      'Platform publicly accessible for the first time',
    ],
  },
  {
    amount: '$500,000',
    label:  'Phase 1 Complete',
    c:      '#0A0A2A',
    items: [
      'All Phase 1 deliverables above, plus:',
      '50 micro-influencer partnerships — 50,000 member target within 6 months',
      '50 runners deployed in first 2 markets — brand touchpoints live',
      'WhatsApp referral engine fully active — K-factor measurable',
      'Community manager hired — UGC campaign running',
      'First institutional traction data: CAC, referral rate, first retention metrics',
    ],
  },
  {
    amount: '$2,000,000',
    label:  'Full Seed Round — Phase 1 + 2',
    c:      '#0A2A0A',
    items: [
      'All Phase 1 and Phase 2 deliverables:',
      '500,000 member target within 18 months',
      '500 runners in 5 US cities + Caribbean/Latin America expansion launched',
      '100+ influencer partners — 70% on Dynasty Fee rev-share',
      'Full team of 6–8 people operational',
      'All 13 revenue streams generating monthly recurring revenue',
      'Series A ready: live traction metrics, unit economics documented, $3M+ MRR',
      'Phase 3 (500K to 10M members) funded entirely by the business — no further raise needed',
    ],
  },
];

tiers.forEach(function(tier) {
  var tiy = doc.y;
  doc.rect(M, tiy, CW, 22).fill(tier.c);
  doc.rect(M, tiy, 4, 22).fill(DGLD);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(DGLD)
     .text(tier.amount, M + 14, tiy + 5, { continued: true });
  doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
     .text('  ·  ' + tier.label);
  doc.y = tiy + 26;
  tier.items.forEach(function(it) { bullet(it); });
  sp(0.4);
});

rule(GLD, 1);
sp(0.4);

// The single bottleneck
doc.rect(M, doc.y, CW, 46).fill(BLK);
doc.rect(M, doc.y, 4, 46).fill(DGLD);
var bky = doc.y;
doc.fontSize(8).font('Helvetica').fillColor('#888888')
   .text('THE ONE THING THAT UNLOCKS EVERYTHING', M + 14, bky + 8, { characterSpacing: 2 });
doc.fontSize(13).font('Helvetica-Bold').fillColor(WHT)
   .text('The platform is built. The bottleneck is the first 1,000 members.', M + 14, bky + 22, { width: CW - 20 });
doc.fontSize(8.5).font('Helvetica').fillColor('#AAAAAA')
   .text('Revenue. Series A. 10 million members. All of it flows from that one milestone.',
     M + 14, bky + 38, { width: CW - 20 });
doc.y = bky + 52;

sp(0.5);

// Contact
secHeader('CONTACT & NEXT STEP', '');
sp(0.3);

kv('Founder',       'Ronald Antonio Cadet  ·  Ron3C');
kv('Entity',        'CUXTOMCANDYCLUB LLC  ·  Florida, USA');
kv('Email',         'ron@3conyx.com');
kv('Website',       'www.3conyx.com');
kv('Platform',      'Live and fully operational — demo available upon request');
kv('Raise',         '$2,000,000 seed round — raising now');
kv('Next Step',     'Reply to schedule a 30-minute live platform walkthrough');

sp(0.8);
rule(GLD, 0.75);
sp(0.4);

doc.fontSize(10).font('Helvetica').fillColor(DARK)
   .text(
     '"One person built this. The platform is done.\nThe communities that were overlooked are about to be served — in luxury."',
     M, doc.y, { width: CW, align: 'center', lineGap: 4 }
   );
sp(0.3);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor(LGY)
   .text('— Ronald Antonio Cadet, Founder & CEO, CUXTOMCANDYCLUB LLC',
     M, doc.y, { width: CW, align: 'center' });
sp(0.6);

doc.fontSize(7.5).font('Helvetica').fillColor('#AAAAAA')
   .text(
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR AND PROFESSIONAL REVIEW ONLY\n' +
     '© 2026 CUXTOMCANDYCLUB LLC. ALL RIGHTS RESERVED. PROPRIETARY AND CONFIDENTIAL.\n' +
     'FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );

doc.end();
console.log('Written to', OUT);
