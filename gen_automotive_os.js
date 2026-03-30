'use strict';

/**
 * 3C ONYX — Automotive Ecosystem OS
 * AWS + Oracle Architecture PDF
 * generator: gen_automotive_os.js
 * output:    automotive-os-platform.pdf
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUT = path.join(__dirname, 'automotive-os-platform.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  compress: false,
  margins: { top: 54, bottom: 54, left: 60, right: 60 },
  info: {
    Title:   '3C ONYX — Automotive Ecosystem OS: AWS + Oracle Architecture',
    Author:  'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: '20 AWS + Oracle upgrades that make the platform 100× stronger',
  },
});

doc.pipe(fs.createWriteStream(OUT));

const W  = 612;
const M  = 60;
const CW = W - M * 2;

const BLK  = '#0A0A0A';
const GLD  = '#B8860B';
const DGLD = '#D4AF37';
const DARK = '#1A1A1A';
const GRY  = '#555555';
const LGY  = '#999999';
const LGBG = '#F8F8F8';
const WHT  = '#FFFFFF';
const AWS  = '#FF9900';
const ORA  = '#F80000';
const BLUE = '#1A3A5C';

// ── Helpers ───────────────────────────────────────────────────────────────

function sp(n) { doc.moveDown(n != null ? n : 0.5); }

function rule(color, wt) {
  doc.moveTo(M, doc.y).lineTo(M + CW, doc.y)
     .lineWidth(wt || 0.5).strokeColor(color || '#DDDDDD').stroke();
  doc.moveDown(0.3);
}

function para(txt, opts) {
  opts = opts || {};
  doc.fontSize(opts.size || 9.5)
     .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(opts.color || DARK)
     .text(txt, M, doc.y, { width: CW, lineGap: 3, align: opts.align || 'left' });
  doc.moveDown(opts.gap || 0.5);
}

function kv(label, value) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
     .text(label + ':  ', M, doc.y, { continued: true, characterSpacing: 0.6 });
  doc.fontSize(9).font('Helvetica').fillColor(DARK).text(value);
  doc.moveDown(0.15);
}

function bullet(txt, sub) {
  var bx = M + (sub ? 20 : 10);
  var by = doc.y;
  doc.circle(bx - 5, by + 5.5, sub ? 2 : 2.8).fill(sub ? GRY : GLD);
  doc.fontSize(sub ? 9 : 9.5).font('Helvetica')
     .fillColor(sub ? GRY : DARK)
     .text(txt, bx + 2, by, { width: CW - 16 - (sub ? 10 : 0) });
  doc.moveDown(0.25);
}

function secHeader(title, sub, accentColor) {
  accentColor = accentColor || DGLD;
  var hy = doc.y;
  var hh = sub ? 36 : 26;
  doc.rect(M, hy, CW, hh).fill(BLK);
  doc.rect(M, hy, 5, hh).fill(accentColor);
  doc.fontSize(11.5).font('Helvetica-Bold').fillColor(WHT)
     .text(title, M + 14, hy + 7, { characterSpacing: 0.6 });
  if (sub) {
    doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
       .text(sub, M + 14, hy + 22, { characterSpacing: 0.3 });
  }
  doc.y = hy + hh + 10;
}

// Upgrade card for AWS or Oracle entries
function upgradeCard(tag, code, title, gap, desc, impact, integrates, multiplier) {
  var isAws = tag === 'AWS';
  var tagColor = isAws ? AWS : ORA;

  // Check page space
  if (doc.y > 680) { doc.addPage(); }

  var cy = doc.y;
  // Colored code bar
  doc.rect(M, cy, CW, 22).fill(isAws ? '#FFF4E0' : '#FFF0F0');
  doc.rect(M, cy, 5, 22).fill(tagColor);
  // Tag badge
  doc.rect(M + 10, cy + 4, 34, 14).fill(tagColor);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(WHT)
     .text(tag, M + 12, cy + 7, { width: 30, characterSpacing: 1 });
  // Code
  doc.fontSize(9).font('Helvetica-Bold').fillColor(tagColor)
     .text(code, M + 50, cy + 6, { continued: true });
  // Title
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLK)
     .text('  ' + title, { width: CW - 180 });
  // Multiplier badge
  if (multiplier) {
    doc.rect(M + CW - 85, cy + 3, 82, 16).fill(BLK);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(DGLD)
       .text(multiplier, M + CW - 83, cy + 6, { width: 78, align: 'center' });
  }
  doc.y = cy + 26;

  // Gap
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRY)
     .text('CURRENT GAP: ', M + 6, doc.y, { continued: true, characterSpacing: 0.5 });
  doc.fontSize(8.5).font('Helvetica').fillColor('#AA3300')
     .text(gap, { width: CW - 14 });
  doc.moveDown(0.2);

  para(desc, { size: 9 });

  doc.fontSize(8).font('Helvetica-Bold').fillColor(isAws ? AWS : ORA)
     .text('IMPACT: ', M + 6, doc.y, { continued: true, characterSpacing: 0.5 });
  doc.fontSize(8.5).font('Helvetica').fillColor(DARK)
     .text(impact, { width: CW - 14 });
  doc.moveDown(0.15);

  if (integrates) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(DGLD)
       .text('INTEGRATES WITH: ', M + 6, doc.y, { continued: true, characterSpacing: 0.5 });
    doc.fontSize(8).font('Helvetica').fillColor(GRY)
       .text(integrates, { width: CW - 14 });
    doc.moveDown(0.15);
  }

  sp(0.5);
}

// Table row helper
function tableRow(cols, widths, bg, bold) {
  var ry = doc.y;
  var totalH = 16;
  if (bg) { doc.rect(M, ry, CW, totalH).fill(bg); }
  var x = M + 4;
  for (var i = 0; i < cols.length; i++) {
    doc.fontSize(bold ? 8 : 8.5)
       .font(bold ? 'Helvetica-Bold' : 'Helvetica')
       .fillColor(bold ? GLD : DARK)
       .text(cols[i], x, ry + 3, { width: widths[i] - 8, characterSpacing: bold ? 0.5 : 0 });
    x += widths[i];
  }
  doc.y = ry + totalH;
}

// Priority item
function tierItem(num, code, title, when) {
  var iy = doc.y;
  if (doc.y > 690) { doc.addPage(); }
  doc.rect(M, iy, 26, 18).fill(GLD);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(BLK)
     .text(num, M, iy + 3, { width: 26, align: 'center' });
  doc.rect(M + 26, iy, 55, 18).fill(LGBG);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GLD)
     .text(code, M + 28, iy + 5, { width: 50 });
  doc.rect(M + 81, iy, CW - 81, 18).fill(WHT);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
     .text(title, M + 84, iy + 3, { width: CW - 130 });
  doc.fontSize(7.5).font('Helvetica').fillColor(LGY)
     .text(when, M + CW - 42, iy + 5, { width: 38, align: 'right' });
  doc.y = iy + 20;
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, W, 120).fill(BLK);
doc.rect(0, 0, W, 5).fill(DGLD);
doc.rect(0, 115, W, 5).fill(AWS);

doc.fontSize(28).font('Helvetica-Bold').fillColor(DGLD)
   .text('3C ONYX', M, 18, { characterSpacing: 8 });
doc.fontSize(15).font('Helvetica-Bold').fillColor(WHT)
   .text('AUTOMOTIVE ECOSYSTEM OS', M, 54, { characterSpacing: 2.5 });
doc.fontSize(10).font('Helvetica').fillColor('#AAAAAA')
   .text('AWS + Oracle Architecture  ·  Making the Platform 100× Stronger', M, 74, { characterSpacing: 0.4 });
doc.fontSize(8.5).font('Helvetica').fillColor('#666666')
   .text('20 precision upgrades mapped directly to the live 3C ONYX codebase', M, 90, { characterSpacing: 0.3 });
doc.fontSize(8).font('Helvetica').fillColor('#444444')
   .text('CUXTOMCANDYCLUB LLC  ·  Ron3C  ·  March 2026', M, 104, { characterSpacing: 0.3 });

// AWS + Oracle badges
doc.rect(M, 128, 100, 22).fill(AWS);
doc.fontSize(10).font('Helvetica-Bold').fillColor(WHT)
   .text('14 AWS UPGRADES', M + 5, 134, { width: 90, characterSpacing: 0.5 });

doc.rect(M + 108, 128, 110, 22).fill(ORA);
doc.fontSize(10).font('Helvetica-Bold').fillColor(WHT)
   .text('6 ORACLE UPGRADES', M + 113, 134, { width: 100, characterSpacing: 0.5 });

doc.rect(M + 226, 128, 110, 22).fill(BLK);
doc.rect(M + 226, 128, 4, 22).fill(DGLD);
doc.fontSize(10).font('Helvetica-Bold').fillColor(DGLD)
   .text('100× STRONGER', M + 234, 134, { width: 100, characterSpacing: 0.5 });

doc.y = 162;

rule(GLD, 1);

para(
  'This is not a generic cloud architecture proposal. Every AWS and Oracle service recommended here ' +
  'maps directly to something already built in the 3C ONYX platform — a specific gap that, ' +
  'when filled, makes the platform work 10× to 100× better at exactly that function. ' +
  'The platform does not need to be rebuilt. It needs to be equipped.',
  { size: 10.5 }
);

sp(0.3);

// What's already built
secHeader('WHAT IS ALREADY BUILT — THE BASELINE', 'Before any upgrade, this platform already has:');
sp(0.2);

var built = [
  '7 autonomous AI agents: Guardian, Concierge, MarketCheck, Mission, Vault, Stripe, Notify',
  'AWS CDK infrastructure: Lambda, DynamoDB, Cognito, S3 Glacier WORM — already deployed',
  '9 circuit breakers protecting every external API call — custom-built, production-grade',
  'Custom IP Guard, Scanner Detector, Sovereignty Middleware — enterprise security at app layer',
  'Oracle integration routes — TS7030 error patched and operational',
  'Real-time WebSocket Neural Mesh hub — live agent status and vehicle telemetry',
  'Drizzle ORM on PostgreSQL (Neon) + DynamoDB hybrid data layer',
  'Smartcar OBD-II/V2X integration, HyperTrack runner GPS, MarketCheck wholesale pricing',
  'Digital Vehicle Passport (DVP) with immutable append-only event log',
  'Reputation Mesh — bidirectional scoring for members, dealers, and runners',
  'Stripe multi-split escrow, Dynasty Fee wallet, referral dividend tracking',
  'AR Viewer for vehicle inspection, Race Mode telemetry dashboard',
  'WhatsApp referral chain with K-factor tracking and Dynasty Fee incentive',
];
built.forEach(function(b) { bullet(b); });

sp(0.3);
rule(DGLD, 0.75);

doc.fontSize(8).font('Helvetica').fillColor(LGY)
   .text('CONFIDENTIAL  ·  © 2026 CUXTOMCANDYCLUB LLC  ·  FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED',
     M, doc.y, { width: CW, align: 'center' });

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — AWS UPGRADES 01–05
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('PART 1 — AWS ARCHITECTURE: 14 PRECISION UPGRADES', '', AWS);
sp(0.3);

upgradeCard(
  'AWS', 'AWS-01', 'Amazon CloudFront + Lambda@Edge',
  'Web and mobile assets served from a single origin — every member gets full server latency.',
  'Distributes the React/Vite web app and Expo mobile assets to 450+ global edge locations. Lambda@Edge runs the existing Sovereignty Middleware at the edge — before traffic reaches the API server. Token validation and honeypot detection execute in 1–5ms at the nearest AWS edge node.',
  'Page load drops from 300–800ms to 30–80ms globally. DDoS is absorbed at the edge before the server sees a single byte. Sovereignty enforcement moves from Express to the network layer — 10× faster, zero server cost.',
  'Existing Sovereignty Middleware (artifacts/api-server/src/middlewares/) — extracted to Lambda@Edge unchanged.',
  '10× FASTER GLOBALLY'
);

upgradeCard(
  'AWS', 'AWS-02', 'AWS WAF — Web Application Firewall',
  'Custom IP Guard and Scanner Detector run inside Express — attack traffic already consumes server resources before being blocked.',
  'AWS WAF sits in front of CloudFront and the Application Load Balancer. It blocks SQL injection, XSS, known scanner signatures, bad bots, and entire botnet ASN subnets — before any request reaches Express. Managed rule sets from AWS are updated daily with new threat signatures.',
  'The custom IP Guard becomes a backup, not the frontline. Server CPU is never burned on attack traffic. 100× reduction in attack surface at the application layer. SOC2 compliance audit: pass.',
  'Existing IP Guard + Scanner Detector logic in middlewares/ — WAF handles 95% of threats, IP Guard handles edge cases.',
  '100× ATTACK SURFACE ↓'
);

upgradeCard(
  'AWS', 'AWS-03', 'AWS Secrets Manager — Credential Sovereignty',
  'JWT_SECRET, ENCRYPTION_KEY, Twilio, MarketCheck, and Oracle credentials are environment variables — pending manual rotation, single point of exposure.',
  'Secrets Manager stores every credential with automatic rotation schedules. The API server retrieves secrets at startup via SDK — no env file, no .env exposure in logs, no manual rotation. Compromised keys self-heal on the next rotation cycle (hours, not months).',
  'Zero breach surface for all 6 pending secrets listed in the project scratchpad. GDPR/SOC2 compliance for credential management. Required for any enterprise dealer partner integration.',
  'All 6 pending secrets: JWT_SECRET, ENCRYPTION_KEY, Twilio x3, MarketCheck API key. One-time migration.',
  '100× CREDENTIAL SECURITY'
);

upgradeCard(
  'AWS', 'AWS-04', 'Amazon Kinesis + AWS IoT Core — Vehicle Telemetry Stream',
  'Smartcar OBD-II/V2X data arrives via HTTP webhook — one event, one server call. At 10,000 connected vehicles, this is 10,000 HTTP calls per minute hitting the API server.',
  'IoT Core is the native MQTT broker for connected vehicles — the protocol every OBD-II adapter and V2X sensor uses natively. Vehicle telemetry publishes to IoT Core → Kinesis ingests the stream at unlimited throughput → Lambda processes events in micro-batches → Guardian Agent receives structured, aggregated alerts. The Guardian Agent now sees patterns across thousands of vehicles simultaneously, not one event at a time.',
  'From 10,000 HTTP calls/minute to a single Kinesis stream handling millions of events/minute. Guardian Agent becomes predictive — it sees 200 vehicles with declining brake pressure patterns and alerts members before breakdowns happen. This is the upgrade that turns Guardian from reactive to prescient.',
  'Existing Smartcar integration and Guardian Agent (artifacts/api-server/src/routes/guardian.ts).',
  '100× TELEMETRY SCALE'
);

upgradeCard(
  'AWS', 'AWS-05', 'Amazon EventBridge — Agent Mesh Event Bus',
  'The 7 agents are orchestrated by a custom AgentOrchestrator — tightly coupled, synchronous in critical paths, no guaranteed delivery between agent steps.',
  'EventBridge replaces direct agent-to-agent calls with a fully managed event bus. Each agent publishes an event and moves on. Subscribers react asynchronously. Events are replayed on failure, logged in full, and routable to any destination — Lambda, SQS, Step Functions, external webhooks. Adding a new agent (Insurance Agent, Financing Agent) is: write the handler, subscribe to the event. No orchestrator changes required.',
  'Zero-drop agent communication. Full event history — every agent decision is auditable. New agents deploy independently. Development velocity for the agent mesh increases 100×.',
  'Existing agentOrchestrator.ts — EventBridge is the production-grade version of what was custom-built.',
  '100× DEV VELOCITY'
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — AWS UPGRADES 06–10
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

upgradeCard(
  'AWS', 'AWS-06', 'AWS Step Functions — Agentic Workflow Engine',
  'Multi-step workflows (car purchase: Concierge → MarketCheck → Stripe escrow → DVP update → Notify) run as sequential async calls — state is lost on any failure.',
  'Step Functions is a visual, serverless state machine for complex workflows. Each step is a Lambda. On failure, it retries with exponential backoff. On persistent failure, it triggers a compensation workflow: refund escrow, notify member, roll back DVP entry. Every workflow execution is logged with complete state history visible in AWS console.',
  'Zero data loss on workflow failures. Complete audit trail for every Dynasty Fee transaction — required for money transmitter compliance. The escrow split and DVP update flow becomes a guaranteed, exactly-once delivery state machine. This is what banks and regulators require.',
  'Existing Dynasty Fee flow, Stripe escrow logic (artifacts/api-server/src/routes/bay.ts, wallet.ts).',
  'ZERO-DROP WORKFLOWS'
);

upgradeCard(
  'AWS', 'AWS-07', 'Amazon OpenSearch — Vehicle Search Engine',
  'Vehicle and parts searches run on PostgreSQL — full table scans at scale, 800ms–2,000ms response on complex queries.',
  'OpenSearch is a distributed full-text search engine. All MarketCheck vehicle data, DVP records, and parts inventory are indexed in OpenSearch. Searches return in 30–80ms for 40M+ listings with complex multi-field filters: make + model + zip radius + price range + mileage + condition + color. Semantic search: "black luxury SUV under $60K with under 30K miles near Miami" returns in 50ms.',
  '20× faster vehicle search. Members find the right vehicle before they lose interest. The Concierge Agent\'s vehicle recommendations go from 1,400ms to 60ms. New capability: real-time inventory alerts — member saves a search, OpenSearch notifies them the moment a matching vehicle lists.',
  'Existing MarketCheck integration (artifacts/api-server/src/routes/marketcheck.ts) and vehicle schema (lib/db/src/schema/).',
  '20× FASTER SEARCH'
);

upgradeCard(
  'AWS', 'AWS-08', 'Amazon Rekognition — AI Vehicle Inspection',
  'The AR Viewer exists for vehicle inspection but analysis is manual — no automated damage detection or VIN extraction.',
  'Rekognition Custom Labels analyzes vehicle inspection photos uploaded by members or runners. It identifies: body damage (dents, scratches, paint transfer), tire condition, glass cracks, fluid leaks, and extracts the VIN from the plate automatically. Analysis returns in under 2 seconds with confidence scores and bounding boxes for each identified issue.',
  'Guardian Agent gains computer vision. A runner photographs a vehicle before pickup — Rekognition returns an AI damage report timestamped and stored in the DVP. Disputes are resolved by immutable photo evidence with AI analysis. Insurance claims become automated. Vehicle appraisals become instant.',
  'Existing AR Viewer (artifacts/3c-onyx/src/), Guardian Agent, and DVP storage layer.',
  'NEW: AI INSPECTION'
);

upgradeCard(
  'AWS', 'AWS-09', 'AWS Fraud Detector — Real-Time Fraud Scoring',
  'No real-time fraud scoring exists on member registrations, Dynasty Fee payouts, or Stripe transactions.',
  'Fraud Detector trains on 90 days of platform data and third-party automotive fraud signals. Every new member registration is scored for synthetic identity (fake accounts gaming the referral system). Every Dynasty Fee payout is scored for anomalous referral patterns. Every Stripe transaction is scored for chargeback risk. High-risk events are held for review — low-risk events flow instantly.',
  'Zero chargebacks from fraud. Dynasty Fee referral gaming becomes economically impossible — fraudulent accounts are caught at registration. Insurance fraud via fake inspections is flagged before payout. Required for any institutional partnership: dealer, lender, or insurance carrier.',
  'Existing Stripe integration, Dynasty Fee wallet, and member registration flow.',
  'NEW: FRAUD IMMUNITY'
);

upgradeCard(
  'AWS', 'AWS-10', 'Amazon Location Service — Runner GPS Sovereignty',
  'Runner GPS tracking uses HyperTrack — a third-party service with its own pricing, uptime SLA, and data residency outside AWS.',
  'Amazon Location Service provides native AWS runner tracking with real-time geofencing, route optimization, and live member-facing maps — all inside AWS, all inside the platform\'s data sovereignty boundary. Geofenced triggers: runner enters service zone → auto check-in fires. Runner completes 5 jobs this week → bonus auto-triggered by geofence event. Member-facing map shows runner ETA with 30-second precision.',
  'HyperTrack dependency eliminated — member and runner location data never leaves AWS. Cost is 80% lower than HyperTrack at 500+ runners. New capability: Zone Dynasty Bonuses — runners who complete concentrated jobs in high-density zones earn automatic bonuses triggered by geofence events, not manual review.',
  'Existing HyperTrack integration and runner tracking UI (artifacts/3c-onyx-mobile/).',
  '80% CHEAPER + SOVEREIGN'
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — AWS UPGRADES 11–14
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

upgradeCard(
  'AWS', 'AWS-11', 'AWS AppSync + GraphQL Subscriptions — Neural Mesh',
  'The Intelligence Feed and Neural Mesh use a custom WebSocket hub — manually managed connections, no built-in auth, no offline message queuing.',
  'AppSync is a managed GraphQL API with native real-time subscriptions. The Intelligence Feed, Bay Dashboard, and runner status updates become GraphQL subscriptions — automatically authorized by the existing Cognito user pools, with message queuing for offline clients. A member disconnects and reconnects — all missed events are delivered in order. No manual connection management code.',
  'Custom WebSocket server replaced by a managed service. Mobile app users get real-time updates even through spotty connections. 10× fewer dropped updates. Each member subscribes to their vehicle\'s Guardian Agent channel — alerts are pushed, not polled. The Neural Mesh becomes genuinely real-time.',
  'Existing WebSocket hub (artifacts/api-server/src/index.ts) and Intelligence Feed UI (artifacts/3c-onyx/src/).',
  '10× MORE RELIABLE'
);

upgradeCard(
  'AWS', 'AWS-12', 'Amazon Bedrock — AI Model Sovereignty',
  'The AI Router sends requests to Gemini (Google) and optionally OpenAI/Anthropic — all external APIs with their own latency, data residency, and pricing models.',
  'Amazon Bedrock provides access to Claude 3 (Anthropic), Llama 3 (Meta), Titan (Amazon), and Mistral — all through a single AWS API, inside the AWS network, with zero data leaving to third-party AI providers. The existing AI router routes to Bedrock as the primary source. Gemini remains as a fallback circuit breaker. Bedrock inference runs at 200–400ms versus Gemini\'s typical 800–2,000ms.',
  'Every Concierge conversation stays inside AWS — zero third-party AI data exposure. Inference is 5× faster at peak. Cost is 40–60% lower at volume. The platform\'s AI claims go from "powered by Gemini" to "sovereign AI — member conversations never leave 3C ONYX infrastructure." That is a premium brand differentiator.',
  'Existing AI Router and Concierge Agent (artifacts/api-server/src/lib/agentOrchestrator.ts).',
  '5× FASTER + SOVEREIGN AI'
);

upgradeCard(
  'AWS', 'AWS-13', 'Amazon Connect — Member Support Escalation',
  'No structured escalation path from the AI Concierge to a human operator — members who need human help have no clear next step.',
  'Amazon Connect is a cloud contact center. When the Concierge Agent cannot resolve a request after 2 attempts, it publishes an escalation event → Connect routes the member to the next available operator with full context pre-loaded: AI conversation history, member profile, vehicle data, and active transactions. Operators speak to members already informed — no "can you explain the issue again."',
  'Members never repeat themselves. Operators are 10× more effective. New revenue stream: licensed white-label ONYX Support for dealer partners who want an AI-first member support desk. At 100 dealer partners using ONYX Support: $50K–$200K/month in B2B support licensing.',
  'Existing Concierge Agent, member profile data, and Twilio communication layer.',
  'NEW REVENUE: B2B SUPPORT'
);

upgradeCard(
  'AWS', 'AWS-14', 'AWS Amplify — Automated Deployment Pipeline',
  'Web and mobile deployments are triggered manually — every code change requires a human to initiate deployment.',
  'Amplify connects to the git repository and deploys the React/Vite web app automatically on every push to main: build → test → deploy → CloudFront cache invalidation — in under 5 minutes. Preview deployments are generated for every branch so new features can be reviewed live before merging. Mobile native builds flow through Expo Application Services (EAS) triggered by the same pipeline.',
  'Every code change is live in 3–5 minutes. No manual deployment steps. Preview deployments allow the founder to approve every feature before it reaches members. Deployment risk drops to near zero — any bad deploy is reverted in one click.',
  'Existing React/Vite web app (artifacts/3c-onyx/) and Expo mobile app (artifacts/3c-onyx-mobile/).',
  '10× DEPLOY SPEED'
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — ORACLE UPGRADES
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('PART 2 — ORACLE ARCHITECTURE: 6 STRATEGIC UPGRADES', '', ORA);
sp(0.3);

upgradeCard(
  'ORA', 'ORA-01', 'Oracle Integration Cloud (OIC) — Dealer System Connectivity',
  'ONYX connects to dealers manually — no native connector to the dealer management systems (DMS) that run US dealerships.',
  'Oracle Integration Cloud has pre-built, certified connectors for CDK Global, Reynolds & Reynolds, DealerSocket, and Dealertrack — the four DMS platforms that run 95% of US automotive dealerships. OIC connects ONYX to these systems without building a custom integration for each dealer. Dealer inventory, financing offers, service records, and warranty data flow into ONYX in real time, bidirectionally.',
  'This is the single highest-ROI architecture investment on this list. 18,000 US dealerships become accessible through 4 OIC connectors. Dealer subscription revenue: $500–$2,000/month per dealer. At 1,000 dealer partners: $500K–$2M/month in pure B2B recurring revenue — on top of Dynasty Fee.',
  'Existing MarketCheck integration and Bay service management system — OIC is the enterprise layer above them.',
  '18,000 DEALERS CONNECTED'
);

upgradeCard(
  'ORA', 'ORA-02', 'Oracle Blockchain Platform — DVP Legal Provenance',
  'The Digital Vehicle Passport uses S3 WORM storage — tamper-resistant but not cryptographically provable or court-admissible as blockchain-anchored record.',
  'Every DVP entry (ownership transfer, service record, inspection result, accident report, mileage verification) is written to Oracle Blockchain Platform — a permissioned Hyperledger Fabric network. The DVP hash is anchored on-chain with a timestamp. Any party with the DVP ID can independently verify the record without accessing 3C ONYX systems — it is mathematically provable.',
  'The ONYX DVP becomes the most trusted vehicle history record in the industry — more defensible than Carfax, legally superior to any dealer-managed record. Insurers and lenders can underwrite based on ONYX DVP data. New revenue stream: DVP API licensing to lenders, insurers, and auction houses ($0.50–$5.00 per DVP query). At 1M vehicles: $500K–$5M/month in DVP API revenue.',
  'Existing DVP architecture (infra/lib/stacks/data-stack.ts) and S3 WORM layer.',
  'NEW: DVP API REVENUE'
);

upgradeCard(
  'ORA', 'ORA-03', 'Oracle Autonomous Database — Financial Transaction Engine',
  'High-volume Dynasty Fee calculations, escrow splits, and wallet balance updates run on PostgreSQL — excellent for structured data, requires manual tuning at transaction scale.',
  'Oracle ADB is self-tuning, self-healing, and self-patching. It runs OLTP (live Dynasty Fee transactions) and OLAP (reporting, analytics, dividend calculations) simultaneously on the same database — a capability PostgreSQL requires read replicas and significant DBA time to approximate. At 10M members transacting, ADB handles millions of concurrent writes with zero DBA intervention.',
  'The Dynasty Fee engine runs on a financial-grade database. No slow queries at transaction scale. ADB becomes the primary financial transaction store while PostgreSQL (Neon) remains the operational member data store. Separation of financial data from operational data is a compliance best practice for money transmitter licensing.',
  'Existing Dynasty Fee wallet (artifacts/api-server/src/routes/wallet.ts) and Drizzle ORM schema.',
  'FINANCIAL-GRADE SCALE'
);

upgradeCard(
  'ORA', 'ORA-04', 'Oracle Analytics Cloud — Growth Intelligence Dashboard',
  'No analytics layer exists for the founder — no way to see which growth engine is working, which runner is highest ROI, or which zip code has the highest Dynasty Fee volume.',
  'Oracle Analytics Cloud connects to DynamoDB, PostgreSQL, and ADB. Pre-built dashboards for: Dynasty Fee revenue by channel (influencer vs UGC vs runner vs referral), member acquisition cost by market, runner performance by city and zone, referral K-factor tracking by week, and projected runway. AI-powered anomaly detection — if a referral source stops performing, the system flags it before the founder notices.',
  'Capital allocation becomes data-driven: "Runner network in Miami is converting at 15% — double the budget there. WhatsApp referrals in Atlanta have a K-factor of 2.8 — seed 50 more influencers in that market." The founder sees exactly where every dollar is working.',
  'Existing growth data across member registrations, Dynasty Fee payouts, and runner job completions.',
  'NEW: GROWTH INTELLIGENCE'
);

upgradeCard(
  'ORA', 'ORA-05', 'Oracle NetSuite — Financial Operations at Scale',
  'No enterprise financial management system for Dynasty Fee accounting, investor reporting, tax compliance, or multi-entity revenue tracking.',
  'NetSuite handles: Dynasty Fee revenue accounting (by member, by channel, by month), team payroll, monthly investor reporting (P&L, cash flow, runway), multi-entity accounting as ONYX expands internationally, and tax compliance across multiple states and countries. Every cent of revenue is traceable from transaction to general ledger to financial statement.',
  'Every investor, bank, and SBA lender will require audited financials. NetSuite produces GAAP-compliant financial statements any institutional investor can rely on. Required for Series A due diligence. Required for every government grant application. Required before any money transmitter license application.',
  'Existing Dynasty Fee wallet, Stripe revenue data, and runner payment ledger.',
  'SERIES A READY'
);

upgradeCard(
  'ORA', 'ORA-06', 'Oracle APEX — Dealer Partner Portal',
  'No B2B portal for dealer partners to manage their ONYX integration, view member leads, or track Dynasty Fee splits owed to them.',
  'Oracle APEX (Application Express) is a professional low-code platform connected directly to ADB. The ONYX Dealer Portal — built on APEX — gives dealer partners a branded dashboard: view member inquiries in real time, manage inventory listings on the ONYX marketplace, track Dynasty Fee splits earned from ONYX-facilitated sales, manage service bay slots for ONYX runners, and view analytics on their ONYX performance.',
  'Dealers invest in ONYX\'s success because it grows their business. The dealer portal is the foundation of the B2B revenue stream. At 1,000 dealer partners: $500K–$2M/month in subscription revenue. Dealer partners also become the referral network for ONYX in their local markets.',
  'Existing Bay management system and dealer-facing workflows. OIC connects dealer data; APEX displays it.',
  'B2B REVENUE FOUNDATION'
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 6 — STRENGTH MAP + PRIORITY + COSTS
// ════════════════════════════════════════════════════════════════════════════

doc.addPage();

secHeader('PART 3 — THE 100× STRENGTH MAP', 'Current state vs upgraded state for every gap');
sp(0.3);

var smW = [180, 190, 122];
tableRow(['CURRENT STATE', 'AWS / ORACLE UPGRADE', 'MULTIPLIER'], smW, BLK, true);

var smRows = [
  ['Custom IP Guard in Express', 'AWS WAF at CloudFront edge', '100× ATTACK SURFACE ↓'],
  ['Env variable secrets', 'AWS Secrets Manager (auto-rotate)', '100× CREDENTIAL SECURITY'],
  ['Webhook OBD-II per vehicle', 'Kinesis + IoT Core stream', '100× TELEMETRY SCALE'],
  ['Direct SQL vehicle search', 'Amazon OpenSearch (40M listings)', '20× FASTER SEARCH'],
  ['Custom agent orchestrator', 'EventBridge + Step Functions', '50× ZERO-DROP WORKFLOWS'],
  ['HyperTrack runner GPS', 'Amazon Location Service', '80% CHEAPER + SOVEREIGN'],
  ['Manual dealer connections', 'Oracle OIC (CDK, R&R, DealerSocket)', '18,000 DEALERS VIA 4 CONNECTORS'],
  ['S3 WORM vehicle history', 'Oracle Blockchain DVP provenance', '100× LEGALLY DEFENSIBLE'],
  ['Custom WebSocket hub', 'AWS AppSync subscriptions', '10× MORE RELIABLE'],
  ['External Gemini/OpenAI calls', 'Amazon Bedrock (sovereign AI)', '5× FASTER + 50% CHEAPER'],
  ['No fraud scoring', 'AWS Fraud Detector (real-time)', 'ZERO CHARGEBACKS'],
  ['Manual AR inspection', 'Amazon Rekognition (AI damage)', 'NEW CAPABILITY'],
  ['No analytics layer', 'Oracle Analytics Cloud', 'NEW: GROWTH INTELLIGENCE'],
  ['No dealer B2B portal', 'Oracle APEX dealer portal', 'NEW: $500K–$2M/MO REVENUE'],
  ['Manual financial reporting', 'Oracle NetSuite ERP', 'SERIES A COMPLIANCE'],
];
smRows.forEach(function(r, i) {
  tableRow(r, smW, i % 2 === 0 ? LGBG : WHT, false);
});

sp(0.6);

secHeader('PART 4 — IMPLEMENTATION PRIORITY', '3 tiers based on revenue impact and compliance requirements');
sp(0.3);

// Tier 1
var t1y = doc.y;
doc.rect(M, t1y, CW, 18).fill('#1A0000');
doc.rect(M, t1y, 5, 18).fill(ORA);
doc.fontSize(8).font('Helvetica-Bold').fillColor(ORA)
   .text('TIER 1 — DO FIRST', M + 10, t1y + 5, { characterSpacing: 1 });
doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
   .text('Pre-Revenue: Maximum security and revenue unlock before first member onboards', M + 160, t1y + 5, { width: CW - 164 });
doc.y = t1y + 22;

tierItem('1', 'AWS-03', 'AWS Secrets Manager — Migrate all 6 pending credentials', 'Week 1');
tierItem('2', 'AWS-02', 'AWS WAF — Attach to existing CloudFront', 'Week 1');
tierItem('3', 'AWS-12', 'Amazon Bedrock — Switch AI Router primary source', 'Week 2');
tierItem('4', 'ORA-01', 'Oracle OIC — Begin CDK Global dealer connector', 'Week 2–4');
tierItem('5', 'AWS-09', 'AWS Fraud Detector — Train on synthetic data, activate', 'Week 3');

sp(0.4);

// Tier 2
var t2y = doc.y;
doc.rect(M, t2y, CW, 18).fill('#001A00');
doc.rect(M, t2y, 5, 18).fill('#00AA00');
doc.fontSize(8).font('Helvetica-Bold').fillColor('#00AA00')
   .text('TIER 2 — POST-REVENUE', M + 10, t2y + 5, { characterSpacing: 1 });
doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
   .text('First 10,000 Members: Scale infrastructure to match growth', M + 180, t2y + 5, { width: CW - 184 });
doc.y = t2y + 22;

tierItem('6', 'AWS-04', 'Kinesis + IoT Core — Replace Smartcar webhooks', '1,000 vehicles');
tierItem('7', 'AWS-05', 'EventBridge — Replace AgentOrchestrator with event bus', '5 agents live');
tierItem('8', 'AWS-06', 'Step Functions — Dynasty Fee + escrow state machine', 'Pre-compliance');
tierItem('9', 'AWS-07', 'Amazon OpenSearch — Vehicle search upgrade', '100K listings');
tierItem('10', 'ORA-02', 'Oracle Blockchain DVP — On-chain provenance anchoring', 'DVP API launch');

sp(0.4);

// Tier 3
var t3y = doc.y;
doc.rect(M, t3y, CW, 18).fill('#001A3A');
doc.rect(M, t3y, 5, 18).fill(AWS);
doc.fontSize(8).font('Helvetica-Bold').fillColor(AWS)
   .text('TIER 3 — SCALE', M + 10, t3y + 5, { characterSpacing: 1 });
doc.fontSize(8).font('Helvetica').fillColor('#AAAAAA')
   .text('50,000+ Members: Enterprise-grade infrastructure for institutional growth', M + 140, t3y + 5, { width: CW - 144 });
doc.y = t3y + 22;

tierItem('11', 'AWS-10', 'Amazon Location — Replace HyperTrack at 200 runners', '200+ runners');
tierItem('12', 'AWS-08', 'Rekognition — AI inspection at 1,000+ inspections/month', '1K inspections');
tierItem('13', 'AWS-11', 'AppSync — Replace WebSocket hub at 5K connections', '5K concurrent');
tierItem('14', 'ORA-04', 'Oracle Analytics Cloud — Founder intelligence dashboard', 'First revenue');
tierItem('15', 'ORA-05', 'Oracle NetSuite — Financial ERP for Series A readiness', 'Pre-Series A');
tierItem('16', 'ORA-06', 'Oracle APEX — Dealer partner portal launch', '10 dealers live');
tierItem('17', 'AWS-13', 'Amazon Connect — Member support escalation layer', '10K members');

sp(0.5);

// Cost table
secHeader('PART 5 — INFRASTRUCTURE COST VERSUS REVENUE', '');
sp(0.3);

var cw2 = [165, 115, 125, 87];
tableRow(['SERVICE', 'COST @ 50K MEMBERS', 'COST @ 500K MEMBERS', 'NOTES'], cw2, BLK, true);

var costs = [
  ['AWS WAF', '$25/mo', '$200/mo', 'Flat + request-based'],
  ['AWS Secrets Manager', '$10/mo', '$10/mo', 'Fixed, negligible'],
  ['Amazon Bedrock (Claude)', '$800/mo', '$5,000/mo', 'Token-based pricing'],
  ['Amazon Kinesis', '$150/mo', '$800/mo', 'Scales with events'],
  ['AWS EventBridge', '$20/mo', '$150/mo', 'Per-event pricing'],
  ['AWS Step Functions', '$50/mo', '$400/mo', 'Per-transition pricing'],
  ['Amazon OpenSearch', '$200/mo', '$1,200/mo', 'Node-based'],
  ['AWS Fraud Detector', '$100/mo', '$600/mo', 'Per-event scoring'],
  ['Amazon Location Service', '$100/mo', '$600/mo', 'vs $500/mo HyperTrack'],
  ['Amazon Rekognition', '$50/mo', '$500/mo', 'Per-image analysis'],
  ['AWS AppSync', '$50/mo', '$400/mo', 'Per-connection/msg'],
  ['Oracle OIC', '$500/mo', '$2,000/mo', 'Dealer connectors'],
  ['Oracle Autonomous DB', '$300/mo', '$2,000/mo', 'Self-tuning'],
  ['Oracle Analytics Cloud', '$200/mo', '$800/mo', 'Per-user licensing'],
];
costs.forEach(function(r, i) {
  tableRow(r, cw2, i % 2 === 0 ? LGBG : WHT, false);
});

// Total row
var cty = doc.y;
doc.rect(M, cty, CW, 20).fill(BLK);
doc.fontSize(9).font('Helvetica-Bold').fillColor(WHT).text('TOTAL INFRASTRUCTURE', M + 4, cty + 5, { width: 161 });
doc.fontSize(9).font('Helvetica-Bold').fillColor(DGLD).text('~$2,555/month', M + 165, cty + 5, { width: 111 });
doc.fontSize(9).font('Helvetica-Bold').fillColor(DGLD).text('~$14,660/month', M + 280, cty + 5, { width: 121 });
doc.fontSize(8).font('Helvetica').fillColor('#888888').text('0.11% of revenue', M + 401, cty + 6, { width: 83 });
doc.y = cty + 26;

sp(0.3);
var revY = doc.y;
doc.rect(M, revY, CW, 28).fill('#001A00');
doc.rect(M, revY, 5, 28).fill(DGLD);
doc.fontSize(8).font('Helvetica').fillColor('#888888')
   .text('DYNASTY FEE REVENUE AT 500K MEMBERS', M + 12, revY + 5, { characterSpacing: 1 });
doc.fontSize(14).font('Helvetica-Bold').fillColor(DGLD)
   .text('$2,250,000 – $5,000,000 / MONTH', M + 12, revY + 16);
doc.fontSize(8).font('Helvetica').fillColor('#888888')
   .text('Infrastructure cost = 0.3–0.7% of revenue. Every upgrade is effectively free at scale.', M + CW - 282, revY + 18, { width: 270, align: 'right' });
doc.y = revY + 34;

// Conclusion
sp(0.5);
rule(GLD, 1);
sp(0.4);

doc.fontSize(11).font('Helvetica-Bold').fillColor(BLK)
   .text('CONCLUSION', M, doc.y, { characterSpacing: 2 });
sp(0.3);

para(
  'The 3C ONYX platform is already built. The 20 AWS and Oracle upgrades in this document are not rebuilds — ' +
  'they are precision installations into a platform that was architected to receive them. ' +
  'Every upgrade is additive. None require rewriting existing code. ' +
  'The circuit breakers, agent mesh, DVP, Reputation Ledger, and Sovereignty Middleware all remain — ' +
  'they get stronger, faster, and more defensible with each layer added.',
  { size: 10 }
);

para(
  'At full implementation, 3C ONYX is not a startup app. It is an automotive operating system ' +
  'with enterprise-grade security, real-time vehicle intelligence across millions of connected vehicles, ' +
  'legally defensible vehicle history anchored on blockchain, 18,000 dealer connections through 4 Oracle connectors, ' +
  'and a financial engine built for the $251B valuation path.',
  { size: 10 }
);

sp(0.3);
doc.rect(M, doc.y, CW, 30).fill(BLK);
doc.rect(M, doc.y, 5, 30).fill(DGLD);
var cly = doc.y;
doc.fontSize(9).font('Helvetica').fillColor('#AAAAAA')
   .text('THE PLATFORM DOES NOT NEED TO BE REBUILT.', M + 12, cly + 6, { characterSpacing: 1.5 });
doc.fontSize(12).font('Helvetica-Bold').fillColor(WHT)
   .text('IT NEEDS TO BE EQUIPPED.', M + 12, cly + 17, { characterSpacing: 1 });
doc.y = cly + 36;

sp(0.5);
doc.fontSize(7.5).font('Helvetica').fillColor('#AAAAAA')
   .text(
     'CONFIDENTIAL — © 2026 CUXTOMCANDYCLUB LLC. ALL RIGHTS RESERVED. PROPRIETARY AND CONFIDENTIAL.\n' +
     'FOR AUTHORIZED REVIEW ONLY — NOT FOR REDISTRIBUTION\n' +
     'FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED',
     M, doc.y, { width: CW, align: 'center', lineGap: 3 }
   );

doc.end();
console.log('Written to', OUT);
