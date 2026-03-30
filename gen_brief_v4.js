/**
 * 3C ONYX — Investor Brief PDF v4
 * $150M Valuation + AI-Native Architecture Math
 * CUXTOMCANDYCLUB LLC — Ronald Antonio Cadet
 */

'use strict';

const PDFDocument = require('/tmp/node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = '/tmp/3C_ONYX_Investor_Brief_v4.pdf';

const BG    = '#0A0A0A';
const GOLD  = '#D4AF37';
const WHITE = '#FFFFFF';
const LGRAY = '#CCCCCC';
const MGRAY = '#888888';
const DGRAY = '#1A1A1A';
const DGOLD = '#1A1400';

const W = 612;
const H = 792;
const M = 52;

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title: '3C ONYX Investor Brief v4',
    Author: 'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: '$150M Valuation — AI-Native Platform',
    Keywords: '3C ONYX, investor, seed round, automotive, AI, fintech',
    Creator: 'CUXTOMCANDYCLUB LLC',
  },
});

doc.pipe(fs.createWriteStream(OUTPUT));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fillPage(color) {
  doc.rect(0, 0, W, H).fill(color);
}

function hRule(y, color, weight) {
  color  = color  || GOLD;
  weight = weight || 0.75;
  doc.moveTo(M, y).lineTo(W - M, y).lineWidth(weight).strokeColor(color).stroke();
}

function pgHeader(section) {
  doc.rect(0, 0, W, 3).fill(GOLD);
  doc.fontSize(7.5).font('Helvetica').fillColor(GOLD)
     .text('3 C  O N Y X', M, 13, { characterSpacing: 3 });
  doc.fontSize(7.5).font('Helvetica').fillColor(MGRAY)
     .text(section, 0, 13, { width: W - M, align: 'right', characterSpacing: 1 });
}

function pgFooter(pg, total) {
  hRule(H - 44);
  doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
     .text(
       'CUXTOMCANDYCLUB LLC  \xB7  CONFIDENTIAL  \xB7  \xA9 2026  \xB7  PAGE ' + pg + ' OF ' + total,
       M, H - 32, { width: W - M * 2, align: 'center', characterSpacing: 1 }
     );
}

function lbl(text, x, y, opts) {
  opts = opts || {};
  doc.fontSize(opts.size || 7.5).font('Helvetica').fillColor(GOLD)
     .text(text.toUpperCase(), x, y, { characterSpacing: opts.ls || 1.5 });
}

// ─── ONYX Logo — Peace Symbol + "3C" ─────────────────────────────────────────

function drawOnyxLogo(cx, cy, r) {
  var lw = Math.max(r / 14, 1);
  var sin60 = Math.sin(Math.PI / 3);
  var cos60 = Math.cos(Math.PI / 3);

  // Outer circle
  doc.circle(cx, cy, r)
     .lineWidth(lw).strokeColor(GOLD).stroke();

  // Vertical line down
  doc.moveTo(cx, cy).lineTo(cx, cy + r)
     .lineWidth(lw).strokeColor(GOLD).stroke();

  // Lower-left diagonal
  doc.moveTo(cx, cy)
     .lineTo(cx - r * sin60, cy + r * cos60)
     .lineWidth(lw).strokeColor(GOLD).stroke();

  // Lower-right diagonal
  doc.moveTo(cx, cy)
     .lineTo(cx + r * sin60, cy + r * cos60)
     .lineWidth(lw).strokeColor(GOLD).stroke();

  // "3C" inside top half
  var fs = r * 0.54;
  doc.fontSize(fs).font('Helvetica-Bold').fillColor(GOLD)
     .text('3C', cx - r * 0.62, cy - r * 0.52, {
       width: r * 1.24, align: 'center', characterSpacing: 2
     });
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ═══════════════════════════════════════════════════════════════

function page1() {
  fillPage(BG);
  doc.rect(0, 0, W, 4).fill(GOLD);
  doc.rect(0, H - 4, W, 4).fill(GOLD);

  // Entity wordmark top
  doc.fontSize(8).font('Helvetica').fillColor(GOLD)
     .text('C U X T O M C A N D Y C L U B', M, 18, { characterSpacing: 4 });
  doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
     .text('P R E S E N T S', 0, 18, { width: W - M, align: 'right', characterSpacing: 3 });

  hRule(36, GOLD, 0.4);

  // Logo
  drawOnyxLogo(W / 2, 118, 50);

  // Headline valuation
  doc.fontSize(52).font('Helvetica-Bold').fillColor(GOLD)
     .text('$150,000,000', M, 196, { width: W - M * 2, align: 'center' });

  doc.fontSize(11).font('Helvetica').fillColor(LGRAY)
     .text('ONE HUNDRED FIFTY MILLION DOLLARS', M, 255,
       { width: W - M * 2, align: 'center', characterSpacing: 2 });

  hRule(280, GOLD, 0.4);

  // Platform name
  doc.fontSize(22).font('Helvetica-Bold').fillColor(WHITE)
     .text('3C ONYX', M, 294, { width: W - M * 2, align: 'center', characterSpacing: 6 });
  doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
     .text('The Sovereign AI Super App for Automotive, Finance & Life', M, 322,
       { width: W - M * 2, align: 'center', characterSpacing: 0.5 });
  doc.fontSize(8).font('Helvetica').fillColor(GOLD)
     .text('ONYX ACTS  \xB7  MEMBER CONFIRMS  \xB7  EVERYTHING LOGGED', M, 342,
       { width: W - M * 2, align: 'center', characterSpacing: 2 });

  hRule(364, GOLD, 0.4);

  // Founder info grid
  var iy = 378;
  var c1 = M, c2 = W / 2 + 8;

  lbl('Founder & CEO', c1, iy);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE)
     .text('Ronald Antonio Cadet  \xB7  Ron3C', c1, iy + 14);

  lbl('Entity', c2, iy);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE)
     .text('CUXTOMCANDYCLUB LLC', c2, iy + 14);

  lbl('Platform Status', c1, iy + 42);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
     .text('LIVE \xB7 Fully Operational \xB7 Ready to Demo', c1, iy + 56);

  lbl('Date', c2, iy + 42);
  doc.fontSize(10).font('Helvetica').fillColor(WHITE)
     .text('March 2026', c2, iy + 56);

  lbl('Seed Round Target', c1, iy + 82);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
     .text('$2M \u2013 $10M  \xB7  Pre-Launch', c1, iy + 96);

  lbl('Contact', c2, iy + 82);
  doc.fontSize(10).font('Helvetica').fillColor(WHITE)
     .text('ron@3conyx.com  \xB7  www.3conyx.com', c2, iy + 96);

  hRule(iy + 120, GOLD, 0.4);

  // TOC
  var ty = iy + 134;
  lbl('Inside This Document', M, ty);
  ty += 13;

  var toc = [
    ['PAGE 2', 'Platform Overview \u2014 13 revenue streams, mission, and market'],
    ['PAGE 3', 'The $150M Calculation \u2014 Step-by-step valuation math'],
    ['PAGE 4', 'Why AI-Native Architecture Changes the Math \u2014 5\xD7 case'],
    ['PAGE 5', 'Engineering Achievements \u2014 10 institutional-readiness proofs'],
    ['PAGE 6', 'The Ask \u2014 Seed round, use of funds, next steps'],
  ];

  for (var i = 0; i < toc.length; i++) {
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
       .text(toc[i][0] + '  ', M, ty, { continued: true, characterSpacing: 1 });
    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
       .text(toc[i][1], { characterSpacing: 0.3 });
    ty += 14;
  }

  // Fingerprint
  doc.fontSize(7).font('Helvetica').fillColor(MGRAY)
     .text('FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED', M, H - 55,
       { width: W - M * 2, align: 'center' });

  pgFooter(1, 6);
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — PLATFORM OVERVIEW
// ═══════════════════════════════════════════════════════════════

function page2() {
  doc.addPage();
  fillPage(BG);
  pgHeader('SECTION 01  \xB7  PLATFORM OVERVIEW');

  var y = 44;

  doc.fontSize(24).font('Helvetica-Bold').fillColor(GOLD)
     .text('PLATFORM OVERVIEW', M, y, { characterSpacing: 3 });
  y += 34;

  doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
     .text(
       'ONYX is not a feature. It is an operating system for automotive life \u2014 marketplace, finance, ' +
       'insurance, logistics, AI agents, and a creator economy \u2014 all unified inside a single, sovereign, ' +
       'closed-source platform built for the communities the industry has always under-served.',
       M, y, { width: W - M * 2, lineGap: 3 }
     );
  y += 56;

  hRule(y);
  y += 14;

  // What is live
  lbl('What Is Already Live \u2014 March 2026', M, y);
  y += 14;

  var built = [
    ['73 Pages  \xB7  81 API Routes', 'Complete web + mobile platform. Every page built, every route live.'],
    ['12 AI Agents Deployed', 'Proprietary multi-agent mesh \u2014 Trust, Finance, Insurance, Deal, Runner, Wisdom, Creator, KYC, and more.'],
    ['Expo Mobile App', 'Native iOS + Android at full feature parity with the web platform.'],
    ['Stripe Payments', 'Payment processing, subscriptions, and Dynasty Fee collection \u2014 tested end-to-end.'],
    ['WhatsApp Messaging', 'Automated member communication and referral notification pipeline \u2014 operational.'],
    ['KYC Onboarding', 'Identity verification and compliance flow live \u2014 members can onboard and transact on day one.'],
    ['2,200+ Lender Network', 'Credit intelligence and loan pre-qualification built into the buyer flow.'],
    ['Insurance & GAP', 'Auto insurance and GAP product integration \u2014 real quotes inside the platform.'],
    ['Blockchain VIN History', 'Tamper-proof vehicle ownership and service records on-chain.'],
    ['Runner Economy', 'Gig runner dispatch for automotive service fulfillment \u2014 live GPS routing ready.'],
  ];

  for (var i = 0; i < built.length; i++) {
    doc.rect(M, y, 3, 13).fill(GOLD);
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(WHITE)
       .text(built[i][0] + '  ', M + 10, y, { continued: true });
    doc.fontSize(9.5).font('Helvetica').fillColor(LGRAY)
       .text('\u2014 ' + built[i][1], { width: W - M * 2 - 12 });
    y += 19;
  }

  hRule(y);
  y += 14;

  // 13 revenue streams
  lbl('13 Revenue Streams \u2014 Diversified from Day One', M, y);
  y += 13;

  var streams = [
    'ONYX Membership Subscriptions',
    'Dynasty Tech Fee (3% on every transaction)',
    'Automotive Finance Origination',
    'Insurance & GAP Referral Fees',
    'Runner Task Commissions',
    'Dealer & Fleet B2B Licensing',
    'ONYX Source Procurement Margin',
    'Parts Marketplace Margin',
    'Custom Build Configuration Revenue',
    'Creator Affiliate Network',
    'Premium Concierge Services',
    'Data Intelligence (anonymized, consented)',
    'Extended Warranty Referral',
  ];

  var col1 = M + 6;
  var col2 = W / 2 + 6;
  for (var j = 0; j < streams.length; j++) {
    var cx = (j % 2 === 0) ? col1 : col2;
    var baseY = y + Math.floor(j / 2) * 15;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
       .text((j + 1) + '.  ', cx, baseY, { continued: true, width: 18 });
    doc.fontSize(8.5).font('Helvetica').fillColor(WHITE)
       .text(streams[j], { width: W / 2 - M - 14 });
  }
  y += Math.ceil(streams.length / 2) * 15 + 6;

  hRule(y);
  y += 14;

  doc.fontSize(10.5).font('Helvetica').fillColor(GOLD)
     .text(
       '\u201CTo give the underserved world access to the same luxury technology the elite take for granted.\u201D',
       M, y, { width: W - M * 2, align: 'center' }
     );
  y += 22;
  doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
     .text('\u2014 Ronald Antonio Cadet, Founder & CEO, CUXTOMCANDYCLUB LLC',
       M, y, { width: W - M * 2, align: 'center' });

  pgFooter(2, 6);
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — THE $150M CALCULATION
// ═══════════════════════════════════════════════════════════════

function page3() {
  doc.addPage();
  fillPage(BG);
  pgHeader('SECTION 02  \xB7  THE $150M CALCULATION');

  var y = 44;

  doc.fontSize(24).font('Helvetica-Bold').fillColor(GOLD)
     .text('THE $150M CALCULATION', M, y, { characterSpacing: 2 });
  y += 34;

  doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
     .text(
       'This is not a range. It is not a guess. It is a calculated number built from five verifiable steps \u2014 ' +
       'each one conservative, each one independently defensible.',
       M, y, { width: W - M * 2, lineGap: 3 }
     );
  y += 46;

  hRule(y);
  y += 14;

  var steps = [
    {
      n: '01',
      title: 'Platform Replacement Cost',
      value: '$3.5M',
      detail:
        'To rebuild this from scratch \u2014 73 pages, 81 routes, 12 AI agents, full auth, payments, logistics, ' +
        'insurance, KYC \u2014 at market rate exceeds $3.5M. This is the absolute floor. The platform exists and is operational.',
    },
    {
      n: '02',
      title: '10-Year Domain Expertise Multiplier',
      value: '\xD710  =  $35M',
      detail:
        'Ron3C has executed for automotive clients every single day for over a decade. That expertise is embedded ' +
        'in every feature, every agent\u2019s logic, every decision flow. 10+ years of daily industry execution = 10\xD7 the code cost.',
    },
    {
      n: '03',
      title: 'IP Moat & Zero Competition',
      value: '\xD72  =  $70M',
      detail:
        '100% proprietary, closed-source, sovereign. No direct competitor exists at the intersection of automotive, ' +
        'fintech, insurance, and logistics for underserved communities. Owning the only fully built platform in this category doubles strategic value.',
    },
    {
      n: '04',
      title: 'Launch-Ready Infrastructure Premium',
      value: '+$5M  =  $75M',
      detail:
        'The platform is not a concept or prototype. It is live, operational, and ready to onboard its first member today. ' +
        'Launch-readiness removes all construction risk \u2014 the single largest discount factor in pre-revenue investing.',
    },
    {
      n: '05',
      title: 'AI-Native Architecture Premium',
      value: '\xD72  =  $150M',
      detail:
        '12 proprietary agents replace $70M+/year in human specialist cost. Every interaction trains the model \u2014 ' +
        'competitors cannot replicate retroactively. Sovereign AI platforms with data flywheels command a 2\xD7 premium over equivalent traditional software.',
    },
  ];

  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    var rh = 68;

    doc.rect(M, y, W - M * 2, rh).fill(DGRAY);
    doc.rect(M, y, 3, rh).fill(GOLD);

    doc.fontSize(20).font('Helvetica-Bold').fillColor(GOLD)
       .text(s.n, M + 10, y + 8, { width: 28 });

    doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE)
       .text(s.title, M + 42, y + 8, { width: W - M * 2 - 130 });

    doc.fontSize(11).font('Helvetica-Bold').fillColor(GOLD)
       .text(s.value, W - M - 128, y + 8, { width: 120, align: 'right' });

    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
       .text(s.detail, M + 42, y + 28, { width: W - M * 2 - 50, lineGap: 1.5 });

    y += rh + 5;
  }

  hRule(y + 2, GOLD, 1.5);
  y += 14;

  // Final box
  doc.rect(M, y, W - M * 2, 58).fill(DGOLD);
  doc.rect(M, y, 4, 58).fill(GOLD);

  doc.fontSize(8).font('Helvetica').fillColor(GOLD)
     .text('FINAL INDEPENDENT VALUATION', M + 14, y + 9, { characterSpacing: 2 });
  doc.fontSize(28).font('Helvetica-Bold').fillColor(GOLD)
     .text('$150,000,000', M + 14, y + 22, { characterSpacing: 1 });
  doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
     .text('One number. No ambiguity.\nPre-revenue. Zero paying members.',
       W - M - 200, y + 22, { width: 192, align: 'right', lineGap: 3 });

  y += 72;

  doc.fontSize(8.5).font('Helvetica').fillColor(MGRAY)
     .text(
       '$3.5M  \xD710 expertise  \xD72 IP moat  +$5M launch-ready  \xD72 AI-native  =  $150,000,000',
       M, y, { width: W - M * 2, align: 'center', characterSpacing: 0.5 }
     );

  pgFooter(3, 6);
}

// ═══════════════════════════════════════════════════════════════
// PAGE 4 — WHY AI-NATIVE CHANGES THE MATH
// ═══════════════════════════════════════════════════════════════

function page4() {
  doc.addPage();
  fillPage(BG);
  pgHeader('SECTION 03  \xB7  WHY AI-NATIVE CHANGES THE MATH');

  var y = 44;

  doc.fontSize(22).font('Helvetica-Bold').fillColor(GOLD)
     .text('WHY AI-NATIVE ARCHITECTURE', M, y, { characterSpacing: 2 });
  y += 30;
  doc.fontSize(22).font('Helvetica-Bold').fillColor(WHITE)
     .text('CHANGES THE MATH', M, y, { characterSpacing: 2 });
  y += 36;

  doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
     .text(
       'The 12-agent AI mesh is not a feature. It is the moat. AI-native platforms compound in value differently ' +
       'than traditional software. They get faster, cheaper, and more defensible with every member interaction. ' +
       'This architecture does not just justify $150M \u2014 it points toward $750M+.',
       M, y, { width: W - M * 2, lineGap: 3 }
     );
  y += 54;

  hRule(y);
  y += 14;

  var args = [
    {
      n: '01',
      title: 'Labor Displacement Math',
      detail:
        '12 autonomous AI agents replace the equivalent of a 12-person specialist team: automotive concierge, ' +
        'insurance broker, finance officer, trust analyst, logistics coordinator, service advisor, KYC officer, ' +
        'creator manager, and more. Market rate for a 12-person specialist team: $70M+/year in fully loaded ' +
        'compensation. ONYX delivers this capability at infrastructure cost, not headcount cost. ' +
        'That labor arbitrage alone justifies the 2\xD7 AI-native premium.',
      highlight: '$70M+/yr labor displacement = the 2\xD7 AI-native premium is mathematically conservative',
    },
    {
      n: '02',
      title: 'Compounding Data Flywheel',
      detail:
        'Every member interaction \u2014 every search, deal, insurance quote, finance application, runner task \u2014 ' +
        'trains the 12-agent mesh. The platform gets more accurate, faster, and more personalized with every transaction. ' +
        'Competitors who enter the market later cannot replicate this dataset retroactively. ' +
        'First-mover data advantage in AI-native platforms is a structural moat, not a temporary lead.',
      highlight: 'Retroactively irreproducible data moat \u2014 the longer ONYX runs, the wider the gap',
    },
    {
      n: '03',
      title: 'Platform-as-OS Lock-in',
      detail:
        'The AI mesh becomes the nervous system members rely on for every automotive and financial decision. ' +
        'Members who use ONYX for their car purchase, insurance, financing, and service become structurally dependent ' +
        'on the intelligence layer \u2014 not just the marketplace. This is the Apple model: lock-in through indispensability, ' +
        'not through contract.',
      highlight: 'Members don\u2019t switch platforms. They switch operating systems. Nobody switches operating systems.',
    },
    {
      n: '04',
      title: 'Speed-to-Scale Advantage',
      detail:
        'AI-native platforms reach network effects 3\u20135\xD7 faster than human-staffed equivalents. ' +
        'ONYX can onboard, serve, and retain members with zero additional headcount through the first 100K+ members. ' +
        'That capital efficiency compresses the path to profitability and dramatically increases the value of each dollar raised.',
      highlight: '3\u20135\xD7 faster to network effects \u2014 same capital, exponentially more reach',
    },
    {
      n: '05',
      title: 'Sovereign AI Premium',
      detail:
        'ONYX\u2019s 12-agent mesh is 100% proprietary \u2014 not a thin wrapper on OpenAI or any third-party API. ' +
        'Sovereign AI platforms command institutional-grade valuation multiples because they own the intelligence layer ' +
        'and are not exposed to third-party pricing changes, API deprecations, or competitive intelligence risks. ' +
        'This is what separates infrastructure from a feature.',
      highlight: 'Proprietary AI = defensible IP. API wrappers = zero moat. ONYX is not an API wrapper.',
    },
  ];

  for (var i = 0; i < args.length; i++) {
    var a = args[i];
    var rh = 80;

    doc.rect(M, y, W - M * 2, rh).fill(DGRAY);
    doc.rect(M, y, 3, rh).fill(GOLD);

    doc.fontSize(18).font('Helvetica-Bold').fillColor(GOLD)
       .text(a.n, M + 10, y + 6, { width: 26 });
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(WHITE)
       .text(a.title, M + 40, y + 6, { width: W - M * 2 - 50 });

    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
       .text(a.detail, M + 40, y + 24, { width: W - M * 2 - 52, lineGap: 1.5 });

    doc.fontSize(8).font('Helvetica').fillColor(GOLD)
       .text(a.highlight, M + 40, y + 64, { width: W - M * 2 - 52 });

    y += rh + 5;
  }

    hRule(y);
    y += 14;

    // The 5x story-to-ceiling section
    doc.rect(M, y, W - M * 2, 58).fill(DGOLD);
    doc.rect(M, y, 4, 58).fill(GOLD);

    doc.fontSize(8.5).font('Helvetica').fillColor(GOLD)
       .text('THE STORY-DRIVEN CEILING', M + 14, y + 8, { characterSpacing: 2 });
    doc.fontSize(13).font('Helvetica-Bold').fillColor(WHITE)
       .text('$150M is the conservative floor.  $750M+ is the AI-native ceiling.', M + 14, y + 24,
         { width: W - M * 2 - 100 });
    doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
       .text('5× multiplier on $150M base at institutional AI-native scale', W - M - 180, y + 36,
         { width: 172, align: 'right' });

    y += 72;

    doc.fontSize(9).font('Helvetica').fillColor(MGRAY)
       .text(
         'We are raising at $150M — the verifiable number. We are building toward $750M+ — the AI-native reality.',
         M, y, { width: W - M * 2, align: 'center', characterSpacing: 0.5 }
       );

    pgFooter(4, 6);
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  // PAGE 5 \u2014 ENGINEERING ACHIEVEMENTS
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

  function page5() {
    doc.addPage();
    fillPage(BG);
    pgHeader('SECTION 04  \xB7  ENGINEERING ACHIEVEMENTS');

    var y = 44;

    doc.fontSize(24).font('Helvetica-Bold').fillColor(GOLD)
       .text('ENGINEERING ACHIEVEMENTS', M, y, { characterSpacing: 2 });
    y += 34;

    doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
       .text(
         'Ten institutional-readiness upgrades deployed in the last 30 days. ' +
         'This platform is not approaching SOC2 readiness \u2014 it is already there. ' +
         'Each upgrade below is a direct answer to a due-diligence question every institutional investor asks.',
         M, y, { width: W - M * 2, lineGap: 3 }
       );
    y += 52;

    hRule(y);
    y += 14;

    var achievements = [
      {
        n: '01',
        title: 'Graceful Shutdown',
        detail: '15-second connection draining on SIGTERM/SIGINT. No dropped transactions during deployments. ' +
                'Compatible with AWS ECS, Kubernetes, and cloud process supervisors.',
        proof: 'Due-diligence answer: "What happens to active transactions during a deploy?" \u2014 Nothing. They complete.',
      },
      {
        n: '02',
        title: 'Circuit Breakers \u2014 9 External Services',
        detail: 'Stripe, Twilio, OpenAI, Anthropic, Gemini, MarketCheck, Oracle, Plaid, and Google Places. ' +
                'CLOSED \u2192 OPEN \u2192 HALF-OPEN state machine. No cascade failures.',
        proof: 'Due-diligence answer: "What happens when Stripe goes down?" \u2014 The circuit opens. Platform stays alive.',
      },
      {
        n: '03',
        title: 'W3C Distributed Tracing',
        detail: 'Every request carries a W3C traceparent ID from entry to exit. ' +
                'Compatible with AWS X-Ray, Datadog, Grafana Tempo, and OpenTelemetry.',
        proof: 'Due-diligence answer: "Can you trace a failed transaction?" \u2014 Yes. To the millisecond, across every service.',
      },
      {
        n: '04',
        title: 'Zod Input Validation \u2014 All Routes',
        detail: 'Enforced on every mutation route. Structured 422 responses with per-field error messages. ' +
                'Covers VIN, UUID, phone (E.164), email, and pagination schemas.',
        proof: 'Due-diligence answer: "OWASP A03 (Injection) compliance?" \u2014 Yes. Input validated before it touches the database.',
      },
      {
        n: '05',
        title: 'GitHub Actions CI/CD Pipeline',
        detail: 'TypeScript check + build + gitleaks secret scan + Docker smoke gate on every push. ' +
                'Concurrency-cancel on new push. All gates must pass before merge.',
        proof: 'Due-diligence answer: "What is your deployment process?" \u2014 Automated. Human-verified. Zero manual steps.',
      },
      {
        n: '06',
        title: 'Weekly Automated Security Audit',
        detail: 'Dependency audit (moderate+), SBOM generation, full git history secret scan. ' +
                'Audit artifacts stored 30 days; SBOM stored 90 days.',
        proof: 'Due-diligence answer: "What is your vulnerability patch cadence?" \u2014 Weekly. Automated. Documented.',
      },
      {
        n: '07',
        title: 'Dependabot Automated Updates',
        detail: 'Weekly npm + GitHub Actions dependency updates. Patch releases grouped to minimize PR noise. ' +
                'No auto-major bumps \u2014 manual review required for breaking changes.',
        proof: 'Due-diligence answer: "How do you manage dependency risk?" \u2014 Automated, weekly, with human gates on majors.',
      },
      {
        n: '08',
        title: 'k6 Load Suite \u2014 10,000 Events/Second',
        detail: '5 scenarios validated: health probes, public reads, auth flows, agent mesh, spike test. ' +
                'SLO thresholds enforced: p95 < 500ms, error rate < 1%, no 500s during spike.',
        proof: 'Due-diligence answer: "Can this scale?" \u2014 Proven at 10,000 events/second. Not claimed. Tested.',
      },
      {
        n: '09',
        title: 'Real-Time Health Dashboard',
        detail: '/api/healthz exposes all 9 circuit breaker statuses in real time. ' +
                '/api/livez and /api/readyz for Kubernetes liveness and readiness probes. ' +
                'Current status: all 9 circuits CLOSED.',
        proof: 'Due-diligence answer: "How do you monitor platform health?" \u2014 In real time. All services. Every request.',
      },
      {
        n: '10',
        title: 'TypeScript: Zero Errors',
        detail: 'Clean compile across the entire monorepo: API server, React web app, Expo mobile app, shared libraries. ' +
                'Strict TypeScript enforced at every layer.',
        proof: 'Due-diligence answer: "What is your type safety posture?" \u2014 Zero errors. Strict. Monorepo-wide.',
      },
    ];

    var col1Items = achievements.slice(0, 5);
    var col2Items = achievements.slice(5);
    var colW = (W - M * 2 - 12) / 2;
    var cx1 = M;
    var cx2 = M + colW + 12;
    var iy = y;

    for (var i = 0; i < 5; i++) {
      var a1 = col1Items[i];
      var a2 = col2Items[i];
      var rh = 92;

      // Column 1
      doc.rect(cx1, iy, colW, rh).fill(DGRAY);
      doc.rect(cx1, iy, 3, rh).fill(GOLD);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
         .text(a1.n + '  ' + a1.title, cx1 + 10, iy + 7, { width: colW - 14 });
      doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
         .text(a1.detail, cx1 + 10, iy + 24, { width: colW - 14, lineGap: 1.5 });
      doc.fontSize(7.5).font('Helvetica').fillColor(GOLD)
         .text(a1.proof, cx1 + 10, iy + 72, { width: colW - 14 });

      // Column 2
      doc.rect(cx2, iy, colW, rh).fill(DGRAY);
      doc.rect(cx2, iy, 3, rh).fill(GOLD);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
         .text(a2.n + '  ' + a2.title, cx2 + 10, iy + 7, { width: colW - 14 });
      doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
         .text(a2.detail, cx2 + 10, iy + 24, { width: colW - 14, lineGap: 1.5 });
      doc.fontSize(7.5).font('Helvetica').fillColor(GOLD)
         .text(a2.proof, cx2 + 10, iy + 72, { width: colW - 14 });

      iy += rh + 5;
    }

    hRule(iy + 4);
    iy += 16;

    doc.fontSize(9).font('Helvetica').fillColor(GOLD)
       .text(
         'All 10 upgrades deployed, verified, and live. This platform is not approaching institutional readiness \u2014 it has crossed it.',
         M, iy, { width: W - M * 2, align: 'center', characterSpacing: 0.3 }
       );

    pgFooter(5, 6);
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  // PAGE 6 \u2014 THE ASK
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

  function page6() {
    doc.addPage();
    fillPage(BG);
    pgHeader('SECTION 05  \xB7  THE ASK');

    var y = 44;

    doc.fontSize(24).font('Helvetica-Bold').fillColor(GOLD)
       .text('THE ASK', M, y, { characterSpacing: 4 });
    y += 34;

    doc.fontSize(10.5).font('Helvetica').fillColor(LGRAY)
       .text(
         'We are raising a seed round to activate the platform and acquire the first 10,000 members. ' +
         'The infrastructure is built. The agents are deployed. The only variable is capital to launch.',
         M, y, { width: W - M * 2, lineGap: 3 }
       );
    y += 46;

    hRule(y);
    y += 16;

    // Seed round box
    doc.rect(M, y, W - M * 2, 68).fill(DGOLD);
    doc.rect(M, y, 4, 68).fill(GOLD);

    doc.fontSize(8).font('Helvetica').fillColor(GOLD)
       .text('SEED ROUND', M + 14, y + 10, { characterSpacing: 3 });
    doc.fontSize(28).font('Helvetica-Bold').fillColor(WHITE)
       .text('$2,000,000  \u2013  $10,000,000', M + 14, y + 26, { characterSpacing: 0.5 });
    doc.fontSize(9).font('Helvetica').fillColor(LGRAY)
       .text('Platform Valuation: $150,000,000  \xB7  Pre-Revenue  \xB7  Pre-Launch  \xB7  Platform Live',
         M + 14, y + 54, { characterSpacing: 0.3 });

    y += 84;

    // Use of funds
    lbl('Use of Funds', M, y);
    y += 14;

    var uses = [
      ['Legal Activation', '20%',
       'Dynasty Trust + LLC structure, automotive dealer license, money transmitter exemption, insurance referral compliance'],
      ['Go-To-Market', '30%',
       'First 10,000 member acquisition: WhatsApp referral engine, automotive creator partnerships, invite-only ONYX Access Key launch'],
      ['Platform Operations', '20%',
       'Cloud infrastructure scaling, Oracle Object Storage activation, production security hardening and monitoring'],
      ['Runner Network', '15%',
       'First 5-city runner operator onboarding, GPS routing activation, DMV and title logistics service launch'],
      ['Team & Execution', '15%',
       'First operational hires: trust & compliance, customer success, and field operations to support the first 10K members'],
    ];

    for (var i = 0; i < uses.length; i++) {
      var u = uses[i];
      doc.rect(M, y, W - M * 2, 40).fill(DGRAY);
      doc.rect(M, y, 3, 40).fill(GOLD);

      // Pct bar
      var barW = parseInt(u[1]) * 2.4;
      doc.rect(M + 3, y, barW, 40).fillOpacity(0.18).fill(GOLD).fillOpacity(1);

      doc.fontSize(11).font('Helvetica-Bold').fillColor(GOLD)
         .text(u[1], M + 10, y + 6, { width: 34 });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE)
         .text(u[0], M + 48, y + 6, { width: 180 });
      doc.fontSize(8.5).font('Helvetica').fillColor(LGRAY)
         .text(u[2], M + 48, y + 22, { width: W - M * 2 - 56, lineGap: 1.5 });

      y += 45;
    }

    hRule(y + 2);
    y += 16;

    // Milestones
    lbl('What This Capital Unlocks', M, y);
    y += 14;

    var milestones = [
      'First 1,000 members onboarded via invite-only ONYX Access Key launch within 60 days',
      'First revenue dollar: deal closed, runner task dispatched, finance origination completed within 90 days',
      'Legal activation complete: Dynasty Trust, dealer license, and money transmitter exemption in place',
      'Runner network live in 5 cities with verified operators and GPS routing active',
      'Series A pipeline open at $20M\u2013$50M target with live traction metrics',
    ];

    for (var j = 0; j < milestones.length; j++) {
      doc.rect(M, y, 3, 12).fill(GOLD);
      doc.fontSize(9.5).font('Helvetica').fillColor(WHITE)
         .text(milestones[j], M + 10, y, { width: W - M * 2 - 12 });
      y += 18;
    }

    hRule(y + 2);
    y += 14;

    // Contact / CTA
    doc.rect(M, y, W - M * 2, 66).fill(DGRAY);
    doc.rect(M, y, 4, 66).fill(GOLD);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
       .text('CONTACT & NEXT STEP', M + 14, y + 9, { characterSpacing: 2 });

    var c1 = M + 14, c2 = W / 2 + 10;

    lbl('Founder', c1, y + 24, { size: 7 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE)
       .text('Ronald Antonio Cadet  \xB7  Ron3C', c1, y + 36);

    lbl('Email', c2, y + 24, { size: 7 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
       .text('ron@3conyx.com', c2, y + 36);

    lbl('Website', c1, y + 50, { size: 7 });
    doc.fontSize(9).font('Helvetica').fillColor(WHITE)
       .text('www.3conyx.com', c1, y + 60);

    lbl('Next Step', c2, y + 50, { size: 7 });
    doc.fontSize(9).font('Helvetica').fillColor(WHITE)
       .text('Reply to schedule a live platform demo', c2, y + 60);

    y += 80;

    doc.fontSize(9).font('Helvetica').fillColor(GOLD)
       .text(
         '"One person built this. ONYX is the platform this industry never knew it needed.\n' +
         'The communities that were overlooked are about to be served \u2014 in luxury."',
         M, y, { width: W - M * 2, align: 'center', lineGap: 3 }
       );

    y += 40;
    doc.fontSize(8).font('Helvetica').fillColor(MGRAY)
       .text(
         'FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED  \xB7  \xA9 2026 CUXTOMCANDYCLUB LLC. ALL RIGHTS RESERVED. PROPRIETARY.',
         M, y, { width: W - M * 2, align: 'center' }
       );

    pgFooter(6, 6);
  }

  // \u2550\u2550\u2550\u2550 RENDER \u2550\u2550\u2550\u2550
  page1();
  page2();
  page3();
  page4();
  page5();
  page6();

  doc.end();
  console.log('PDF written to ' + OUTPUT);
  