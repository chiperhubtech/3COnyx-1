import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";

const router = Router();

interface CustomizationProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  priceRange: { min: number; max: number };
  laborEstimate: string;
  popular: boolean;
  fleetAvailable: boolean;
  imageHint: string;
}

const CUSTOMIZATION_CATALOG: CustomizationProduct[] = [
  { id: "wrap-full-color", name: "Full Vehicle Wrap — Color Change", description: "Complete color transformation with premium cast vinyl. Matte, gloss, satin, or chrome finishes. Protects original paint.", category: "Wraps & Graphics", subcategory: "Color Wraps", priceRange: { min: 2500, max: 6000 }, laborEstimate: "2-4 days", popular: true, fleetAvailable: true, imageHint: "vinyl-wrap" },
  { id: "wrap-partial", name: "Partial Wrap / Accent Wrap", description: "Roof, hood, mirrors, or custom accent panels. Make a statement without full commitment.", category: "Wraps & Graphics", subcategory: "Color Wraps", priceRange: { min: 500, max: 1500 }, laborEstimate: "1-2 days", popular: false, fleetAvailable: true, imageHint: "partial-wrap" },
  { id: "wrap-fleet-branding", name: "Fleet Branding Package", description: "Company logos, contact info, and branding for your entire fleet. Volume pricing available. Design included.", category: "Wraps & Graphics", subcategory: "Commercial", priceRange: { min: 800, max: 3500 }, laborEstimate: "1-3 days per vehicle", popular: true, fleetAvailable: true, imageHint: "fleet-wrap" },
  { id: "wrap-ppf", name: "Paint Protection Film (PPF)", description: "Clear bra / XPEL / 3M — self-healing protection for high-impact areas or full body.", category: "Wraps & Graphics", subcategory: "Protection", priceRange: { min: 800, max: 7000 }, laborEstimate: "1-3 days", popular: true, fleetAvailable: true, imageHint: "ppf" },
  { id: "wrap-ceramic", name: "Ceramic Coating", description: "Professional-grade 9H ceramic coating. Hydrophobic, UV protection, extreme gloss. 2-5 year durability.", category: "Wraps & Graphics", subcategory: "Protection", priceRange: { min: 500, max: 2000 }, laborEstimate: "1-2 days", popular: true, fleetAvailable: true, imageHint: "ceramic" },

  { id: "wheels-alloy", name: "Custom Alloy Wheels", description: "Forged or flow-formed alloy wheels. 17\"–24\". Brands: Vossen, HRE, Rotiform, Fuel, and more.", category: "Wheels & Tires", subcategory: "Wheels", priceRange: { min: 1200, max: 8000 }, laborEstimate: "2-4 hours", popular: true, fleetAvailable: false, imageHint: "alloy-wheels" },
  { id: "wheels-offroad", name: "Off-Road Wheels & Tires Package", description: "Aggressive off-road wheels + all-terrain or mud-terrain tires. Lift-compatible sizing.", category: "Wheels & Tires", subcategory: "Wheels", priceRange: { min: 2000, max: 6000 }, laborEstimate: "3-4 hours", popular: true, fleetAvailable: true, imageHint: "offroad-wheels" },
  { id: "wheels-tires", name: "Performance Tire Package", description: "High-performance summer, all-season, or winter tires. Mounted, balanced, and aligned.", category: "Wheels & Tires", subcategory: "Tires", priceRange: { min: 600, max: 3000 }, laborEstimate: "1-2 hours", popular: false, fleetAvailable: true, imageHint: "tires" },
  { id: "wheels-spacers", name: "Wheel Spacers & Adapters", description: "Precision-machined hub-centric spacers for wider stance and proper fitment.", category: "Wheels & Tires", subcategory: "Accessories", priceRange: { min: 150, max: 500 }, laborEstimate: "1 hour", popular: false, fleetAvailable: false, imageHint: "spacers" },

  { id: "int-leather", name: "Custom Leather Interior", description: "Full leather upholstery — seats, door panels, center console. Italian or synthetic leather. Color-matched stitching.", category: "Interior", subcategory: "Upholstery", priceRange: { min: 2000, max: 8000 }, laborEstimate: "3-5 days", popular: true, fleetAvailable: false, imageHint: "leather" },
  { id: "int-seats", name: "Heated / Cooled Seat Conversion", description: "Add heating and ventilation to factory seats. OEM-level integration.", category: "Interior", subcategory: "Comfort", priceRange: { min: 400, max: 1200 }, laborEstimate: "4-6 hours", popular: true, fleetAvailable: true, imageHint: "heated-seats" },
  { id: "int-trim", name: "Carbon Fiber / Wood Trim Kit", description: "Replace factory trim with real carbon fiber, alcantara, or wood veneer throughout cabin.", category: "Interior", subcategory: "Trim", priceRange: { min: 500, max: 3000 }, laborEstimate: "1-2 days", popular: false, fleetAvailable: false, imageHint: "trim" },
  { id: "int-floormats", name: "Premium Floor Mats & Liners", description: "WeatherTech, Husky, or custom-fit laser-measured liners. Full cabin + cargo.", category: "Interior", subcategory: "Protection", priceRange: { min: 150, max: 500 }, laborEstimate: "Same day", popular: true, fleetAvailable: true, imageHint: "floormats" },
  { id: "int-steering", name: "Custom Steering Wheel", description: "Carbon fiber, flat-bottom, alcantara, or heated steering wheel upgrade.", category: "Interior", subcategory: "Controls", priceRange: { min: 300, max: 1500 }, laborEstimate: "2-3 hours", popular: false, fleetAvailable: false, imageHint: "steering" },

  { id: "ext-sidesteps", name: "Side Steps / Running Boards", description: "Power-deploying, fixed, or rock slider side steps. OEM or aftermarket fit.", category: "Exterior", subcategory: "Steps & Rails", priceRange: { min: 300, max: 2000 }, laborEstimate: "2-3 hours", popular: true, fleetAvailable: true, imageHint: "sidesteps" },
  { id: "ext-grille", name: "Custom Grille", description: "Mesh, billet, or branded replacement grille. Includes paint-match option.", category: "Exterior", subcategory: "Front End", priceRange: { min: 200, max: 1200 }, laborEstimate: "1-2 hours", popular: true, fleetAvailable: false, imageHint: "grille" },
  { id: "ext-bumper", name: "Aftermarket Bumper", description: "Steel or aluminum front/rear bumper upgrade with winch mount and D-ring provisions.", category: "Exterior", subcategory: "Protection", priceRange: { min: 600, max: 3000 }, laborEstimate: "3-5 hours", popular: false, fleetAvailable: false, imageHint: "bumper" },
  { id: "ext-fender", name: "Fender Flares", description: "Pocket-style, OE-style, or bolt-on fender flares for wider tire coverage.", category: "Exterior", subcategory: "Body", priceRange: { min: 300, max: 1000 }, laborEstimate: "2-3 hours", popular: false, fleetAvailable: false, imageHint: "flares" },
  { id: "ext-spoiler", name: "Rear Spoiler / Wing", description: "Factory-style or performance spoiler. Includes paint-match.", category: "Exterior", subcategory: "Aero", priceRange: { min: 200, max: 800 }, laborEstimate: "1-2 hours", popular: false, fleetAvailable: false, imageHint: "spoiler" },
  { id: "ext-bedliner", name: "Spray-In Bed Liner", description: "LINE-X or Rhino Liner — permanent bed protection for trucks. Lifetime warranty.", category: "Exterior", subcategory: "Truck", priceRange: { min: 400, max: 800 }, laborEstimate: "1 day", popular: true, fleetAvailable: true, imageHint: "bedliner" },
  { id: "ext-rack", name: "Roof Rack / Cargo System", description: "Thule, Yakima, or custom rack system. Bike, kayak, ski, and cargo mounts.", category: "Exterior", subcategory: "Cargo", priceRange: { min: 300, max: 1500 }, laborEstimate: "1-2 hours", popular: false, fleetAvailable: true, imageHint: "roofrack" },
  { id: "ext-tint", name: "Window Tint", description: "Ceramic or carbon window film. Legal tint levels. UV and heat rejection.", category: "Exterior", subcategory: "Glass", priceRange: { min: 200, max: 600 }, laborEstimate: "2-3 hours", popular: true, fleetAvailable: true, imageHint: "tint" },

  { id: "light-led", name: "LED Headlight Conversion", description: "Factory halogen to LED upgrade. Projector or reflector compatible. DOT approved.", category: "Lighting", subcategory: "Headlights", priceRange: { min: 200, max: 1200 }, laborEstimate: "1-3 hours", popular: true, fleetAvailable: true, imageHint: "led" },
  { id: "light-bar", name: "LED Light Bar", description: "20\"–50\" light bar with roof or bumper mount. Spot, flood, or combo beam.", category: "Lighting", subcategory: "Auxiliary", priceRange: { min: 150, max: 800 }, laborEstimate: "2-3 hours", popular: true, fleetAvailable: true, imageHint: "lightbar" },
  { id: "light-underglow", name: "Underglow / Accent Lighting", description: "RGB LED accent lighting — underbody, interior, or wheel well. App-controlled.", category: "Lighting", subcategory: "Accent", priceRange: { min: 100, max: 500 }, laborEstimate: "2-4 hours", popular: false, fleetAvailable: false, imageHint: "underglow" },

  { id: "audio-system", name: "Premium Audio System", description: "Full stereo upgrade — head unit, speakers, amplifier, and subwoofer. JL Audio, Focal, Kicker.", category: "Audio & Electronics", subcategory: "Sound", priceRange: { min: 800, max: 5000 }, laborEstimate: "1-2 days", popular: true, fleetAvailable: false, imageHint: "audio" },
  { id: "audio-carplay", name: "Apple CarPlay / Android Auto", description: "Add wireless CarPlay/AA to any vehicle. Retains factory controls.", category: "Audio & Electronics", subcategory: "Integration", priceRange: { min: 200, max: 800 }, laborEstimate: "2-4 hours", popular: true, fleetAvailable: true, imageHint: "carplay" },
  { id: "audio-dashcam", name: "Dash Cam / Security System", description: "Front + rear dash cam with parking mode. Cloud-connected option available.", category: "Audio & Electronics", subcategory: "Security", priceRange: { min: 150, max: 800 }, laborEstimate: "1-2 hours", popular: true, fleetAvailable: true, imageHint: "dashcam" },
  { id: "audio-remote", name: "Remote Start System", description: "OEM-integrated remote start with smartphone app. Works with push-button or key.", category: "Audio & Electronics", subcategory: "Convenience", priceRange: { min: 200, max: 600 }, laborEstimate: "2-3 hours", popular: true, fleetAvailable: true, imageHint: "remote" },

  { id: "perf-exhaust", name: "Performance Exhaust System", description: "Cat-back, axle-back, or headers. Brands: Borla, MagnaFlow, Flowmaster, AWE.", category: "Performance", subcategory: "Exhaust", priceRange: { min: 400, max: 3000 }, laborEstimate: "2-4 hours", popular: true, fleetAvailable: false, imageHint: "exhaust" },
  { id: "perf-intake", name: "Cold Air Intake", description: "High-flow air intake system. Improves throttle response and sound. K&N, AEM, AFE.", category: "Performance", subcategory: "Engine", priceRange: { min: 200, max: 600 }, laborEstimate: "1-2 hours", popular: true, fleetAvailable: false, imageHint: "intake" },
  { id: "perf-suspension", name: "Suspension Lift / Lowering Kit", description: "2\"–6\" lift kits for trucks/SUVs or lowering springs/coilovers for cars.", category: "Performance", subcategory: "Suspension", priceRange: { min: 500, max: 4000 }, laborEstimate: "4-8 hours", popular: true, fleetAvailable: false, imageHint: "suspension" },
  { id: "perf-tune", name: "ECU Tune / Performance Chip", description: "Custom dyno tune or plug-in performance module. Horsepower and torque gains.", category: "Performance", subcategory: "Tuning", priceRange: { min: 300, max: 1500 }, laborEstimate: "1-3 hours", popular: false, fleetAvailable: false, imageHint: "tune" },
  { id: "perf-brakes", name: "Big Brake Kit", description: "Upgraded rotors, calipers, and pads. Brembo, Wilwood, or StopTech.", category: "Performance", subcategory: "Brakes", priceRange: { min: 800, max: 4000 }, laborEstimate: "3-5 hours", popular: false, fleetAvailable: false, imageHint: "brakes" },
];

function requireUserId(req: Request, res: Response): number | null {
  const sub = (req as any).user?.sub ?? (req as any).userId;
  if (!sub) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const id = parseInt(String(sub), 10);
  if (!Number.isFinite(id)) { res.status(401).json({ error: "Invalid user identity" }); return null; }
  return id;
}

router.get("/customize/catalog", requireAuth, async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || "";
    const fleetOnly = req.query.fleet === "true";
    const search = (req.query.search as string) || "";

    let items = [...CUSTOMIZATION_CATALOG];

    if (category) {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (fleetOnly) {
      items = items.filter(i => i.fleetAvailable);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        (i.name + " " + i.description + " " + i.category + " " + i.subcategory)
          .toLowerCase().includes(q)
      );
    }

    const categories = [...new Set(CUSTOMIZATION_CATALOG.map(i => i.category))];
    const popularItems = CUSTOMIZATION_CATALOG.filter(i => i.popular);

    res.json({
      items,
      total: items.length,
      categories,
      popularCount: popularItems.length,
    });
  } catch {
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

router.post("/customize/quote", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { items, vehicleInfo, isFleet, fleetSize, notes } = req.body as {
      items: string[];
      vehicleInfo?: { make?: string; model?: string; year?: number; vin?: string };
      isFleet?: boolean;
      fleetSize?: number;
      notes?: string;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "At least one item is required" });
      return;
    }

    const selectedProducts = items
      .map(id => CUSTOMIZATION_CATALOG.find(p => p.id === id))
      .filter(Boolean) as CustomizationProduct[];

    if (selectedProducts.length === 0) {
      res.status(400).json({ error: "No valid products selected" });
      return;
    }

    const vehicleCount = isFleet && fleetSize ? Math.max(1, fleetSize) : 1;
    const fleetDiscount = vehicleCount >= 10 ? 0.15 : vehicleCount >= 5 ? 0.10 : vehicleCount >= 3 ? 0.05 : 0;

    const lineItems = selectedProducts.map(p => {
      const basePrice = Math.round((p.priceRange.min + p.priceRange.max) / 2);
      const perVehicle = Math.round(basePrice * (1 - fleetDiscount));
      return {
        productId: p.id,
        name: p.name,
        category: p.category,
        basePrice,
        discount: fleetDiscount > 0 ? `${Math.round(fleetDiscount * 100)}% fleet discount` : null,
        perVehiclePrice: perVehicle,
        totalPrice: perVehicle * vehicleCount,
        laborEstimate: p.laborEstimate,
      };
    });

    const subtotal = lineItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const platformFee = Math.round(subtotal * 0.03);
    const total = subtotal + platformFee;

    const quoteNumber = `CQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    await writeAudit({
      eventType: "API_CALL",
      action: `Customization quote generated: ${quoteNumber} — ${selectedProducts.length} items, ${vehicleCount} vehicle(s), total $${total.toLocaleString()}`,
      actorId: userId,
      severity: "INFO",
    });

    res.json({
      quoteNumber,
      vehicleInfo: vehicleInfo || null,
      isFleet: !!isFleet,
      vehicleCount,
      lineItems,
      subtotal,
      platformFee,
      total,
      fleetDiscount: fleetDiscount > 0 ? `${Math.round(fleetDiscount * 100)}%` : null,
      estimatedTimeline: selectedProducts.length > 3 ? "1-2 weeks" : selectedProducts.length > 1 ? "3-7 days" : selectedProducts[0]?.laborEstimate || "1-3 days",
      validFor: "30 days",
      createdAt: new Date().toISOString(),
      notes: notes || null,
    });
  } catch {
    res.status(500).json({ error: "Failed to generate quote" });
  }
});

router.get("/customize/categories", requireAuth, async (_req: Request, res: Response) => {
  const cats = [...new Set(CUSTOMIZATION_CATALOG.map(i => i.category))];
  const result = cats.map(cat => {
    const items = CUSTOMIZATION_CATALOG.filter(i => i.category === cat);
    const subcats = [...new Set(items.map(i => i.subcategory))];
    return {
      name: cat,
      count: items.length,
      subcategories: subcats,
      priceRange: {
        min: Math.min(...items.map(i => i.priceRange.min)),
        max: Math.max(...items.map(i => i.priceRange.max)),
      },
      fleetCount: items.filter(i => i.fleetAvailable).length,
    };
  });
  res.json({ categories: result });
});

export default router;
