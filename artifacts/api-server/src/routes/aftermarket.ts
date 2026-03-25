/**
 * 3C ONYX Automotive Aftermarket Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 * Powered by SEMA Data Co-op × API2Cart × APEXX Supplier Network
 *
 * GET  /aftermarket/products          Browse/search (filterable, vehicle-aware)
 * GET  /aftermarket/product/:id       Single product detail + specs
 * GET  /aftermarket/categories        Category tree
 * GET  /aftermarket/suppliers         Verified supplier directory
 * GET  /aftermarket/fitment-check     Check if product fits a vehicle
 * POST /aftermarket/customize         Save customization session
 * POST /aftermarket/cart/add          Add item to dropship cart
 * GET  /aftermarket/cart/:session     Get cart contents
 * DELETE /aftermarket/cart/:session/:itemId  Remove item
 * POST /aftermarket/order             Place dropship order (Stripe)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { optionalAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ProductSource = "sema" | "api2cart" | "apexx";
type ProductPlatform = "shopify" | "woocommerce" | "magento" | "bigcommerce" | "direct";
type ProductCategory =
  | "exhaust" | "wheels" | "brakes" | "suspension" | "intake"
  | "exterior" | "interior" | "lighting" | "audio" | "performance"
  | "tires" | "safety";

interface VehicleFitment {
  yearFrom: number;
  yearTo: number;
  make: string;
  model: string;
  trim?: string;
}

interface ProductOption {
  id: string;
  label: string;
  type: "color" | "size" | "style" | "material";
  choices: { value: string; label: string; priceAdj?: number; hex?: string }[];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  supplierName: string;
  supplierId: string;
  sku: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  salePrice?: number;
  source: ProductSource;
  platform?: ProductPlatform;
  imageColor: string;
  categoryIcon: string;
  description: string;
  longDescription: string;
  specs: Record<string, string>;
  fitment: VehicleFitment[];
  options: ProductOption[];
  inStock: boolean;
  leadTime: string;
  dropshipMargin: number;
  arEnabled: boolean;
  installTime: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  weight: string;
  warranty: string;
  partNumber: string;
}

interface Supplier {
  id: string;
  name: string;
  logo: string;
  source: ProductSource;
  platform?: ProductPlatform;
  category: string[];
  productsCount: number;
  rating: number;
  shipsFrom: string;
  leadTime: string;
  dropshipEnabled: boolean;
  minimumOrder: number;
  marginRange: string;
  verified: boolean;
  semaShowYear?: number;
  apexxTier?: "gold" | "platinum" | "elite";
  tagline: string;
}

interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedOptions: Record<string, string>;
  vehicleId?: string;
}

interface Cart {
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  dropshipFee: number;
  total: number;
  createdAt: string;
}

/* ─── Supplier catalog ───────────────────────────────────────────────────── */

const SUPPLIERS: Supplier[] = [
  {
    id: "s-borla", name: "Borla Performance Industries", logo: "borla", source: "sema",
    category: ["exhaust"], productsCount: 847, rating: 4.9, shipsFrom: "Oxnard, CA",
    leadTime: "3-5 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "18-28%",
    verified: true, semaShowYear: 1978, tagline: "World's only stainless steel cat-back exhaust manufacturer",
  },
  {
    id: "s-vossen", name: "Vossen Wheels", logo: "vossen", source: "apexx",
    category: ["wheels"], productsCount: 312, rating: 4.8, shipsFrom: "Miami, FL",
    leadTime: "5-10 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "22-35%",
    verified: true, semaShowYear: 2010, apexxTier: "elite",
    tagline: "Forged precision. Custom offset. Engineered for performance.",
  },
  {
    id: "s-brembo", name: "Brembo NA", logo: "brembo", source: "sema",
    category: ["brakes"], productsCount: 1204, rating: 4.9, shipsFrom: "Homer, MI",
    leadTime: "4-7 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "20-30%",
    verified: true, semaShowYear: 1961, tagline: "The reference for high-performance braking",
  },
  {
    id: "s-bilstein", name: "Bilstein of America", logo: "bilstein", source: "api2cart",
    platform: "shopify",
    category: ["suspension"], productsCount: 2891, rating: 4.8, shipsFrom: "Mooresville, NC",
    leadTime: "2-4 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "15-25%",
    verified: true, semaShowYear: 1873, tagline: "70+ years of motorsport engineering",
  },
  {
    id: "s-kn", name: "K&N Engineering", logo: "kn", source: "api2cart",
    platform: "magento",
    category: ["intake", "performance"], productsCount: 3400, rating: 4.7, shipsFrom: "Riverside, CA",
    leadTime: "2-3 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "20-28%",
    verified: true, semaShowYear: 1969, tagline: "Washable. Reusable. Guaranteed for life.",
  },
  {
    id: "s-recaro", name: "Recaro North America", logo: "recaro", source: "apexx",
    category: ["interior"], productsCount: 189, rating: 4.9, shipsFrom: "Troy, MI",
    leadTime: "7-14 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "25-40%",
    verified: true, semaShowYear: 1906, apexxTier: "platinum",
    tagline: "Racing DNA since 1906. Zero-compromise seating.",
  },
  {
    id: "s-hre", name: "HRE Performance Wheels", logo: "hre", source: "apexx",
    category: ["wheels"], productsCount: 98, rating: 5.0, shipsFrom: "Vista, CA",
    leadTime: "14-21 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "30-45%",
    verified: true, semaShowYear: 1978, apexxTier: "elite",
    tagline: "America's most technically advanced wheels",
  },
  {
    id: "s-apr", name: "APR Performance", logo: "apr", source: "sema",
    category: ["exterior", "performance"], productsCount: 445, rating: 4.7, shipsFrom: "Opelika, AL",
    leadTime: "5-8 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "22-32%",
    verified: true, semaShowYear: 1997, tagline: "Wind tunnel tested. Race proven.",
  },
  {
    id: "s-kw", name: "KW Automotive NA", logo: "kw", source: "api2cart",
    platform: "woocommerce",
    category: ["suspension"], productsCount: 1876, rating: 4.8, shipsFrom: "Danville, CA",
    leadTime: "3-6 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "20-30%",
    verified: true, semaShowYear: 1995, tagline: "Made in Germany. Built for the road and the track.",
  },
  {
    id: "s-magnaflow", name: "MagnaFlow Performance Exhaust", logo: "magnaflow", source: "sema",
    category: ["exhaust"], productsCount: 2100, rating: 4.8, shipsFrom: "Oceanside, CA",
    leadTime: "2-4 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "18-26%",
    verified: true, semaShowYear: 1981, tagline: "Race-inspired acoustics. Street-legal performance.",
  },
  {
    id: "s-diode", name: "Diode Dynamics", logo: "diode", source: "api2cart",
    platform: "shopify",
    category: ["lighting"], productsCount: 620, rating: 4.8, shipsFrom: "St. Louis, MO",
    leadTime: "2-3 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "25-38%",
    verified: true, tagline: "The most advanced automotive LED products",
  },
  {
    id: "s-jlaudio", name: "JL Audio", logo: "jlaudio", source: "apexx",
    category: ["audio"], productsCount: 892, rating: 4.9, shipsFrom: "Miramar, FL",
    leadTime: "3-5 business days", dropshipEnabled: true, minimumOrder: 0, marginRange: "20-30%",
    verified: true, apexxTier: "gold", tagline: "Pure sound. Engineered obsessively.",
  },
];

/* ─── Product catalog ────────────────────────────────────────────────────── */

const PRODUCTS: Product[] = [
  /* ── EXHAUST ──────────────────────────────────────────────────────── */
  {
    id: "p-borla-bmw-m5-atak",
    name: "ATAK Cat-Back Exhaust System",
    brand: "Borla", supplierName: "Borla Performance Industries", supplierId: "s-borla",
    sku: "BORLA-140891", partNumber: "140891",
    category: "exhaust", subcategory: "Cat-Back",
    price: 1899, source: "sema",
    imageColor: "#1A1A1A", categoryIcon: "flame",
    description: "Maximum sound, maximum performance. The ATAK is Borla's loudest street-legal exhaust.",
    longDescription: "The Borla ATAK Cat-Back exhaust is engineered exclusively for the F90 BMW M5. Constructed from aircraft-quality T-304 stainless steel with a straight-through design that eliminates restriction. The ATAK signature tone is optimized to complement the 4.4L twin-turbo V8's natural character — aggressive under throttle, refined at cruise. Includes Borla's lifetime warranty.",
    specs: { "Material": "T-304 Stainless Steel", "Pipe Diameter": "2.75\"", "Tips": "4x 4.5\" Angle-Cut", "Finish": "Polished", "Sound Level": "ATAK (Maximum)", "Weight Savings": "12 lbs vs OEM" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "tip-finish", label: "Tip Finish", type: "style", choices: [
        { value: "polished", label: "Polished" },
        { value: "black", label: "Black Chrome", priceAdj: 120 },
        { value: "carbon", label: "Carbon Fiber Tips", priceAdj: 280 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 3-5 business days", dropshipMargin: 22,
    arEnabled: true, installTime: "2-3 hours", rating: 4.9, reviewCount: 284,
    tags: ["exhaust", "performance", "bmw", "m5", "sema", "borla"],
    weight: "34 lbs", warranty: "Lifetime",
  },
  {
    id: "p-magnaflow-porsche-911",
    name: "Competition Series Cat-Back Exhaust",
    brand: "MagnaFlow", supplierName: "MagnaFlow Performance Exhaust", supplierId: "s-magnaflow",
    sku: "MF-19371", partNumber: "19371",
    category: "exhaust", subcategory: "Cat-Back",
    price: 2499, source: "sema",
    imageColor: "#2D2D2D", categoryIcon: "flame",
    description: "Race-tuned acoustics designed specifically for the Porsche 911's flat-six character.",
    longDescription: "MagnaFlow's Competition Series brings GT racing-inspired sound engineering to your 992 Porsche 911. The mandrel-bent T-304 stainless piping maximizes flow efficiency while the patented straight-through chamber eliminates drone at highway speeds. Features an N1-style rear diffuser and 4-inch black chrome tips.",
    specs: { "Material": "T-304 Stainless Steel", "Pipe Diameter": "2.5\"", "Tips": "2x 4\" N1-Style", "Finish": "Polished + Black Chrome Tips", "Sound Level": "Competition", "Drone": "Zero highway drone" },
    fitment: [{ yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" }],
    options: [
      { id: "valvetronic", label: "Valvetronic Option", type: "style", choices: [
        { value: "passive", label: "Standard (Fixed)" },
        { value: "active", label: "Valvetronic (Sound Control)", priceAdj: 680 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 4-6 business days", dropshipMargin: 24,
    arEnabled: true, installTime: "3-4 hours", rating: 4.8, reviewCount: 142,
    tags: ["exhaust", "performance", "porsche", "911", "gt3", "sema"],
    weight: "28 lbs", warranty: "Limited Lifetime",
  },

  /* ── WHEELS ──────────────────────────────────────────────────────── */
  {
    id: "p-vossen-hf7-20",
    name: "HF-7 Forged Hybrid Wheels — 20\"",
    brand: "Vossen", supplierName: "Vossen Wheels", supplierId: "s-vossen",
    sku: "VOSS-HF7-20-SET", partNumber: "HF7-20-SET",
    category: "wheels", subcategory: "Forged",
    price: 3200, source: "apexx",
    imageColor: "#0A0A0A", categoryIcon: "circle",
    description: "Hybrid forged precision. Custom offset. 2,900 lb load rating per wheel.",
    longDescription: "The Vossen HF-7 is the pinnacle of the HF Series — a 7-spoke monoblock flow-formed wheel with forged-level strength at cast pricing. Flow-forming technology compresses and stretches the barrel, creating a grain structure similar to forged, resulting in stronger, lighter wheels. Available in custom offsets to fit your exact setup. Includes Vossen center caps.",
    specs: { "Construction": "Hybrid Flow-Formed", "Size": "20x9 Front / 20x10.5 Rear", "Offset": "Custom (ET25-ET45)", "Load Rating": "2,900 lbs/wheel", "Finish Options": "10+", "Valve Stems": "Included" },
    fitment: [
      { yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" },
      { yearFrom: 2017, yearTo: 2024, make: "Mercedes", model: "S580" },
      { yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" },
    ],
    options: [
      { id: "finish", label: "Wheel Finish", type: "color", choices: [
        { value: "matte-black", label: "Matte Graphite", hex: "#2A2A2A" },
        { value: "gloss-black", label: "Gloss Black", hex: "#0A0A0A" },
        { value: "silver", label: "Brushed Silver", hex: "#B0B0B0" },
        { value: "gold", label: "Satin Gold", hex: "#C9A227", priceAdj: 240 },
        { value: "bronze", label: "Satin Bronze", hex: "#8B6914", priceAdj: 240 },
      ]},
      { id: "size", label: "Wheel Size", type: "size", choices: [
        { value: "19", label: "19\"", priceAdj: -400 },
        { value: "20", label: "20\"" },
        { value: "21", label: "21\"", priceAdj: 600 },
        { value: "22", label: "22\"", priceAdj: 1400 },
      ]},
    ],
    inStock: true, leadTime: "Custom order — 7-12 business days", dropshipMargin: 28,
    arEnabled: true, installTime: "1-2 hours (professional mount/balance)", rating: 4.9, reviewCount: 891,
    tags: ["wheels", "forged", "vossen", "custom", "apexx"],
    weight: "42 lbs/set", warranty: "3 Year",
  },
  {
    id: "p-hre-p101",
    name: "P101 Monoblock Forged Wheels",
    brand: "HRE", supplierName: "HRE Performance Wheels", supplierId: "s-hre",
    sku: "HRE-P101-SET", partNumber: "P101-CUSTOM",
    category: "wheels", subcategory: "Monoblock Forged",
    price: 5800, source: "apexx",
    imageColor: "#111111", categoryIcon: "circle",
    description: "America's most technically advanced wheel. 100% bespoke — made to order.",
    longDescription: "Every HRE P101 begins as an aerospace-grade aluminum billet, computer modeled, then precision-machined in Vista, CA. The P-Series is HRE's entry to their forged line — offering the full HRE treatment at a more accessible price point. Each set is made to your exact specifications: diameter, width, offset, finish, and center bore. No shelf stock. No compromise.",
    specs: { "Construction": "Full Monoblock Forged 6061-T6 Aluminum", "Process": "CNC machined from billet", "Finish": "Fully custom (RAL color match available)", "Lead Time": "14-21 business days", "Center Bore": "Custom machined", "Lifetime": "Guaranteed for life of vehicle" },
    fitment: [
      { yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" },
      { yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" },
    ],
    options: [
      { id: "finish", label: "Wheel Finish", type: "color", choices: [
        { value: "satin-black", label: "Satin Black", hex: "#1A1A1A" },
        { value: "polished", label: "Polished Aluminum", hex: "#D8D8D8" },
        { value: "frozen-silver", label: "Frozen Silver", hex: "#9A9A9A" },
        { value: "custom-ral", label: "Custom RAL Color Match", priceAdj: 600 },
      ]},
      { id: "size", label: "Configuration", type: "size", choices: [
        { value: "20-staggered", label: "20\" Staggered" },
        { value: "21-staggered", label: "21\" Staggered", priceAdj: 800 },
      ]},
    ],
    inStock: false, leadTime: "Made to order — 14-21 business days", dropshipMargin: 32,
    arEnabled: true, installTime: "Professional install required", rating: 5.0, reviewCount: 209,
    tags: ["wheels", "forged", "hre", "bespoke", "apexx", "premium"],
    weight: "38 lbs/set", warranty: "Lifetime",
  },

  /* ── BRAKES ──────────────────────────────────────────────────────── */
  {
    id: "p-brembo-gt-bmw-m5",
    name: "GT Big Brake Kit — 6-Piston Front",
    brand: "Brembo", supplierName: "Brembo NA", supplierId: "s-brembo",
    sku: "BREMBO-1H4-009A0", partNumber: "1H4.009A0",
    category: "brakes", subcategory: "Big Brake Kit",
    price: 3400, source: "sema",
    imageColor: "#CC0000", categoryIcon: "disc",
    description: "Brembo GT: the benchmark for high-performance street braking. 6-piston front calipers.",
    longDescription: "The Brembo GT Big Brake Kit for the F90 BMW M5 provides an immediate and dramatic improvement in braking performance and feel. Features Brembo's signature 6-piston monoblock calipers, 380mm slotted and drilled discs, and premium Brembo brake pads. The calipers are forged from aluminum and anodized to resist corrosion and heat.",
    specs: { "Caliper": "6-Piston Forged Aluminum Monoblock", "Disc Size": "380mm x 34mm (F) / 380mm x 28mm (R)", "Disc Type": "Slotted & Drilled", "Material": "High-carbon cast iron", "Pad Material": "Brembo High-Perf Street", "Fluid Temp Rating": "450°C" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "caliper-color", label: "Caliper Color", type: "color", choices: [
        { value: "red", label: "Brembo Red", hex: "#CC0000" },
        { value: "black", label: "Matte Black", hex: "#1A1A1A" },
        { value: "yellow", label: "Yellow", hex: "#FFD700" },
        { value: "gold", label: "Gold", hex: "#C9A227", priceAdj: 180 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 5-7 business days", dropshipMargin: 25,
    arEnabled: true, installTime: "4-6 hours (professional)", rating: 4.9, reviewCount: 412,
    tags: ["brakes", "brembo", "gt", "big-brake", "bmw", "m5", "sema"],
    weight: "28 lbs", warranty: "1 Year",
  },
  {
    id: "p-brembo-gt-porsche-911",
    name: "GT Big Brake Kit — 6-Piston (911)",
    brand: "Brembo", supplierName: "Brembo NA", supplierId: "s-brembo",
    sku: "BREMBO-1N1-021A0", partNumber: "1N1.021A0",
    category: "brakes", subcategory: "Big Brake Kit",
    price: 3800, source: "sema",
    imageColor: "#CC0000", categoryIcon: "disc",
    description: "Track-ready stopping power for the 992 Porsche 911. PCCB-equivalent performance.",
    longDescription: "Specifically engineered for the 992-generation Porsche 911, this Brembo GT kit delivers PCCB-level stopping power at a fraction of the ceramic composite price. Perfect for track day enthusiasts who want repeatable, consistent performance without the fragility of carbon-ceramic.",
    specs: { "Caliper": "6-Piston Monoblock", "Front Disc": "390mm x 36mm", "Rear Disc": "355mm x 32mm", "Disc Type": "Slotted", "Clearance": "Requires 19\"+ wheels" },
    fitment: [{ yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" }],
    options: [
      { id: "caliper-color", label: "Caliper Color", type: "color", choices: [
        { value: "red", label: "Brembo Red", hex: "#CC0000" },
        { value: "black", label: "Matte Black", hex: "#1A1A1A" },
        { value: "yellow", label: "GT Yellow", hex: "#FFD700" },
      ]},
    ],
    inStock: true, leadTime: "Ships in 5-7 business days", dropshipMargin: 25,
    arEnabled: true, installTime: "4-6 hours", rating: 4.9, reviewCount: 287,
    tags: ["brakes", "brembo", "porsche", "911", "track", "sema"],
    weight: "32 lbs", warranty: "1 Year",
  },

  /* ── SUSPENSION ──────────────────────────────────────────────────── */
  {
    id: "p-bilstein-b16-bmw",
    name: "B16 PSS10 Coilover System",
    brand: "Bilstein", supplierName: "Bilstein of America", supplierId: "s-bilstein",
    sku: "BILSTEIN-48-252421", partNumber: "48-252421",
    category: "suspension", subcategory: "Coilovers",
    price: 2100, source: "api2cart", platform: "shopify",
    imageColor: "#FFD700", categoryIcon: "settings",
    description: "10-way adjustable. Motorsport engineering. 30mm lowering range.",
    longDescription: "The Bilstein B16 PSS10 is a height-adjustable coilover system with 10-step monotube damper adjustment in both compression and rebound. Built in Bilstein's German facility using the same monotube technology found in their motorsport products. Provides up to 30mm of ride height adjustment without compromising handling geometry.",
    specs: { "Damper Technology": "Monotube", "Adjustment": "10-way (compression + rebound)", "Height Range": "15-30mm lowering", "Spring Rate (F/R)": "300/280 lbs/in", "Construction": "Zinc-coated steel body", "TÜV Certification": "Yes" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "spring-rate", label: "Spring Rate", type: "style", choices: [
        { value: "sport", label: "Sport (Stock Rate)" },
        { value: "track", label: "Track (+15% stiffer)", priceAdj: 180 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 2-4 business days", dropshipMargin: 20,
    arEnabled: false, installTime: "4-6 hours (alignment required)", rating: 4.8, reviewCount: 631,
    tags: ["suspension", "coilovers", "bilstein", "bmw", "adjustable"],
    weight: "48 lbs", warranty: "2 Year / 24,000 miles",
  },
  {
    id: "p-kw-v3-porsche-911",
    name: "Variant 3 Coilover System (992)",
    brand: "KW Automotive", supplierName: "KW Automotive NA", supplierId: "s-kw",
    sku: "KW-35271074", partNumber: "35271074",
    category: "suspension", subcategory: "Coilovers",
    price: 3400, source: "api2cart", platform: "woocommerce",
    imageColor: "#DC2626", categoryIcon: "settings",
    description: "TÜV-certified. Separately adjustable compression and rebound. Made in Germany.",
    longDescription: "The KW Variant 3 is KW's most adjustable street coilover — featuring separate high and low-speed compression adjustment alongside independent rebound adjustment. Built in Germany to OEM-level tolerances. Includes the KW comfort kit for PASM-equipped vehicles.",
    specs: { "Damper": "Twin-tube", "Compression Adjust": "Separate high/low speed", "Rebound Adjust": "Independent", "Height Range": "20-40mm lowering", "PASM Compatible": "Yes (comfort kit included)", "TÜV": "Certified" },
    fitment: [{ yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" }],
    options: [],
    inStock: true, leadTime: "Ships in 3-6 business days", dropshipMargin: 22,
    arEnabled: false, installTime: "5-7 hours", rating: 4.9, reviewCount: 318,
    tags: ["suspension", "coilovers", "kw", "porsche", "911", "germany"],
    weight: "52 lbs", warranty: "2 Year",
  },

  /* ── INTAKE ──────────────────────────────────────────────────────── */
  {
    id: "p-kn-intake-bmw-m5",
    name: "69-Series Typhoon Cold Air Intake",
    brand: "K&N", supplierName: "K&N Engineering", supplierId: "s-kn",
    sku: "KN-69-8750TC", partNumber: "69-8750TC",
    category: "intake", subcategory: "Cold Air Intake",
    price: 389, source: "api2cart", platform: "magento",
    imageColor: "#DC2626", categoryIcon: "wind",
    description: "+15 HP. Dyno-proven. Washable/reusable. Lifetime warranty.",
    longDescription: "The K&N 69-Series Typhoon Cold Air Intake for the BMW M5 is a direct-fit system that increases airflow up to 50% over the stock paper air filter. The high-flow conical filter is washable and reusable — never buy another air filter again. Backed by K&N's million-mile limited warranty.",
    specs: { "HP Gain": "+15 HP (dyno proven)", "Torque Gain": "+14 lb-ft", "Airflow Improvement": "+50% vs OEM", "Filter Material": "Cotton gauze", "Filter Style": "Conical", "Washable": "Yes — reusable lifetime" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "filter-color", label: "Filter Color", type: "color", choices: [
        { value: "red", label: "Red", hex: "#DC2626" },
        { value: "black", label: "Black Drycharger", hex: "#1A1A1A", priceAdj: 30 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 1-2 business days", dropshipMargin: 26,
    arEnabled: false, installTime: "30-45 minutes", rating: 4.7, reviewCount: 1240,
    tags: ["intake", "performance", "kn", "bmw", "m5", "horsepower"],
    weight: "4.2 lbs", warranty: "Million Mile",
  },

  /* ── EXTERIOR ────────────────────────────────────────────────────── */
  {
    id: "p-apr-wing-bmw-m5",
    name: "GTC-500 Adjustable Carbon Wing",
    brand: "APR Performance", supplierName: "APR Performance", supplierId: "s-apr",
    sku: "APR-CW-999999-BMW-M5", partNumber: "CW-999999-1",
    category: "exterior", subcategory: "Wings & Spoilers",
    price: 1299, source: "sema",
    imageColor: "#111111", categoryIcon: "triangle",
    description: "0-19 degrees of adjustment. Wind tunnel validated. 60\"-span carbon fiber.",
    longDescription: "The APR GTC-500 is APR's most aggressive production wing — developed in conjunction with race engineers and validated in a professional wind tunnel. The adjustable aluminum end plates allow 0-19 degrees of angle of attack adjustment, letting you tune for maximum grip or minimum drag. The carbon fiber construction is multiple layers of 2x2 twill weave.",
    specs: { "Span": "60 inches", "Height Range": "3.75\" - 7\" above deck", "AoA Adjustment": "0-19 degrees", "Material": "Carbon Fiber (2x2 twill)", "Downforce": "Up to 500 lbs at 150 mph", "Wind Tunnel": "Validated" },
    fitment: [
      { yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" },
      { yearFrom: 2019, yearTo: 2022, make: "BMW", model: "M4" },
    ],
    options: [
      { id: "finish", label: "Carbon Finish", type: "style", choices: [
        { value: "raw-carbon", label: "Raw Carbon (UV protected)" },
        { value: "gloss-black", label: "Gloss Black Paint", priceAdj: -200 },
        { value: "matte-black", label: "Matte Black Paint", priceAdj: -200 },
        { value: "color-match", label: "Color Match (any BMW paint code)", priceAdj: 400 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 5-8 business days", dropshipMargin: 28,
    arEnabled: true, installTime: "2-3 hours", rating: 4.8, reviewCount: 187,
    tags: ["exterior", "wing", "spoiler", "apr", "carbon", "aero", "sema"],
    weight: "18 lbs", warranty: "2 Year",
  },

  /* ── INTERIOR ────────────────────────────────────────────────────── */
  {
    id: "p-recaro-sportster-cs",
    name: "Sportster CS Racing Seat",
    brand: "Recaro", supplierName: "Recaro North America", supplierId: "s-recaro",
    sku: "RECARO-410C2-RL550", partNumber: "410C2.RL550",
    category: "interior", subcategory: "Racing Seats",
    price: 1499, source: "apexx",
    imageColor: "#1A1A2E", categoryIcon: "user",
    description: "FIA-certified. Carbon fiber shell. 360° adjustable wings.",
    longDescription: "The Recaro Sportster CS is Recaro's flagship fixed-back racing seat — combining a carbon fiber shell with microfiber upholstery for the ultimate in both weight savings and comfort. FIA 8862-2009 certified for use in motorsport events. The CS variant features Recaro's signature adjustable shoulder wings that conform to your body for maximum lateral support.",
    specs: { "Shell": "Carbon Fiber", "FIA Certification": "8862-2009", "Weight": "11.9 lbs", "Shoulder Width": "390mm", "Hip Width": "340mm", "Side Bolsters": "360° adjustable" },
    fitment: [
      { yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" },
      { yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" },
    ],
    options: [
      { id: "upholstery", label: "Upholstery", type: "material", choices: [
        { value: "alcantara-black", label: "Alcantara Black" },
        { value: "alcantara-red", label: "Alcantara Black / Red Stitching", priceAdj: 80 },
        { value: "leather-black", label: "Full Leather Black" },
        { value: "carbon-black", label: "Carbon/Alcantara Combo", priceAdj: 200 },
      ]},
      { id: "mount", label: "Mounting Bracket", type: "style", choices: [
        { value: "none", label: "No Bracket (HANS only)" },
        { value: "bmw-m5", label: "BMW M5 Bracket Set", priceAdj: 180 },
        { value: "porsche-911", label: "Porsche 911 Bracket Set", priceAdj: 180 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 7-14 business days", dropshipMargin: 30,
    arEnabled: true, installTime: "2-4 hours", rating: 4.9, reviewCount: 312,
    tags: ["interior", "seat", "recaro", "racing", "fia", "carbon", "apexx"],
    weight: "11.9 lbs", warranty: "2 Year",
  },

  /* ── LIGHTING ────────────────────────────────────────────────────── */
  {
    id: "p-diode-ss3-pods",
    name: "SS3 Pro LED Light Pods (Pair)",
    brand: "Diode Dynamics", supplierName: "Diode Dynamics", supplierId: "s-diode",
    sku: "DD-SS3PRO-WW-SP", partNumber: "DD6516",
    category: "lighting", subcategory: "Auxiliary Lighting",
    price: 399, source: "api2cart", platform: "shopify",
    imageColor: "#1D4ED8", categoryIcon: "sun",
    description: "3,200 lumens per pod. SAE compliant. IP68 waterproof. 5-year warranty.",
    longDescription: "The Diode Dynamics SS3 Pro is the brightest SAE-compliant auxiliary LED pod on the market, producing 3,200 lumens from a compact 3-inch housing. Features the proprietary MSR (Multiplex Signal Reflector) that mimics halogen output characteristics for a clean, glare-free beam pattern. Available in spot, flood, or combo patterns.",
    specs: { "Output": "3,200 lumens/pod", "Color Temp": "5,000K White", "IP Rating": "IP68", "Input Voltage": "9-48V DC", "Life Span": "50,000 hours", "SAE Compliant": "J563 (fog) + J1131 (driving)" },
    fitment: [
      { yearFrom: 2015, yearTo: 2024, make: "BMW", model: "M5" },
      { yearFrom: 2015, yearTo: 2024, make: "Mercedes", model: "S580" },
      { yearFrom: 2015, yearTo: 2024, make: "Porsche", model: "911" },
    ],
    options: [
      { id: "beam", label: "Beam Pattern", type: "style", choices: [
        { value: "spot", label: "Spot (long range)" },
        { value: "flood", label: "Flood (wide area)" },
        { value: "combo", label: "Combo (spot + flood)" },
      ]},
      { id: "color", label: "Light Color", type: "color", choices: [
        { value: "white", label: "5,000K White", hex: "#FFFFFF" },
        { value: "yellow", label: "3,000K Yellow (fog)", hex: "#FFE55C" },
      ]},
    ],
    inStock: true, leadTime: "Ships in 1-2 business days", dropshipMargin: 30,
    arEnabled: true, installTime: "1-3 hours", rating: 4.8, reviewCount: 2140,
    tags: ["lighting", "led", "diode-dynamics", "pods", "auxiliary"],
    weight: "1.8 lbs", warranty: "5 Year",
  },

  /* ── AUDIO ───────────────────────────────────────────────────────── */
  {
    id: "p-jlaudio-stealthbox-bmw",
    name: "Stealthbox Subwoofer System",
    brand: "JL Audio", supplierName: "JL Audio", supplierId: "s-jlaudio",
    sku: "JLAUDIO-SB-BMW-M5-10W3V3-4", partNumber: "SB-BMW-M5-10W3V3-4",
    category: "audio", subcategory: "Subwoofers",
    price: 999, source: "apexx",
    imageColor: "#1A1A1A", categoryIcon: "volume-2",
    description: "OEM-integration. No trunk space lost. 500W RMS clean bass.",
    longDescription: "The JL Audio Stealthbox for the BMW M5 is a factory-fit subwoofer system that slides directly into the spare tire well without sacrificing any usable trunk space. Features a single 10W3v3 subwoofer, automotive-grade enclosure, and JL Audio's patented Elevated Frame Cooling technology for long-term reliability at high output.",
    specs: { "Subwoofer": "10W3v3 (10-inch W3v3 series)", "Power Handling": "500W RMS / 1,000W peak", "Enclosure": "Sealed, custom-fit", "Frequency Response": "31-200 Hz", "Sensitivity": "87.7 dB", "Installation": "No modification required" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "finish", label: "Grille Finish", type: "color", choices: [
        { value: "black", label: "Black" },
        { value: "carbon", label: "Carbon Fiber", priceAdj: 120 },
      ]},
    ],
    inStock: true, leadTime: "Ships in 3-5 business days", dropshipMargin: 25,
    arEnabled: false, installTime: "2-3 hours", rating: 4.9, reviewCount: 389,
    tags: ["audio", "subwoofer", "jl-audio", "bmw", "m5", "apexx"],
    weight: "18 lbs", warranty: "2 Year",
  },

  /* ── PERFORMANCE ─────────────────────────────────────────────────── */
  {
    id: "p-cobb-accessport-porsche",
    name: "AccessPORT V3 ECU Tuner",
    brand: "COBB Tuning", supplierName: "APR Performance", supplierId: "s-apr",
    sku: "COBB-AP3-POR-003", partNumber: "AP3-POR-003",
    category: "performance", subcategory: "ECU Tuning",
    price: 749, source: "sema",
    imageColor: "#E57B00", categoryIcon: "cpu",
    description: "OTS maps included. +90 HP on GT3 RS. Switchable on-the-fly.",
    longDescription: "The COBB AccessPORT V3 is the industry standard for Porsche ECU tuning. Includes 6 OTS (Off-The-Shelf) calibrations covering stock hardware through Stage 2. Connects directly to the OBD-II port — no permanent vehicle modification. Features a color display for data logging, fault code reading, and on-the-fly map switching. Perfect for track day preparation.",
    specs: { "Platform": "Porsche 911 GT3 / GT3 RS (992)", "HP Gain (OTS Stage 2)": "+90 HP", "Torque Gain": "+72 lb-ft", "OTS Maps": "6 included", "Data Logging": "Yes — 40+ channels", "Display": "3.5\" color touchscreen" },
    fitment: [{ yearFrom: 2020, yearTo: 2024, make: "Porsche", model: "911" }],
    options: [],
    inStock: true, leadTime: "Ships in 2-3 business days", dropshipMargin: 22,
    arEnabled: false, installTime: "15 minutes (plug and flash)", rating: 4.8, reviewCount: 1820,
    tags: ["performance", "ecu", "tuning", "cobb", "porsche", "gt3", "sema"],
    weight: "0.8 lbs", warranty: "1 Year",
  },
  {
    id: "p-mishimoto-intercooler-bmw",
    name: "Performance Intercooler Kit",
    brand: "Mishimoto", supplierName: "K&N Engineering", supplierId: "s-kn",
    sku: "MMINT-F80-14BK", partNumber: "MMINT-F80-14BK",
    category: "performance", subcategory: "Intercoolers",
    price: 899, source: "api2cart", platform: "magento",
    imageColor: "#1D4ED8", categoryIcon: "thermometer",
    description: "52% increase in core volume. -28°F charge air temps. Direct drop-in.",
    longDescription: "The Mishimoto Performance Intercooler for the BMW M5 is a direct-fit replacement for the factory unit that dramatically reduces charge air temperatures — critical for maintaining power on back-to-back runs. Features a bar-and-plate core with 52% more core volume than stock, aluminum end tanks, and powder-coated finish.",
    specs: { "Core Volume": "+52% vs OEM", "Charge Air Temp Reduction": "-28°F at 80°F ambient", "Core Type": "Bar-and-plate", "End Tanks": "Cast aluminum", "Finish": "Wrinkle black powder coat", "Pressure Test": "50 PSI" },
    fitment: [{ yearFrom: 2018, yearTo: 2024, make: "BMW", model: "M5" }],
    options: [
      { id: "finish", label: "End Tank Finish", type: "color", choices: [
        { value: "black", label: "Wrinkle Black", hex: "#1A1A1A" },
        { value: "silver", label: "Polished Silver", hex: "#C0C0C0" },
      ]},
    ],
    inStock: true, leadTime: "Ships in 2-4 business days", dropshipMargin: 20,
    arEnabled: false, installTime: "3-5 hours", rating: 4.7, reviewCount: 534,
    tags: ["performance", "intercooler", "mishimoto", "bmw", "m5", "boost"],
    weight: "14 lbs", warranty: "Lifetime",
  },
];

/* ─── In-memory cart store ───────────────────────────────────────────────── */

const CART_STORE = new Map<string, Cart>();

function getOrCreateCart(sessionId: string): Cart {
  if (!CART_STORE.has(sessionId)) {
    CART_STORE.set(sessionId, {
      sessionId,
      items: [],
      subtotal: 0,
      dropshipFee: 0,
      total: 0,
      createdAt: new Date().toISOString(),
    });
  }
  return CART_STORE.get(sessionId)!;
}

function recalcCart(cart: Cart): void {
  cart.subtotal = cart.items.reduce((s, i) => {
    const p = PRODUCTS.find((pr) => pr.id === i.productId);
    const base = (p?.salePrice ?? p?.price ?? i.price);
    const optionAdj = Object.values(i.selectedOptions).reduce((adj, val) => {
      const prod = PRODUCTS.find((pr) => pr.id === i.productId);
      for (const opt of prod?.options ?? []) {
        const choice = opt.choices.find((c) => c.value === val);
        if (choice?.priceAdj) return adj + choice.priceAdj;
      }
      return adj;
    }, 0);
    return s + (base + optionAdj) * i.quantity;
  }, 0);
  cart.dropshipFee = cart.items.length > 0 ? 24.99 : 0;
  cart.total = cart.subtotal + cart.dropshipFee;
}

/* ─── Helper: fitment check ──────────────────────────────────────────────── */

const DEMO_VEHICLES = [
  { id: "v1", year: 2021, make: "BMW",     model: "M5" },
  { id: "v2", year: 2019, make: "Mercedes", model: "S580" },
  { id: "v3", year: 2023, make: "Porsche",  model: "911 GT3" },
];

function checkFitment(product: Product, vehicleId: string): boolean {
  const v = DEMO_VEHICLES.find((v) => v.id === vehicleId);
  if (!v) return false;
  return product.fitment.some(
    (f) =>
      v.year >= f.yearFrom &&
      v.year <= f.yearTo &&
      v.make.toLowerCase() === f.make.toLowerCase() &&
      v.model.toLowerCase().includes(f.model.toLowerCase())
  );
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */

// GET /aftermarket/categories
router.get("/aftermarket/categories", (_req: Request, res: Response) => {
  const categories = [
    { id: "exhaust",     label: "Exhaust Systems",   icon: "flame",       count: PRODUCTS.filter(p => p.category === "exhaust").length,     color: "#EF4444" },
    { id: "wheels",      label: "Wheels & Rims",     icon: "circle",      count: PRODUCTS.filter(p => p.category === "wheels").length,      color: "#C9A227" },
    { id: "brakes",      label: "Brake Systems",     icon: "disc",        count: PRODUCTS.filter(p => p.category === "brakes").length,      color: "#DC2626" },
    { id: "suspension",  label: "Suspension",        icon: "settings",    count: PRODUCTS.filter(p => p.category === "suspension").length,  color: "#3B82F6" },
    { id: "intake",      label: "Intake & Air",      icon: "wind",        count: PRODUCTS.filter(p => p.category === "intake").length,      color: "#10B981" },
    { id: "exterior",    label: "Exterior & Aero",   icon: "triangle",    count: PRODUCTS.filter(p => p.category === "exterior").length,    color: "#8B5CF6" },
    { id: "interior",    label: "Interior",          icon: "user",        count: PRODUCTS.filter(p => p.category === "interior").length,    color: "#F97316" },
    { id: "lighting",    label: "Lighting",          icon: "sun",         count: PRODUCTS.filter(p => p.category === "lighting").length,    color: "#FBBF24" },
    { id: "audio",       label: "Audio & Media",     icon: "volume-2",    count: PRODUCTS.filter(p => p.category === "audio").length,       color: "#6366F1" },
    { id: "performance", label: "Performance Tuning", icon: "cpu",        count: PRODUCTS.filter(p => p.category === "performance").length, color: "#E57B00" },
  ];
  res.json({ categories, total: PRODUCTS.length, ts: new Date().toISOString() });
});

// GET /aftermarket/suppliers
router.get("/aftermarket/suppliers", (_req: Request, res: Response) => {
  res.json({ suppliers: SUPPLIERS, total: SUPPLIERS.length, ts: new Date().toISOString() });
});

// GET /aftermarket/products
router.get("/aftermarket/products", optionalAuth, (req: Request, res: Response) => {
  const { category, vehicleId, brand, source, q, arOnly, minPrice, maxPrice, page, limit } = req.query;

  let results = [...PRODUCTS];

  if (category && category !== "all") {
    results = results.filter((p) => p.category === String(category));
  }
  if (vehicleId) {
    results = results.filter((p) => checkFitment(p, String(vehicleId)));
  }
  if (brand) {
    results = results.filter((p) => p.brand.toLowerCase().includes(String(brand).toLowerCase()));
  }
  if (source) {
    results = results.filter((p) => p.source === String(source));
  }
  if (arOnly === "true") {
    results = results.filter((p) => p.arEnabled);
  }
  if (q) {
    const query = String(q).toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query))
    );
  }
  if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));

  const pageNum = Math.max(1, Number(page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(limit ?? 20)));
  const total = results.length;
  const paginated = results.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  // Annotate fitment confidence
  const annotated = paginated.map((p) => ({
    ...p,
    fitmentConfirmed: vehicleId ? checkFitment(p, String(vehicleId)) : null,
  }));

  res.json({
    products: annotated,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    filters: { category, vehicleId, brand, source, q },
    ts: new Date().toISOString(),
  });
});

// GET /aftermarket/product/:id
router.get("/aftermarket/product/:id", optionalAuth, (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const vehicleId = String(req.query["vehicleId"] ?? "");
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const supplier = SUPPLIERS.find((s) => s.id === product.supplierId);
  res.json({
    product: {
      ...product,
      fitmentConfirmed: vehicleId ? checkFitment(product, vehicleId) : null,
    },
    supplier: supplier ?? null,
    relatedProducts: PRODUCTS
      .filter((p) => p.id !== id && p.category === product.category)
      .slice(0, 4)
      .map((p) => ({ id: p.id, name: p.name, brand: p.brand, price: p.price, source: p.source, fitmentConfirmed: vehicleId ? checkFitment(p, vehicleId) : null })),
    ts: new Date().toISOString(),
  });
});

// GET /aftermarket/fitment-check
router.get("/aftermarket/fitment-check", optionalAuth, (req: Request, res: Response) => {
  const { vehicleId, productId } = req.query;
  if (!vehicleId || !productId) {
    res.status(400).json({ error: "vehicleId and productId required" });
    return;
  }
  const product = PRODUCTS.find((p) => p.id === String(productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  const fits = checkFitment(product, String(vehicleId));
  const vehicle = DEMO_VEHICLES.find((v) => v.id === String(vehicleId));
  res.json({
    fits,
    confidence: fits ? "high" : "none",
    vehicleId: String(vehicleId),
    productId: String(productId),
    vehicle: vehicle ?? null,
    message: fits
      ? `Confirmed fitment for ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`
      : `No fitment data for this vehicle/product combination`,
  });
});

// POST /aftermarket/cart/add
router.post("/aftermarket/cart/add", optionalAuth, (req: Request, res: Response) => {
  const { sessionId, productId, quantity = 1, selectedOptions = {}, vehicleId } = req.body as {
    sessionId: string; productId: string; quantity?: number;
    selectedOptions?: Record<string, string>; vehicleId?: string;
  };
  if (!sessionId || !productId) {
    res.status(400).json({ error: "sessionId and productId required" });
    return;
  }
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  if (!product.inStock) { res.status(409).json({ error: "Product out of stock" }); return; }

  const cart = getOrCreateCart(sessionId);
  const existing = cart.items.find((i) => i.productId === productId && JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions));

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, name: product.name, brand: product.brand, price: product.salePrice ?? product.price, quantity, selectedOptions, vehicleId });
  }

  recalcCart(cart);
  logger.info({ productId, sessionId }, "[aftermarket] item added to cart");
  res.json({ cart, addedProduct: product.name });
});

// GET /aftermarket/cart/:session
router.get("/aftermarket/cart/:session", optionalAuth, (req: Request, res: Response) => {
  const sessionId = String(req.params["session"] ?? "");
  const cart = CART_STORE.get(sessionId) ?? { sessionId, items: [], subtotal: 0, dropshipFee: 0, total: 0, createdAt: new Date().toISOString() };
  res.json({ cart });
});

// DELETE /aftermarket/cart/:session/:itemId
router.delete("/aftermarket/cart/:session/:itemId", optionalAuth, (req: Request, res: Response) => {
  const sessionId = String(req.params["session"] ?? "");
  const itemId    = String(req.params["itemId"] ?? "");
  const cart = CART_STORE.get(sessionId);
  if (!cart) { res.status(404).json({ error: "Cart not found" }); return; }
  cart.items = cart.items.filter((i) => i.productId !== itemId);
  recalcCart(cart);
  res.json({ cart });
});

// POST /aftermarket/order
router.post("/aftermarket/order", optionalAuth, (req: Request, res: Response) => {
  const { sessionId, shippingAddress } = req.body as { sessionId: string; shippingAddress: Record<string, string> };
  if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }
  const cart = CART_STORE.get(sessionId);
  if (!cart || cart.items.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const orderId = `ONYX-AM-${Date.now().toString(36).toUpperCase()}`;
  const orderItems = cart.items.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    const supplier = SUPPLIERS.find((s) => s.id === product?.supplierId);
    return {
      ...item,
      supplier: supplier?.name,
      leadTime: product?.leadTime,
      tracking: null,
    };
  });

  // Clear cart after order
  CART_STORE.delete(sessionId);

  logger.info({ orderId, sessionId, total: cart.total }, "[aftermarket] dropship order placed");

  res.json({
    orderId,
    status: "confirmed",
    items: orderItems,
    total: cart.total,
    shippingAddress: shippingAddress ?? null,
    estimatedDelivery: "5-10 business days",
    message: "Order confirmed. Suppliers have been notified for fulfillment.",
    note: "3C ONYX coordinates delivery directly with each supplier. You'll receive tracking information within 24 hours.",
    ts: new Date().toISOString(),
  });
});

// POST /aftermarket/customize
router.post("/aftermarket/customize", optionalAuth, (req: Request, res: Response) => {
  const { productId, vehicleId, options } = req.body as {
    productId: string; vehicleId?: string; options: Record<string, string>;
  };
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const sessionId = `cust-${productId}-${Date.now().toString(36)}`;
  const totalAdj = Object.values(options).reduce((adj, val) => {
    for (const opt of product.options) {
      const choice = opt.choices.find((c) => c.value === val);
      if (choice?.priceAdj) return adj + choice.priceAdj;
    }
    return adj;
  }, 0);

  res.json({
    sessionId,
    productId,
    vehicleId: vehicleId ?? null,
    options,
    finalPrice: (product.salePrice ?? product.price) + totalAdj,
    arEnabled: product.arEnabled,
    message: product.arEnabled ? "AR visualization ready. Load in 3C AR viewer." : "Customization saved.",
  });
});

export default router;
