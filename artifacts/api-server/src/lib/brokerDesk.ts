/**
 * 3C ONYX — Broker AI Deal Desk (Autonomous Clearinghouse)
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECT: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 * TRADE SECRET: TS-06 — Automated Deal Structure Engine
 * PATENT CANDIDATE: PAT-04 (extends Cross-Departmental Data Synthesis)
 *
 * "Replaces manual broker texting with instant Lease/Finance/Cash comparisons."
 *
 * This engine does what a finance desk does manually in 45 minutes — in
 * milliseconds. It calculates Invoice, Holdback, and all OEM Incentives,
 * then outputs three fully-structured payment options side by side. The
 * platform eliminates the "broker texting" problem permanently.
 *
 * Inputs:  VIN, MSRP, selling price, trade-in, down payment, term, credit tier
 * Outputs: Cash deal, Finance deal (60/72 mo), Lease deal — all with F&I
 *
 * F&I Products auto-bundled per the 3C Union standard:
 *   Simoniz PPF   $499   (Paint Protection — PAT-01 node: Simoniz USA)
 *   Sonsio T&W    $299   (Tire & Wheel — PAT-01 node: Sonsio)
 *   Powertrain    $1,295 (Extended Warranty — Guardian Agent)
 *
 * Dynasty Tech Fee: 3% of deal amount credited to the mesh.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Credit Tier → Finance APR Map ──────────────────────────────────────────
// Industry-standard tier brackets (Stellantis Financial / Ally / Chase Auto)
const FINANCE_APR: Record<string, number> = {
  Tier1: 5.9,   // 720+  FICO — prime
  Tier2: 7.9,   // 680–719 — near-prime
  Tier3: 10.9,  // 640–679 — subprime
  Tier4: 14.9,  // 580–639 — deep subprime
};

// Money factor = APR / 2400 (industry standard conversion)
const LEASE_MONEY_FACTOR: Record<string, number> = {
  Tier1: 0.00246,  // 5.9% ÷ 2400
  Tier2: 0.00329,  // 7.9% ÷ 2400
  Tier3: 0.00454,  // 10.9% ÷ 2400
  Tier4: 0.00621,  // 14.9% ÷ 2400
};

// Residual value by term (% of MSRP) — conservative avg across segments
const LEASE_RESIDUAL: Record<number, number> = {
  24: 0.56,
  36: 0.50,
  39: 0.47,
  48: 0.43,
};

// ─── F&I Product Registry ────────────────────────────────────────────────────
export const FI_PRODUCTS = {
  simonizPPF:  { name: "Simoniz Paint Protection Film",   node: "Simoniz USA",    priceUsd: 499,   term: "Lifetime", contractType: "PaintProtection" },
  sonsioTW:    { name: "Sonsio Tire & Wheel Protection",  node: "Sonsio",         priceUsd: 299,   term: "3yr/45K",  contractType: "TireWheel"       },
  powertrain:  { name: "3C Powertrain Warranty",          node: "Guardian Agent", priceUsd: 1295,  term: "5yr/60K",  contractType: "Warranty"        },
} as const;

// ─── Holdback & Incentive Engine ─────────────────────────────────────────────
// Holdback is 3% of MSRP (industry standard, varies 2–3% by OEM)
// Incentives are pulled from OEM feed (or provided by caller)

export interface DealInputs {
  vin:             string;
  vehicleLabel:    string;
  msrp:            number;
  sellingPrice:    number;
  tradeInValue?:   number;
  downPayment?:    number;
  oemIncentives?:  number;  // cash-back or rate subsidy from OEM
  creditTier?:     "Tier1" | "Tier2" | "Tier3" | "Tier4";
  financeTerm?:    60 | 72;
  leaseTerm?:      24 | 36 | 39 | 48;
  includeFiProducts?: boolean;
  lenderName?:     string;
  buyerName?:      string;
}

export interface PriceBreakdown {
  msrp:             number;
  invoice:          number;  // MSRP × 0.97 (holdback removed)
  holdback:         number;  // MSRP × 0.03
  oemIncentives:    number;
  dealerCost:       number;  // invoice - incentives
  sellingPrice:     number;
  tradeInValue:     number;
  downPayment:      number;
  isBelowInvoice:   boolean;
  savingsVsInvoice: number;  // sellingPrice vs invoice (+ if below, - if above)
  savingsVsMsrp:    number;
}

export interface CashDeal {
  type:           "Cash";
  netPrice:       number;  // sellingPrice - tradeIn - downPayment
  fiProducts:     number;  // F&I add-ons total
  totalOop:       number;  // out-of-pocket
  dynastyFeeUsd:  number;
  recommendation: string;
}

export interface FinanceDeal {
  type:             "Finance";
  term:             number;
  apr:              number;
  creditTier:       string;
  amountFinanced:   number;
  monthlyPayment:   number;
  totalInterest:    number;
  totalCost:        number;
  fiProducts:       number;
  monthlyWithFi:    number;
  dynastyFeeUsd:    number;
  recommendation:   string;
}

export interface LeaseDeal {
  type:             "Lease";
  term:             number;
  moneyFactor:      number;
  aprEquivalent:    number;
  residualValue:    number;
  residualPct:      number;
  capCost:          number;   // selling price + fees - down - trade
  monthlyPayment:   number;   // depreciation + finance charge
  fiProducts:       number;
  monthlyWithFi:    number;
  dispositionFee:   number;
  acquisitionFee:   number;
  totalLeaseCost:   number;
  dynastyFeeUsd:    number;
  recommendation:   string;
}

export interface FiBundle {
  simoniz:   typeof FI_PRODUCTS.simonizPPF & { priceUsd: number };
  sonsio:    typeof FI_PRODUCTS.sonsioTW   & { priceUsd: number };
  warranty:  typeof FI_PRODUCTS.powertrain & { priceUsd: number };
  totalUsd:  number;
  note:      string;
}

export interface DealStructure {
  dealId:       string;
  vin:          string;
  vehicleLabel: string;
  generatedAt:  string;
  pricing:      PriceBreakdown;
  fiBundle:     FiBundle;
  cash:         CashDeal;
  finance:      FinanceDeal;
  lease:        LeaseDeal;
  recommendation: {
    bestOption:   "Cash" | "Finance" | "Lease";
    rationale:    string;
    dealAlert:    string | null;
  };
  lenderName:   string;
  buyerName:    string | null;
  nextSteps: {
    action:   string;
    endpoint: string;
    note:     string;
  }[];
  architect:  string;
  tradeSecret: string;
}

// ─── Monthly Payment Formula ──────────────────────────────────────────────────
// Standard amortization: M = P × [r(1+r)^n] / [(1+r)^n - 1]
function monthlyFinancePayment(principal: number, aprPct: number, termMonths: number): number {
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / termMonths;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

// Lease payment: (capCost - residual)/term + (capCost + residual) × moneyFactor
function monthlyLeasePayment(capCost: number, residual: number, moneyFactor: number, termMonths: number): number {
  const depreciation   = (capCost - residual) / termMonths;
  const financeCharge  = (capCost + residual) * moneyFactor;
  return depreciation + financeCharge;
}

// ─── Deal ID Generator ────────────────────────────────────────────────────────
import crypto from "crypto";
function dealId(): string {
  return `DEAL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

// ─── Core Deal Structurer ─────────────────────────────────────────────────────
export function structureDeal(inputs: DealInputs): DealStructure {
  const {
    vin,
    vehicleLabel,
    msrp,
    sellingPrice,
    tradeInValue    = 0,
    downPayment     = 0,
    oemIncentives   = 0,      // caller should use /api/oem-incentives/match to get real value
    creditTier      = "Tier2",
    financeTerm     = 72,
    leaseTerm       = 36,
    includeFiProducts = true,
    lenderName      = "Stellantis Financial",
    buyerName       = null,
  } = inputs;

  // ── Pricing math ──────────────────────────────────────────────────────────
  const holdback          = Math.round(msrp * 0.03);
  const invoice           = msrp - holdback;
  const dealerCost        = invoice - oemIncentives;
  const isBelowInvoice    = sellingPrice < invoice;
  const savingsVsInvoice  = invoice - sellingPrice;  // + = below, - = above
  const savingsVsMsrp     = msrp - sellingPrice;

  const pricing: PriceBreakdown = {
    msrp, invoice, holdback, oemIncentives, dealerCost,
    sellingPrice, tradeInValue, downPayment,
    isBelowInvoice, savingsVsInvoice, savingsVsMsrp,
  };

  // ── F&I bundle ────────────────────────────────────────────────────────────
  const fiTotal = includeFiProducts
    ? FI_PRODUCTS.simonizPPF.priceUsd + FI_PRODUCTS.sonsioTW.priceUsd + FI_PRODUCTS.powertrain.priceUsd
    : 0;

  const fiBundle: FiBundle = {
    simoniz:  { ...FI_PRODUCTS.simonizPPF },
    sonsio:   { ...FI_PRODUCTS.sonsioTW   },
    warranty: { ...FI_PRODUCTS.powertrain },
    totalUsd: fiTotal,
    note:     "All F&I products are pre-negotiated by the 3C Union — no dealership markup. Simoniz and Sonsio are verified node partners.",
  };

  // ── Dynasty Tech Fee (3% of deal) ─────────────────────────────────────────
  const dynastyFeeUsd = parseFloat((sellingPrice * 0.03).toFixed(2));

  // ── Cash deal ─────────────────────────────────────────────────────────────
  const netPrice = sellingPrice - tradeInValue - downPayment;
  const cashDeal: CashDeal = {
    type:           "Cash",
    netPrice:       Math.max(0, netPrice),
    fiProducts:     fiTotal,
    totalOop:       Math.max(0, netPrice) + fiTotal,
    dynastyFeeUsd,
    recommendation: isBelowInvoice
      ? `Below-invoice cash deal. Dealer is $${Math.abs(savingsVsInvoice).toLocaleString()} below invoice — strong position. Recommend closing immediately.`
      : `Cash deal is $${Math.abs(savingsVsInvoice).toLocaleString()} above invoice. Negotiate $${Math.round(Math.abs(savingsVsInvoice) / 2).toLocaleString()} reduction before signing.`,
  };

  // ── Finance deal ──────────────────────────────────────────────────────────
  const apr             = FINANCE_APR[creditTier] ?? 7.9;
  const amountFinanced  = Math.max(0, sellingPrice - downPayment - tradeInValue);
  const monthlyPayment  = monthlyFinancePayment(amountFinanced, apr, financeTerm);
  const totalCostFin    = monthlyPayment * financeTerm + downPayment;
  const totalInterest   = totalCostFin - sellingPrice;
  const fiMonthly       = fiTotal / financeTerm;

  const financeDeal: FinanceDeal = {
    type:           "Finance",
    term:           financeTerm,
    apr,
    creditTier,
    amountFinanced: parseFloat(amountFinanced.toFixed(2)),
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    totalInterest:  parseFloat(Math.max(0, totalInterest).toFixed(2)),
    totalCost:      parseFloat(totalCostFin.toFixed(2)),
    fiProducts:     fiTotal,
    monthlyWithFi:  parseFloat((monthlyPayment + fiMonthly).toFixed(2)),
    dynastyFeeUsd,
    recommendation: `${financeTerm}-month finance at ${apr}% APR (${creditTier}). Monthly: $${monthlyPayment.toFixed(0)}/mo. ${isBelowInvoice ? "Below-invoice price locks in maximum value." : "Consider negotiating selling price to reduce interest over term."}`,
  };

  // ── Lease deal ────────────────────────────────────────────────────────────
  const moneyFactor   = LEASE_MONEY_FACTOR[creditTier] ?? 0.00329;
  const residualPct   = LEASE_RESIDUAL[leaseTerm]      ?? 0.50;
  const residualValue = msrp * residualPct;
  const acquisitionFee  = 895;   // standard bank acquisition fee
  const dispositionFee  = 395;   // end-of-lease
  const capCost       = sellingPrice + acquisitionFee - downPayment - tradeInValue;
  const leaseMonthly  = monthlyLeasePayment(capCost, residualValue, moneyFactor, leaseTerm);
  const aprEquivalent = moneyFactor * 2400;
  const leaseMonthlyFi = leaseMonthly + (fiTotal / leaseTerm);
  const totalLeaseCost = leaseMonthly * leaseTerm + downPayment + acquisitionFee + dispositionFee;

  const leaseDeal: LeaseDeal = {
    type:           "Lease",
    term:           leaseTerm,
    moneyFactor:    parseFloat(moneyFactor.toFixed(5)),
    aprEquivalent:  parseFloat(aprEquivalent.toFixed(1)),
    residualValue:  parseFloat(residualValue.toFixed(2)),
    residualPct:    residualPct * 100,
    capCost:        parseFloat(capCost.toFixed(2)),
    monthlyPayment: parseFloat(leaseMonthly.toFixed(2)),
    fiProducts:     fiTotal,
    monthlyWithFi:  parseFloat(leaseMonthlyFi.toFixed(2)),
    dispositionFee,
    acquisitionFee,
    totalLeaseCost: parseFloat(totalLeaseCost.toFixed(2)),
    dynastyFeeUsd,
    recommendation: `${leaseTerm}-mo lease — $${leaseMonthly.toFixed(0)}/mo. Residual ${(residualPct * 100).toFixed(0)}% of MSRP ($${residualValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}). Walk away at lease end or purchase at residual.`,
  };

  // ── Best option logic ─────────────────────────────────────────────────────
  const dealAlert = isBelowInvoice
    ? `BELOW INVOICE ALERT — Selling at $${Math.abs(savingsVsInvoice).toLocaleString()} under invoice. Lock this deal now.`
    : savingsVsInvoice < -2000
    ? `OVERPRICED — $${Math.abs(savingsVsInvoice).toLocaleString()} over invoice. Platform recommends counter-offer.`
    : null;

  const bestOption: "Cash" | "Finance" | "Lease" =
    netPrice < 20000 ? "Cash"
    : leaseTerm <= 36 && leaseMonthly < monthlyPayment ? "Lease"
    : "Finance";

  const rationale =
    bestOption === "Cash"
      ? "Low net price favors cash — zero interest, strongest negotiating position."
      : bestOption === "Lease"
      ? `Lease delivers the lowest monthly ($${leaseMonthly.toFixed(0)}/mo) vs finance ($${monthlyPayment.toFixed(0)}/mo). Optimal for buyers who upgrade every 3 years.`
      : `Finance at ${apr}% for ${financeTerm} months balances monthly cost and total ownership. Recommended for buyers planning to keep 5+ years.`;

  return {
    dealId:       dealId(),
    vin,
    vehicleLabel,
    generatedAt:  new Date().toISOString(),
    pricing,
    fiBundle,
    cash:         cashDeal,
    finance:      financeDeal,
    lease:        leaseDeal,
    recommendation: { bestOption, rationale, dealAlert },
    lenderName,
    buyerName,
    nextSteps: [
      {
        action:   "Create Bank-Ready Bundle",
        endpoint: "POST /api/lifecycle/vault/bundle",
        note:     "Auto-packages Buyer's Order + Warranty + Simoniz + Sonsio into a SHA-256 sealed vault.",
      },
      {
        action:   "Run Bird-Dog Referral",
        endpoint: "POST /api/lifecycle/referral",
        note:     "Log the referring node and start the 3% commission clock the moment the deal is structured.",
      },
      {
        action:   "Submit Transport Quote (if out-of-state)",
        endpoint: "POST /api/transport/quote",
        note:     "If buyer is out of state, initiate the Transporter Agent quote in parallel.",
      },
    ],
    architect:   "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    tradeSecret: "TS-06: Automated Deal Structure Engine",
  };
}
