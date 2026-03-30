'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '3C_ONYX_One_Pager.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 54, bottom: 54, left: 60, right: 60 },
  info: {
    Title: '3C ONYX — Investor One-Pager',
    Author: 'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
  },
});

doc.pipe(fs.createWriteStream(OUT));

const W   = 612;
const M   = 60;
const CW  = W - M * 2;
const BLK = '#111111';
const GLD = '#B8860B';
const GRY = '#555555';

// ── HEADER ──────────────────────────────────────────────────────────────────

doc.rect(0, 0, W, 90).fill('#0A0A0A');

doc.fontSize(28).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('3C ONYX', M, 22, { characterSpacing: 6 });

doc.fontSize(10).font('Helvetica').fillColor('#AAAAAA')
   .text('Sovereign AI Super App  ·  Automotive  ·  Finance  ·  Life', M, 58,
     { characterSpacing: 1 });

doc.fontSize(9).font('Helvetica').fillColor('#888888')
   .text('CUXTOMCANDYCLUB LLC  ·  Ronald Antonio Cadet  ·  Founder & CEO',
     0, 72, { width: W - M, align: 'right' });

// ── VALUATION BOX ───────────────────────────────────────────────────────────

doc.moveDown(0);
const vY = 104;
doc.rect(M, vY, CW, 72).fill('#F9F6EE');
doc.rect(M, vY, 5, 72).fill(GLD);

doc.fontSize(11).font('Helvetica').fillColor(GRY)
   .text('INDEPENDENT PLATFORM VALUATION', M + 18, vY + 12, { characterSpacing: 1 });

doc.fontSize(34).font('Helvetica-Bold').fillColor(BLK)
   .text('$150,000,000', M + 18, vY + 28, { characterSpacing: 1 });

doc.fontSize(9.5).font('Helvetica').fillColor(GRY)
   .text('Pre-revenue  ·  Zero paying members  ·  One number, no ambiguity',
     M + 18, vY + 66, { characterSpacing: 0.3 });

// ── HOW WE GET TO $150M ─────────────────────────────────────────────────────

const mY = vY + 94;
doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('HOW WE GET TO $150 MILLION', M, mY, { characterSpacing: 0.5 });

doc.moveTo(M, mY + 16).lineTo(M + CW, mY + 16)
   .lineWidth(0.75).strokeColor('#CCCCCC').stroke();

const steps = [
  ['$3.5M',    'Cost to rebuild this platform from scratch (73 pages · 81 API routes · 12 AI agents)'],
  ['× 10',     '10-year domain expertise multiplier — founder has worked in automotive every day for a decade'],
  ['× 2',      'IP moat — 100% proprietary, closed-source, zero direct competitors in this space'],
  ['+ $5M',    'Launch-ready premium — platform is live today, not a concept or prototype'],
  ['× 2',      'AI-native premium — 12 autonomous agents replace $70M+/yr in human specialist cost'],
  ['= $150M',  'Final independent valuation'],
];

let y = mY + 24;
for (let i = 0; i < steps.length; i++) {
  const isLast = i === steps.length - 1;
  const bg     = isLast ? '#F9F6EE' : (i % 2 === 0 ? '#FAFAFA' : '#FFFFFF');
  const rh     = 22;

  doc.rect(M, y, CW, rh).fill(bg);
  if (isLast) doc.rect(M, y, 5, rh).fill(GLD);

  doc.fontSize(isLast ? 11 : 10)
     .font(isLast ? 'Helvetica-Bold' : 'Helvetica-Bold')
     .fillColor(isLast ? GLD : BLK)
     .text(steps[i][0], M + 10, y + 5, { width: 58 });

  doc.fontSize(isLast ? 10.5 : 9.5)
     .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(isLast ? BLK : GRY)
     .text(steps[i][1], M + 72, y + 5, { width: CW - 80 });

  y += rh + 1;
}

// ── WHAT IS BUILT ────────────────────────────────────────────────────────────

y += 14;
doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('WHAT IS ALREADY BUILT AND LIVE', M, y, { characterSpacing: 0.5 });
doc.moveTo(M, y + 16).lineTo(M + CW, y + 16)
   .lineWidth(0.75).strokeColor('#CCCCCC').stroke();
y += 24;

const built = [
  ['73-page platform', 'Web + mobile app covering marketplace, finance, insurance, logistics, creator economy'],
  ['12 AI agents',     'Proprietary agent mesh — trust, deal, insurance, finance, runner, wisdom, KYC, and more'],
  ['Expo mobile app',  'Native iOS + Android at full feature parity — live today'],
  ['Payments',         'Stripe processing, subscription management, and Dynasty Fee collection — tested end-to-end'],
  ['2,200+ lenders',   'Credit intelligence and loan matching built into the buyer flow'],
  ['Insurance & GAP',  'Real auto insurance quotes delivered inside the platform'],
  ['13 revenue streams','Subscriptions, 3% Dynasty Fee, finance origination, insurance, runners, B2B, parts, and more'],
];

const col2Start = M + CW / 2 + 6;
const colW      = CW / 2 - 10;

for (let i = 0; i < built.length; i++) {
  const cx = i % 2 === 0 ? M : col2Start;
  const ry = y + Math.floor(i / 2) * 26;

  doc.circle(cx + 4, ry + 6, 3).fill(GLD);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
     .text(built[i][0], cx + 12, ry, { width: colW });
  doc.fontSize(8.5).font('Helvetica').fillColor(GRY)
     .text(built[i][1], cx + 12, ry + 11, { width: colW });
}

y += Math.ceil(built.length / 2) * 26 + 8;

// ── THE ASK ──────────────────────────────────────────────────────────────────

doc.rect(M, y, CW, 62).fill('#0A0A0A');

doc.fontSize(8.5).font('Helvetica').fillColor('#888888')
   .text('SEED ROUND', M + 18, y + 10, { characterSpacing: 2 });
doc.fontSize(20).font('Helvetica-Bold').fillColor('#D4AF37')
   .text('$2,000,000 – $10,000,000', M + 18, y + 24);
doc.fontSize(9).font('Helvetica').fillColor('#CCCCCC')
   .text('Platform is live and ready for demo  ·  Raising at $150M valuation',
     M + 18, y + 50, { characterSpacing: 0.3 });

y += 76;

// ── USE OF FUNDS ─────────────────────────────────────────────────────────────

doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
   .text('USE OF FUNDS:', M, y, { continued: true });
doc.fontSize(10).font('Helvetica').fillColor(GRY)
   .text('  Legal activation 20%  ·  Go-to-market 30%  ·  Platform ops 20%  ·  Runner network 15%  ·  Team 15%');

y += 18;

// ── CONTACT ──────────────────────────────────────────────────────────────────

doc.moveTo(M, y).lineTo(M + CW, y)
   .lineWidth(0.75).strokeColor('#CCCCCC').stroke();
y += 10;

doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
   .text('Ronald Antonio Cadet  ·  Founder & CEO  ·  CUXTOMCANDYCLUB LLC', M, y);
doc.fontSize(9).font('Helvetica').fillColor(GLD)
   .text('ron@3conyx.com  ·  www.3conyx.com', 0, y, { width: W - M, align: 'right' });

y += 18;
doc.fontSize(7.5).font('Helvetica').fillColor('#999999')
   .text(
     'CONFIDENTIAL — FOR QUALIFIED INVESTOR REVIEW ONLY  ·  © 2026 CUXTOMCANDYCLUB LLC  ·  ALL RIGHTS RESERVED',
     M, y, { width: CW, align: 'center', characterSpacing: 0.5 }
   );

doc.end();
console.log('One-pager written to', OUT);
