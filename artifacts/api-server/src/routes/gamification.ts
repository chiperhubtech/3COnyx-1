/**
 * 3C ONYX Gamification Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Driver Profile · ONYX Points · Challenges · Achievements · Leaderboard
 *
 * GET  /gamification/profile/:userId    Driver license + tier + stats
 * GET  /gamification/challenges         Daily + weekly challenge feed
 * POST /gamification/challenges/complete  Complete a challenge + award points
 * GET  /gamification/leaderboard        Community standings
 * GET  /gamification/achievements       Full achievement catalog
 * POST /gamification/points/award       Award ONYX points
 * GET  /gamification/tier              Current tier + progress to next
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { optionalAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Types ──────────────────────────────────────────────────────────────── */

type DriverTier =
  | "rookie"
  | "amateur"
  | "semi-pro"
  | "pro"
  | "gt"
  | "supercup"
  | "f1"
  | "apex";

type ChallengeCategory =
  | "service" | "savings" | "garage" | "community" | "racing"
  | "speed" | "loyalty" | "discovery";

interface DriverTierInfo {
  id: DriverTier;
  label: string;
  subtitle: string;
  color: string;
  minPoints: number;
  maxPoints: number;
  badge: string;
  perks: string[];
}

interface Challenge {
  id: string;
  type: "daily" | "weekly" | "season";
  category: ChallengeCategory;
  title: string;
  description: string;
  points: number;
  bonusPoints?: number;
  icon: string;
  color: string;
  progress: number;
  target: number;
  completed: boolean;
  expiresIn: string;
  difficulty: "easy" | "medium" | "hard" | "elite";
  racingInspired?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  points: number;
  earned: boolean;
  earnedDate?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  racingTie?: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  driverNumber: string;
  tier: DriverTier;
  points: number;
  totalSaved: number;
  wins: number;
  isYou?: boolean;
  badge?: string;
}

/* ─── Tier definitions ───────────────────────────────────────────────────── */

const TIERS: DriverTierInfo[] = [
  {
    id: "rookie",
    label: "ROOKIE",
    subtitle: "P Class",
    color: "#9CA3AF",
    minPoints: 0,
    maxPoints: 999,
    badge: "🔰",
    perks: ["Access to basic vehicle lookup", "3 daily challenges"],
  },
  {
    id: "amateur",
    label: "AMATEUR",
    subtitle: "F3 Class",
    color: "#34D399",
    minPoints: 1000,
    maxPoints: 2499,
    badge: "🟢",
    perks: ["Priority AI concierge", "Aftermarket discount unlocked", "Extended challenge set"],
  },
  {
    id: "semi-pro",
    label: "SEMI PRO",
    subtitle: "F2 Class",
    color: "#60A5FA",
    minPoints: 2500,
    maxPoints: 4999,
    badge: "🔵",
    perks: ["Fleet intelligence access", "Document vault priority", "Weekly savings report"],
  },
  {
    id: "pro",
    label: "PRO",
    subtitle: "DTM Class",
    color: "#A78BFA",
    minPoints: 5000,
    maxPoints: 9999,
    badge: "🟣",
    perks: ["Full blockchain chain-of-custody", "Dynasty wallet VIP", "Exclusive race feeds"],
  },
  {
    id: "gt",
    label: "GT",
    subtitle: "GT3 Class",
    color: "#F59E0B",
    minPoints: 10000,
    maxPoints: 19999,
    badge: "🟡",
    perks: ["Personal AI negotiator", "VIP roadside SOS", "Founding member status"],
  },
  {
    id: "supercup",
    label: "SUPERCUP",
    subtitle: "GT1 Class",
    color: "#F97316",
    minPoints: 20000,
    maxPoints: 39999,
    badge: "🟠",
    perks: ["Revenue share on referrals", "APEXX supplier direct access", "White-glove concierge"],
  },
  {
    id: "f1",
    label: "F1",
    subtitle: "Super License",
    color: "#EF4444",
    minPoints: 40000,
    maxPoints: 99999,
    badge: "🔴",
    perks: ["Maximum savings engine", "Direct access to C-suite vendors", "ONYX red card"],
  },
  {
    id: "apex",
    label: "APEX",
    subtitle: "🏆 Legend",
    color: "#C9A227",
    minPoints: 100000,
    maxPoints: Infinity,
    badge: "⚡",
    perks: ["All platform perks", "ONYX founding investor access", "Custom driver number", "Revenue share program"],
  },
];

function getTier(points: number): DriverTierInfo {
  return TIERS.slice().reverse().find(t => points >= t.minPoints) ?? TIERS[0]!;
}

function getNextTier(points: number): DriverTierInfo | null {
  const current = getTier(points);
  const idx = TIERS.findIndex(t => t.id === current.id);
  return idx < TIERS.length - 1 ? (TIERS[idx + 1] ?? null) : null;
}

/* ─── Daily challenges ───────────────────────────────────────────────────── */

function buildChallenges(): Challenge[] {
  return [
    // ── DAILY ────────────────────────────────────────────────────────────────
    {
      id: "c-daily-pit-stop",
      type: "daily",
      category: "speed",
      title: "PIT STOP MASTER",
      description: "Complete a service request in under 2 minutes",
      points: 150,
      bonusPoints: 50,
      icon: "timer",
      color: "#EF4444",
      progress: 0,
      target: 1,
      completed: false,
      expiresIn: "12h 44m",
      difficulty: "medium",
      racingInspired: "F1 pit stops average 2.3 seconds — how fast can you handle yours?",
    },
    {
      id: "c-daily-lap",
      type: "daily",
      category: "garage",
      title: "MORNING LAP",
      description: "Check your vehicle health score today",
      points: 75,
      icon: "activity",
      color: "#3B82F6",
      progress: 0,
      target: 1,
      completed: false,
      expiresIn: "12h 44m",
      difficulty: "easy",
      racingInspired: "F1 engineers review telemetry every single lap. Know your data.",
    },
    {
      id: "c-daily-pole",
      type: "daily",
      category: "savings",
      title: "POLE POSITION DEAL",
      description: "Find and save a new deal in the marketplace",
      points: 200,
      bonusPoints: 75,
      icon: "zap",
      color: "#C9A227",
      progress: 0,
      target: 1,
      completed: false,
      expiresIn: "12h 44m",
      difficulty: "medium",
      racingInspired: "Pole position gives you the best track position. Position yourself for the best deal.",
    },
    {
      id: "c-daily-crew",
      type: "daily",
      category: "community",
      title: "CREW CHIEF",
      description: "Check in on a referral — see how your crew is performing",
      points: 100,
      icon: "users",
      color: "#10B981",
      progress: 0,
      target: 1,
      completed: false,
      expiresIn: "12h 44m",
      difficulty: "easy",
      racingInspired: "Every champion has a world-class crew behind them.",
    },
    {
      id: "c-daily-intel",
      type: "daily",
      category: "discovery",
      title: "RACE ENGINEER",
      description: "Review 3 items in your Intelligence Feed",
      points: 90,
      icon: "radio",
      color: "#8B5CF6",
      progress: 1,
      target: 3,
      completed: false,
      expiresIn: "12h 44m",
      difficulty: "easy",
      racingInspired: "F1 race engineers process 300+ data points per lap. Stay sharp.",
    },
    // ── WEEKLY ───────────────────────────────────────────────────────────────
    {
      id: "c-weekly-fastest-lap",
      type: "weekly",
      category: "speed",
      title: "FASTEST LAP BONUS",
      description: "Complete 5 platform actions this week (any category)",
      points: 500,
      bonusPoints: 250,
      icon: "flag",
      color: "#C9A227",
      progress: 2,
      target: 5,
      completed: false,
      expiresIn: "4d 12h",
      difficulty: "medium",
      racingInspired: "The fastest lap bonus in F1 is 1 extra championship point. Every point counts.",
    },
    {
      id: "c-weekly-grand-prix",
      type: "weekly",
      category: "savings",
      title: "GRAND PRIX SAVINGS",
      description: "Save $100+ through platform actions this week",
      points: 750,
      bonusPoints: 500,
      icon: "dollar-sign",
      color: "#10B981",
      progress: 0,
      target: 100,
      completed: false,
      expiresIn: "4d 12h",
      difficulty: "hard",
      racingInspired: "F1 teams spend $500M to gain 0.1s. Optimize every dollar.",
    },
    {
      id: "c-weekly-qualifier",
      type: "weekly",
      category: "community",
      title: "Q3 QUALIFIER",
      description: "Refer 2 new members to the ONYX network",
      points: 600,
      icon: "user-plus",
      color: "#8B5CF6",
      progress: 0,
      target: 2,
      completed: false,
      expiresIn: "4d 12h",
      difficulty: "hard",
      racingInspired: "In Q3, only the top 10 make it through. Make your network elite.",
    },
    // ── SEASON ───────────────────────────────────────────────────────────────
    {
      id: "c-season-championship",
      type: "season",
      category: "loyalty",
      title: "WORLD CHAMPIONSHIP",
      description: "Reach GT tier by end of season",
      points: 5000,
      icon: "trophy",
      color: "#C9A227",
      progress: 3200,
      target: 10000,
      completed: false,
      expiresIn: "Season ends Dec 31",
      difficulty: "elite",
      racingInspired: "The WDC is won over 24 races — not sprints. Build your season.",
    },
    {
      id: "c-season-drag-strip",
      type: "season",
      category: "speed",
      title: "QUARTER MILE KING",
      description: "Complete 100 platform actions this season",
      points: 3000,
      icon: "zap",
      color: "#EF4444",
      progress: 23,
      target: 100,
      completed: false,
      expiresIn: "Season ends Dec 31",
      difficulty: "elite",
      racingInspired: "Quarter mile in 3.6 seconds. 100 platform actions — how fast are you?",
    },
  ];
}

/* ─── Achievements ───────────────────────────────────────────────────────── */

function buildAchievements(): Achievement[] {
  return [
    { id: "ach-pole-position",  name: "Pole Position",        description: "Achieve first place in the weekly savings leaderboard",          icon: "🏁", color: "#C9A227", category: "competitive", points: 500,  earned: false, rarity: "epic",      racingTie: "Only one driver gets pole — the fastest qualifier." },
    { id: "ach-fastest-lap",    name: "Fastest Lap",          description: "Complete a service request in record time",                       icon: "⚡", color: "#A855F7", category: "speed",       points: 250,  earned: false, rarity: "rare",      racingTie: "In F1, the fastest lap earns a bonus championship point." },
    { id: "ach-pit-crew",       name: "Elite Pit Crew",       description: "Complete 50 service actions through the platform",                 icon: "🔧", color: "#3B82F6", category: "service",     points: 300,  earned: false, rarity: "rare",      racingTie: "An F1 pit crew changes 4 tires in 1.9 seconds." },
    { id: "ach-drag-king",      name: "Drag Strip King",      description: "Achieve $5,000 in total platform savings",                        icon: "🏎️", color: "#EF4444", category: "savings",     points: 1000, earned: false, rarity: "epic",      racingTie: "Like a Top Fuel car — maximum power, maximum output." },
    { id: "ach-race-engineer",  name: "Race Engineer",        description: "Review the Intelligence Feed 30 days in a row",                   icon: "📡", color: "#10B981", category: "loyalty",     points: 750,  earned: false, rarity: "rare",      racingTie: "The race engineer is the driver's most trusted strategist." },
    { id: "ach-safety-car",     name: "Safety Car Protocol",  description: "Use Emergency SOS 3x (always there when it counts)",              icon: "🚨", color: "#F97316", category: "safety",      points: 200,  earned: false, rarity: "common",    racingTie: "The safety car neutralizes danger — so do we." },
    { id: "ach-wdc",            name: "World Champion",       description: "Reach APEX tier — the highest level in the ONYX ecosystem",       icon: "🏆", color: "#C9A227", category: "milestone",   points: 5000, earned: false, rarity: "legendary", racingTie: "World Drivers' Champion. 23 have done it. You could be next." },
    { id: "ach-daytona",        name: "Daytona 500 Winner",   description: "Win the weekly savings challenge 3 times in a row",               icon: "🏁", color: "#1D4ED8", category: "competitive", points: 1500, earned: false, rarity: "legendary", racingTie: "The Great American Race — won only by the best." },
    { id: "ach-formation",      name: "Formation Lap",        description: "Complete your vehicle profile 100%",                               icon: "🚗", color: "#10B981", category: "garage",      points: 100,  earned: true,  earnedDate: "2026-01-15", rarity: "common", racingTie: "Every race starts with a formation lap — so does your ONYX journey." },
    { id: "ach-referral-race",  name: "Crew Chief",           description: "Refer your first 5 members to ONYX",                              icon: "👥", color: "#8B5CF6", category: "community",   points: 500,  earned: false, rarity: "rare",      racingTie: "A great crew chief builds the team around the champion driver." },
    { id: "ach-nhra-et",        name: "3.6 Second Club",      description: "Complete any platform action in under 60 seconds",                 icon: "⏱️", color: "#EF4444", category: "speed",       points: 200,  earned: false, rarity: "rare",      racingTie: "A Top Fuel dragster runs the quarter mile in 3.6 seconds. Match it." },
    { id: "ach-blockchain",     name: "Chain of Custody",     description: "Add your first vehicle to the blockchain ledger",                  icon: "⛓️", color: "#6366F1", category: "trust",       points: 300,  earned: false, rarity: "common",    racingTie: "Every F1 car part is tracked with serial numbers. Your car should be too." },
    { id: "ach-clean-air",      name: "Clean Air",            description: "Use ONYX 7 days in a row",                                        icon: "💨", color: "#60A5FA", category: "loyalty",     points: 150,  earned: true,  earnedDate: "2026-03-10", rarity: "common", racingTie: "Running in clean air means no one ahead of you — free to push." },
    { id: "ach-super-license",  name: "Super License",        description: "Reach F1 tier",                                                   icon: "📜", color: "#EF4444", category: "milestone",   points: 2000, earned: false, rarity: "epic",      racingTie: "The F1 Super License — the most exclusive racing credential in the world." },
    { id: "ach-hot-lap",        name: "Hot Lap",              description: "Complete 3 challenges in one day",                                 icon: "🔥", color: "#F97316", category: "speed",       points: 300,  earned: false, rarity: "rare",      racingTie: "A hot lap is maximum attack, minimum time. Go." },
  ];
}

/* ─── Leaderboard ────────────────────────────────────────────────────────── */

function buildLeaderboard(): LeaderboardEntry[] {
  return [
    { rank: 1,  username: "VEL0CIRAPTOR",   driverNumber: "01",  tier: "apex",    points: 142800, totalSaved: 48200, wins: 12, badge: "🏆" },
    { rank: 2,  username: "BLACKBIRD_87",   driverNumber: "87",  tier: "f1",      points: 89400,  totalSaved: 31700, wins: 8  },
    { rank: 3,  username: "MIDNIGHT.RUN",   driverNumber: "44",  tier: "f1",      points: 74200,  totalSaved: 26100, wins: 7  },
    { rank: 4,  username: "QUARTER_MILE_Q", driverNumber: "28",  tier: "supercup", points: 58900, totalSaved: 19800, wins: 5  },
    { rank: 5,  username: "GT_PHANTOM",     driverNumber: "63",  tier: "supercup", points: 47300, totalSaved: 16200, wins: 4  },
    { rank: 6,  username: "RACE_ENGINEER",  driverNumber: "16",  tier: "gt",      points: 38700,  totalSaved: 13400, wins: 3  },
    { rank: 7,  username: "APEX_HUNTER",    driverNumber: "55",  tier: "gt",      points: 31200,  totalSaved: 10800, wins: 2  },
    { rank: 8,  username: "YOU",            driverNumber: "33",  tier: "semi-pro", points: 3200,  totalSaved: 2847,  wins: 0, isYou: true },
    { rank: 9,  username: "BOOST.PRESSURE", driverNumber: "4",   tier: "semi-pro", points: 3080, totalSaved: 1900,  wins: 0  },
    { rank: 10, username: "SLIPSTREAM_S",   driverNumber: "77",  tier: "amateur", points: 2840,   totalSaved: 1600,  wins: 0  },
  ];
}

/* ─── In-memory points store ─────────────────────────────────────────────── */

const POINTS_STORE = new Map<string, number>([
  ["demo-user", 3200],
]);

const COMPLETED_CHALLENGES = new Set<string>();

/* ─── Routes ─────────────────────────────────────────────────────────────── */

// GET /gamification/profile/:userId
router.get("/gamification/profile/:userId", optionalAuth, (req: Request, res: Response) => {
  const userId = String(req.params["userId"] ?? "demo-user");
  const points = POINTS_STORE.get(userId) ?? 3200;
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const achievements = buildAchievements().filter(a => a.earned);

  res.json({
    userId,
    driverNumber: "33",
    driverName: "ONYX DRIVER",
    points,
    tier,
    nextTier,
    progressToNext: nextTier ? Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100) : 100,
    pointsToNext: nextTier ? nextTier.minPoints - points : 0,
    totalSaved: 2847,
    totalActions: 23,
    weeklyStreak: 4,
    achievements: achievements,
    achievementCount: achievements.length,
    totalAchievements: buildAchievements().length,
    joinDate: "2026-01-01",
    season: "2026",
    seasonRank: 8,
    ts: new Date().toISOString(),
  });
});

// GET /gamification/challenges
router.get("/gamification/challenges", optionalAuth, (req: Request, res: Response) => {
  const { type } = req.query;
  let challenges = buildChallenges();
  if (type) challenges = challenges.filter(c => c.type === String(type));

  // Mark any completed ones
  challenges = challenges.map(c => ({ ...c, completed: COMPLETED_CHALLENGES.has(c.id) }));

  const daily = challenges.filter(c => c.type === "daily");
  const weekly = challenges.filter(c => c.type === "weekly");
  const season = challenges.filter(c => c.type === "season");

  res.json({
    challenges,
    daily,
    weekly,
    season,
    totalPoints: challenges.filter(c => !c.completed).reduce((s, c) => s + c.points + (c.bonusPoints ?? 0), 0),
    completedToday: daily.filter(c => c.completed).length,
    ts: new Date().toISOString(),
  });
});

// POST /gamification/challenges/complete
router.post("/gamification/challenges/complete", optionalAuth, (req: Request, res: Response) => {
  const { challengeId, userId = "demo-user" } = req.body as { challengeId: string; userId?: string };
  const challenges = buildChallenges();
  const challenge = challenges.find(c => c.id === challengeId);

  if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
  if (COMPLETED_CHALLENGES.has(challengeId)) { res.status(409).json({ error: "Challenge already completed" }); return; }

  COMPLETED_CHALLENGES.add(challengeId);
  const totalAwarded = challenge.points + (challenge.bonusPoints ?? 0);
  const currentPoints = POINTS_STORE.get(String(userId)) ?? 3200;
  const newPoints = currentPoints + totalAwarded;
  POINTS_STORE.set(String(userId), newPoints);

  const tier = getTier(currentPoints);
  const newTier = getTier(newPoints);
  const tierUp = tier.id !== newTier.id;

  logger.info({ challengeId, userId, points: totalAwarded, newTotal: newPoints }, "[gamification] challenge completed");

  res.json({
    success: true,
    challenge,
    pointsAwarded: totalAwarded,
    newTotal: newPoints,
    tierUp,
    newTier: tierUp ? newTier : null,
    message: tierUp
      ? `🚀 TIER UP! Welcome to ${newTier.label} — ${newTier.subtitle}`
      : `+${totalAwarded} ONYX Points — ${challenge.racingInspired ?? "Keep pushing."}`,
  });
});

// GET /gamification/leaderboard
router.get("/gamification/leaderboard", optionalAuth, (req: Request, res: Response) => {
  const { scope = "global" } = req.query;
  const board = buildLeaderboard();

  res.json({
    scope: String(scope),
    board,
    season: "2026",
    weekNumber: 13,
    userRank: board.find(e => e.isYou)?.rank ?? null,
    ts: new Date().toISOString(),
  });
});

// GET /gamification/achievements
router.get("/gamification/achievements", optionalAuth, (req: Request, res: Response) => {
  const achievements = buildAchievements();
  res.json({
    achievements,
    earned: achievements.filter(a => a.earned).length,
    total: achievements.length,
    legendaryCount: achievements.filter(a => a.rarity === "legendary").length,
    ts: new Date().toISOString(),
  });
});

// GET /gamification/tier
router.get("/gamification/tier", optionalAuth, (req: Request, res: Response) => {
  const points = parseInt(String(req.query["points"] ?? "3200"), 10);
  const tier = getTier(points);
  const next = getNextTier(points);
  res.json({
    tiers: TIERS,
    current: tier,
    next,
    allTiers: TIERS.map(t => ({ ...t, unlocked: points >= t.minPoints })),
    ts: new Date().toISOString(),
  });
});

// POST /gamification/points/award
router.post("/gamification/points/award", optionalAuth, (req: Request, res: Response) => {
  const { userId = "demo-user", points, reason } = req.body as { userId?: string; points: number; reason: string };
  if (!points || !reason) { res.status(400).json({ error: "points and reason required" }); return; }

  const current = POINTS_STORE.get(String(userId)) ?? 3200;
  const newTotal = current + points;
  POINTS_STORE.set(String(userId), newTotal);

  logger.info({ userId, points, reason, newTotal }, "[gamification] points awarded");
  res.json({ success: true, pointsAwarded: points, newTotal, tier: getTier(newTotal) });
});

export default router;
