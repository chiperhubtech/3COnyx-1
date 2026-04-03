import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "entertainment" });

const PLATFORM_COMMISSION_RATE = 0.03;

interface EntertainmentProduct {
  id: string;
  name: string;
  provider: string;
  category: "music_streaming" | "satellite_radio" | "podcast" | "audiobook";
  description: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number | null;
  commissionPct: number;
  trialDays: number;
  features: string[];
  affiliateUrl: string | null;
  logoColor: string;
  tags: string[];
}

const CATALOG: EntertainmentProduct[] = [
  {
    id: "ent-spotify-premium",
    name: "Spotify Premium",
    provider: "Spotify",
    category: "music_streaming",
    description: "Ad-free music, offline downloads, high-quality audio. 100M+ tracks. Perfect for every ride — hip-hop, rock, country, Latin, electronic, whatever moves you.",
    monthlyPriceUsd: 11.99,
    annualPriceUsd: 119.99,
    commissionPct: 3,
    trialDays: 30,
    features: ["Ad-free listening", "Offline downloads", "High-quality audio", "Spotify Connect for car systems", "Personalized playlists", "Podcasts included"],
    affiliateUrl: null,
    logoColor: "#1DB954",
    tags: ["music", "streaming", "premium", "all_genres"],
  },
  {
    id: "ent-spotify-duo",
    name: "Spotify Premium Duo",
    provider: "Spotify",
    category: "music_streaming",
    description: "Two Premium accounts for couples living together. Duo Mix playlist made for both of you.",
    monthlyPriceUsd: 16.99,
    annualPriceUsd: null,
    commissionPct: 3,
    trialDays: 30,
    features: ["2 Premium accounts", "Duo Mix playlist", "Ad-free listening", "Offline downloads"],
    affiliateUrl: null,
    logoColor: "#1DB954",
    tags: ["music", "streaming", "duo", "couples"],
  },
  {
    id: "ent-spotify-family",
    name: "Spotify Premium Family",
    provider: "Spotify",
    category: "music_streaming",
    description: "Six Premium accounts for the whole family. Spotify Kids included. Block explicit content for the little ones.",
    monthlyPriceUsd: 19.99,
    annualPriceUsd: null,
    commissionPct: 3,
    trialDays: 30,
    features: ["6 Premium accounts", "Spotify Kids", "Block explicit music", "Family Mix playlist", "Each member gets their own profile"],
    affiliateUrl: null,
    logoColor: "#1DB954",
    tags: ["music", "streaming", "family"],
  },
  {
    id: "ent-siriusxm-platinum",
    name: "SiriusXM Platinum",
    provider: "SiriusXM",
    category: "satellite_radio",
    description: "425+ channels. Howard Stern, every NFL/NBA/MLB game, ad-free music channels, comedy, news. Works in your car, on your phone, at home.",
    monthlyPriceUsd: 13.99,
    annualPriceUsd: 149.99,
    commissionPct: 3,
    trialDays: 90,
    features: ["425+ channels", "Howard Stern", "Every major sport live", "Ad-free music channels", "Car + phone + home", "Offline listening"],
    affiliateUrl: null,
    logoColor: "#0000EB",
    tags: ["radio", "satellite", "sports", "talk", "premium"],
  },
  {
    id: "ent-siriusxm-music",
    name: "SiriusXM Music & Entertainment",
    provider: "SiriusXM",
    category: "satellite_radio",
    description: "340+ channels of music, talk, sports. Perfect for long rides and daily commutes. Ad-free music all day.",
    monthlyPriceUsd: 10.99,
    annualPriceUsd: 109.99,
    commissionPct: 3,
    trialDays: 90,
    features: ["340+ channels", "Ad-free music", "Sports coverage", "Talk & comedy", "Works in most vehicles"],
    affiliateUrl: null,
    logoColor: "#0000EB",
    tags: ["radio", "satellite", "music", "commute"],
  },
  {
    id: "ent-siriusxm-essential",
    name: "SiriusXM Essential Streaming",
    provider: "SiriusXM",
    category: "satellite_radio",
    description: "Stream-only plan. 300+ channels on your phone and connected devices. No satellite hardware needed.",
    monthlyPriceUsd: 8.99,
    annualPriceUsd: 99.99,
    commissionPct: 3,
    trialDays: 90,
    features: ["300+ channels", "Phone streaming", "No hardware needed", "Personalized stations", "Podcasts"],
    affiliateUrl: null,
    logoColor: "#0000EB",
    tags: ["radio", "streaming", "budget", "phone"],
  },
  {
    id: "ent-apple-music-individual",
    name: "Apple Music Individual",
    provider: "Apple Music",
    category: "music_streaming",
    description: "100M+ songs, lossless audio, spatial audio with Dolby Atmos. Seamless with CarPlay. The premium listening experience.",
    monthlyPriceUsd: 10.99,
    annualPriceUsd: 109.99,
    commissionPct: 3,
    trialDays: 30,
    features: ["100M+ songs", "Lossless audio", "Spatial Audio / Dolby Atmos", "CarPlay integration", "Music videos", "Live radio stations", "Offline downloads"],
    affiliateUrl: null,
    logoColor: "#FA243C",
    tags: ["music", "streaming", "lossless", "apple", "premium"],
  },
  {
    id: "ent-apple-music-family",
    name: "Apple Music Family",
    provider: "Apple Music",
    category: "music_streaming",
    description: "Six accounts for the whole family. Lossless audio, spatial audio, Apple Music Sing. Everyone gets their own library.",
    monthlyPriceUsd: 16.99,
    annualPriceUsd: 169.99,
    commissionPct: 3,
    trialDays: 30,
    features: ["6 accounts", "Lossless audio", "Spatial Audio", "Apple Music Sing", "CarPlay", "Family sharing"],
    affiliateUrl: null,
    logoColor: "#FA243C",
    tags: ["music", "streaming", "family", "apple"],
  },
  {
    id: "ent-pandora-premium",
    name: "Pandora Premium",
    provider: "Pandora",
    category: "music_streaming",
    description: "On-demand music + personalized radio. Search and play any song, build playlists, download for offline. The OG of personalized music.",
    monthlyPriceUsd: 10.99,
    annualPriceUsd: 109.99,
    commissionPct: 3,
    trialDays: 30,
    features: ["On-demand playback", "Personalized radio stations", "Unlimited skips", "Offline listening", "Higher quality audio", "No ads"],
    affiliateUrl: null,
    logoColor: "#3668FF",
    tags: ["music", "streaming", "radio", "personalized"],
  },
  {
    id: "ent-pandora-plus",
    name: "Pandora Plus",
    provider: "Pandora",
    category: "music_streaming",
    description: "Ad-free personalized radio. Unlimited skips, replays, offline stations. Perfect for driving — just turn it on and go.",
    monthlyPriceUsd: 4.99,
    annualPriceUsd: 54.99,
    commissionPct: 3,
    trialDays: 30,
    features: ["Ad-free radio", "Unlimited skips", "Unlimited replays", "Offline stations", "Higher quality audio"],
    affiliateUrl: null,
    logoColor: "#3668FF",
    tags: ["music", "radio", "budget", "driving"],
  },
  {
    id: "ent-pandora-family",
    name: "Pandora Premium Family",
    provider: "Pandora",
    category: "music_streaming",
    description: "Six Premium accounts for the family. Everyone gets their own personalized experience. Ad-free, on-demand, unlimited.",
    monthlyPriceUsd: 16.99,
    annualPriceUsd: null,
    commissionPct: 3,
    trialDays: 30,
    features: ["6 Premium accounts", "On-demand playback", "Personalized radio", "No ads", "Offline listening"],
    affiliateUrl: null,
    logoColor: "#3668FF",
    tags: ["music", "streaming", "family", "pandora"],
  },
];

router.get("/catalog", async (req: Request, res: Response) => {
  try {
    const provider = req.query.provider as string | undefined;
    const category = req.query.category as string | undefined;

    let products = CATALOG;
    if (provider) products = products.filter(p => p.provider.toLowerCase() === provider.toLowerCase());
    if (category) products = products.filter(p => p.category === category);

    res.json({
      products,
      total: products.length,
      providers: ["Spotify", "SiriusXM", "Apple Music", "Pandora"],
      categories: ["music_streaming", "satellite_radio"],
      commissionRate: PLATFORM_COMMISSION_RATE,
      message: "Music for every ride. Subscribe through the network — we all eat.",
    });
  } catch (err) {
    log.error({ err }, "Entertainment catalog failed");
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

router.get("/catalog/:productId", async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const product = CATALOG.find(p => p.id === productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/subscribe", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { productId, plan } = req.body;

    if (!productId) {
      res.status(400).json({ error: "productId required" });
      return;
    }

    const product = CATALOG.find(p => p.id === productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const isAnnual = plan === "annual" && product.annualPriceUsd;
    const priceUsd = isAnnual ? product.annualPriceUsd! : product.monthlyPriceUsd;
    const commissionUsd = priceUsd * (product.commissionPct / 100);

    log.info({ userId, productId, priceUsd, commissionUsd, plan: isAnnual ? "annual" : "monthly" }, "Entertainment subscription initiated");

    res.json({
      success: true,
      subscription: {
        subscriptionId: "ENT-" + Date.now().toString(36).toUpperCase(),
        productId,
        productName: product.name,
        provider: product.provider,
        plan: isAnnual ? "annual" : "monthly",
        priceUsd,
        commissionUsd,
        trialDays: product.trialDays,
        status: "pending_payment",
        createdAt: new Date().toISOString(),
      },
      message: product.trialDays > 0
        ? `${product.trialDays}-day free trial activated. Enjoy the ride.`
        : "Subscription started. Enjoy the ride.",
    });
  } catch (err) {
    log.error({ err }, "Subscription failed");
    res.status(500).json({ error: "Subscription failed" });
  }
});

export default router;
