import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "apparel" });

const SOVEREIGN_USER_ID = 6;
const PLATFORM_COMMISSION_RATE = 0.03;

interface ApparelProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  priceUsd: number;
  costUsd: number;
  marginPct: number;
  images: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  supplier: string;
  dropship: boolean;
  inStock: boolean;
  moq: number;
  estimatedShipDays: number;
}

const APPAREL_CATEGORIES = [
  "racing_jerseys",
  "team_jackets",
  "pit_crew_shirts",
  "snapbacks_hats",
  "hoodies",
  "graphic_tees",
  "bomber_jackets",
  "mechanic_coveralls",
  "driving_gloves",
  "motorsport_shoes",
  "windbreakers",
  "track_pants",
  "beanies",
  "bandanas",
  "sunglasses",
  "watches",
  "duffel_bags",
  "backpacks",
  "phone_cases",
  "stickers_decals",
  "lanyards",
  "keychains",
];

function generateCatalog(category?: string, query?: string): ApparelProduct[] {
  const catalog: ApparelProduct[] = [
    {
      id: "ap-001",
      name: "3C ONYX Racing Jersey — Midnight Edition",
      category: "racing_jerseys",
      description: "Full-sublimation racing jersey with 3C ONYX branding. Moisture-wicking, lightweight polyester mesh. Designed for the track and the street.",
      priceUsd: 59.99,
      costUsd: 12.50,
      marginPct: 79,
      images: [],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black/Gold", "White/Gold", "Red/Black"],
      tags: ["racing", "jersey", "sublimation", "motorsport"],
      supplier: "Alibaba — Guangzhou SportWear Co.",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 12,
    },
    {
      id: "ap-002",
      name: "ONYX Network Bomber Jacket",
      category: "bomber_jackets",
      description: "Satin bomber jacket with embroidered 3C peace sign logo on chest, GLOBAL AUTOMOTIVE LIQUIDITY NETWORK on back. MA-1 flight style.",
      priceUsd: 89.99,
      costUsd: 22.00,
      marginPct: 76,
      images: [],
      sizes: ["S", "M", "L", "XL", "2XL"],
      colors: ["Black", "Navy", "Olive"],
      tags: ["bomber", "jacket", "embroidered", "premium"],
      supplier: "Alibaba — Dongguan Prestige Garments",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 14,
    },
    {
      id: "ap-003",
      name: "Lightning Crew Snapback",
      category: "snapbacks_hats",
      description: "Structured 6-panel snapback with 3/C logo front, 'Lightning doesn't wait' embroidered side. Premium wool blend.",
      priceUsd: 34.99,
      costUsd: 5.80,
      marginPct: 83,
      images: [],
      sizes: ["One Size"],
      colors: ["Black/Gold", "White/Black", "Camo"],
      tags: ["snapback", "hat", "headwear", "logo"],
      supplier: "Alibaba — Yiwu Crown Caps",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 10,
    },
    {
      id: "ap-004",
      name: "Pit Crew Heavyweight Hoodie",
      category: "hoodies",
      description: "14oz heavyweight cotton hoodie. Oversized fit, dropped shoulders. Back print: peace sign logo with ONYX protocol text.",
      priceUsd: 74.99,
      costUsd: 18.00,
      marginPct: 76,
      images: [],
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black", "Charcoal", "Cream"],
      tags: ["hoodie", "heavyweight", "streetwear", "premium"],
      supplier: "Alibaba — Shenzhen UrbanWear",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 14,
    },
    {
      id: "ap-005",
      name: "ONYX Motorsport Graphic Tee",
      category: "graphic_tees",
      description: "Premium cotton tee with large back print — vintage motorsport poster style featuring the 3C logo, circuit map, and tagline.",
      priceUsd: 39.99,
      costUsd: 7.50,
      marginPct: 81,
      images: [],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black", "White", "Vintage Wash"],
      tags: ["tee", "graphic", "motorsport", "streetwear"],
      supplier: "Alibaba — Guangzhou PrintHouse",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 10,
    },
    {
      id: "ap-006",
      name: "Mechanic Coverall — Club Edition",
      category: "mechanic_coveralls",
      description: "Full-body mechanic coverall. Custom name patch slot, 3C ONYX chest logo, reflective trim. Built for the garage.",
      priceUsd: 79.99,
      costUsd: 16.00,
      marginPct: 80,
      images: [],
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black", "Navy", "Charcoal"],
      tags: ["coverall", "mechanic", "workwear", "garage"],
      supplier: "Alibaba — Dongguan WorkPro",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 14,
    },
    {
      id: "ap-007",
      name: "ONYX Track Pants — Tapered Fit",
      category: "track_pants",
      description: "Tapered jogger-style track pants with gold side stripe and 3C embroidery on left thigh. Zippered ankle.",
      priceUsd: 54.99,
      costUsd: 11.00,
      marginPct: 80,
      images: [],
      sizes: ["S", "M", "L", "XL", "2XL"],
      colors: ["Black/Gold", "Grey/White"],
      tags: ["track_pants", "joggers", "athleisure", "motorsport"],
      supplier: "Alibaba — Shenzhen UrbanWear",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 12,
    },
    {
      id: "ap-008",
      name: "Driving Gloves — Perforated Leather",
      category: "driving_gloves",
      description: "Italian-style perforated leather driving gloves with knuckle holes. Gold snap closure with 3C stamp.",
      priceUsd: 44.99,
      costUsd: 8.50,
      marginPct: 81,
      images: [],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Tan", "Racing Red"],
      tags: ["gloves", "driving", "leather", "luxury"],
      supplier: "Alibaba — Hebei LeatherCraft",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 14,
    },
    {
      id: "ap-009",
      name: "ONYX Windbreaker — Reflective",
      category: "windbreakers",
      description: "Ultralight nylon windbreaker with full reflective 3C logo on back. Packable into chest pocket. Water-resistant.",
      priceUsd: 64.99,
      costUsd: 13.00,
      marginPct: 80,
      images: [],
      sizes: ["S", "M", "L", "XL", "2XL"],
      colors: ["Black", "Neon Green/Black"],
      tags: ["windbreaker", "reflective", "lightweight", "outerwear"],
      supplier: "Alibaba — Guangzhou SportWear Co.",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 12,
    },
    {
      id: "ap-010",
      name: "Network Member Lanyard + Badge Holder",
      category: "lanyards",
      description: "Woven lanyard with 'GLOBAL AUTOMOTIVE LIQUIDITY NETWORK' text. Includes hard-shell badge holder for Paramount Access credential.",
      priceUsd: 14.99,
      costUsd: 1.80,
      marginPct: 88,
      images: [],
      sizes: ["One Size"],
      colors: ["Black/Gold"],
      tags: ["lanyard", "badge", "credential", "accessory"],
      supplier: "Alibaba — Yiwu Crown Caps",
      dropship: true,
      inStock: true,
      moq: 1,
      estimatedShipDays: 8,
    },
  ];

  let filtered = catalog;

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
    );
  }

  return filtered;
}

router.get("/catalog", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;
    const products = generateCatalog(category, query);

    res.json({
      products,
      total: products.length,
      categories: APPAREL_CATEGORIES,
      commissionRate: PLATFORM_COMMISSION_RATE,
      message: "Motorsport-inspired. Culture-driven. Dropship direct.",
    });
  } catch (err) {
    log.error({ err }, "Catalog fetch failed");
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

router.get("/catalog/:productId", async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const products = generateCatalog();
    const product = products.find(p => p.id === productId);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/order", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { productId, size, color, quantity, shippingAddress } = req.body;

    if (!productId || !size || !quantity) {
      res.status(400).json({ error: "productId, size, and quantity required" });
      return;
    }

    const products = generateCatalog();
    const product = products.find(p => p.id === productId);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const totalUsd = product.priceUsd * (quantity || 1);
    const commissionUsd = totalUsd * PLATFORM_COMMISSION_RATE;

    log.info({ userId, productId, totalUsd, commissionUsd }, "Apparel order placed");

    res.json({
      success: true,
      order: {
        orderId: "APR-" + Date.now().toString(36).toUpperCase(),
        productId,
        productName: product.name,
        size,
        color: color || product.colors[0],
        quantity: quantity || 1,
        totalUsd,
        commissionUsd,
        estimatedShipDays: product.estimatedShipDays,
        status: "pending_payment",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    log.error({ err }, "Order failed");
    res.status(500).json({ error: "Order failed" });
  }
});

router.get("/categories", async (_req: Request, res: Response) => {
  res.json({ categories: APPAREL_CATEGORIES });
});

export default router;
