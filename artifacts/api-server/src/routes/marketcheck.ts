import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { apiCache, cacheKeys } from "../lib/apiCache";
import { circuits } from "../lib/circuitBreaker";

const router: IRouter = Router();

const MARKETCHECK_BASE = (process.env.MARKETCHECK_BASE_URL ?? "https://api.marketcheck.com/v2").replace(/\/+$/, "");

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
export interface BaseListing {
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
  seller?: { name?: string; phone?: string; website?: string };
  vdp_url?: string;
}

export interface EnrichedListing extends BaseListing {
  /** Fixture-only calculations. Never inferred for live provider listings. */
  market_avg: number;
  guardian_health_score: number;
  dealer_discount: number;
  platform_fee: number;
  club_price: number;
  savings_vs_retail: number;
  wholesale_potential: boolean;
}

export function enrichListing(l: BaseListing): EnrichedListing {
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

// Additive export — used by the ONYX Advisor (AI Picks feed). Read-only.
export function getCuratedEnrichedListings(): EnrichedListing[] {
  return ENRICHED_MOCKS;
}

// ─── Filter helper ────────────────────────────────────────────────────────────
export function filterListings(
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

  const rows = Number(query.rows ?? "24");
  const start = Number(query.start ?? "0");
  const sortBy = query.sort_by;
  if (sortBy === "price" || sortBy === "miles" || sortBy === "year" || sortBy === "dom") {
    const direction = query.sort_order === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const aValue = sortBy === "dom" ? a.dom ?? Number.MAX_SAFE_INTEGER : a[sortBy];
      const bValue = sortBy === "dom" ? b.dom ?? Number.MAX_SAFE_INTEGER : b[sortBy];
      return (aValue - bValue) * direction || a.id.localeCompare(b.id);
    });
  }
  return result.slice(start, start + rows);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const SORT_FIELDS = ["price", "miles", "year", "dom"] as const;
const isProduction = () => process.env.NODE_ENV === "production";

const optionalText = z.string().trim().min(1).max(80).optional();
const optionalNumber = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).optional();

/** The public query contract. Unknown values are deliberately discarded. */
export const MarketCheckSearchQuery = z.object({
  make: optionalText,
  model: optionalText,
  year: optionalNumber(1886, 2100),
  price_min: optionalNumber(0, 10_000_000),
  price_max: optionalNumber(0, 10_000_000),
  miles_max: optionalNumber(0, 2_000_000),
  zip: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/).optional(),
  radius: optionalNumber(1, 500),
  search: z.string().trim().min(1).max(100).optional(),
  wholesale_only: z.enum(["true", "false"]).optional().default("false"),
  rows: z.coerce.number().int().min(1).max(100).default(20),
  start: z.coerce.number().int().min(0).max(10_000).default(0),
  sort_by: z.enum(SORT_FIELDS).default("price"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
}).superRefine((query, ctx) => {
  if (query.price_min !== undefined && query.price_max !== undefined && query.price_min > query.price_max) {
    ctx.addIssue({ code: "custom", message: "price_min must not exceed price_max", path: ["price_min"] });
  }
});

export type MarketCheckQuery = z.infer<typeof MarketCheckSearchQuery>;

export function parseMarketCheckQuery(query: unknown): MarketCheckQuery {
  return MarketCheckSearchQuery.parse(query);
}

function stableQueryKey(q: Record<string, unknown>): string {
  const keys = Object.keys(q).sort();
  return keys.map((k) => `${k}=${String(q[k] ?? "")}`).join("&");
}

function cleanText(value: unknown, max = 120): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return clean || undefined;
}

function cleanNumber(value: unknown, min: number, max: number): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number >= min && number <= max ? Math.round(number) : undefined;
}

function cleanPhotoLinks(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links = value
    .filter((link): link is string => typeof link === "string")
    .map((link) => link.trim())
    .filter((link) => /^https?:\/\//i.test(link))
    .slice(0, 20);
  return links.length ? links : undefined;
}

function cleanHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Converts untrusted provider records into the stable public listing shape. */
export function normalizeMarketCheckListing(raw: unknown): BaseListing | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const listing = raw as Record<string, unknown>;
  const build = listing.build && typeof listing.build === "object" && !Array.isArray(listing.build)
    ? listing.build as Record<string, unknown> : {};
  const dealer = listing.dealer && typeof listing.dealer === "object" && !Array.isArray(listing.dealer)
    ? listing.dealer as Record<string, unknown> : {};
  const year = cleanNumber(listing.year ?? build.year, 1886, 2100);
  const price = cleanNumber(listing.price, 0, 10_000_000);
  const miles = cleanNumber(listing.miles ?? listing.mileage, 0, 2_000_000);
  const make = cleanText(listing.make ?? build.make, 80);
  const model = cleanText(listing.model ?? build.model, 80);
  const vin = cleanText(listing.vin, 17)?.toUpperCase() ?? "";
  if (!year || price === undefined || miles === undefined || !make || !model) return null;

  const id = cleanText(listing.id ?? listing.vdp_url ?? listing.vin, 200) ?? `${year}-${make}-${model}-${price}`;
  const trim = cleanText(listing.trim ?? build.trim, 100);
  const rawSeller = listing.seller as Record<string, unknown> | undefined;
  const sellerName = cleanText(rawSeller?.name ?? dealer.name ?? listing.dealer_name, 120);
  const sellerPhone = cleanText(rawSeller?.phone ?? dealer.phone ?? listing.dealer_phone ?? listing.phone, 40);
  const sellerWebsite = cleanHttpUrl(rawSeller?.website ?? dealer.website ?? listing.dealer_website ?? listing.website);
  const photos = cleanPhotoLinks((listing.media as Record<string, unknown> | undefined)?.photo_links ?? listing.photo_links);
  const vdpUrl = cleanHttpUrl(listing.vdp_url ?? listing.vdpUrl);
  return {
    id,
    heading: cleanText(listing.heading, 200) ?? [year, make, model, trim].filter(Boolean).join(" "),
    price, miles, year, make, model, vin,
    ...(trim ? { trim } : {}),
    ...(cleanText(listing.exterior_color, 80) ? { exterior_color: cleanText(listing.exterior_color, 80) } : {}),
    ...(cleanText(listing.interior_color, 80) ? { interior_color: cleanText(listing.interior_color, 80) } : {}),
    ...(cleanText(listing.fuel_type ?? build.fuel_type, 60) ? { fuel_type: cleanText(listing.fuel_type ?? build.fuel_type, 60) } : {}),
    ...(cleanText(listing.city ?? dealer.city, 80) ? { city: cleanText(listing.city ?? dealer.city, 80) } : {}),
    ...(cleanText(listing.state ?? dealer.state, 2) ? { state: cleanText(listing.state ?? dealer.state, 2)?.toUpperCase() } : {}),
    ...(cleanNumber(listing.dom, 0, 10_000) !== undefined ? { dom: cleanNumber(listing.dom, 0, 10_000) } : {}),
    ...(photos ? { media: { photo_links: photos } } : {}),
    ...(sellerName || sellerPhone || sellerWebsite ? { seller: { ...(sellerName ? { name: sellerName } : {}), ...(sellerPhone ? { phone: sellerPhone } : {}), ...(sellerWebsite ? { website: sellerWebsite } : {}) } } : {}),
    ...(vdpUrl ? { vdp_url: vdpUrl } : {}),
  };
}

interface SearchPayload {
  listings: Array<BaseListing | EnrichedListing>;
  totalCount: number;
  source: "marketcheck" | "3c-curated";
  sourceLabel: string;
  message: string;
  mode: "live" | "demo";
  status: "available";
  hasMore: boolean;
  nextStart: number | null;
  pagination: { start: number; rows: number; totalCount: number; nextStart: number | null };
}

class MarketCheckError extends Error {
  constructor(public readonly status: number, message: string, public readonly retryAfter?: string | null) {
    super(message);
  }
}

function demoSearch(query: MarketCheckQuery): SearchPayload {
  const filters = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)]));
  const allListings = filterListings(ENRICHED_MOCKS, { ...filters, rows: "10000", start: "0" });
  const listings = allListings.slice(query.start, query.start + query.rows);
  return {
    listings, totalCount: allListings.length, source: "3c-curated", sourceLabel: "3C curated demo inventory", message: "Demo inventory is shown because MarketCheck is not configured.", mode: "demo", status: "available",
    hasMore: query.start + listings.length < allListings.length,
    nextStart: query.start + listings.length < allListings.length ? query.start + listings.length : null,
    pagination: { start: query.start, rows: query.rows, totalCount: allListings.length, nextStart: query.start + listings.length < allListings.length ? query.start + listings.length : null },
  };
}

const KNOWN_MAKES = ["Alfa Romeo", "Aston Martin", "Mercedes-Benz", "Rolls-Royce", "Land Rover", "Tesla", "Porsche", "Ferrari", "Lamborghini", "Bentley", "Maserati", "McLaren", "BMW", "Audi", "Cadillac", "Chevrolet", "Ford", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Lincoln", "Nissan", "Toyota", "Volkswagen", "Volvo"];

/** Extracts documented MarketCheck make/model/year filters from ordinary search text. */
export function parseMarketCheckSearch(search: string): Pick<MarketCheckQuery, "make" | "model" | "year"> {
  let remainder = search.trim();
  const yearMatch = remainder.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[0]) : undefined;
  if (yearMatch) remainder = remainder.replace(yearMatch[0], " ");
  const make = KNOWN_MAKES.find((candidate) => new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(remainder));
  if (make) remainder = remainder.replace(new RegExp(`\\b${make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), " ");
  const model = cleanText(remainder.replace(/\s+/g, " "), 80);
  return { ...(make ? { make } : {}), ...(model ? { model } : {}), ...(year ? { year } : {}) };
}

export function marketCheckSearchParams(query: MarketCheckQuery, apiKey: string): URLSearchParams {
  const params = new URLSearchParams({ api_key: apiKey, rows: String(query.rows), start: String(query.start), sort_by: query.sort_by, sort_order: query.sort_order, car_type: "used" });
  // MarketCheck accepts ranges, not price_min/price_max/miles_max.
  // Bound these required values so unpriced records cannot fill the first page.
  params.set("price_range", `${query.price_min ?? 1}-${query.price_max ?? 10_000_000}`);
  params.set("miles_range", `0-${query.miles_max ?? 2_000_000}`);
  const searchFilters = query.search ? parseMarketCheckSearch(query.search) : {};
  for (const key of ["make", "model", "year", "zip", "radius"] as const) {
    const value = query[key] ?? searchFilters[key as keyof typeof searchFilters];
    if (value !== undefined) params.set(key, String(value));
  }
  return params;
}

async function liveSearch(query: MarketCheckQuery, apiKey: string): Promise<SearchPayload> {
  const params = marketCheckSearchParams(query, apiKey);
  const url = `${MARKETCHECK_BASE}/search/car/active?${params}`;
  const data = await circuits.marketcheck.execute(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      // Keep this slightly below the circuit's 8s request timeout so the socket
      // is cancelled before the circuit returns control to the caller.
      const timeout = setTimeout(() => controller.abort(), 7_500);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) return await response.json() as Record<string, unknown>;
        const retryable = [408, 425, 500, 502, 503, 504].includes(response.status);
        if (retryable && attempt === 0) continue;
        throw new MarketCheckError(response.status === 429 ? 429 : 502, "MarketCheck provider request failed", response.headers.get("retry-after"));
      } catch (error) {
        if (error instanceof MarketCheckError || attempt === 1) throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new MarketCheckError(502, "MarketCheck provider request failed");
  });
  const rawListings = Array.isArray(data.listings) ? data.listings : [];
  // Provider listings remain provider facts: no synthetic discounts, values, or wholesale flags.
  const listings = rawListings.map(normalizeMarketCheckListing).filter((listing): listing is BaseListing => listing !== null);
  const totalCount = cleanNumber(data.num_found ?? data.total ?? data.totalCount, 0, 10_000_000) ?? listings.length;
  // Advance past provider records even when validation rejects one, avoiding repeated pages.
  const nextStart = rawListings.length > 0 && query.start + rawListings.length < totalCount ? query.start + rawListings.length : null;
  return { listings, totalCount, source: "marketcheck", sourceLabel: "Live MarketCheck inventory", message: "Live inventory supplied by MarketCheck.", mode: "live", status: "available", hasMore: nextStart !== null, nextStart, pagination: { start: query.start, rows: query.rows, totalCount, nextStart } };
}

async function searchMarketCheck(query: MarketCheckQuery): Promise<SearchPayload> {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey) {
    if (!isProduction()) return demoSearch(query);
    throw new MarketCheckError(503, "MarketCheck is not configured");
  }
  return liveSearch(query, apiKey);
}

function sendMarketCheckError(req: Request, res: Response, error: unknown): void {
  const status = error instanceof MarketCheckError ? error.status : 503;
  const retryAfter = error instanceof MarketCheckError ? error.retryAfter : null;
  req.log.error({ err: error, status, circuit: circuits.marketcheck.status().state }, "MarketCheck search unavailable");
  if (retryAfter && /^\d+$/.test(retryAfter)) res.set("Retry-After", retryAfter);
  const message = status === 429 ? "MarketCheck quota or rate limit exceeded" : "MarketCheck search unavailable";
  res.status(status).json({
    error: message,
    message,
    listings: [],
    totalCount: 0,
    source: "marketcheck",
    sourceLabel: "MarketCheck unavailable",
    mode: "unavailable",
    status: "unavailable",
    hasMore: false,
    nextStart: null,
    pagination: { start: 0, rows: 0, totalCount: 0, nextStart: null },
  });
}

// Main search — validated, normalized and SWR-cached by canonical query.
router.get("/marketcheck/search", async (req: Request, res: Response): Promise<void> => {
  const parsed = MarketCheckSearchQuery.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid MarketCheck search query");
    res.status(400).json({ error: "Invalid MarketCheck search query", details: parsed.error.flatten() });
    return;
  }
  const query = parsed.data;
  const cacheKey = cacheKeys.marketplaceSearch(`v4:${stableQueryKey(query)}`);

  try {
    const payload = await apiCache.get(cacheKey, () => searchMarketCheck(query), 60_000, 5 * 60_000);
    res.json(payload);
  } catch (error) {
    sendMarketCheckError(req, res, error);
  }
});

router.get("/marketcheck/status", (_req: Request, res: Response): void => {
  const configured = Boolean(process.env.MARKETCHECK_API_KEY);
  const mode = configured ? "live" : isProduction() ? "unavailable" : "demo";
  res.status(configured || !isProduction() ? 200 : 503).json({ service: "marketcheck", mode, status: configured || !isProduction() ? "available" : "unavailable", configured, circuit: circuits.marketcheck.status() });
});

// Wholesale engine derives from the same normalized live search contract.
router.get("/marketcheck/wholesale", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await apiCache.get(cacheKeys.marketplaceWholesale(), async () => {
      const result = await searchMarketCheck({ rows: 100, start: 0, sort_by: "price", sort_order: "asc", wholesale_only: "true" });
      const wholesale = result.listings.filter((l): l is EnrichedListing => "wholesale_potential" in l && l.wholesale_potential);
      const totalSavings = wholesale.reduce((s, l) => s + l.savings_vs_retail, 0);
      const avgSavings   = wholesale.length ? Math.round(totalSavings / wholesale.length) : 0;
      const avgScore     = wholesale.length
        ? Math.round(wholesale.reduce((s, l) => s + l.guardian_health_score, 0) / wholesale.length)
        : 0;
      return {
        listings: wholesale,
        totalCount: wholesale.length,
        totalSavings,
        avgSavings,
        avgGuardianScore: avgScore,
        source: result.source,
        sourceLabel: result.sourceLabel,
        message: result.mode === "demo"
          ? "Demo wholesale candidates are derived from curated fixtures."
          : "Wholesale candidates are limited to verified provider values.",
        mode: result.mode,
        status: result.status,
        hasMore: false,
        nextStart: null,
        pagination: { start: 0, rows: wholesale.length, totalCount: wholesale.length, nextStart: null },
      };
    }, 60_000, 5 * 60_000);
    res.json(payload);
  } catch (error) {
    sendMarketCheckError(req, res, error);
  }
});

// NHTSA VIN Decode — free US government database, no API key required
// Decodes make, model, year, body class, engine, fuel type from a 17-char VIN
router.get("/marketcheck/vin/:vin", async (req: Request, res: Response) => {
  const vin = req.params["vin"] as string;
  const clean = vin.trim().toUpperCase();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) {
    res.status(400).json({ error: "Invalid VIN — must be 17 alphanumeric characters (no I, O, Q)" });
    return;
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${clean}?format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`NHTSA returned ${response.status}`);

    const raw = await response.json() as { Results?: Array<{ Variable: string; Value: string | null }> };
    const results: Array<{ Variable: string; Value: string | null }> = raw.Results ?? [];

    const get = (variable: string) =>
      results.find((r) => r.Variable === variable)?.Value?.trim() || null;

    const decoded = {
      vin: clean,
      make: get("Make"),
      model: get("Model"),
      year: get("Model Year") ? parseInt(get("Model Year")!) : null,
      trim: get("Trim"),
      bodyClass: get("Body Class"),
      driveType: get("Drive Type"),
      engineCylinders: get("Engine Number of Cylinders"),
      engineDisplacementL: get("Displacement (L)"),
      fuelType: get("Fuel Type - Primary"),
      gvwr: get("Gross Vehicle Weight Rating From"),
      plantCountry: get("Plant Country"),
      vehicleType: get("Vehicle Type"),
      manufacturer: get("Manufacturer Name"),
      errorCode: get("Error Code"),
      errorText: get("Error Text"),
      source: "nhtsa-vpic",
      decodedAt: new Date().toISOString(),
    };

    if (decoded.errorCode && decoded.errorCode !== "0") {
      res.status(422).json({ error: "VIN decode error", detail: decoded.errorText, decoded });
      return;
    }

    res.json({ decoded, source: "nhtsa-vpic", verifiedBy: "US Department of Transportation" });
  } catch (err) {
    req.log.error({ err, vin: clean }, "NHTSA VIN decode failed");
    res.status(502).json({ error: "VIN decode service unavailable", vin: clean });
  }
});

export default router;
