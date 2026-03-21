import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const INSUREMO_API_KEY = process.env.INSUREMO_API_KEY;
const INSUREMO_BASE = "https://api.insuremo.com/v1";

function isLive() {
  return !!INSUREMO_API_KEY;
}

type QuoteResult = {
  provider: string;
  plan: string;
  monthly_premium: number;
  annual_premium: number;
  coverage_limit: number;
  deductible: number;
  rating: number;
  features: string[];
  recommended: boolean;
};

function generateQuotes(vin: string, year: number, make: string, model: string): QuoteResult[] {
  const baseMultiplier = year > 2021 ? 1.2 : 1.0;
  const luxuryMultiplier = ["Porsche", "Ferrari", "Lamborghini", "Rolls-Royce", "Bentley", "McLaren"].includes(make) ? 1.8 : 1.0;
  const base = 180 * baseMultiplier * luxuryMultiplier;

  return [
    {
      provider: "Hagerty Collector",
      plan: "Agreed Value Platinum",
      monthly_premium: Math.round(base * 1.4 * 100) / 100,
      annual_premium: Math.round(base * 1.4 * 12 * 100) / 100,
      coverage_limit: 500_000,
      deductible: 0,
      rating: 4.9,
      features: ["Agreed Value", "Spare Parts Coverage", "Track Day Coverage", "Roadside Concierge", "Auto Show Coverage"],
      recommended: true,
    },
    {
      provider: "Chubb Masterpiece",
      plan: "High-Net-Worth Auto",
      monthly_premium: Math.round(base * 1.15 * 100) / 100,
      annual_premium: Math.round(base * 1.15 * 12 * 100) / 100,
      coverage_limit: 350_000,
      deductible: 500,
      rating: 4.7,
      features: ["Stated Value", "Rental Reimbursement $400/day", "Gap Coverage", "New Car Replacement"],
      recommended: false,
    },
    {
      provider: "Markel Specialty",
      plan: "Collector Elite",
      monthly_premium: Math.round(base * 0.9 * 100) / 100,
      annual_premium: Math.round(base * 0.9 * 12 * 100) / 100,
      coverage_limit: 250_000,
      deductible: 1_000,
      rating: 4.4,
      features: ["Stated Value", "Diminishing Deductible", "Towing & Labor"],
      recommended: false,
    },
    {
      provider: "Grundy Classic",
      plan: "Agreed Value Standard",
      monthly_premium: Math.round(base * 0.75 * 100) / 100,
      annual_premium: Math.round(base * 0.75 * 12 * 100) / 100,
      coverage_limit: 200_000,
      deductible: 1_500,
      rating: 4.2,
      features: ["Agreed Value", "Flexible Usage", "Roadside Assistance"],
      recommended: false,
    },
  ];
}

// GET /api/insuremo/quote?vin=&year=&make=&model=
router.get("/insuremo/quote", async (req: Request, res: Response) => {
  const { vin, year, make, model } = req.query as Record<string, string>;
  if (!vin) { res.status(400).json({ error: "vin is required" }); return; }

  if (isLive()) {
    try {
      const resp = await fetch(`${INSUREMO_BASE}/quote?vin=${vin}`, {
        headers: { Authorization: `Bearer ${INSUREMO_API_KEY}` },
      });
      const data = await resp.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("Insuremo error:", err);
    }
  }

  const quotes = generateQuotes(vin, parseInt(year || "2022"), make || "Luxury", model || "Vehicle");
  res.json({
    vin,
    year: year || "2022",
    make: make || "Luxury",
    model: model || "Vehicle",
    quotes,
    retrieved_at: new Date().toISOString(),
    simulated: !isLive(),
  });
});

// GET /api/insuremo/policies
router.get("/insuremo/policies", async (_req: Request, res: Response) => {
  res.json({
    policies: [
      {
        id: "pol-001",
        provider: "Hagerty Collector",
        plan: "Agreed Value Platinum",
        vin_masked: "•••••••••••4821",
        vehicle: "2023 Porsche Cayenne Turbo S",
        status: "Active",
        monthly_premium: 504.0,
        coverage_limit: 500_000,
        expires_at: "2027-03-21",
        next_payment: "2026-04-01",
      },
      {
        id: "pol-002",
        provider: "Chubb Masterpiece",
        plan: "High-Net-Worth Auto",
        vin_masked: "•••••••••••1842",
        vehicle: "2023 Tesla Model S Plaid",
        status: "Active",
        monthly_premium: 310.5,
        coverage_limit: 350_000,
        expires_at: "2027-01-15",
        next_payment: "2026-04-01",
      },
    ],
    total_monthly: 814.5,
    simulated: !isLive(),
  });
});

export default router;
