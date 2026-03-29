const PDFDocument = require('/tmp/node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = '/tmp/3C_ONYX_VC_Outreach_10_Firms.pdf';

const BLACK = '#000000';
const GOLD = '#C9A227';
const WHITE = '#FFFFFF';
const DARK_GRAY = '#111111';
const LIGHT_GRAY = '#CCCCCC';

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title: '3C ONYX | VC Outreach Brief',
    Author: 'Ronald Antonio Cadet / CUXTOMCANDYCLUB LLC',
    Subject: 'Seed Round Fundraising Outreach — 10 Firm Profiles',
    Keywords: '3C ONYX, VC, seed round, automotive, fintech, AI',
  },
});

doc.pipe(fs.createWriteStream(OUTPUT_PATH));

const W = 612;
const H = 792;
const MARGIN = 54;

function fillPage(color) {
  doc.rect(0, 0, W, H).fill(color);
}

function goldLine(y) {
  doc.moveTo(MARGIN, y).lineTo(W - MARGIN, y).lineWidth(1.5).strokeColor(GOLD).stroke();
}

function smallCaps(text, x, y, options = {}) {
  doc.fontSize(9).font('Helvetica').fillColor(GOLD).text(text.toUpperCase(), x, y, options);
}

function drawCover() {
  fillPage(BLACK);

  doc.rect(0, 0, W, 6).fill(GOLD);
  doc.rect(0, H - 6, W, 6).fill(GOLD);

  doc.fontSize(11).font('Helvetica').fillColor(GOLD).text('3C ONYX', MARGIN, 36, { characterSpacing: 6 });

  doc.moveTo(MARGIN, 58).lineTo(W - MARGIN, 58).lineWidth(0.5).strokeColor(GOLD).stroke();

  const logoBoxX = MARGIN;
  const logoBoxY = 78;
  const logoBoxW = W - MARGIN * 2;
  const logoBoxH = 160;
  doc.rect(logoBoxX, logoBoxY, logoBoxW, logoBoxH)
    .lineWidth(1)
    .strokeColor(GOLD)
    .stroke();
  doc.rect(logoBoxX, logoBoxY, logoBoxW, logoBoxH)
    .fill('#0A0A0A');
  doc.fontSize(11).font('Helvetica').fillColor(GOLD)
    .text('[ INSERT 3C ONYX BRAND MARK ]', logoBoxX, logoBoxY + logoBoxH / 2 - 10, {
      width: logoBoxW,
      align: 'center',
      characterSpacing: 3,
    });

  doc.fontSize(36).font('Helvetica-Bold').fillColor(WHITE)
    .text('VC OUTREACH', MARGIN, 268, { width: W - MARGIN * 2, align: 'center', characterSpacing: 4 });

  doc.fontSize(36).font('Helvetica-Bold').fillColor(GOLD)
    .text('BRIEF', MARGIN, 308, { width: W - MARGIN * 2, align: 'center', characterSpacing: 12 });

  doc.moveTo(MARGIN, 360).lineTo(W - MARGIN, 360).lineWidth(0.5).strokeColor(GOLD).stroke();

  doc.fontSize(13).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('10 TARGET VENTURE CAPITAL FIRMS', MARGIN, 374, { width: W - MARGIN * 2, align: 'center', characterSpacing: 2 });

  doc.fontSize(11).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('SEED ROUND  ·  $2M – $10M  ·  PRE-LAUNCH', MARGIN, 398, { width: W - MARGIN * 2, align: 'center', characterSpacing: 1 });

  const infoY = 470;
  const col1 = MARGIN;
  const col2 = W / 2;

  smallCaps('Founder', col1, infoY);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
    .text('Ronald Antonio Cadet', col1, infoY + 16);

  smallCaps('Entity', col2, infoY);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
    .text('CUXTOMCANDYCLUB LLC', col2, infoY + 16);

  smallCaps('Platform', col1, infoY + 56);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
    .text('3C ONYX', col1, infoY + 72);

  smallCaps('Date', col2, infoY + 56);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
    .text('March 29, 2026', col2, infoY + 72);

  smallCaps('Contact Email', col1, infoY + 112);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(GOLD)
    .text('[YOUR EMAIL HERE]', col1, infoY + 128);

  doc.moveTo(MARGIN, H - 50).lineTo(W - MARGIN, H - 50).lineWidth(0.5).strokeColor(GOLD).stroke();
  doc.fontSize(8).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('CONFIDENTIAL — FOR QUALIFIED INVESTOR REVIEW ONLY', MARGIN, H - 38, {
      width: W - MARGIN * 2,
      align: 'center',
      characterSpacing: 1,
    });
}

const vcFirms = [
  {
    name: 'QED Investors',
    partners: 'Frank Rotman · Nigel Morris',
    website: 'qedinvestors.com',
    email: 'team@qedinvestors.com',
    linkedin: 'linkedin.com/company/qed-investors',
    thesisMatch: [
      'Pre-seed to growth-stage fintech with global reach',
      'Deep conviction in financial inclusion and underserved markets',
      'Backed Nubank ($30B) — the defining financial access story of the decade',
      'Emphasis on founder-market fit and proprietary distribution advantages',
    ],
    portfolioComps: 'Nubank, Credit Karma, Remitly, Avant',
    pitch: `QED built its legacy backing Nubank at a time when no one believed a digital bank for underserved Brazilians could become a $30B institution. 3C ONYX is that same thesis applied to the American automotive and financial ecosystem. Ron3C has insider domain knowledge — years embedded in the very communities ONYX is built to serve. The platform combines an automotive marketplace, embedded fintech (insurance, GAP, credit), AI agents, and a trust-based creator economy. The 3% Dynasty Fee model creates a compounding, community-driven revenue flywheel that Nubank never had. QED's financial inclusion mandate and network expertise make this a natural portfolio addition before ONYX achieves its first 100,000 members.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Kapor Capital',
    partners: 'Ulili Onovakpuri · Brian Dixon',
    website: 'kaporcapital.com',
    email: 'info@kaporcapital.com',
    linkedin: 'linkedin.com/company/kapor-capital',
    thesisMatch: [
      'Invests at the intersection of tech and closing gaps of access',
      'Prioritizes companies serving low-income communities and communities of color',
      'Strong track record backing diverse founders with domain expertise',
      'Early-stage focus with a mission-aligned impact lens',
    ],
    portfolioComps: 'Blavity, Pigeonly, GreenLight, Accolade',
    pitch: `Kapor's "gaps of access" framework was written for 3C ONYX. For decades, underserved communities have been overcharged for auto insurance, locked out of competitive financing, and pushed toward predatory dealerships with no recourse. ONYX is the infrastructure fix — a Black-founded, AI-powered automotive and financial platform that gives these communities the same leverage that wealthy buyers have always had. Ron3C is the founder Kapor invests in: deeply embedded, mission-driven, and building with the community rather than for it. The platform is live, the agents are deployed, and the first members are within reach. This is Kapor's moment to back the mobility equity story of the decade.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Slauson & Co.',
    partners: 'Richelieu Dennis · Austin Clements',
    website: 'slausonandco.com',
    email: 'hello@slausonandco.com',
    linkedin: 'linkedin.com/company/slauson-co',
    thesisMatch: [
      'Invests in companies that build wealth and infrastructure for overlooked communities',
      'Deep focus on Black and Brown founders with authentic market access',
      'Backs businesses that create ownership, not just consumption',
      'Strong network in culture, media, and consumer brand ecosystems',
    ],
    portfolioComps: 'Partake Foods, Bev, Cityblock Health, Interface AI',
    pitch: `Slauson & Co. exists because the infrastructure for underrepresented communities has always been underfunded and under-built. 3C ONYX is luxury infrastructure — a full-stack automotive platform that doesn't ask communities to settle for less. The ONYX brand is designed for aspiration: black and gold, unapologetically premium, built for people who have been told the luxury experience isn't for them. Richelieu Dennis understands brand-as-culture-as-business. Ron3C has built that: 60+ pages, 12 AI agents, embedded finance, and a creator economy that rewards loyalty. Slauson's backing would be a cultural signal as much as a capital signal — and ONYX is ready to carry that flag.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'AutoTech Ventures',
    partners: 'Managing Partners',
    website: 'autotech.vc',
    email: 'info@autotech.vc',
    linkedin: 'linkedin.com/company/autotech-ventures',
    thesisMatch: [
      'The only venture fund exclusively focused on automotive and mobility technology',
      'Invests across the full automotive value chain: marketplace, finance, insurance, data, and service',
      'Backed companies at the intersection of dealer tech, consumer platforms, and fleet intelligence',
      'Deep industry relationships with OEMs, dealers, insurers, and fleet operators',
    ],
    portfolioComps: 'Joydrive, Ridepanda, Drivezy, Agora',
    pitch: `AutoTech Ventures doesn't need to be convinced that automotive is a massive, transformable market. That's why this conversation is simple: 3C ONYX is your entire investment thesis in a single platform. Automotive marketplace? Built. Embedded insurance and GAP? Built. AI-powered buyer and seller intelligence? 12 agents deployed. Fintech and credit? Integrated. Creator and community flywheel? Live. Ron3C has built what your portfolio companies are trying to become — a vertically integrated, AI-native automotive Super App. AutoTech's domain expertise and OEM relationships would accelerate ONYX's dealer and fleet partnerships faster than any other investor. This is the flagship investment your fund was designed to make.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Andreessen Horowitz (a16z)',
    partners: 'Katherine Boyle — American Dynamism',
    website: 'a16z.com',
    email: 'a16z.com/apply (submission portal)',
    linkedin: 'linkedin.com/company/andreessen-horowitz',
    thesisMatch: [
      'American Dynamism thesis: backing companies that strengthen national infrastructure',
      'Deep belief in sovereign AI platforms that are proprietary, not dependent on Big Tech APIs',
      'Invests in category-defining companies targeting 100M+ user scale',
      'Katherine Boyle specifically champions founders rebuilding American industry from the ground up',
    ],
    portfolioComps: 'Anduril, Shield AI, Joby Aviation, OpenSea',
    pitch: `Katherine Boyle's American Dynamism mandate is clear: back the builders who are rebuilding America's physical and economic infrastructure with technology. 3C ONYX fits that mandate exactly. The U.S. auto market is $1.5 trillion annually. The financing, insurance, and trust infrastructure underneath it is broken, opaque, and predatory — particularly for the 100M+ Americans who can't access fair terms. ONYX is the sovereign AI platform that fixes this at scale. Its 12-agent mesh is proprietary, not a thin wrapper on OpenAI. The platform is full-stack, live, and built by a founder with inside access to the market he's disrupting. At 1 billion member scale, ONYX is national infrastructure. a16z should be at the table before the Series A.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'General Catalyst',
    partners: 'Hemant Taneja',
    website: 'generalcatalyst.com',
    email: 'generalcatalyst.com (submission portal)',
    linkedin: 'linkedin.com/company/general-catalyst',
    thesisMatch: [
      'Responsible innovation — tech that creates genuine societal value, not just shareholder returns',
      'Backs Super Apps and platform businesses with multi-vertical convergence',
      'Strong track record in fintech, marketplace, and consumer platform investments',
      'Hemant Taneja champions companies where technology and humanity intersect at scale',
    ],
    portfolioComps: 'Stripe, DoorDash, Airbnb, Livongo, Snap',
    pitch: `Hemant Taneja wrote the playbook on responsible innovation — technology that doesn't just extract value but creates it for the communities it serves. 3C ONYX is that company for automotive and financial services. Think of ONYX as the convergence of Stripe (embedded fintech), DoorDash (gig runner economy), and Airbnb (trust-based community marketplace) — all built natively for the automotive vertical. The responsible innovation angle is structural: ONYX replaces predatory dealers, opaque insurance brokers, and high-fee credit intermediaries with transparent, AI-powered tools that favor the buyer. General Catalyst's network — particularly in fintech infrastructure and consumer platforms — would be transformative for ONYX's partnership pipeline and Series A positioning.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Harlem Capital',
    partners: 'Henri Pierre-Jacques · Jarrid Tingle',
    website: 'harlemcapital.co',
    email: 'info@harlemcapital.co',
    linkedin: 'linkedin.com/company/harlem-capital',
    thesisMatch: [
      'Invests in diverse founders — 50% women, 50% people of color — at pre-seed and seed',
      'Focus on fintech, consumer, marketplace, and future of work',
      'Mission to back 1,000 diverse founders by 2040',
      'Deep community in Black and Brown founder networks, HBCUs, and urban ecosystems',
    ],
    portfolioComps: 'Brex, Pipe, Mahmee, Habi',
    pitch: `Harlem Capital exists to close the funding gap for diverse founders who build for markets that traditional VCs overlook. Ron3C is exactly that founder: a Black entrepreneur with deep insider access to an underserved market, building a platform that creates real wealth for his community. 3C ONYX addresses the fintech access gap (embedded insurance, credit, and GAP products), the marketplace gap (trusted automotive buying for underserved buyers), and the creator economy gap (the 3% Dynasty Fee that rewards community builders). Harlem Capital's network of diverse founders, HBCUs, and urban investors would accelerate ONYX's first 100,000 members faster than any paid acquisition channel. This is Henri and Jarrid's thesis made real.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Precursor Ventures',
    partners: 'Charles Hudson',
    website: 'precursorvc.com',
    email: 'pitch@precursorvc.com',
    linkedin: 'linkedin.com/company/precursor-ventures',
    thesisMatch: [
      'Pre-seed and seed first-check investor in underrepresented founders',
      'Writes the first institutional check — founder conviction over traction metrics',
      'Focus on B2B SaaS, consumer, and marketplace companies',
      'Charles Hudson personally champions founders with unique founder-market fit',
    ],
    portfolioComps: 'Homebase, Oye! (formerly), Coda, True Link Financial',
    pitch: `Charles Hudson's entire framework centers on one question: does this founder have the right to win in this market? For 3C ONYX, the answer is unambiguous. Ron3C has spent years embedded in the automotive and community finance ecosystem he is now disrupting. He didn't read about this market — he lived it. Precursor writes first checks when founders have that kind of insider conviction, and when the product is built before most seed investors have even heard the pitch. ONYX is fully functional: 12 agents, 60+ pages, Stripe, KYC, insurance, WhatsApp, and a live API. Precursor's check is the catalyst that unlocks the institutional seed round. Charles, this is your founder.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'Reinvent Technology Partners',
    partners: 'Reid Hoffman · Mark Pincus',
    website: 'reinventtechnologypartners.com',
    email: 'LinkedIn outreach recommended',
    linkedin: 'linkedin.com/company/reinvent-technology-partners',
    thesisMatch: [
      'Backs companies at the intersection of AI, automotive, and insurance disruption',
      'Portfolio skews toward category-defining tech with massive addressable markets',
      "Reid Hoffman's network effect and blitzscaling frameworks are core to thesis",
      'Experience with autonomous vehicles, transportation infrastructure, and insurtech',
    ],
    portfolioComps: 'Joby Aviation, Aurora Innovation, Hippo Insurance, Opendoor',
    pitch: `Reid Hoffman coined "blitzscaling" — the strategy of capturing a market so fast that competition becomes structurally impossible. 3C ONYX is a blitzscaling opportunity. The convergence of automotive marketplace, embedded insurance (Hippo parallel), AI agent infrastructure (Aurora parallel), and community-driven network effects (Joby's market-defining ambition) creates a platform that, once scaled, is nearly impossible to replicate. The 3% Dynasty Fee model is the network effect moat: every member who refers another member strengthens the flywheel. Reinvent's portfolio comps — Joby, Aurora, Hippo — speak to exactly the verticals ONYX is disrupting from below. Reid's involvement would signal to the broader market that ONYX is the defining mobility platform of this generation.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
  {
    name: 'SoftBank Vision Fund',
    partners: 'Masayoshi Son · Rajeev Misra',
    website: 'softbank.com/en/vision-fund',
    email: 'softbank.com (submission portal)',
    linkedin: 'linkedin.com/company/softbank-vision-fund',
    thesisMatch: [
      'Backs category-defining platforms at global scale — $1B+ in targeted addressable markets',
      'Masayoshi Son famously backs founders with 300-year visions and audacious scale',
      'Portfolio skews toward Super Apps, AI, mobility, and financial infrastructure',
      'Vision Fund has backed the defining Super App in nearly every major global market',
    ],
    portfolioComps: 'Uber, WeWork, DoorDash, Grab, Paytm, Ola',
    pitch: `Masayoshi Son backed Grab because he saw one Super App could own mobility, delivery, and financial services for Southeast Asia. He backed Paytm because he saw digital payments could leapfrog a billion underserved Indians. The pattern is clear: Son invests in founders who see the category-defining Super App that will serve a massive underserved population before anyone else does. 3C ONYX is that platform for the American automotive and financial ecosystem. The addressable market is $1.5T in auto transactions, $300B in auto insurance, and 100M+ underserved Americans. The platform is fully built. The founder has domain authority. At 1 billion member scale — Son's preferred frame — ONYX becomes the mobility and financial infrastructure for communities that have never had a champion. SoftBank should lead or co-lead the seed before the Series A window closes.`,
    ask: 'Seed round · $2M–$10M · Pre-launch · Platform live and fully functional',
  },
];

function drawVCPage(firm, index) {
  doc.addPage();
  fillPage(BLACK);

  doc.rect(0, 0, W, 4).fill(GOLD);
  doc.rect(0, H - 4, W, 4).fill(GOLD);

  doc.rect(MARGIN - 16, 0, 4, H).fill(GOLD);
  doc.rect(W - MARGIN + 12, 0, 4, H).fill(GOLD);

  const pageNumText = `${String(index + 1).padStart(2, '0')} / 10`;
  doc.fontSize(8).font('Helvetica').fillColor(GOLD)
    .text(pageNumText, W - MARGIN - 40, 14, { width: 60, align: 'right', characterSpacing: 1 });

  doc.fontSize(8).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('3C ONYX · VC OUTREACH BRIEF · CONFIDENTIAL', MARGIN, 14, { characterSpacing: 1 });

  let y = 44;

  doc.fontSize(22).font('Helvetica-Bold').fillColor(GOLD)
    .text(firm.name.toUpperCase(), MARGIN, y, { characterSpacing: 2 });

  y += 30;
  doc.fontSize(11).font('Helvetica').fillColor(LIGHT_GRAY)
    .text(firm.partners, MARGIN, y, { characterSpacing: 1 });

  y += 20;
  goldLine(y);
  y += 12;

  const colA = MARGIN;
  const colB = 320;

  smallCaps('Website', colA, y);
  smallCaps('Email / Submission', colB, y);
  y += 14;

  doc.fontSize(10).font('Helvetica').fillColor(WHITE)
    .text(firm.website, colA, y);
  doc.fontSize(10).font('Helvetica').fillColor(WHITE)
    .text(firm.email, colB, y, { width: W - colB - MARGIN });

  y += 20;
  smallCaps('LinkedIn', colA, y);
  y += 14;
  doc.fontSize(10).font('Helvetica').fillColor(GOLD)
    .text(firm.linkedin, colA, y);

  y += 20;
  goldLine(y);
  y += 14;

  smallCaps('Thesis Match — Why ONYX Fits', colA, y);
  y += 14;

  for (const point of firm.thesisMatch) {
    doc.fontSize(10).font('Helvetica').fillColor(WHITE)
      .text(`·  ${point}`, MARGIN + 8, y, { width: W - MARGIN * 2 - 8, lineGap: 2 });
    y += doc.heightOfString(`·  ${point}`, { width: W - MARGIN * 2 - 8, lineGap: 2 }) + 3;
  }

  y += 4;
  smallCaps('Portfolio Comps', colA, y);
  y += 14;
  doc.fontSize(10).font('Helvetica').fillColor(LIGHT_GRAY)
    .text(firm.portfolioComps, MARGIN, y, { width: W - MARGIN * 2 });

  y += 22;
  goldLine(y);
  y += 14;

  smallCaps('Custom ONYX Pitch', colA, y);
  y += 14;

  doc.rect(MARGIN - 2, y - 4, 3, doc.heightOfString(firm.pitch, { width: W - MARGIN * 2, lineGap: 3 }) + 8)
    .fill(GOLD);

  doc.fontSize(10.5).font('Helvetica').fillColor(WHITE)
    .text(firm.pitch, MARGIN + 10, y, { width: W - MARGIN * 2 - 10, lineGap: 3, align: 'justify' });

  y += doc.heightOfString(firm.pitch, { width: W - MARGIN * 2 - 10, lineGap: 3 }) + 14;

  goldLine(y);
  y += 10;

  doc.rect(MARGIN, y, W - MARGIN * 2, 34).fill('#1A1400');
  doc.rect(MARGIN, y, 4, 34).fill(GOLD);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
    .text('THE ASK:', MARGIN + 14, y + 8, { continued: true, characterSpacing: 1 });
  doc.fontSize(9).font('Helvetica').fillColor(WHITE)
    .text(`  ${firm.ask}`, { characterSpacing: 0.5 });
}

function drawPlatformProofPage() {
  doc.addPage();
  fillPage(BLACK);

  doc.rect(0, 0, W, 4).fill(GOLD);
  doc.rect(0, H - 4, W, 4).fill(GOLD);

  doc.fontSize(8).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('3C ONYX · VC OUTREACH BRIEF · CONFIDENTIAL', MARGIN, 14, { characterSpacing: 1 });

  let y = 44;

  doc.fontSize(22).font('Helvetica-Bold').fillColor(GOLD)
    .text('PLATFORM PROOF', MARGIN, y, { characterSpacing: 3 });

  y += 30;
  doc.fontSize(12).font('Helvetica').fillColor(LIGHT_GRAY)
    .text('What Is Already Built — As of March 2026', MARGIN, y, { characterSpacing: 1 });

  y += 20;
  goldLine(y);
  y += 16;

  const proofItems = [
    { label: '12-Agent AI Mesh', detail: 'Fully deployed proprietary multi-agent system — not an API wrapper. Each agent handles a distinct platform function (trust, finance, insurance, creator, wisdom, runner, and more).' },
    { label: '60+ Page Platform', detail: 'Complete web and mobile application spanning marketplace, member dashboard, finance hub, insurance center, creator economy, KYC onboarding, runner dispatch, and admin tools.' },
    { label: 'Full-Stack Architecture', detail: 'React + Vite frontend, Express API server, PostgreSQL database, pnpm monorepo — production-grade, not MVP scaffolding.' },
    { label: 'Live API', detail: 'REST API fully operational with authentication, role-based access, and all core endpoints serving both web and mobile clients.' },
    { label: 'Stripe Integration', detail: 'Payment processing, subscription management, and Dynasty Fee collection live and tested end-to-end.' },
    { label: 'WhatsApp Messaging', detail: 'Automated member communication and notification pipeline integrated and operational.' },
    { label: 'KYC Onboarding', detail: 'Identity verification and compliance flow completed — members can onboard, verify, and transact on day one.' },
    { label: 'Embedded Finance', detail: 'Credit intelligence, loan pre-qualification, and financing partner integration built into the buyer flow.' },
    { label: 'Insurance & GAP', detail: 'Auto insurance and GAP coverage product integration live — members get real quotes inside the platform.' },
    { label: 'Runner Economy', detail: 'Gig runner dispatch and delivery coordination system operational for automotive service fulfillment.' },
    { label: 'Trust Agent', detail: 'AI-powered trust scoring and reputation system that protects buyers and sellers in every marketplace transaction.' },
    { label: 'Wisdom Engine', detail: 'Proprietary AI knowledge layer that delivers personalized automotive and financial guidance to members.' },
    { label: 'Creator Outreach', detail: '3% Dynasty Fee model and creator-affiliate system built, rewarding community ambassadors who grow the ONYX network.' },
    { label: 'Expo Mobile App', detail: 'Native iOS/Android application live with full feature parity to the web platform.' },
  ];

  const colLeft = MARGIN;
  const colRight = 320;

  for (let i = 0; i < proofItems.length; i++) {
    const item = proofItems[i];
    const col = i % 2 === 0 ? colLeft : colRight;

    if (i % 2 === 0 && i !== 0) y += 4;

    if (i % 2 === 0) {
      const rowY = y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
        .text(`✦  ${item.label}`, col, rowY, { width: 240 });
      const h = doc.heightOfString(`✦  ${item.label}`, { width: 240 });
      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_GRAY)
        .text(item.detail, col + 14, rowY + h + 2, { width: 226, lineGap: 1 });
    } else {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD)
        .text(`✦  ${item.label}`, col, y, { width: 240 });
      const h = doc.heightOfString(`✦  ${item.label}`, { width: 240 });
      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_GRAY)
        .text(item.detail, col + 14, y + h + 2, { width: 226, lineGap: 1 });

      const leftItem = proofItems[i - 1];
      const leftH = doc.heightOfString(`✦  ${leftItem.label}`, { width: 240 });
      const leftDetailH = doc.heightOfString(leftItem.detail, { width: 226, lineGap: 1 });
      const rightH = doc.heightOfString(`✦  ${item.label}`, { width: 240 });
      const rightDetailH = doc.heightOfString(item.detail, { width: 226, lineGap: 1 });
      const rowHeight = Math.max(leftH + leftDetailH, rightH + rightDetailH) + 14;
      y += rowHeight;
    }

    if (i === proofItems.length - 1 && proofItems.length % 2 !== 0) {
      const h = doc.heightOfString(`✦  ${item.label}`, { width: 240 });
      const detailH = doc.heightOfString(item.detail, { width: 226, lineGap: 1 });
      y += h + detailH + 14;
    }
  }

  goldLine(y);
  y += 14;

  doc.rect(MARGIN, y, W - MARGIN * 2, 60).fill('#0D0D00');
  doc.rect(MARGIN, y, W - MARGIN * 2, 2).fill(GOLD);
  doc.rect(MARGIN, y + 58, W - MARGIN * 2, 2).fill(GOLD);

  doc.fontSize(13).font('Helvetica-Bold').fillColor(GOLD)
    .text('THE INFRASTRUCTURE IS BUILT. THE VISION IS 1 BILLION MEMBERS.', MARGIN, y + 10, {
      width: W - MARGIN * 2,
      align: 'center',
      characterSpacing: 1,
    });

  doc.fontSize(10).font('Helvetica').fillColor(WHITE)
    .text('3C ONYX is not a pitch deck. It is a platform. Your investment accelerates launch, not construction.', MARGIN, y + 36, {
      width: W - MARGIN * 2,
      align: 'center',
    });
}

drawCover();
for (let i = 0; i < vcFirms.length; i++) {
  drawVCPage(vcFirms[i], i);
}
drawPlatformProofPage();

doc.end();

doc.on('end', () => {
  console.log(`PDF generated: ${OUTPUT_PATH}`);
});

doc.on('error', (err) => {
  console.error('PDF generation error:', err);
  process.exit(1);
});
