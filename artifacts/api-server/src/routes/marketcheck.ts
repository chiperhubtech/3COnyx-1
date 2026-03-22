import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const MARKETCHECK_BASE = "https://mc-api.marketcheck.com/v2";

// ─── deterministic seed from VIN ─────────────────────────────────────────────
function vinSeed(vin: string): number {
  let h = 0;
  for (let i = 0; i < vin.length; i++) {
    h = (Math.imul(31, h) + vin.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deterministicFloat(vin: string, salt: number, min: number, max: number): number {
  const seed = (vinSeed(vin) ^ (salt * 2654435761)) >>> 0;
  return min + (seed % 10000) / 10000 * (max - min);
}

// ─── Guardian Health Score ────────────────────────────────────────────────────
// Factors: mileage, age, dom, base VIN hash
function computeGuardianScore(listing: BaseListing): number {
  const currentYear = 2026;
  const age = currentYear - listing.year;

  // Mileage factor: 0-15k = 0 penalty, 15-30k = -5, 30k+ = -12
  const milePenalty = listing.miles < 15000 ? 0 : listing.miles < 30000 ? 5 : 12;

  // Age factor: each year over 2 costs 2 pts
  const agePenalty = Math.max(0, (age - 2) * 2);

  // DOM factor: quick-selling cars score higher
  const domBonus = listing.dom != null && listing.dom <= 5 ? 3 : 0;

  // Base from VIN hash (75-94)
  const base = Math.round(deterministicFloat(listing.vin, 99, 75, 94));

  return Math.min(99, Math.max(55, base - milePenalty - agePenalty + domBonus));
}

// ─── Market Average (simulated regional retail) ───────────────────────────────
// Market avg is always HIGHER than listed price — this creates wholesale potential
function computeMarketAvg(listing: BaseListing): number {
  const multiplier = deterministicFloat(listing.vin, 7, 1.07, 1.19);
  return Math.round(listing.price * multiplier / 100) * 100;
}

// ─── 3C Club Price ────────────────────────────────────────────────────────────
// Dealer discount: 3% (negotiated bulk wholesale rate)
// 3C Platform fee: 1.2% (concierge + delivery coordination)
// Net: price × (1 − 0.03 + 0.012) = price × 0.982
const DEALER_DISCOUNT_RATE = 0.030;
const PLATFORM_FEE_RATE    = 0.012;

function computeClubPrice(price: number): {
  dealerDiscount: number;
  platformFee: number;
  clubPrice: number;
} {
  const dealerDiscount = Math.round(price * DEALER_DISCOUNT_RATE);
  const platformFee    = Math.round(price * PLATFORM_FEE_RATE);
  const clubPrice      = price - dealerDiscount + platformFee;
  return { dealerDiscount, platformFee, clubPrice };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface BaseListing {
  id: string;
  heading: string;
  price: number;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  exterior_color?: string;
  interior_color?: string;
  fuel_type?: string;
  city?: string;
  state?: string;
  dom?: number;
  vin: string;
  media?: { photo_links?: string[] };
  seller?: { name?: string };
}

export interface EnrichedListing extends BaseListing {
  market_avg: number;
  guardian_health_score: number;
  dealer_discount: number;
  platform_fee: number;
  club_price: number;
  savings_vs_retail: number;
  wholesale_potential: boolean;
}

function enrichListing(l: BaseListing): EnrichedListing {
  const market_avg            = computeMarketAvg(l);
  const guardian_health_score = computeGuardianScore(l);
  const { dealerDiscount, platformFee, clubPrice } = computeClubPrice(l.price);
  const savings_vs_retail     = market_avg - clubPrice;
  const wholesale_potential   = l.price < market_avg;

  return {
    ...l,
    market_avg,
    guardian_health_score,
    dealer_discount: dealerDiscount,
    platform_fee:    platformFee,
    club_price:      clubPrice,
    savings_vs_retail,
    wholesale_potential,
  };
}

// ─── Mock listings ────────────────────────────────────────────────────────────
const MOCK_LISTINGS: BaseListing[] = [
  {
    id: "mc-001",
    heading: "2022 Porsche 911 Carrera S Cabriolet",
    price: 142900,
    miles: 8412,
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera S Cabriolet",
    exterior_color: "GT Silver Metallic",
    interior_color: "Black",
    fuel_type: "Gasoline",
    city: "Beverly Hills",
    state: "CA",
    dom: 4,
    vin: "WP0CB2A91NS225481",
    media: { photo_links: ["https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80"] },
    seller: { name: "Porsche Beverly Hills" },
  },
  {
    id: "mc-002",
    heading: "2023 Mercedes-Benz AMG GT 63 S 4-Door",
    price: 198500,
    miles: 3201,
    year: 2023,
    make: "Mercedes-Benz",
    model: "AMG GT 63 S",
    trim: "4-Door Coupe",
    exterior_color: "Obsidian Black",
    interior_color: "Nappa Leather Macchiato Beige",
    fuel_type: "Gasoline",
    city: "Miami",
    state: "FL",
    dom: 2,
    vin: "W1K7X6BB1PA012934",
    media: { photo_links: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"] },
    seller: { name: "Mercedes-Benz of Miami" },
  },
  {
    id: "mc-003",
    heading: "2021 Lamborghini Huracán EVO Spyder",
    price: 289000,
    miles: 5890,
    year: 2021,
    make: "Lamborghini",
    model: "Huracán",
    trim: "EVO Spyder",
    exterior_color: "Giallo Inti",
    interior_color: "Nero Ade",
    fuel_type: "Gasoline",
    city: "Scottsdale",
    state: "AZ",
    dom: 7,
    vin: "ZHWUC4ZF7MLA13902",
    media: { photo_links: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80"] },
    seller: { name: "Lamborghini Scottsdale" },
  },
  {
    id: "mc-004",
    heading: "2023 Bentley Bentayga EWB Azure",
    price: 249900,
    miles: 1240,
    year: 2023,
    make: "Bentley",
    model: "Bentayga",
    trim: "EWB Azure",
    exterior_color: "Midnight Emerald",
    interior_color: "Linen/Imperial Blue",
    fuel_type: "Gasoline",
    city: "New York",
    state: "NY",
    dom: 1,
    vin: "SCBCU9ZX8PC090123",
    media: { photo_links: ["https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80"] },
    seller: { name: "Bentley Manhattan" },
  },
  {
    id: "mc-005",
    heading: "2022 Ferrari Roma Coupe",
    price: 319000,
    miles: 2100,
    year: 2022,
    make: "Ferrari",
    model: "Roma",
    trim: "Coupe",
    exterior_color: "Grigio Ingrid",
    interior_color: "Cuoio",
    fuel_type: "Gasoline",
    city: "Greenwich",
    state: "CT",
    dom: 3,
    vin: "ZFF97XJA8N0267841",
    media: { photo_links: ["https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&q=80"] },
    seller: { name: "Ferrari of New England" },
  },
  {
    id: "mc-006",
    heading: "2023 Rolls-Royce Ghost Extended",
    price: 489000,
    miles: 720,
    year: 2023,
    make: "Rolls-Royce",
    model: "Ghost",
    trim: "Extended",
    exterior_color: "Black Diamond",
    interior_color: "Seashell/Dark Spice",
    fuel_type: "Gasoline",
    city: "Houston",
    state: "TX",
    dom: 6,
    vin: "SCA664S51PUX98123",
    media: { photo_links: ["https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=600&q=80"] },
    seller: { name: "Rolls-Royce Motor Cars Houston" },
  },
  {
    id: "mc-007",
    heading: "2022 Aston Martin DBX707",
    price: 239500,
    miles: 4320,
    year: 2022,
    make: "Aston Martin",
    model: "DBX",
    trim: "707",
    exterior_color: "Satin Xenon Grey",
    interior_color: "Obsidian Black",
    fuel_type: "Gasoline",
    city: "Atlanta",
    state: "GA",
    dom: 9,
    vin: "SCFSMGAW5NGT10044",
    media: { photo_links: ["https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&q=80"] },
    seller: { name: "Aston Martin Atlanta" },
  },
  {
    id: "mc-008",
    heading: "2023 McLaren Artura Spider",
    price: 279000,
    miles: 610,
    year: 2023,
    make: "McLaren",
    model: "Artura",
    trim: "Spider",
    exterior_color: "MSO Volcano Orange",
    interior_color: "Onyx Black",
    fuel_type: "Hybrid",
    city: "Los Angeles",
    state: "CA",
    dom: 2,
    vin: "SBM15ACA3PW003412",
    media: { photo_links: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"] },
    seller: { name: "McLaren Beverly Hills" },
  },
  {
    id: "mc-009",
    heading: "2022 Porsche Taycan Turbo S Cross Turismo",
    price: 164800,
    miles: 9870,
    year: 2022,
    make: "Porsche",
    model: "Taycan",
    trim: "Turbo S Cross Turismo",
    exterior_color: "Frozen Blue Metallic",
    interior_color: "Black/Bordeaux Red",
    fuel_type: "Electric",
    city: "Chicago",
    state: "IL",
    dom: 11,
    vin: "WP0CF2Y1XNS282901",
    media: { photo_links: ["https://images.unsplash.com/photo-1611578663303-db093ef197ec?w=600&q=80"] },
    seller: { name: "Porsche Chicago" },
  },
  {
    id: "mc-010",
    heading: "2023 BMW M8 Competition Gran Coupe",
    price: 139900,
    miles: 4100,
    year: 2023,
    make: "BMW",
    model: "M8",
    trim: "Competition Gran Coupe xDrive",
    exterior_color: "Frozen Dark Silver",
    interior_color: "Full Merino Tartufo",
    fuel_type: "Gasoline",
    city: "Dallas",
    state: "TX",
    dom: 5,
    vin: "WBSGV0C01PCH51209",
    media: { photo_links: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"] },
    seller: { name: "BMW of Dallas" },
  },
  {
    id: "mc-011",
    heading: "2021 Bentley Flying Spur V8",
    price: 218000,
    miles: 11200,
    year: 2021,
    make: "Bentley",
    model: "Flying Spur",
    trim: "V8",
    exterior_color: "Cobalt Blue",
    interior_color: "Camel/Newmarket Tan",
    fuel_type: "Gasoline",
    city: "Palm Beach",
    state: "FL",
    dom: 14,
    vin: "SCBBP6ZG3MC079812",
    media: { photo_links: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80"] },
    seller: { name: "Bentley Palm Beach" },
  },
  {
    id: "mc-012",
    heading: "2023 Maserati MC20 Cielo",
    price: 269700,
    miles: 890,
    year: 2023,
    make: "Maserati",
    model: "MC20",
    trim: "Cielo Spider",
    exterior_color: "Bianco Audace",
    interior_color: "Nero",
    fuel_type: "Gasoline",
    city: "Scottsdale",
    state: "AZ",
    dom: 3,
    vin: "ZAM44XSAXP0409812",
    media: { photo_links: ["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80"] },
    seller: { name: "Maserati of Scottsdale" },
  },
];

// Enrich all mocks once at startup
const ENRICHED_MOCKS = MOCK_LISTINGS.map(enrichListing);

// ─── Filter helper ────────────────────────────────────────────────────────────
function filterListings(
  listings: EnrichedListing[],
  query: Record<string, string>
): EnrichedListing[] {
  let result = [...listings];

  if (query.make) {
    result = result.filter((l) => l.make.toLowerCase().includes(query.make.toLowerCase()));
  }
  if (query.model) {
    result = result.filter((l) => l.model.toLowerCase().includes(query.model.toLowerCase()));
  }
  if (query.year) {
    result = result.filter((l) => l.year === parseInt(query.year));
  }
  if (query.price_max) {
    result = result.filter((l) => l.price <= parseInt(query.price_max));
  }
  if (query.miles_max) {
    result = result.filter((l) => l.miles <= parseInt(query.miles_max));
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.heading.toLowerCase().includes(s) ||
        l.make.toLowerCase().includes(s) ||
        l.model.toLowerCase().includes(s) ||
        (l.exterior_color ?? "").toLowerCase().includes(s) ||
        (l.city ?? "").toLowerCase().includes(s)
    );
  }
  if (query.wholesale_only === "true") {
    result = result.filter((l) => l.wholesale_potential);
  }

  const rows = parseInt(query.rows ?? "24");
  return result.slice(0, rows);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Main search — returns enriched listings
router.get("/marketcheck/search", async (req: Request, res: Response) => {
  const apiKey = process.env.MARKETCHECK_API_KEY;

  if (!apiKey) {
    const query = req.query as Record<string, string>;
    const filtered = filterListings(ENRICHED_MOCKS, query);
    res.json({ listings: filtered, totalCount: filtered.length, source: "3c-demo" });
    return;
  }

  const {
    make, model, year, price_min, price_max,
    miles_max, zip, radius, rows = "20", start = "0",
    sort_by = "price", sort_order = "asc",
  } = req.query;

  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("rows", String(rows));
  params.set("start", String(start));
  params.set("sort_by", String(sort_by));
  params.set("sort_order", String(sort_order));
  params.set("car_type", "used");

  if (make) params.set("make", String(make));
  if (model) params.set("model", String(model));
  if (year) params.set("year", String(year));
  if (price_min) params.set("price_min", String(price_min));
  if (price_max) params.set("price_max", String(price_max));
  if (miles_max) params.set("miles_max", String(miles_max));
  if (zip) params.set("zip", String(zip));
  if (radius) params.set("radius", String(radius));

  try {
    const url = `${MARKETCHECK_BASE}/search/car/active?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      req.log.error({ status: response.status }, "MarketCheck API error — falling back to demo data");
      const query = req.query as Record<string, string>;
      const filtered = filterListings(ENRICHED_MOCKS, query);
      res.json({ listings: filtered, totalCount: filtered.length, source: "3c-demo" });
      return;
    }

    const data = await response.json();
    // Enrich live listings too
    const enriched = (data.listings ?? []).map((l: BaseListing) => enrichListing(l));
    res.json({ ...data, listings: enriched });
  } catch (err) {
    req.log.error({ err }, "MarketCheck fetch failed — falling back to demo data");
    const query = req.query as Record<string, string>;
    const filtered = filterListings(ENRICHED_MOCKS, query);
    res.json({ listings: filtered, totalCount: filtered.length, source: "3c-demo" });
  }
});

// Wholesale engine — only returns listings where price < market_avg
router.get("/marketcheck/wholesale", async (_req: Request, res: Response) => {
  const wholesale = ENRICHED_MOCKS.filter((l) => l.wholesale_potential);
  const totalSavings = wholesale.reduce((s, l) => s + l.savings_vs_retail, 0);
  const avgSavings   = wholesale.length ? Math.round(totalSavings / wholesale.length) : 0;
  const avgScore     = wholesale.length
    ? Math.round(wholesale.reduce((s, l) => s + l.guardian_health_score, 0) / wholesale.length)
    : 0;

  res.json({
    listings: wholesale,
    totalCount: wholesale.length,
    totalSavings,
    avgSavings,
    avgGuardianScore: avgScore,
    source: "3c-demo",
  });
});

export default router;
