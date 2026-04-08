import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

interface FeedItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceType: "news" | "social" | "recall" | "market" | "video";
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  category: string;
  engagement?: { upvotes?: number; comments?: number };
}

interface CacheEntry {
  data: FeedItem[];
  ts: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000;

function cached(key: string): FeedItem[] | null {
  const e = cache[key];
  if (e && Date.now() - e.ts < CACHE_TTL) return e.data;
  return null;
}

function setCache(key: string, data: FeedItem[]) {
  cache[key] = { data, ts: Date.now() };
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
    return undefined;
  } catch {
    return undefined;
  }
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`).exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);
  return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i").exec(xml);
  return match ? match[1] : "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").trim();
}

function extractImageFromHtml(html: string): string | undefined {
  const m = /<img[^>]+src="([^"]+)"/.exec(html);
  return m ? m[1] : undefined;
}

async function fetchGoogleNewsAuto(): Promise<FeedItem[]> {
  const hit = cached("google-news");
  if (hit) return hit;

  try {
    const urls = [
      "https://news.google.com/rss/search?q=automotive+industry+cars&hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/search?q=electric+vehicles+EV+news&hl=en-US&gl=US&ceid=US:en",
    ];

    const results: FeedItem[] = [];
    for (const url of urls) {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; 3CONYX/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (!resp.ok) continue;
        const xml = await resp.text();

        const items = xml.split("<item>").slice(1);
        for (const item of items.slice(0, 8)) {
          const title = stripHtml(extractTag(item, "title"));
          const link = extractTag(item, "link");
          const pubDate = extractTag(item, "pubDate");
          const desc = stripHtml(extractTag(item, "description"));
          const src = extractTag(item, "source") || "Google News";

          if (title && link) {
            results.push({
              id: `gn-${Buffer.from(link).toString("base64url").slice(0, 16)}`,
              title,
              description: desc.slice(0, 280),
              url: link,
              source: src,
              sourceType: "news",
              publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              category: title.toLowerCase().includes("electric") || title.toLowerCase().includes("ev")
                ? "EV & Tech" : title.toLowerCase().includes("recall")
                ? "Recalls" : "Breaking News",
            });
          }
        }
      } catch {}
    }

    setCache("google-news", results);
    return results;
  } catch {
    return [];
  }
}

async function fetchRedditAutomotive(): Promise<FeedItem[]> {
  const hit = cached("reddit");
  if (hit) return hit;

  const subreddits = ["cars", "Autos", "electricvehicles", "whatcarshouldIbuy", "MechanicAdvice", "CarMods"];
  const results: FeedItem[] = [];

  for (const sub of subreddits) {
    try {
      const resp = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=6`, {
        headers: { "User-Agent": "3CONYX:v1.0 (by /u/3conyx)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) continue;
      const data = await resp.json() as any;

      for (const post of (data?.data?.children || [])) {
        const d = post.data;
        if (!d || d.stickied || d.over_18) continue;

        const imageUrl = d.thumbnail && d.thumbnail.startsWith("http") ? d.thumbnail : undefined;

        results.push({
          id: `reddit-${d.id}`,
          title: d.title,
          description: (d.selftext || "").slice(0, 280) || `Posted in r/${sub}`,
          url: `https://reddit.com${d.permalink}`,
          source: `r/${sub}`,
          sourceType: "social",
          imageUrl: d.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") || imageUrl,
          author: d.author,
          publishedAt: new Date(d.created_utc * 1000).toISOString(),
          category: sub === "electricvehicles" ? "EV & Tech"
            : sub === "MechanicAdvice" ? "Service & Repair"
            : sub === "whatcarshouldIbuy" ? "Buying Guide"
            : sub === "CarMods" ? "Mods & Culture"
            : "Community",
          engagement: { upvotes: d.ups, comments: d.num_comments },
        });
      }
    } catch {}
  }

  setCache("reddit", results);
  return results;
}

async function fetchNHTSARecalls(): Promise<FeedItem[]> {
  const hit = cached("nhtsa");
  if (hit) return hit;

  try {
    const currentYear = new Date().getFullYear();
    const resp = await fetch(
      `https://api.nhtsa.dot.gov/recalls/recallsByYear?year=${currentYear}&type=vehicle`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    const recalls = (data?.results || []).slice(0, 12);

    const results: FeedItem[] = recalls.map((r: any, i: number) => ({
      id: `nhtsa-${r.NHTSACampaignNumber || i}`,
      title: `RECALL: ${r.Manufacturer || "Unknown"} — ${r.Subject || "Safety Issue"}`,
      description: (r.Summary || r.Consequence || "").slice(0, 280),
      url: `https://www.nhtsa.gov/recalls`,
      source: "NHTSA",
      sourceType: "recall" as const,
      publishedAt: r.ReportReceivedDate
        ? new Date(r.ReportReceivedDate).toISOString()
        : new Date().toISOString(),
      category: "Recalls",
    }));

    setCache("nhtsa", results);
    return results;
  } catch {
    return [];
  }
}

async function fetchAutoRSS(): Promise<FeedItem[]> {
  const hit = cached("auto-rss");
  if (hit) return hit;

  const feeds = [
    { url: "https://www.autoblog.com/rss.xml", name: "Autoblog" },
    { url: "https://www.thedrive.com/feed", name: "The Drive" },
    { url: "https://jalopnik.com/rss", name: "Jalopnik" },
    { url: "https://www.caranddriver.com/rss/all.xml/", name: "Car and Driver" },
    { url: "https://www.motortrend.com/feed/", name: "MotorTrend" },
  ];

  const results: FeedItem[] = [];

  for (const feed of feeds) {
    try {
      const resp = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; 3CONYX/1.0)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) continue;
      const xml = await resp.text();

      const items = xml.split("<item>").slice(1, 6);
      for (const item of items) {
        const title = stripHtml(extractTag(item, "title"));
        const link = extractTag(item, "link");
        const pubDate = extractTag(item, "pubDate");
        const desc = stripHtml(extractTag(item, "description"));
        const mediaUrl = extractAttr(item, "media:content", "url")
          || extractAttr(item, "enclosure", "url")
          || extractImageFromHtml(extractTag(item, "description"));

        if (title && link) {
          results.push({
            id: `rss-${Buffer.from(link).toString("base64url").slice(0, 16)}`,
            title,
            description: desc.slice(0, 280),
            url: link,
            source: feed.name,
            sourceType: "news",
            imageUrl: mediaUrl || undefined,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            category: title.toLowerCase().includes("review") ? "Reviews"
              : title.toLowerCase().includes("electric") || title.toLowerCase().includes("ev") ? "EV & Tech"
              : "Industry News",
          });
        }
      }
    } catch {}
  }

  setCache("auto-rss", results);
  return results;
}

async function fetchYouTubeAuto(): Promise<FeedItem[]> {
  const hit = cached("youtube");
  if (hit) return hit;

  const channels = [
    { id: "UCsqjHFMB_JYTaEnf_vmTNqg", name: "Doug DeMuro" },
    { id: "UCDqViGr39pce_JHaf7mBDtg", name: "Donut Media" },
    { id: "UCtinbF-Q-fVthA0qrFQTgXQ", name: "Casey Neistat" },
    { id: "UCQMELFlXQL38KPm8kM-4Adg", name: "Savagegeese" },
    { id: "UCBJycsmduvYEL83R_U4JriQ", name: "MKBHD" },
  ];

  const results: FeedItem[] = [];

  for (const ch of channels) {
    try {
      const resp = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; 3CONYX/1.0)" },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (!resp.ok) continue;
      const xml = await resp.text();

      const entries = xml.split("<entry>").slice(1, 4);
      for (const entry of entries) {
        const title = stripHtml(extractTag(entry, "title"));
        const videoId = extractTag(entry, "yt:videoId");
        const published = extractTag(entry, "published");
        const desc = stripHtml(extractTag(entry, "media:description")).slice(0, 200);

        if (title && videoId) {
          const isAuto = /car|auto|vehicle|drive|engine|tesla|ford|bmw|truck|suv|ev |electric|horsepower|mph|motor|wheel|tire|dealer/i.test(title + " " + desc);
          if (!isAuto && ch.name !== "Doug DeMuro" && ch.name !== "Donut Media" && ch.name !== "Savagegeese") continue;

          results.push({
            id: `yt-${videoId}`,
            title,
            description: desc || `Video by ${ch.name}`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: ch.name,
            sourceType: "video",
            imageUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            author: ch.name,
            publishedAt: published ? new Date(published).toISOString() : new Date().toISOString(),
            category: "Video",
          });
        }
      }
    } catch {}
  }

  setCache("youtube", results);
  return results;
}

router.get("/auto-pulse/feed", requireAuth, async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || "all";
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) || "30", 10), 50);

    const [news, reddit, recalls, rss, youtube] = await Promise.all([
      fetchGoogleNewsAuto(),
      fetchRedditAutomotive(),
      fetchNHTSARecalls(),
      fetchAutoRSS(),
      fetchYouTubeAuto(),
    ]);

    let all = [...news, ...reddit, ...recalls, ...rss, ...youtube]
      .map(item => ({
        ...item,
        url: sanitizeUrl(item.url) || "#",
        imageUrl: sanitizeUrl(item.imageUrl) || undefined,
      }))
      .filter(item => item.url !== "#");

    if (category !== "all") {
      all = all.filter(item =>
        item.category.toLowerCase() === category.toLowerCase()
        || item.sourceType === category.toLowerCase()
      );
    }

    all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const seen = new Set<string>();
    all = all.filter(item => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const start = (page - 1) * limit;
    const paginated = all.slice(start, start + limit);

    const categories = [...new Set(all.map(i => i.category))].sort();
    const sourceBreakdown = {
      news: all.filter(i => i.sourceType === "news").length,
      social: all.filter(i => i.sourceType === "social").length,
      recalls: all.filter(i => i.sourceType === "recall").length,
      video: all.filter(i => i.sourceType === "video").length,
    };

    res.json({
      items: paginated,
      total: all.length,
      page,
      totalPages: Math.ceil(all.length / limit),
      categories,
      sourceBreakdown,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Auto Pulse feed error:", err.message);
    res.status(500).json({ error: "Failed to load feed" });
  }
});

router.get("/auto-pulse/trending", requireAuth, async (_req: Request, res: Response) => {
  try {
    const [news, reddit, rss] = await Promise.all([
      fetchGoogleNewsAuto(),
      fetchRedditAutomotive(),
      fetchAutoRSS(),
    ]);

    const all = [...news, ...reddit, ...rss];

    const wordCounts: Record<string, number> = {};
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "has", "have", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "it", "its", "from", "as", "not", "no", "new", "says", "said", "just", "how", "why", "what", "when", "where", "who", "which", "about", "more", "than", "into", "up", "out", "over", "after", "all", "also", "get", "got", "if", "their", "they", "them", "our", "your", "you", "we", "he", "she", "him", "her", "his", "my", "me"]);

    for (const item of all) {
      const words = (item.title + " " + item.description)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const w of words) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    }

    const trending = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ topic: word, mentions: count }));

    const hotStories = all
      .filter(i => i.engagement?.upvotes && i.engagement.upvotes > 50)
      .sort((a, b) => (b.engagement?.upvotes || 0) - (a.engagement?.upvotes || 0))
      .slice(0, 5);

    res.json({ trending, hotStories, timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: "Failed to load trending" });
  }
});

router.get("/auto-pulse/vehicle-intel", requireAuth, async (req: Request, res: Response) => {
  try {
    const vin = (req.query.vin as string) || "";
    const make = (req.query.make as string) || "";
    const model = (req.query.model as string) || "";

    if (!vin && !make) {
      res.status(400).json({ error: "VIN or make is required" });
      return;
    }

    const searchTerms = [make, model].filter(Boolean).join(" ").toLowerCase();
    const vinPrefix = vin ? vin.slice(0, 8) : "";

    const [news, reddit, recalls, rss] = await Promise.all([
      fetchGoogleNewsAuto(),
      fetchRedditAutomotive(),
      fetchNHTSARecalls(),
      fetchAutoRSS(),
    ]);

    const all = [...news, ...reddit, ...recalls, ...rss];

    const matchScore = (item: FeedItem): number => {
      const text = (item.title + " " + item.description).toLowerCase();
      let score = 0;
      if (make && text.includes(make.toLowerCase())) score += 3;
      if (model && text.includes(model.toLowerCase())) score += 3;
      if (searchTerms && text.includes(searchTerms)) score += 2;
      const autoTerms = ["recall", "rebate", "incentive", "deal", "review", "mod", "upgrade", "issue", "fix", "service", "warranty", "price"];
      for (const term of autoTerms) {
        if (text.includes(term)) score += 0.5;
      }
      return score;
    };

    let vehicleRecalls: FeedItem[] = [];
    if (make) {
      try {
        const recallUrl = model
          ? `https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
          : `https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}`;
        const recallResp = await fetch(recallUrl, { signal: AbortSignal.timeout(6000) });
        if (recallResp.ok) {
          const recallData = await recallResp.json() as any;
          vehicleRecalls = (recallData?.results || []).slice(0, 8).map((r: any, i: number) => ({
            id: `vr-${r.NHTSACampaignNumber || i}`,
            title: `RECALL: ${r.Manufacturer || make} ${r.ModelYear || ""} — ${r.Subject || "Safety Issue"}`,
            description: (r.Summary || r.Consequence || "").slice(0, 280),
            url: sanitizeUrl(`https://www.nhtsa.gov/recalls`) || "#",
            source: "NHTSA",
            sourceType: "recall" as const,
            publishedAt: r.ReportReceivedDate
              ? new Date(r.ReportReceivedDate).toISOString()
              : new Date().toISOString(),
            category: "Vehicle Recalls",
          }));
        }
      } catch {}
    }

    const scored = all
      .map(item => ({ ...item, _score: matchScore(item) }))
      .filter(i => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
      .map(({ _score, ...item }) => ({
        ...item,
        url: sanitizeUrl(item.url) || "#",
        imageUrl: sanitizeUrl(item.imageUrl) || undefined,
      }))
      .filter(item => item.url !== "#");

    const sections = {
      recalls: vehicleRecalls,
      news: scored.filter(i => i.sourceType === "news").slice(0, 5),
      social: scored.filter(i => i.sourceType === "social").slice(0, 5),
      marketTrends: scored.filter(i =>
        /price|deal|value|cost|rebate|incentive/i.test(i.title + i.description)
      ).slice(0, 5),
    };

    res.json({
      vehicle: { vin: vin || null, make, model },
      totalIntel: vehicleRecalls.length + scored.length,
      sections,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Vehicle intel error:", err.message);
    res.status(500).json({ error: "Failed to load vehicle intelligence" });
  }
});

export default router;
