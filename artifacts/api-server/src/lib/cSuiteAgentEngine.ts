import crypto from "crypto";
import { logger } from "./logger";
import { eventBus } from "./eventBus";
import { selfLearningEngine } from "./selfLearningEngine";
import type { MeshAgentId } from "./agentMesh12";

const ARCHITECT_SEAL = "RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::C_SUITE_AGENT_ENGINE";

export type CSuiteAgentId =
  | "ceo"
  | "cto"
  | "cfo"
  | "coo"
  | "content-social"
  | "business-dev"
  | "legal-compliance"
  | "blitzscale"
  | "lean-startup"
  | "greatest-salesman"
  | "trillion-coach"
  | "twelve-week"
  | "katamari"
  | "intelligent-investor";

export type DirectiveUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "SOVEREIGN";

export type DirectiveCategory =
  | "STRATEGIC_VISION"
  | "NETWORK_GROWTH"
  | "DEAL_OVERSIGHT"
  | "REVENUE_OPTIMIZATION"
  | "CASH_FLOW"
  | "FINANCIAL_FORECAST"
  | "PLATFORM_HEALTH"
  | "INFRASTRUCTURE"
  | "DEPLOYMENT"
  | "SECURITY_POSTURE"
  | "OPERATIONS"
  | "SLA_MANAGEMENT"
  | "VENDOR_COORDINATION"
  | "CONTENT_STRATEGY"
  | "SOCIAL_ENGAGEMENT"
  | "BRAND_VOICE"
  | "PARTNERSHIP_PIPELINE"
  | "HUB_ONBOARDING"
  | "MARKET_EXPANSION"
  | "NODE_ACTIVATION"
  | "REGULATORY"
  | "CONTRACT_REVIEW"
  | "COMPLIANCE_AUDIT"
  | "IP_PROTECTION"
  | "BLITZSCALE_VELOCITY"
  | "NETWORK_EFFECTS"
  | "FIRST_SCALER"
  | "LEAN_EXPERIMENT"
  | "BUILD_MEASURE_LEARN"
  | "PIVOT_OR_PERSEVERE"
  | "SALES_PERSISTENCE"
  | "HABIT_FORMATION"
  | "EMOTIONAL_MASTERY"
  | "TEAM_COACHING"
  | "TRUST_BUILDING"
  | "RADICAL_CANDOR"
  | "TWELVE_WEEK_SPRINT"
  | "WEEKLY_ACCOUNTABILITY"
  | "EXECUTION_SCORING"
  | "KATAMARI_ABSORPTION"
  | "COMPOUND_GROWTH"
  | "MASS_ACCUMULATION"
  | "MARGIN_OF_SAFETY"
  | "INTRINSIC_VALUE"
  | "MR_MARKET_DISCIPLINE"
  | "VALUE_INVESTING";

export type AgentMaturityState = "INITIALIZING" | "LEARNING" | "CALIBRATED" | "AUTONOMOUS" | "SOVEREIGN";

export interface CSuiteDirective {
  id: string;
  agentId: CSuiteAgentId;
  category: DirectiveCategory;
  directive: string;
  reasoning: string;
  confidence: number;
  urgency: DirectiveUrgency;
  suggestedAction: string;
  expectedOutcome: string;
  timeWindowMinutes: number;
  alternativeDirectives: Array<{ directive: string; confidence: number; category: DirectiveCategory }>;
  delegateTo?: CSuiteAgentId | MeshAgentId;
  kpiImpact: string;
  timestamp: number;
  expiresAt: number;
  architectSeal: string;
}

interface PlatformContext {
  totalDeals: number;
  activeDeals: number;
  closedDealsToday: number;
  totalRevenue: number;
  revenueToday: number;
  commissionEarned: number;
  totalMembers: number;
  newMembersToday: number;
  activeNodes: number;
  distributionHubs: number;
  avgDealCycleHours: number;
  platformUptime: number;
  errorRate: number;
  apiLatencyP95: number;
  pendingDeals: number;
  staleDealCount: number;
  atRiskDealCount: number;
  runnerMissionsActive: number;
  contentPostsThisWeek: number;
  socialEngagementRate: number;
  partnerApplicationsPending: number;
  complianceScore: number;
  openLegalItems: number;
  cashOnHand: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  kFactor: number;
  churnRate: number;
  npsScore: number;
}

interface DirectiveRule {
  id: string;
  agentId: CSuiteAgentId;
  condition: (ctx: PlatformContext) => boolean;
  category: DirectiveCategory;
  directive: string | ((ctx: PlatformContext) => string);
  suggestedAction: string | ((ctx: PlatformContext) => string);
  reasoning: string | ((ctx: PlatformContext) => string);
  confidence: number;
  urgency: DirectiveUrgency;
  timeWindowMinutes: number;
  expectedOutcome: string;
  kpiImpact: string;
  delegateTo?: CSuiteAgentId | MeshAgentId;
  priority: number;
}

interface CSuiteAgentProfile {
  id: CSuiteAgentId;
  title: string;
  name: string;
  domain: string;
  responsibilities: string[];
  kpis: string[];
  maturity: AgentMaturityState;
  totalDirectivesIssued: number;
  directivesAccepted: number;
  directivesOverridden: number;
  acceptanceRate: number;
  confidenceCalibration: number;
  lastActive: number;
  activeSince: number;
  color: string;
}

const AGENT_PROFILES: Record<CSuiteAgentId, Omit<CSuiteAgentProfile, "totalDirectivesIssued" | "directivesAccepted" | "directivesOverridden" | "acceptanceRate" | "confidenceCalibration" | "lastActive" | "activeSince" | "maturity">> = {
  ceo: {
    id: "ceo",
    title: "Chief Executive Officer",
    name: "SOVEREIGN-1",
    domain: "Strategic Command",
    responsibilities: [
      "Network growth trajectory oversight",
      "Billion-node expansion strategy",
      "Revenue milestone tracking",
      "Sovereign authority decisions",
      "Team directive coordination",
      "Investor/partner strategic alignment",
      "Brand vision enforcement",
    ],
    kpis: ["Network Nodes", "GMV Growth", "K-Factor", "Revenue Milestones", "Strategic Partnerships"],
    color: "#C9A85D",
  },
  cto: {
    id: "cto",
    title: "Chief Technology Officer",
    name: "ARCHITECT-1",
    domain: "Technology & Infrastructure",
    responsibilities: [
      "Platform health monitoring",
      "Infrastructure scaling decisions",
      "Deployment readiness assessment",
      "Security posture enforcement",
      "Agent mesh optimization",
      "Self-learning calibration oversight",
      "API performance governance",
    ],
    kpis: ["Uptime %", "API Latency P95", "Error Rate", "Deployment Frequency", "Security Score"],
    color: "#00E5FF",
  },
  cfo: {
    id: "cfo",
    title: "Chief Financial Officer",
    name: "TREASURY-1",
    domain: "Financial Command",
    responsibilities: [
      "Revenue optimization",
      "Commission flow analysis",
      "Cash flow forecasting",
      "Burn rate monitoring",
      "Runway calculation",
      "Unit economics tracking",
      "Financial compliance",
    ],
    kpis: ["Revenue", "Commission %", "Burn Rate", "Runway Months", "Unit Economics"],
    color: "#4CAF50",
  },
  coo: {
    id: "coo",
    title: "Chief Operations Officer",
    name: "OPERATIONS-1",
    domain: "Operations Command",
    responsibilities: [
      "Call center coordination",
      "SLA monitoring and enforcement",
      "Process optimization",
      "Runner fleet efficiency",
      "Vendor management",
      "Quality assurance",
      "Operational KPI tracking",
    ],
    kpis: ["Deal Cycle Time", "SLA Compliance", "Runner Efficiency", "Resolution Time", "CSAT"],
    color: "#FF9800",
  },
  "content-social": {
    id: "content-social",
    title: "Content & Social Media Director",
    name: "SIGNAL-1",
    domain: "Content & Brand Command",
    responsibilities: [
      "Content calendar management",
      "Social media strategy execution",
      "Engagement rate optimization",
      "Brand voice consistency",
      "Platform-specific content adaptation",
      "Viral content identification",
      "Community engagement",
    ],
    kpis: ["Engagement Rate", "Content Velocity", "Follower Growth", "Viral Coefficient", "Brand Sentiment"],
    color: "#FF2D9A",
  },
  "business-dev": {
    id: "business-dev",
    title: "Business Development Director",
    name: "EXPANSION-1",
    domain: "Growth & Partnerships",
    responsibilities: [
      "Distribution hub onboarding",
      "Partnership pipeline management",
      "Node activation strategy",
      "Market expansion analysis",
      "Strategic alliance formation",
      "Hub tier progression tracking",
      "Revenue partnership optimization",
    ],
    kpis: ["New Hubs Onboarded", "Partnership Pipeline", "Node Activation Rate", "Market Coverage", "Partner Revenue"],
    color: "#7B61FF",
  },
  "legal-compliance": {
    id: "legal-compliance",
    title: "Legal & Compliance Officer",
    name: "GUARDIAN-1",
    domain: "Legal & Regulatory Command",
    responsibilities: [
      "Regulatory monitoring",
      "Contract review triggers",
      "Compliance scoring",
      "IP protection enforcement",
      "State licensing tracking",
      "Data privacy governance",
      "Risk mitigation",
    ],
    kpis: ["Compliance Score", "Open Legal Items", "Contract Review Velocity", "Regulatory Coverage", "Risk Score"],
    color: "#F44336",
  },
  blitzscale: {
    id: "blitzscale",
    title: "Blitzscaling Strategist",
    name: "BLITZSCALE-1",
    domain: "Hypergrowth Velocity",
    responsibilities: [
      "Prioritize speed over efficiency when network effects are present",
      "Identify and exploit first-scaler advantage windows",
      "Accept managed chaos during growth spurts",
      "Ignore non-critical inefficiencies during scaling phases",
      "Force counterintuitive hiring and spending decisions",
      "Monitor competitive moats and network lock-in",
      "Escalate when growth is too slow relative to market window",
    ],
    kpis: ["Growth Rate", "Time to Market", "Network Lock-in %", "Market Share Velocity", "First-Scaler Score"],
    color: "#FF6B00",
  },
  "lean-startup": {
    id: "lean-startup",
    title: "Lean Innovation Officer",
    name: "LEAN-1",
    domain: "Build-Measure-Learn",
    responsibilities: [
      "Enforce validated learning over vanity metrics",
      "Identify minimum viable experiments for every initiative",
      "Track innovation accounting separate from revenue accounting",
      "Detect pivot-or-persevere decision points",
      "Kill features that show no validated learning signal",
      "Enforce small batch deployment for rapid feedback",
      "Measure actionable metrics vs vanity metrics",
    ],
    kpis: ["Experiment Velocity", "Learning Rate", "Pivot Signals", "Feature Adoption %", "Validated Learnings/Week"],
    color: "#2196F3",
  },
  "greatest-salesman": {
    id: "greatest-salesman",
    title: "Sales Doctrine Commander",
    name: "SCROLLS-1",
    domain: "Persistence & Emotional Mastery",
    responsibilities: [
      "Enforce daily habit discipline across all outreach",
      "Detect emotional weakness in deal follow-up patterns",
      "Trigger persistence protocols on abandoned opportunities",
      "Monitor love-based vs fear-based selling patterns",
      "Enforce the principle: act now, for now is all you have",
      "Track daily action streaks and break detection",
      "Escalate when team morale or persistence drops",
    ],
    kpis: ["Daily Actions Completed", "Follow-up Streak Days", "Persistence Score", "Emotional Resilience", "Scroll Adherence"],
    color: "#FFD700",
  },
  "trillion-coach": {
    id: "trillion-coach",
    title: "Team Excellence Coach",
    name: "COACH-1",
    domain: "Team-First Leadership",
    responsibilities: [
      "Ensure people problems are solved before strategy problems",
      "Monitor team trust and psychological safety signals",
      "Enforce radical candor in all feedback loops",
      "Detect and escalate when smart creatives are blocked",
      "Track whether managers are coaching or just managing",
      "Force 1-on-1 accountability and trip report disciplines",
      "Identify when the team needs a hug vs a kick",
    ],
    kpis: ["Team Trust Score", "Coaching Frequency", "Candor Index", "Blocker Resolution Time", "Team Velocity"],
    color: "#9C27B0",
  },
  "twelve-week": {
    id: "twelve-week",
    title: "Execution Sprint Commander",
    name: "SPRINT-1",
    domain: "12-Week Execution Cycles",
    responsibilities: [
      "Break annual goals into 12-week sprints with weekly scoring",
      "Enforce weekly accountability reviews",
      "Track leading indicators not lagging indicators",
      "Detect execution drift before it compounds",
      "Score weekly execution rate (target: 85%+)",
      "Time-block strategic activities vs reactive work",
      "Compress urgency — treat 12 weeks as the entire year",
    ],
    kpis: ["Weekly Execution Score", "Sprint Completion %", "Leading Indicator Hits", "Time Block Adherence", "Goal Velocity"],
    color: "#00BCD4",
  },
  katamari: {
    id: "katamari",
    title: "Compound Absorption Engine",
    name: "KATAMARI-1",
    domain: "Exponential Mass Accumulation",
    responsibilities: [
      "Absorb every small win into compounding momentum",
      "Never stop rolling — continuous forward motion",
      "Start with the smallest achievable targets first",
      "Grow mass before attempting larger absorptions",
      "Detect when the ball is big enough to absorb the next tier",
      "Monitor velocity — slowing down means losing momentum",
      "Transform every node, deal, and interaction into growth mass",
    ],
    kpis: ["Ball Mass (Network Size)", "Absorption Rate", "Momentum Velocity", "Tier Readiness", "Compound Growth %"],
    color: "#E91E63",
  },
  "intelligent-investor": {
    id: "intelligent-investor",
    title: "Value Intelligence Analyst",
    name: "GRAHAM-1",
    domain: "Margin of Safety & Intrinsic Value",
    responsibilities: [
      "Enforce margin of safety on every deal and partnership decision",
      "Calculate intrinsic value of network nodes vs market price",
      "Apply Mr. Market discipline — buy fear, sell greed",
      "Prevent speculative over-expansion without value backing",
      "Distinguish investment-grade nodes from speculative ones",
      "Enforce defensive positioning during market volatility",
      "Demand adequate return for every dollar of risk taken",
    ],
    kpis: ["Margin of Safety %", "Intrinsic Value Score", "Risk-Adjusted Return", "Speculative Ratio", "Value Discipline Score"],
    color: "#1B5E20",
  },
};

const DIRECTIVE_RULES: DirectiveRule[] = [
  {
    id: "ceo-network-stall",
    agentId: "ceo",
    condition: (ctx) => ctx.newMembersToday === 0 && ctx.activeNodes > 10,
    category: "NETWORK_GROWTH",
    directive: "Network growth has stalled — zero new members today. Activate emergency growth protocol.",
    suggestedAction: "Trigger referral incentive blast to top 10% of active members. Deploy Growth Agent viral loop. Instruct Content Agent to push success story content.",
    reasoning: "Zero new member acquisition in a 24-hour period with an active network indicates a growth friction point. Historical data shows referral incentive blasts recover 3x daily acquisition within 48 hours.",
    confidence: 0.91,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Restore daily member acquisition to baseline within 48 hours",
    kpiImpact: "Network Nodes +15% WoW",
    delegateTo: "growth",
    priority: 98,
  },
  {
    id: "ceo-revenue-milestone",
    agentId: "ceo",
    condition: (ctx) => ctx.totalRevenue > 0 && ctx.revenueToday > ctx.totalRevenue * 0.05,
    category: "STRATEGIC_VISION",
    directive: "Revenue spike detected — today's revenue exceeds 5% of total historical revenue. Capitalize on momentum.",
    suggestedAction: "Identify top-performing channels and double down. Push BD Agent to onboard similar hub profiles. Notify CFO Agent to forecast impact.",
    reasoning: "Revenue spikes indicate a channel or segment breakthrough. Capitalizing within 24 hours extends momentum by an average of 2 weeks.",
    confidence: 0.89,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Sustain elevated revenue trajectory for 14+ days",
    kpiImpact: "Revenue Growth +25%",
    delegateTo: "business-dev",
    priority: 85,
  },
  {
    id: "ceo-kfactor-below-1",
    agentId: "ceo",
    condition: (ctx) => ctx.kFactor < 1.0 && ctx.activeNodes > 50,
    category: "NETWORK_GROWTH",
    directive: (ctx) => `K-Factor at ${ctx.kFactor.toFixed(2)} — below viral threshold. Network is shrinking. Sovereign intervention required.`,
    suggestedAction: "Activate all growth levers: referral bonuses, hub fast-track promotions, content blitz. CEO direct outreach to top 5 distribution hubs.",
    reasoning: "K-Factor below 1.0 means each user brings in less than one new user — the network contracts. This is an existential metric.",
    confidence: 0.95,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 60,
    expectedOutcome: "Restore K-Factor above 1.0 within 7 days",
    kpiImpact: "K-Factor → 1.0+",
    priority: 100,
  },
  {
    id: "ceo-deal-oversight-stale",
    agentId: "ceo",
    condition: (ctx) => ctx.staleDealCount > ctx.activeDeals * 0.3,
    category: "DEAL_OVERSIGHT",
    directive: (ctx) => `${ctx.staleDealCount} stale deals detected (${Math.round(ctx.staleDealCount / Math.max(ctx.activeDeals, 1) * 100)}% of pipeline). Revenue leak in progress.`,
    suggestedAction: "Direct COO Agent to audit stale deals. Trigger NBA Engine batch computation. Deploy concierge re-engagement on all deals stale >48 hours.",
    reasoning: "Stale deals exceeding 30% of pipeline signals systemic follow-up failure. Each stale deal represents lost commission.",
    confidence: 0.93,
    urgency: "CRITICAL",
    timeWindowMinutes: 180,
    expectedOutcome: "Reduce stale deal ratio below 15% within 72 hours",
    kpiImpact: "Pipeline Recovery +$50K+ potential",
    delegateTo: "coo",
    priority: 92,
  },
  {
    id: "ceo-churn-alert",
    agentId: "ceo",
    condition: (ctx) => ctx.churnRate > 5,
    category: "STRATEGIC_VISION",
    directive: (ctx) => `Churn rate at ${ctx.churnRate}% — above acceptable threshold. Member retention emergency.`,
    suggestedAction: "Deploy retention campaign. Activate loyalty rewards. Direct Content Agent to push value reinforcement content. CEO personal outreach to churning high-value members.",
    reasoning: "Churn above 5% monthly compounds destructively. Reducing churn by 1% increases lifetime network value by approximately 8%.",
    confidence: 0.90,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Reduce churn below 5% within 30 days",
    kpiImpact: "LTV +8% per 1% churn reduction",
    priority: 94,
  },

  {
    id: "cto-error-rate-spike",
    agentId: "cto",
    condition: (ctx) => ctx.errorRate > 2,
    category: "PLATFORM_HEALTH",
    directive: (ctx) => `Error rate at ${ctx.errorRate.toFixed(1)}% — exceeds 2% threshold. Platform stability at risk.`,
    suggestedAction: "Trigger Log Aggregator analysis for top error patterns. Activate Service Mesh circuit breakers on failing services. Deploy hotfix pipeline.",
    reasoning: "Error rates above 2% indicate systemic platform issues. Each 1% increase in error rate correlates to 3% decrease in deal completion.",
    confidence: 0.94,
    urgency: "CRITICAL",
    timeWindowMinutes: 30,
    expectedOutcome: "Reduce error rate below 1% within 4 hours",
    kpiImpact: "Platform Uptime → 99.9%",
    priority: 97,
  },
  {
    id: "cto-latency-degradation",
    agentId: "cto",
    condition: (ctx) => ctx.apiLatencyP95 > 500,
    category: "INFRASTRUCTURE",
    directive: (ctx) => `API P95 latency at ${ctx.apiLatencyP95}ms — above 500ms threshold. User experience degrading.`,
    suggestedAction: "Analyze Metrics Engine for bottleneck identification. Check database query performance. Scale Service Mesh replicas on slow endpoints.",
    reasoning: "P95 latency above 500ms causes 12% increase in user abandonment. Every 100ms improvement increases conversion by 1%.",
    confidence: 0.91,
    urgency: "HIGH",
    timeWindowMinutes: 60,
    expectedOutcome: "Reduce P95 latency below 300ms within 2 hours",
    kpiImpact: "Conversion +1% per 100ms improvement",
    priority: 88,
  },
  {
    id: "cto-uptime-risk",
    agentId: "cto",
    condition: (ctx) => ctx.platformUptime < 99.5,
    category: "PLATFORM_HEALTH",
    directive: (ctx) => `Platform uptime at ${ctx.platformUptime.toFixed(2)}% — below 99.5% SLA. Sovereign infrastructure integrity compromised.`,
    suggestedAction: "Activate all redundancy protocols. Review Service Mesh health probes. Deploy CI/CD Pipeline emergency stability build. Notify CEO Agent.",
    reasoning: "Uptime below 99.5% violates enterprise SLA requirements and destroys trust with distribution hubs.",
    confidence: 0.96,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 15,
    expectedOutcome: "Restore uptime to 99.9%+ within 1 hour",
    kpiImpact: "SLA Compliance → 99.9%",
    delegateTo: "ceo",
    priority: 99,
  },
  {
    id: "cto-security-posture",
    agentId: "cto",
    condition: (ctx) => ctx.complianceScore < 80,
    category: "SECURITY_POSTURE",
    directive: "Security compliance score below 80 — vulnerability window open. Harden immediately.",
    suggestedAction: "Run full security audit. Review sovereign hardened endpoints. Verify encryption on all data at rest. Notify Legal/Compliance Agent.",
    reasoning: "Compliance below 80 indicates exploitable gaps. Financial platform requirements demand 90+ for production readiness.",
    confidence: 0.93,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Raise compliance score above 90 within 48 hours",
    kpiImpact: "Security Score → 90+",
    delegateTo: "legal-compliance",
    priority: 95,
  },

  {
    id: "cfo-runway-critical",
    agentId: "cfo",
    condition: (ctx) => ctx.runwayMonths < 3,
    category: "CASH_FLOW",
    directive: (ctx) => `Runway at ${ctx.runwayMonths.toFixed(1)} months — below 3-month critical threshold. Financial survival mode.`,
    suggestedAction: "Reduce non-essential burn immediately. Accelerate revenue through commission optimization. Identify top 5 revenue-generating hubs and maximize throughput. CEO must evaluate fundraise or strategic partnership.",
    reasoning: "Sub-3-month runway requires immediate cash preservation and revenue acceleration. Bootstrap mode demands maximum efficiency.",
    confidence: 0.97,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 60,
    expectedOutcome: "Extend runway to 6+ months through burn reduction and revenue acceleration",
    kpiImpact: "Runway → 6+ months",
    delegateTo: "ceo",
    priority: 100,
  },
  {
    id: "cfo-commission-leak",
    agentId: "cfo",
    condition: (ctx) => ctx.commissionEarned < ctx.totalRevenue * 0.025 && ctx.totalRevenue > 0,
    category: "REVENUE_OPTIMIZATION",
    directive: "Commission capture below 2.5% of revenue — below the 3% protocol target. Revenue leak detected.",
    suggestedAction: "Audit all deal commission calculations. Verify 3% platform fee enforcement. Check for discount overrides or commission waivers that bypass protocol.",
    reasoning: "The 3% commission protocol is the financial backbone. Sub-2.5% capture means deals are leaking revenue through misconfigured fee structures or unauthorized discounts.",
    confidence: 0.92,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Restore commission capture to 3%+ across all deal types",
    kpiImpact: "Commission Revenue +20%",
    priority: 90,
  },
  {
    id: "cfo-burn-rate-spike",
    agentId: "cfo",
    condition: (ctx) => ctx.monthlyBurnRate > ctx.cashOnHand * 0.25,
    category: "FINANCIAL_FORECAST",
    directive: (ctx) => `Monthly burn rate (${ctx.monthlyBurnRate.toLocaleString()}) exceeds 25% of cash reserves. Spending discipline required.`,
    suggestedAction: "Itemize top 5 cost centers. Identify deferrable expenses. Negotiate vendor payment terms. Report to CEO with 90-day cash flow forecast.",
    reasoning: "Burn exceeding 25% of reserves in a bootstrap operation reduces strategic flexibility and increases existential risk.",
    confidence: 0.88,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Reduce monthly burn by 15% within 30 days",
    kpiImpact: "Burn Rate -15%, Runway +2 months",
    delegateTo: "ceo",
    priority: 87,
  },
  {
    id: "cfo-revenue-trend-positive",
    agentId: "cfo",
    condition: (ctx) => ctx.revenueToday > 0 && ctx.closedDealsToday >= 3,
    category: "FINANCIAL_FORECAST",
    directive: (ctx) => `Strong revenue day: ${ctx.closedDealsToday} deals closed, $${ctx.revenueToday.toLocaleString()} revenue. Forecast update recommended.`,
    suggestedAction: "Update 30/60/90 day revenue projections. Flag winning patterns for BD Agent to replicate. Notify CEO Agent of milestone progress.",
    reasoning: "Multiple closes in a single day indicate operational momentum. Capturing and replicating this pattern drives compounding growth.",
    confidence: 0.85,
    urgency: "MEDIUM",
    timeWindowMinutes: 480,
    expectedOutcome: "Extrapolate winning pattern to 20% revenue growth next month",
    kpiImpact: "Revenue Forecast +20%",
    priority: 70,
  },

  {
    id: "coo-deal-cycle-slow",
    agentId: "coo",
    condition: (ctx) => ctx.avgDealCycleHours > 72,
    category: "OPERATIONS",
    directive: (ctx) => `Average deal cycle at ${ctx.avgDealCycleHours.toFixed(0)} hours — above 72-hour target. Process bottleneck detected.`,
    suggestedAction: "Identify top 3 bottleneck stages (finance, insurance, documentation). Deploy NBA Engine on all pending deals. Optimize handoff timing between agents.",
    reasoning: "Every hour above the 72-hour target decreases close probability by 2%. Deals exceeding 120 hours have a 40% abandonment rate.",
    confidence: 0.90,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Reduce average deal cycle below 48 hours within 2 weeks",
    kpiImpact: "Deal Velocity +30%",
    priority: 85,
  },
  {
    id: "coo-runner-utilization",
    agentId: "coo",
    condition: (ctx) => ctx.runnerMissionsActive < 3 && ctx.pendingDeals > 5,
    category: "SLA_MANAGEMENT",
    directive: "Runner fleet underutilized while deals are pending. Logistics bottleneck forming.",
    suggestedAction: "Audit pending deals for delivery/inspection needs. Dispatch available runners to highest-priority tasks. Optimize route batching.",
    reasoning: "Idle runners with pending deals means the dispatch system is not matching supply to demand. This creates unnecessary delay.",
    confidence: 0.87,
    urgency: "HIGH",
    timeWindowMinutes: 60,
    expectedOutcome: "Increase runner utilization to 80%+ and clear pending logistics within 24 hours",
    kpiImpact: "Delivery SLA Compliance +25%",
    delegateTo: "runner" as any,
    priority: 82,
  },
  {
    id: "coo-at-risk-escalation",
    agentId: "coo",
    condition: (ctx) => ctx.atRiskDealCount > 3,
    category: "OPERATIONS",
    directive: (ctx) => `${ctx.atRiskDealCount} deals in AT_RISK state. Immediate operational intervention required.`,
    suggestedAction: "Assign senior operators to each at-risk deal. Trigger personalized save campaigns. Escalate highest-value at-risk deals to CEO Agent.",
    reasoning: "Multiple concurrent at-risk deals compound into pipeline collapse. Each saved deal is worth 5x the cost of acquisition.",
    confidence: 0.91,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Save 40%+ of at-risk deals within 48 hours",
    kpiImpact: "Pipeline Recovery +$30K+",
    priority: 90,
  },

  {
    id: "content-low-engagement",
    agentId: "content-social",
    condition: (ctx) => ctx.socialEngagementRate < 2,
    category: "SOCIAL_ENGAGEMENT",
    directive: (ctx) => `Social engagement rate at ${ctx.socialEngagementRate.toFixed(1)}% — below 2% minimum. Content strategy needs recalibration.`,
    suggestedAction: "Analyze top-performing posts from last 30 days. Shift to video-first content (Reels, TikTok). Deploy user-generated content from successful deals. A/B test posting times.",
    reasoning: "Engagement below 2% means content is not resonating. The algorithm deprioritizes low-engagement accounts, creating a death spiral.",
    confidence: 0.86,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Raise engagement rate above 4% within 14 days",
    kpiImpact: "Engagement Rate → 4%+",
    priority: 78,
  },
  {
    id: "content-velocity-low",
    agentId: "content-social",
    condition: (ctx) => ctx.contentPostsThisWeek < 5,
    category: "CONTENT_STRATEGY",
    directive: (ctx) => `Only ${ctx.contentPostsThisWeek} posts this week — below minimum 5/week cadence. Brand presence fading.`,
    suggestedAction: "Deploy content batch production: 3 deal success stories, 2 platform feature highlights, 2 behind-the-scenes, 1 industry insight. Schedule across platforms with peak-time optimization.",
    reasoning: "Consistency is the #1 factor in social algorithm favorability. Dropping below 5 posts/week reduces reach by 40% within 2 weeks.",
    confidence: 0.88,
    urgency: "MEDIUM",
    timeWindowMinutes: 480,
    expectedOutcome: "Maintain 7+ posts per week cadence for sustained reach",
    kpiImpact: "Social Reach +40%",
    priority: 75,
  },
  {
    id: "content-viral-opportunity",
    agentId: "content-social",
    condition: (ctx) => ctx.kFactor > 1.5 && ctx.socialEngagementRate > 5,
    category: "BRAND_VOICE",
    directive: "Viral conditions detected — K-Factor above 1.5 with high engagement. Maximum content deployment NOW.",
    suggestedAction: "Triple posting frequency. Deploy all available success stories. Activate TikTok Ads scaling. Push referral CTAs on every post. Coordinate with BD Agent for partnership announcements.",
    reasoning: "When K-Factor and engagement are both elevated, the network is in a viral moment. Every piece of content has 3x normal impact. This window typically lasts 5-10 days.",
    confidence: 0.92,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Capture viral moment for 200%+ follower growth",
    kpiImpact: "Follower Growth +200%, Node Activation +50%",
    delegateTo: "business-dev",
    priority: 93,
  },

  {
    id: "bd-hub-pipeline-empty",
    agentId: "business-dev",
    condition: (ctx) => ctx.partnerApplicationsPending === 0 && ctx.distributionHubs < 100,
    category: "PARTNERSHIP_PIPELINE",
    directive: "Zero pending partner applications. Hub onboarding pipeline is dry. Network expansion stalled.",
    suggestedAction: "Launch targeted outreach to 50 potential hubs (auto dealerships, repair shops, rideshare companies). Deploy partner landing page A/B test. Activate referral bonus for existing hubs bringing new partners.",
    reasoning: "Empty pipeline means zero future growth. Hub onboarding takes 14-30 days, so today's empty pipeline means no growth for the next month.",
    confidence: 0.90,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Generate 10+ qualified hub applications within 14 days",
    kpiImpact: "Hub Pipeline → 10+ applications",
    priority: 88,
  },
  {
    id: "bd-node-activation-low",
    agentId: "business-dev",
    condition: (ctx) => ctx.activeNodes < ctx.totalMembers * 0.3 && ctx.totalMembers > 20,
    category: "NODE_ACTIVATION",
    directive: (ctx) => `Only ${Math.round(ctx.activeNodes / Math.max(ctx.totalMembers, 1) * 100)}% of members are active nodes. Dormant network problem.`,
    suggestedAction: "Deploy re-activation email sequence to dormant members. Offer first-deal incentive bonus. Implement gamification badges for activity streaks. Push personalized NBA to each dormant member.",
    reasoning: "A network with <30% active nodes is economically inefficient. Each activated node increases revenue potential by an average of $1,200/year.",
    confidence: 0.87,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Increase active node ratio to 50%+ within 30 days",
    kpiImpact: "Active Nodes +$1,200/node/year revenue potential",
    priority: 83,
  },
  {
    id: "bd-market-expansion",
    agentId: "business-dev",
    condition: (ctx) => ctx.distributionHubs >= 50 && ctx.kFactor >= 1.2,
    category: "MARKET_EXPANSION",
    directive: "Network has critical mass (50+ hubs) with viral growth. Launch geographic expansion.",
    suggestedAction: "Identify top 3 underserved metro areas by auto transaction volume. Deploy BD outreach with localized hub proposals. Coordinate with Legal Agent for state-specific licensing.",
    reasoning: "50+ hubs with K-Factor above 1.2 means the model is proven. Geographic expansion at this stage has 3x ROI compared to densifying existing markets.",
    confidence: 0.84,
    urgency: "MEDIUM",
    timeWindowMinutes: 1440,
    expectedOutcome: "Enter 3 new metro markets within 60 days",
    kpiImpact: "TAM +30%, Geographic Coverage +3 markets",
    delegateTo: "legal-compliance",
    priority: 76,
  },

  {
    id: "legal-compliance-low",
    agentId: "legal-compliance",
    condition: (ctx) => ctx.complianceScore < 85,
    category: "COMPLIANCE_AUDIT",
    directive: (ctx) => `Compliance score at ${ctx.complianceScore} — below 85 threshold. Regulatory exposure increasing.`,
    suggestedAction: "Run full compliance audit across all active states. Review dealer agreements for updated regulatory language. Verify KYC/AML processes are current. Report findings to CEO Agent.",
    reasoning: "Compliance below 85 in automotive finance creates material legal risk. Regulatory action can freeze operations with zero notice.",
    confidence: 0.94,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Raise compliance score to 95+ within 14 days",
    kpiImpact: "Regulatory Risk → Minimal",
    delegateTo: "ceo",
    priority: 96,
  },
  {
    id: "legal-open-items",
    agentId: "legal-compliance",
    condition: (ctx) => ctx.openLegalItems > 5,
    category: "CONTRACT_REVIEW",
    directive: (ctx) => `${ctx.openLegalItems} open legal items — backlog exceeding safe threshold. Contract review velocity must increase.`,
    suggestedAction: "Prioritize legal items by financial exposure. Engage Karra Law for high-priority contract reviews. Flag any items older than 30 days as critical.",
    reasoning: "Legal item backlog above 5 creates compounding risk. Each unresolved item increases potential exposure by approximately 15%.",
    confidence: 0.89,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Reduce open legal items to 2 or fewer within 21 days",
    kpiImpact: "Legal Risk Reduction -60%",
    priority: 84,
  },
  {
    id: "legal-ip-protection",
    agentId: "legal-compliance",
    condition: (ctx) => ctx.activeNodes > 100,
    category: "IP_PROTECTION",
    directive: "Network exceeding 100 nodes — sovereign IP protection must be hardened. File provisional patents and update trade secret documentation.",
    suggestedAction: "Document all proprietary algorithms (Self-Learning Engine, NBA Engine, C-Suite Agent Engine, Behavioral DNA). File provisional patents for core protocols. Update NDA templates for all new partners.",
    reasoning: "At 100+ nodes, the platform IP becomes a target. Provisional patents establish priority date. Trade secret documentation creates legal defensibility.",
    confidence: 0.91,
    urgency: "HIGH",
    timeWindowMinutes: 2880,
    expectedOutcome: "Full IP protection portfolio filed within 60 days",
    kpiImpact: "IP Protection → Complete",
    delegateTo: "ceo",
    priority: 80,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BOOK DOCTRINE AGENTS — 6 agents, each encoding an entire playbook
  // Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─── BLITZSCALE-1 — Reid Hoffman's Blitzscaling ─────────────────────────────
  {
    id: "blitz-speed-over-efficiency",
    agentId: "blitzscale",
    condition: (ctx) => ctx.activeNodes < 100 && ctx.kFactor >= 1.0,
    category: "BLITZSCALE_VELOCITY",
    directive: "Viral conditions present but network is under 100 nodes. BLITZSCALE NOW — speed over efficiency. Do things that don't scale to reach critical mass.",
    suggestedAction: "Manually onboard 10 hubs this week by direct outreach. Skip automation polish — raw founder-led sales. Offer aggressive first-mover incentives. Every hour spent on optimization is an hour your competitor is stealing your market.",
    reasoning: "Reid Hoffman: 'In a world of network effects, the first scaler wins everything and everyone else gets nothing.' With K-Factor above 1.0, the network wants to grow. Feed it nodes — NOW. Efficiency comes later.",
    confidence: 0.93,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Reach 100-node critical mass within 14 days",
    kpiImpact: "Network Nodes → 100+ (Critical Mass)",
    delegateTo: "business-dev",
    priority: 95,
  },
  {
    id: "blitz-network-effects-check",
    agentId: "blitzscale",
    condition: (ctx) => ctx.distributionHubs >= 10 && ctx.kFactor < 1.0,
    category: "NETWORK_EFFECTS",
    directive: (ctx) => `10+ hubs deployed but K-Factor is ${ctx.kFactor.toFixed(2)} — network effects are NOT firing. Fix the value loop before scaling further.`,
    suggestedAction: "Audit what each hub gets from the network vs. operating alone. If the 10th hub isn't dramatically better off than the 1st hub was, the network effect is broken. Fix value delivery before adding more nodes.",
    reasoning: "Hoffman: 'Blitzscaling only works when you have genuine network effects. Scaling a broken model just creates a bigger broken model.' The value of each new node must increase the value for all existing nodes.",
    confidence: 0.95,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 120,
    expectedOutcome: "Identify and fix network effect blockers, restore K-Factor above 1.0",
    kpiImpact: "K-Factor → 1.0+ (Network Effect Activation)",
    delegateTo: "ceo",
    priority: 98,
  },
  {
    id: "blitz-first-scaler-window",
    agentId: "blitzscale",
    condition: (ctx) => ctx.distributionHubs >= 50 && ctx.kFactor >= 1.2,
    category: "FIRST_SCALER",
    directive: "FIRST-SCALER WINDOW OPEN — 50+ hubs with viral K-Factor. Every day you don't pour gasoline on this fire, a competitor could emerge. Ignore efficiency. Maximize speed.",
    suggestedAction: "10x outreach budget. Accept 30% higher CAC temporarily. Launch in 3 new markets simultaneously even if operations aren't perfect. Hire ahead of demand. The winner of this market takes 80% of all future value.",
    reasoning: "Hoffman: 'The first-scaler advantage is the most powerful competitive moat in network businesses. Once you own the network, switching costs make it nearly impossible for competitors to displace you.' This is the moment.",
    confidence: 0.91,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 60,
    expectedOutcome: "Secure first-scaler position in primary markets within 90 days",
    kpiImpact: "Market Share → Dominant Position",
    delegateTo: "ceo",
    priority: 99,
  },
  {
    id: "blitz-managed-chaos",
    agentId: "blitzscale",
    condition: (ctx) => ctx.errorRate > 1 && ctx.newMembersToday > 5,
    category: "BLITZSCALE_VELOCITY",
    directive: (ctx) => `Error rate ${ctx.errorRate.toFixed(1)}% during high-growth day (${ctx.newMembersToday} new members). This is EXPECTED chaos during blitzscaling. Do NOT slow down to fix — patch and continue.`,
    suggestedAction: "Deploy hotfixes for user-facing errors only. Accept backend technical debt temporarily. Keep the growth engine running. Schedule cleanup sprint for next week. Growth momentum is more valuable than clean code right now.",
    reasoning: "Hoffman: 'If you're not embarrassed by your first product, you launched too late.' During blitzscaling, some chaos is the sign you're moving fast enough. Only fix what kills growth.",
    confidence: 0.87,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Maintain growth velocity while patching critical issues only",
    kpiImpact: "Growth Continuity — Zero growth interruption",
    delegateTo: "cto",
    priority: 82,
  },

  // ─── LEAN-1 — Eric Ries' The Lean Startup ──────────────────────────────────
  {
    id: "lean-vanity-metrics",
    agentId: "lean-startup",
    condition: (ctx) => ctx.totalMembers > 50 && ctx.activeNodes < ctx.totalMembers * 0.2,
    category: "BUILD_MEASURE_LEARN",
    directive: (ctx) => `${ctx.totalMembers} total members but only ${ctx.activeNodes} active nodes (${Math.round(ctx.activeNodes / Math.max(ctx.totalMembers, 1) * 100)}%). Total members is a VANITY METRIC. Active nodes is the ACTIONABLE metric. Fix activation, not acquisition.`,
    suggestedAction: "Stop all acquisition campaigns. Deploy activation experiments: A/B test onboarding flows, test incentive structures, run user interviews with dormant members to identify friction. Measure activation rate, not signup rate.",
    reasoning: "Ries: 'Vanity metrics let you feel good but don't tell you if your business model is working.' Signup count means nothing if people don't activate. Every dollar spent on acquisition of users who don't activate is wasted.",
    confidence: 0.94,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Increase activation rate from current to 40%+ within 30 days",
    kpiImpact: "Activation Rate → 40%+ (True Growth)",
    delegateTo: "ceo",
    priority: 93,
  },
  {
    id: "lean-pivot-signal",
    agentId: "lean-startup",
    condition: (ctx) => ctx.closedDealsToday === 0 && ctx.activeDeals > 10 && ctx.avgDealCycleHours > 120,
    category: "PIVOT_OR_PERSEVERE",
    directive: (ctx) => `Zero deals closing despite ${ctx.activeDeals} in pipeline. Average cycle at ${ctx.avgDealCycleHours.toFixed(0)} hours. PIVOT-OR-PERSEVERE decision point reached.`,
    suggestedAction: "Convene decision meeting. Analyze: Is the problem the channel (wrong customers), the solution (wrong product), or the engine (wrong process)? Run a zoom-in pivot experiment — take the one feature that IS working and make it the whole product. 48-hour decision deadline.",
    reasoning: "Ries: 'A pivot is a structured course correction designed to test a new fundamental hypothesis.' Extended deal cycles with no closes means the current model has a structural problem. The data is telling you something — listen.",
    confidence: 0.90,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Identify root cause and deploy pivot experiment within 48 hours",
    kpiImpact: "Deal Close Rate → Recovery",
    delegateTo: "ceo",
    priority: 94,
  },
  {
    id: "lean-small-batch",
    agentId: "lean-startup",
    condition: (ctx) => ctx.contentPostsThisWeek === 0 && ctx.socialEngagementRate < 1,
    category: "LEAN_EXPERIMENT",
    directive: "Zero content output and sub-1% engagement. Deploy a minimum viable content experiment — one post, one metric, one learning. Stop planning the perfect campaign.",
    suggestedAction: "Post one deal success story TODAY. Measure response within 24 hours. If engagement above 3%, double down. If below 1%, test a completely different format. Small batches, fast learning. Stop waiting for the perfect content calendar.",
    reasoning: "Ries: 'The minimum viable product is that version of the product that enables a full turn of the Build-Measure-Learn loop with a minimum amount of effort.' Apply this to everything — including content.",
    confidence: 0.88,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Complete one full build-measure-learn loop within 48 hours",
    kpiImpact: "Content Learning Velocity → 1 cycle/48h",
    delegateTo: "content-social",
    priority: 80,
  },
  {
    id: "lean-innovation-accounting",
    agentId: "lean-startup",
    condition: (ctx) => ctx.totalRevenue === 0 && ctx.totalMembers > 20,
    category: "BUILD_MEASURE_LEARN",
    directive: "20+ members but zero revenue. Traditional accounting says failure. Innovation accounting says: Are you learning? Measure learning velocity, not revenue yet.",
    suggestedAction: "Define 3 learning milestones for this week: (1) Can you get one user to pay for anything? (2) Which user segment shows highest willingness to pay? (3) What's the #1 reason people DON'T pay? Track these, not total revenue.",
    reasoning: "Ries: 'Innovation accounting allows startups to prove that they are learning and growing even before revenue appears.' Pre-revenue doesn't mean pre-progress — but only if you're measuring the right things.",
    confidence: 0.86,
    urgency: "MEDIUM",
    timeWindowMinutes: 480,
    expectedOutcome: "Achieve 3 validated learnings about monetization within 7 days",
    kpiImpact: "Learning Velocity → 3 learnings/week",
    priority: 75,
  },

  // ─── SCROLLS-1 — Og Mandino's The Greatest Salesman ────────────────────────
  {
    id: "scrolls-persistence-failure",
    agentId: "greatest-salesman",
    condition: (ctx) => ctx.staleDealCount > 5,
    category: "SALES_PERSISTENCE",
    directive: (ctx) => `${ctx.staleDealCount} stale deals rotting in the pipeline. Scroll II: "I will persist until I succeed." Every stale deal is a broken promise of persistence. Revive them ALL.`,
    suggestedAction: "Touch every single stale deal TODAY. Not tomorrow. Not next week. TODAY. Call, text, email — in that order. The difference between a master salesman and a failure is the willingness to make one more attempt. Set a 48-hour follow-up cadence on every deal until it closes or dies.",
    reasoning: "Mandino: 'I will persist until I succeed. I was not delivered into this world in defeat, nor does failure course in my veins.' Stale deals are not dead deals — they are deals that were abandoned by people who gave up too soon.",
    confidence: 0.92,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Revive 30%+ of stale deals through persistent follow-up",
    kpiImpact: "Pipeline Recovery +30%, Revenue from Persistence",
    delegateTo: "coo",
    priority: 91,
  },
  {
    id: "scrolls-habit-formation",
    agentId: "greatest-salesman",
    condition: (ctx) => ctx.closedDealsToday === 0 && ctx.activeDeals > 0,
    category: "HABIT_FORMATION",
    directive: "Zero closes today. Scroll I: 'I will form good habits and become their slave.' Have you completed your daily non-negotiables? 10 outreach touches. 5 follow-ups. 3 presentations. Every day. No exceptions.",
    suggestedAction: "Before the day ends: make 10 outreach touches to cold prospects, 5 follow-ups to warm leads, present 3 vehicle solutions. Log every action. The habit IS the strategy. Missing one day is a crack. Missing two is a collapse.",
    reasoning: "Mandino: 'In truth, the only difference between those who have failed and those who have succeeded lies in the difference of their habits.' Daily discipline compounds into unstoppable momentum.",
    confidence: 0.89,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Complete daily sales habit cycle, build 7-day streak",
    kpiImpact: "Daily Activity Compliance → 100%",
    priority: 88,
  },
  {
    id: "scrolls-emotional-mastery",
    agentId: "greatest-salesman",
    condition: (ctx) => ctx.churnRate > 3 && ctx.npsScore < 50,
    category: "EMOTIONAL_MASTERY",
    directive: (ctx) => `Churn at ${ctx.churnRate}%, NPS at ${ctx.npsScore}. Scroll VI: "I am master of my emotions." The network is sensing negativity. Greet every interaction with love, not desperation.`,
    suggestedAction: "Shift all outreach to value-giving mode. Every message should offer something — a market insight, a saved deal, a connection — before asking for anything. If the team is frustrated, acknowledge it, then refocus on service. Love is the greatest weapon in selling.",
    reasoning: "Mandino: 'I will greet this day with love in my heart. And how will I confront each person? In only one way. In silence and to myself I will address them and say: I love you.' People churn from platforms that feel transactional. They stay on platforms that feel like partnership.",
    confidence: 0.90,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Improve NPS 10+ points within 30 days through love-based engagement",
    kpiImpact: "NPS +10, Churn Rate -1%",
    priority: 86,
  },
  {
    id: "scrolls-act-now",
    agentId: "greatest-salesman",
    condition: (ctx) => ctx.pendingDeals > 10 && ctx.closedDealsToday === 0,
    category: "SALES_PERSISTENCE",
    directive: (ctx) => `${ctx.pendingDeals} deals pending, zero closed. Scroll IX: "I will act now. I will act now. I will act now." Stop analyzing. Stop planning. Start closing.`,
    suggestedAction: "Pick the top 3 highest-value pending deals. Call each one RIGHT NOW. Make an offer. Set a deadline. Create urgency. 'I will not avoid the tasks of today by thinking about tomorrow. Tomorrow is for lazy people. I act now.'",
    reasoning: "Mandino: 'My dreams are worthless, my plans are dust, my goals are impossible — all are of no value unless they are followed by action. I will act now.' The gap between 10 pending deals and 0 closes is not strategy — it's inaction.",
    confidence: 0.93,
    urgency: "CRITICAL",
    timeWindowMinutes: 30,
    expectedOutcome: "Close at least 1 pending deal within 24 hours through immediate action",
    kpiImpact: "Immediate Deal Close → Revenue Today",
    priority: 92,
  },

  // ─── COACH-1 — Bill Campbell's Trillion Dollar Coach ───────────────────────
  {
    id: "coach-people-first",
    agentId: "trillion-coach",
    condition: (ctx) => ctx.atRiskDealCount > 3 && ctx.runnerMissionsActive > 0,
    category: "TEAM_COACHING",
    directive: "Multiple deals at risk with active runners in the field. Campbell Rule #1: Take care of your people first. Before optimizing the pipeline, check on your team. Are runners supported? Are operators overwhelmed?",
    suggestedAction: "Direct 1-on-1 check-in with every active operator and runner today. Ask: 'What's blocking you? What do you need from me?' Fix their blockers before fixing the pipeline. A supported team fixes the pipeline faster than any automation.",
    reasoning: "Campbell: 'The top priority of any manager is the well-being and success of their people.' Deals fail because people fail. People fail because they feel unsupported. Fix the people, and the deals fix themselves.",
    confidence: 0.91,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Team blockers resolved, at-risk deals recovered through supported operators",
    kpiImpact: "Team Satisfaction → High, At-Risk Recovery +40%",
    delegateTo: "coo",
    priority: 89,
  },
  {
    id: "coach-trust-deficit",
    agentId: "trillion-coach",
    condition: (ctx) => ctx.churnRate > 4 && ctx.totalMembers > 30,
    category: "TRUST_BUILDING",
    directive: (ctx) => `Churn at ${ctx.churnRate}% with ${ctx.totalMembers} members. Trust is broken somewhere. Campbell: 'Build trust by listening, providing honest feedback, and demanding the best from your people.' Find the trust gap.`,
    suggestedAction: "Deploy a 3-question survey to churned members: (1) What did we promise that we didn't deliver? (2) When did you decide to leave? (3) What would bring you back? Then actually DO what they say. Trust is rebuilt through action, not promises.",
    reasoning: "Campbell: 'Your title makes you a manager. Your people make you a leader.' High churn means the network doesn't trust the platform to deliver value. No amount of features fixes a trust problem — only listening and acting does.",
    confidence: 0.92,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Identify top 3 trust gaps and deploy fixes within 14 days",
    kpiImpact: "Churn Rate -2%, Trust Score → Restored",
    delegateTo: "ceo",
    priority: 90,
  },
  {
    id: "coach-radical-candor",
    agentId: "trillion-coach",
    condition: (ctx) => ctx.staleDealCount > ctx.activeDeals * 0.4,
    category: "RADICAL_CANDOR",
    directive: (ctx) => `${Math.round(ctx.staleDealCount / Math.max(ctx.activeDeals, 1) * 100)}% of deals are stale. Campbell practiced radical candor — caring personally while challenging directly. Time for honest conversation: Why aren't deals closing?`,
    suggestedAction: "Hold a candid team review. No blame, no sugarcoating. Put every stale deal on screen. Ask for each one: 'What's the real reason this isn't closed?' If the answer is 'waiting on the customer' for more than 3 deals, the real answer is 'we stopped pushing.' Challenge the team to be honest, then solve together.",
    reasoning: "Campbell: 'When you have a difficult conversation, be honest but never cruel. Care personally and challenge directly.' Stale pipelines happen when teams avoid hard truths about deal quality. Radical candor surfaces the truth faster than any dashboard.",
    confidence: 0.89,
    urgency: "HIGH",
    timeWindowMinutes: 180,
    expectedOutcome: "Surface real blockers on all stale deals, clear 50% within 7 days",
    kpiImpact: "Pipeline Honesty → 100%, Stale Deals -50%",
    priority: 85,
  },
  {
    id: "coach-winning-together",
    agentId: "trillion-coach",
    condition: (ctx) => ctx.closedDealsToday >= 3 && ctx.revenueToday > 0,
    category: "TEAM_COACHING",
    directive: (ctx) => `${ctx.closedDealsToday} deals closed today — $${ctx.revenueToday.toLocaleString()} revenue. Campbell: 'Celebrate the wins together. The team that celebrates together, fights together.' Recognize the people who made this happen.`,
    suggestedAction: "Send a personal recognition message to every person who touched today's deals — operators, runners, referrers. Name specific contributions. Share the win in the team channel. Small celebrations compound into a culture of winning.",
    reasoning: "Campbell: 'Be generous with your praise, specific in your feedback.' Celebrating wins builds the emotional bank account that you withdraw from during hard times. Every recognition strengthens the team bond.",
    confidence: 0.85,
    urgency: "MEDIUM",
    timeWindowMinutes: 480,
    expectedOutcome: "Team morale boost, reinforced winning behaviors",
    kpiImpact: "Team Morale → Peak, Retention +5%",
    priority: 72,
  },

  // ─── SPRINT-1 — Brian Moran's The 12 Week Year ────────────────────────────
  {
    id: "sprint-weekly-execution-low",
    agentId: "twelve-week",
    condition: (ctx) => ctx.closedDealsToday === 0 && ctx.contentPostsThisWeek < 3 && ctx.newMembersToday === 0,
    category: "WEEKLY_ACCOUNTABILITY",
    directive: "Zero deals, under 3 posts, zero new members. Weekly execution score is FAILING. Moran: 'Execution is the single greatest market differentiator.' You are not executing.",
    suggestedAction: "Immediate execution audit: What were this week's 3 critical tasks? Which ones are complete? If the answer is none, you have an execution problem, not a strategy problem. Block the next 2 hours for your #1 revenue-generating activity. No email. No meetings. Pure execution.",
    reasoning: "Moran: 'Most people have the capacity to double or triple their income and their productivity. It's not about doing more things; it's about doing the right things.' A week with zero output across all KPIs means strategic activities are being displaced by reactive work.",
    confidence: 0.93,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Complete #1 critical task within 2 hours, restore daily execution rhythm",
    kpiImpact: "Weekly Execution Score → 85%+",
    priority: 91,
  },
  {
    id: "sprint-12-week-planning",
    agentId: "twelve-week",
    condition: (ctx) => ctx.distributionHubs < 20 && ctx.totalMembers > 10,
    category: "TWELVE_WEEK_SPRINT",
    directive: "Under 20 hubs — the 12-Week Year framework demands a clear sprint goal. Current Sprint Goal: 50 hubs in 12 weeks. That's 4.2 hubs per week. Are you on pace?",
    suggestedAction: "Set the 12-Week Goal: 50 Distribution Hubs. Break into weekly targets: Week 1-4: 3 hubs/week (foundation). Week 5-8: 4 hubs/week (acceleration). Week 9-12: 6 hubs/week (peak execution). Score yourself every Friday. If below 85% execution, diagnose immediately.",
    reasoning: "Moran: 'The 12 Week Year creates a sense of urgency by shortening the execution cycle. There's no more waiting until Q4 to catch up.' Treating 12 weeks as the full year eliminates the complacency that kills startups.",
    confidence: 0.90,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Structured 12-week plan with weekly milestones deployed",
    kpiImpact: "Hub Onboarding → 50 in 12 weeks",
    delegateTo: "business-dev",
    priority: 87,
  },
  {
    id: "sprint-leading-indicators",
    agentId: "twelve-week",
    condition: (ctx) => ctx.pendingDeals > 5 && ctx.closedDealsToday === 0,
    category: "EXECUTION_SCORING",
    directive: (ctx) => `${ctx.pendingDeals} pending deals, zero closes. Stop watching LAGGING indicators (revenue). Track LEADING indicators: calls made, proposals sent, follow-ups completed. Leading indicators predict revenue 2 weeks out.`,
    suggestedAction: "Define 3 leading indicators for this sprint: (1) Outreach touches per day (target: 20), (2) Proposals sent per week (target: 10), (3) Follow-up response rate (target: 30%). If leading indicators are green, closes WILL follow. If red, no amount of hoping will create revenue.",
    reasoning: "Moran: 'Leading indicators are the activities that drive results. Track them weekly, and the lagging indicators (revenue, deals closed) take care of themselves.' You can't manage outcomes — only activities.",
    confidence: 0.91,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Shift tracking to leading indicators, restore predictable close rate",
    kpiImpact: "Activity Compliance → 85%+, Predicted Closes +3/week",
    priority: 84,
  },
  {
    id: "sprint-time-blocking",
    agentId: "twelve-week",
    condition: (ctx) => ctx.avgDealCycleHours > 96,
    category: "TWELVE_WEEK_SPRINT",
    directive: (ctx) => `Deal cycle at ${ctx.avgDealCycleHours.toFixed(0)} hours — way above target. Moran: 'If it's not in your calendar, it's not real.' Are revenue-generating activities time-blocked, or are they getting displaced by meetings and admin?`,
    suggestedAction: "Implement 'Strategic Blocks' — 3-hour uninterruptible blocks dedicated solely to deal advancement. No email, no Slack, no meetings during these blocks. Monday and Thursday mornings are deal blocks. Tuesday and Friday afternoons are outreach blocks. Protect these blocks like your revenue depends on it — because it does.",
    reasoning: "Moran: 'Effective people don't work more hours. They work the right hours on the right things.' Long deal cycles almost always trace back to revenue-generating activities being fragmented by reactive interruptions.",
    confidence: 0.88,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Reduce deal cycle time by 30% within 2 weeks through time-blocking discipline",
    kpiImpact: "Deal Cycle Time -30%, Revenue Velocity +20%",
    delegateTo: "coo",
    priority: 83,
  },

  // ─── KATAMARI-1 — Katamari Damacy Compound Growth ─────────────────────────
  {
    id: "katamari-start-small",
    agentId: "katamari",
    condition: (ctx) => ctx.activeNodes < 10,
    category: "KATAMARI_ABSORPTION",
    directive: "Ball mass: under 10 nodes. Katamari Rule #1: Start with objects smaller than you. Don't chase dealership chains yet — absorb individual mechanics, detailers, tow drivers. Each one makes you bigger for the next tier.",
    suggestedAction: "Target 10 independent service providers this week — mobile mechanics, detailers, windshield repair, tow operators. These are the thumbtacks and paper clips of the auto industry. Absorb them first. They're easy to onboard, desperate for leads, and each one adds mass to your ball.",
    reasoning: "In Katamari Damacy, you fail when you try to absorb objects bigger than your current mass. A 5-node network trying to sign a 200-car dealership will fail. But a 5-node network signing 10 independent operators becomes a 15-node network — now you can roll over the small dealerships.",
    confidence: 0.94,
    urgency: "HIGH",
    timeWindowMinutes: 120,
    expectedOutcome: "Absorb 10 independent operators, reach 20-node mass",
    kpiImpact: "Network Mass → 20 nodes (Tier 1 → Tier 2)",
    delegateTo: "business-dev",
    priority: 90,
  },
  {
    id: "katamari-never-stop",
    agentId: "katamari",
    condition: (ctx) => ctx.newMembersToday === 0 && ctx.activeNodes > 5,
    category: "COMPOUND_GROWTH",
    directive: "The ball stopped rolling. Zero new absorptions today. Katamari Rule #2: NEVER STOP ROLLING. The moment you stop, you lose momentum and objects start falling off. Every day without growth is a day of shrinkage.",
    suggestedAction: "Absorb SOMETHING today — even if it's just one email subscriber, one waitlist signup, one QR code scan. The ball must move forward every single day. Set a minimum daily absorption target: 1 node activation. No exceptions. No days off. The Prince never stops rolling.",
    reasoning: "In Katamari, if you stop moving, you don't just stay the same size — objects actively fall off your ball. Networks work the same way: zero growth days are actually negative growth days because existing nodes lose confidence in the network's momentum.",
    confidence: 0.92,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Resume daily growth streak, absorb at least 1 node today",
    kpiImpact: "Growth Streak → Restored, Daily Minimum → 1 node",
    priority: 93,
  },
  {
    id: "katamari-tier-ready",
    agentId: "katamari",
    condition: (ctx) => ctx.activeNodes >= 50 && ctx.distributionHubs < 10,
    category: "MASS_ACCUMULATION",
    directive: (ctx) => `Ball mass: ${ctx.activeNodes} nodes but only ${ctx.distributionHubs} hubs. You're big enough to absorb LARGER objects now. Stop rolling over thumbtacks — go after the filing cabinets. Target multi-location businesses and small dealer groups.`,
    suggestedAction: "With 50+ nodes as proof of network value, pitch to small dealer groups (3-5 locations), regional repair chains, fleet management companies. Show them the network they'd be joining. Your mass IS the pitch now — '50 service providers already on the network, your customers are already here.'",
    reasoning: "In Katamari, there's a moment when your ball is suddenly big enough to absorb objects that were previously obstacles. 50 nodes is that moment for 3C ONYX. Small dealer groups that would have ignored a 10-node network will listen to a 50-node network because the value proposition is now proven.",
    confidence: 0.91,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Absorb 5 multi-location businesses, reach 10+ distribution hubs",
    kpiImpact: "Hub Count → 10+, Network Mass → Tier 3",
    delegateTo: "business-dev",
    priority: 88,
  },
  {
    id: "katamari-celestial-body",
    agentId: "katamari",
    condition: (ctx) => ctx.distributionHubs >= 100 && ctx.kFactor >= 1.5,
    category: "COMPOUND_GROWTH",
    directive: "100+ hubs, K-Factor 1.5+. CELESTIAL BODY PHASE. The ball is now absorbing entire market segments. You are no longer competing with tools — you are becoming the industry infrastructure. Roll over the OEMs. Roll over the lenders. Absorb everything.",
    suggestedAction: "Launch OEM partnership program — every manufacturer needs a network of this density. Approach Tier 1 lenders with network data proving reduced risk. Pitch state DMVs on digital title infrastructure. You're not asking for partnership anymore — you're offering them access to YOUR network.",
    reasoning: "In Katamari's final stage, the ball is so massive it absorbs houses, then cities, then continents, then stars. At 100+ hubs with viral growth, 3C ONYX has enough mass to absorb institutional players. The network IS the product. The bigger it gets, the more irresistible it becomes.",
    confidence: 0.89,
    urgency: "SOVEREIGN",
    timeWindowMinutes: 1440,
    expectedOutcome: "Initiate institutional-level partnerships, absorb OEM/Lender tier",
    kpiImpact: "Network Phase → Celestial, TAM → $1T+ addressable",
    delegateTo: "ceo",
    priority: 96,
  },

  // ─── GRAHAM-1 — Benjamin Graham's The Intelligent Investor ─────────────────
  {
    id: "graham-margin-of-safety",
    agentId: "intelligent-investor",
    condition: (ctx) => ctx.totalRevenue > 0 && ctx.errorRate > 2,
    category: "MARGIN_OF_SAFETY",
    directive: (ctx) => `Revenue flowing but error rate at ${ctx.errorRate.toFixed(1)}%. Graham Rule #1: MARGIN OF SAFETY. Never operate on the edge — always maintain a buffer between your capacity and your load. You are running without margin.`,
    suggestedAction: "Reduce operational load to 70% of capacity. Reserve 30% as margin of safety. This means: don't onboard more hubs than your support team can handle, don't promise delivery timelines without padding, don't spend revenue before it's confirmed. The margin of safety is what separates investors from speculators — and platforms that survive from those that collapse.",
    reasoning: "Graham: 'The function of the margin of safety is, in essence, that of rendering unnecessary an accurate estimate of the future.' You don't know what will break next. The margin of safety ensures you survive whatever does.",
    confidence: 0.94,
    urgency: "CRITICAL",
    timeWindowMinutes: 120,
    expectedOutcome: "Establish 30% operational margin across all systems",
    kpiImpact: "System Resilience → 30% margin, Error Rate → <1%",
    delegateTo: "cto",
    priority: 92,
  },
  {
    id: "graham-intrinsic-value",
    agentId: "intelligent-investor",
    condition: (ctx) => ctx.distributionHubs >= 10 && ctx.avgDealCycleHours > 72,
    category: "INTRINSIC_VALUE",
    directive: (ctx) => `${ctx.distributionHubs} hubs but deal cycles dragging at ${ctx.avgDealCycleHours.toFixed(0)} hours. Are you chasing SPECULATIVE hubs or INVESTMENT-GRADE hubs? Graham demands intrinsic value analysis on every node.`,
    suggestedAction: "Score every hub on intrinsic value: (1) Revenue potential — does this hub generate actual transaction volume? (2) Network contribution — does this hub bring other nodes into the network? (3) Retention probability — will this hub still be active in 6 months? Drop hubs scoring below 40%. Focus resources on investment-grade nodes that compound value.",
    reasoning: "Graham: 'An investment operation is one which, upon thorough analysis, promises safety of principal and an adequate return.' Apply this to every hub onboarding decision. A hub that looks good on paper but generates no transactions is a speculative position, not an investment.",
    confidence: 0.92,
    urgency: "HIGH",
    timeWindowMinutes: 240,
    expectedOutcome: "Classify all hubs as investment-grade or speculative, reallocate resources",
    kpiImpact: "Hub Quality Score → 70%+ investment-grade",
    delegateTo: "coo",
    priority: 88,
  },
  {
    id: "graham-mr-market",
    agentId: "intelligent-investor",
    condition: (ctx) => ctx.churnRate > 3 && ctx.newMembersToday > 3,
    category: "MR_MARKET_DISCIPLINE",
    directive: (ctx) => `High churn (${ctx.churnRate}%) alongside high signup (${ctx.newMembersToday} today). Mr. Market is manic — offering you new members with one hand and taking existing ones with the other. Do NOT be swayed by the signups. Fix the churn first.`,
    suggestedAction: "Graham's Mr. Market is irrational — he offers you deals that seem great one day and terrible the next. Right now, new signups feel like validation, but they're masking a retention crisis. Ignore Mr. Market's enthusiastic new-member offers. Focus entirely on why existing members are leaving. A leaky bucket doesn't need more water — it needs the holes patched.",
    reasoning: "Graham: 'Mr. Market is there to serve you, not to guide you. It is his pocketbook, not his wisdom, that you will find useful.' High signup + high churn means the market is showing you enthusiasm that isn't real. The intrinsic value of a member who stays is 10x a member who churns in 30 days.",
    confidence: 0.95,
    urgency: "CRITICAL",
    timeWindowMinutes: 60,
    expectedOutcome: "Reduce churn to <2% before celebrating new member growth",
    kpiImpact: "Churn → <2%, Net Retention → Positive",
    delegateTo: "ceo",
    priority: 94,
  },
  {
    id: "graham-defensive-positioning",
    agentId: "intelligent-investor",
    condition: (ctx) => ctx.totalRevenue === 0 && ctx.activeDeals > 15,
    category: "VALUE_INVESTING",
    directive: (ctx) => `Zero revenue with ${ctx.activeDeals} active deals. Graham's defensive investor rule: Never confuse activity with achievement. A pipeline full of deals that don't close is a speculative portfolio, not an investment portfolio.`,
    suggestedAction: "Apply Graham's defensive investor criteria to every deal: (1) Is there adequate size — is this deal worth the effort? (2) Is there a sufficiently strong financial condition — can this buyer actually pay? (3) Is there earnings stability — will this generate recurring revenue? (4) Is there a dividend record — has this customer type paid others before? Kill any deal that fails 2 or more criteria. Better to have 5 investment-grade deals than 15 speculative ones.",
    reasoning: "Graham: 'The defensive investor will place chief emphasis on the avoidance of serious mistakes or losses.' A pre-revenue platform with 15+ loose deals is speculating, not investing. Concentrate firepower on the 3-5 deals most likely to produce actual revenue, and kill the rest.",
    confidence: 0.93,
    urgency: "HIGH",
    timeWindowMinutes: 180,
    expectedOutcome: "Qualify pipeline to 5 investment-grade deals, close first revenue within 14 days",
    kpiImpact: "Pipeline Quality → Investment-Grade, First Revenue → 14 days",
    delegateTo: "cfo",
    priority: 90,
  },
];

class CSuiteAgentEngine {
  private profiles: Map<CSuiteAgentId, CSuiteAgentProfile> = new Map();
  private directiveHistory: Map<CSuiteAgentId, CSuiteDirective[]> = new Map();
  private totalDirectives = 0;
  private totalAccepted = 0;
  private startedAt = Date.now();

  constructor() {
    const agentIds: CSuiteAgentId[] = [
      "ceo", "cto", "cfo", "coo", "content-social", "business-dev", "legal-compliance",
      "blitzscale", "lean-startup", "greatest-salesman", "trillion-coach", "twelve-week", "katamari", "intelligent-investor",
    ];
    for (const id of agentIds) {
      const base = AGENT_PROFILES[id];
      this.profiles.set(id, {
        ...base,
        totalDirectivesIssued: 0,
        directivesAccepted: 0,
        directivesOverridden: 0,
        acceptanceRate: 100,
        confidenceCalibration: 1.0,
        lastActive: Date.now(),
        activeSince: Date.now(),
        maturity: "INITIALIZING",
      });
      this.directiveHistory.set(id, []);
    }
  }

  computeDirectives(agentId: CSuiteAgentId, platformContext: PlatformContext): CSuiteDirective[] {
    const agentRules = DIRECTIVE_RULES.filter(r => r.agentId === agentId);
    const matchingRules = agentRules
      .filter(r => r.condition(platformContext))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length === 0) return [];

    const profile = this.profiles.get(agentId);
    if (profile) {
      profile.lastActive = Date.now();
      this.updateMaturity(profile);
    }

    const directives: CSuiteDirective[] = matchingRules.map(rule => {
      const othersInCategory = matchingRules
        .filter(r => r.id !== rule.id)
        .slice(0, 3)
        .map(r => ({
          directive: typeof r.directive === "function" ? r.directive(platformContext) : r.directive,
          confidence: r.confidence,
          category: r.category,
        }));

      const directive: CSuiteDirective = {
        id: crypto.randomBytes(8).toString("hex"),
        agentId,
        category: rule.category,
        directive: typeof rule.directive === "function" ? rule.directive(platformContext) : rule.directive,
        reasoning: typeof rule.reasoning === "function" ? rule.reasoning(platformContext) : rule.reasoning,
        confidence: rule.confidence * (profile?.confidenceCalibration || 1.0),
        urgency: rule.urgency,
        suggestedAction: typeof rule.suggestedAction === "function" ? rule.suggestedAction(platformContext) : rule.suggestedAction,
        expectedOutcome: rule.expectedOutcome,
        timeWindowMinutes: rule.timeWindowMinutes,
        alternativeDirectives: othersInCategory,
        delegateTo: rule.delegateTo,
        kpiImpact: rule.kpiImpact,
        timestamp: Date.now(),
        expiresAt: Date.now() + rule.timeWindowMinutes * 60 * 1000,
        architectSeal: crypto.createHash("sha256")
          .update(`${ARCHITECT_SEAL}::${rule.id}::${agentId}::${Date.now()}`)
          .digest("hex")
          .substring(0, 16),
      };

      if (profile) {
        profile.totalDirectivesIssued++;
      }
      this.totalDirectives++;

      const history = this.directiveHistory.get(agentId) || [];
      history.push(directive);
      if (history.length > 100) history.splice(0, history.length - 100);
      this.directiveHistory.set(agentId, history);

      return directive;
    });

    eventBus.emit("agent.action", {
      type: "agent.action" as const,
      source: `c-suite-${agentId}`,
      payload: {
        event: "directives_computed",
        agentId,
        directiveCount: directives.length,
        topUrgency: directives[0]?.urgency,
      },
      ts: new Date().toISOString(),
    });

    logger.debug({
      agentId,
      directiveCount: directives.length,
      topPriority: directives[0]?.category,
    }, "[c-suite] Directives computed");

    return directives;
  }

  computeAllDirectives(platformContext: PlatformContext): {
    directives: CSuiteDirective[];
    byAgent: Record<CSuiteAgentId, CSuiteDirective[]>;
    summary: { sovereign: number; critical: number; high: number; medium: number; low: number };
    priorityOrder: string[];
  } {
    const allDirectives: CSuiteDirective[] = [];
    const byAgent: Record<string, CSuiteDirective[]> = {};

    const agentIds: CSuiteAgentId[] = [
      "ceo", "cto", "cfo", "coo", "content-social", "business-dev", "legal-compliance",
      "blitzscale", "lean-startup", "greatest-salesman", "trillion-coach", "twelve-week", "katamari", "intelligent-investor",
    ];
    for (const agentId of agentIds) {
      const directives = this.computeDirectives(agentId, platformContext);
      allDirectives.push(...directives);
      byAgent[agentId] = directives;
    }

    const urgencyOrder: Record<DirectiveUrgency, number> = { SOVEREIGN: 5, CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    allDirectives.sort((a, b) => {
      const diff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (diff !== 0) return diff;
      return b.confidence - a.confidence;
    });

    return {
      directives: allDirectives,
      byAgent: byAgent as Record<CSuiteAgentId, CSuiteDirective[]>,
      summary: {
        sovereign: allDirectives.filter(d => d.urgency === "SOVEREIGN").length,
        critical: allDirectives.filter(d => d.urgency === "CRITICAL").length,
        high: allDirectives.filter(d => d.urgency === "HIGH").length,
        medium: allDirectives.filter(d => d.urgency === "MEDIUM").length,
        low: allDirectives.filter(d => d.urgency === "LOW").length,
      },
      priorityOrder: allDirectives.map(d => d.id),
    };
  }

  recordDirectiveAccepted(directiveId: string, agentId: CSuiteAgentId): void {
    const profile = this.profiles.get(agentId);
    if (profile) {
      profile.directivesAccepted++;
      profile.acceptanceRate = profile.totalDirectivesIssued > 0
        ? Number((profile.directivesAccepted / profile.totalDirectivesIssued * 100).toFixed(1))
        : 100;
    }
    this.totalAccepted++;

    selfLearningEngine.recordSuggestionAccepted(agentId as any, 0.9);
  }

  recordDirectiveOverridden(directiveId: string, agentId: CSuiteAgentId, overrideReason: string): void {
    const profile = this.profiles.get(agentId);
    if (profile) {
      profile.directivesOverridden++;
      profile.acceptanceRate = profile.totalDirectivesIssued > 0
        ? Number((profile.directivesAccepted / profile.totalDirectivesIssued * 100).toFixed(1))
        : 100;

      if (profile.directivesOverridden > profile.totalDirectivesIssued * 0.3) {
        profile.confidenceCalibration = Math.min(1.2, profile.confidenceCalibration + 0.01);
      }
    }

    const directive = this.findDirective(directiveId);
    if (directive) {
      selfLearningEngine.recordCorrection({
        sessionId: `csuite-${agentId}-${Date.now()}`,
        agentId: agentId as any,
        aiSuggestion: directive.directive,
        aiConfidence: directive.confidence,
        humanAction: overrideReason,
        overrideReason,
        engagementState: "WARM" as any,
        objectionTypes: [],
        context: { directiveCategory: directive.category, kpiImpact: directive.kpiImpact },
      });
    }
  }

  getAgentProfile(agentId: CSuiteAgentId): CSuiteAgentProfile | undefined {
    return this.profiles.get(agentId);
  }

  getAgentDirectiveHistory(agentId: CSuiteAgentId): CSuiteDirective[] {
    return (this.directiveHistory.get(agentId) || []).slice(-30).reverse();
  }

  private findDirective(directiveId: string): CSuiteDirective | undefined {
    for (const directives of this.directiveHistory.values()) {
      const found = directives.find(d => d.id === directiveId);
      if (found) return found;
    }
    return undefined;
  }

  private updateMaturity(profile: CSuiteAgentProfile): void {
    const total = profile.totalDirectivesIssued;
    const prevMaturity = profile.maturity;

    if (total >= 5000) profile.maturity = "SOVEREIGN";
    else if (total >= 1000) profile.maturity = "AUTONOMOUS";
    else if (total >= 200) profile.maturity = "CALIBRATED";
    else if (total >= 50) profile.maturity = "LEARNING";
    else profile.maturity = "INITIALIZING";

    if (profile.maturity !== prevMaturity) {
      logger.info({
        agentId: profile.id,
        from: prevMaturity,
        to: profile.maturity,
        totalDirectives: total,
      }, "[c-suite] Agent maturity level advanced");
    }
  }

  getDashboard(): {
    architect: string;
    entity: string;
    protocol: string;
    version: string;
    status: string;
    uptime: number;
    totalDirectivesIssued: number;
    totalDirectivesAccepted: number;
    overallAcceptanceRate: number;
    activeRules: number;
    agents: Array<{
      id: CSuiteAgentId;
      title: string;
      name: string;
      domain: string;
      maturity: AgentMaturityState;
      color: string;
      totalDirectives: number;
      accepted: number;
      overridden: number;
      acceptanceRate: number;
      confidenceCalibration: number;
      kpis: string[];
      responsibilities: string[];
      lastActive: number;
      recentDirectives: Array<{ id: string; category: string; urgency: string; confidence: number; directive: string; timestamp: number }>;
    }>;
    urgencyDistribution: Record<DirectiveUrgency, number>;
    categoryBreakdown: Record<string, number>;
  } {
    const agents = Array.from(this.profiles.values()).map(p => {
      const history = this.directiveHistory.get(p.id) || [];
      const recent = history.slice(-10).reverse();

      return {
        id: p.id,
        title: p.title,
        name: p.name,
        domain: p.domain,
        maturity: p.maturity,
        color: p.color,
        totalDirectives: p.totalDirectivesIssued,
        accepted: p.directivesAccepted,
        overridden: p.directivesOverridden,
        acceptanceRate: p.acceptanceRate,
        confidenceCalibration: Number(p.confidenceCalibration.toFixed(3)),
        kpis: p.kpis,
        responsibilities: p.responsibilities,
        lastActive: p.lastActive,
        recentDirectives: recent.map(d => ({
          id: d.id,
          category: d.category,
          urgency: d.urgency,
          confidence: Number(d.confidence.toFixed(2)),
          directive: d.directive,
          timestamp: d.timestamp,
        })),
      };
    });

    const allHistory: CSuiteDirective[] = [];
    for (const h of this.directiveHistory.values()) allHistory.push(...h);

    const urgencyDist: Record<DirectiveUrgency, number> = { SOVEREIGN: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const categoryBreakdown: Record<string, number> = {};
    for (const d of allHistory) {
      urgencyDist[d.urgency]++;
      categoryBreakdown[d.category] = (categoryBreakdown[d.category] || 0) + 1;
    }

    return {
      architect: "Ronald Antonio Cadet",
      entity: "CUXTOMCANDYCLUB LLC",
      protocol: "C-Suite AI Agent Engine",
      version: "1.0.0",
      status: "ARMED",
      uptime: Date.now() - this.startedAt,
      totalDirectivesIssued: this.totalDirectives,
      totalDirectivesAccepted: this.totalAccepted,
      overallAcceptanceRate: this.totalDirectives > 0
        ? Number((this.totalAccepted / this.totalDirectives * 100).toFixed(1))
        : 100,
      activeRules: DIRECTIVE_RULES.length,
      agents,
      urgencyDistribution: urgencyDist,
      categoryBreakdown,
    };
  }

  private autonomousInterval: ReturnType<typeof setInterval> | null = null;

  startAutonomousLoop(contextProvider: () => PlatformContext | null, intervalMs = 60_000): void {
    if (this.autonomousInterval) return;

    this.autonomousInterval = setInterval(() => {
      try {
        const ctx = contextProvider();
        if (!ctx) return;

        const result = this.computeAllDirectives(ctx);
        if (result.directives.length > 0) {
          logger.info({
            directiveCount: result.directives.length,
            sovereign: result.summary.sovereign,
            critical: result.summary.critical,
            high: result.summary.high,
          }, "[c-suite] Autonomous directive cycle completed");
        }
      } catch (err) {
        logger.warn({ err: (err as Error).message }, "[c-suite] Autonomous cycle error");
      }
    }, intervalMs);

    logger.info({ intervalMs }, "[c-suite] Autonomous compute loop started");
  }

  buildLiveContext(): PlatformContext {
    return {
      totalDeals: 0,
      activeDeals: 0,
      closedDealsToday: 0,
      totalRevenue: 0,
      revenueToday: 0,
      commissionEarned: 0,
      totalMembers: 0,
      newMembersToday: 0,
      activeNodes: 0,
      distributionHubs: 0,
      avgDealCycleHours: 48,
      platformUptime: 99.9,
      errorRate: 0.5,
      apiLatencyP95: 200,
      pendingDeals: 0,
      staleDealCount: 0,
      atRiskDealCount: 0,
      runnerMissionsActive: 0,
      contentPostsThisWeek: 0,
      socialEngagementRate: 0,
      partnerApplicationsPending: 0,
      complianceScore: 90,
      openLegalItems: 0,
      cashOnHand: 0,
      monthlyBurnRate: 0,
      runwayMonths: 12,
      kFactor: 1.0,
      churnRate: 0,
      npsScore: 0,
    };
  }

  genesis(): void {
    const agentCount = this.profiles.size;
    const ruleCount = DIRECTIVE_RULES.length;
    const categories = [...new Set(DIRECTIVE_RULES.map(r => r.category))];
    const cSuiteCount = 7;
    const doctrineCount = agentCount - cSuiteCount;
    console.log(`[C-SUITE + DOCTRINE ENGINE] 👔 ${agentCount} agents (${cSuiteCount} C-Suite + ${doctrineCount} Book Doctrine), ${ruleCount} directive rules, ${categories.length} categories — Autonomous Executive + Doctrine Intelligence ARMED — Architect: Ronald Antonio Cadet`);

    this.startAutonomousLoop(() => {
      try {
        return this.buildLiveContext();
      } catch {
        return null;
      }
    }, 120_000);
  }
}

export const cSuiteEngine = new CSuiteAgentEngine();
