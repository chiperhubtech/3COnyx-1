/**
 * 3C ONYX Racing Universe
 * ─────────────────────────────────────────────────────────────────────────────
 * F1 × NASCAR × NHRA drag racing — live event engine
 *
 * GET /racing/live          Current live session (what's happening RIGHT NOW)
 * GET /racing/calendar      Full multi-series race calendar
 * GET /racing/standings/f1  F1 World Championship standings
 * GET /racing/standings/nascar  NASCAR Cup Series standings
 * GET /racing/standings/nhra    NHRA Top Fuel / Funny Car standings
 * GET /racing/session/:id   Session detail (laps, gaps, fastest lap)
 * GET /racing/telemetry/:driverId  Driver telemetry snapshot
 * GET /racing/feed          Live racing events feed (mergeable with intel feed)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { optionalAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Series = "f1" | "nascar" | "nhra" | "indycar" | "wec";
type SessionType = "race" | "qualifying" | "practice" | "sprint" | "sprint-qualifying";
type SessionStatus = "live" | "upcoming" | "completed" | "rain-delay" | "red-flag";

interface Driver {
  number: string;
  name: string;
  shortName: string;
  team: string;
  teamColor: string;
  nationality: string;
  points: number;
  wins: number;
}

interface RaceEvent {
  id: string;
  series: Series;
  round: number;
  name: string;
  shortName: string;
  circuit: string;
  city: string;
  country: string;
  countryCode: string;
  date: string;        // YYYY-MM-DD race day
  sessions: SessionEntry[];
  status: "upcoming" | "live" | "completed";
  currentSession?: SessionType;
  laps?: number;
  lapDistance?: string;
  winner?: string;
  broadcast: string[];
}

interface SessionEntry {
  type: SessionType;
  date: string;
  time: string;
  status: SessionStatus;
  durationMin: number;
}

interface StandingEntry {
  pos: number;
  driver: Driver;
  gap: string;
  lastResult: string;
  streak?: string;
}

interface LiveSession {
  eventId: string;
  series: Series;
  eventName: string;
  sessionType: SessionType;
  status: SessionStatus;
  lap: number;
  totalLaps: number;
  safetyCarOut: boolean;
  vscOut: boolean;
  redFlag: boolean;
  timeRemaining?: string;
  lapTime?: string;
  fastestLap?: { driver: string; time: string; lap: number };
  positions: LivePosition[];
  lastUpdated: string;
}

interface LivePosition {
  pos: number;
  driver: Driver;
  gap: string;
  interval: string;
  lastLap: string;
  s1?: string;
  s2?: string;
  s3?: string;
  drs: boolean;
  pitCount: number;
  tire: "soft" | "medium" | "hard" | "inter" | "wet";
  tireAge: number;
}

interface NHRARun {
  round: string;
  driver: string;
  car: string;
  team: string;
  et: string;    // elapsed time
  mph: string;   // trap speed
  result: "win" | "loss" | "bye";
  reactionTime: string;
}

/* ─── F1 2026 Driver roster ──────────────────────────────────────────────── */

const F1_DRIVERS: Record<string, Driver> = {
  VER: { number: "1",  name: "Max Verstappen",    shortName: "VER", team: "Oracle Red Bull Racing",   teamColor: "#3671C6", nationality: "NED", points: 77,  wins: 4 },
  NOR: { number: "4",  name: "Lando Norris",      shortName: "NOR", team: "McLaren Formula 1 Team",   teamColor: "#FF8000", nationality: "GBR", points: 71,  wins: 2 },
  LEC: { number: "16", name: "Charles Leclerc",   shortName: "LEC", team: "Scuderia Ferrari",          teamColor: "#E8002D", nationality: "MON", points: 62,  wins: 3 },
  HAM: { number: "44", name: "Lewis Hamilton",     shortName: "HAM", team: "Scuderia Ferrari",          teamColor: "#E8002D", nationality: "GBR", points: 55,  wins: 1 },
  PIA: { number: "81", name: "Oscar Piastri",      shortName: "PIA", team: "McLaren Formula 1 Team",   teamColor: "#FF8000", nationality: "AUS", points: 48,  wins: 1 },
  RUS: { number: "63", name: "George Russell",     shortName: "RUS", team: "Mercedes-AMG Petronas",    teamColor: "#27F4D2", nationality: "GBR", points: 41,  wins: 0 },
  SAI: { number: "55", name: "Carlos Sainz",       shortName: "SAI", team: "Williams Racing",          teamColor: "#37BEDD", nationality: "ESP", points: 37,  wins: 1 },
  ALO: { number: "14", name: "Fernando Alonso",    shortName: "ALO", team: "Aston Martin F1 Team",     teamColor: "#229971", nationality: "ESP", points: 29,  wins: 0 },
  ANT: { number: "12", name: "Kimi Antonelli",     shortName: "ANT", team: "Mercedes-AMG Petronas",    teamColor: "#27F4D2", nationality: "ITA", points: 21,  wins: 0 },
  STR: { number: "18", name: "Lance Stroll",       shortName: "STR", team: "Aston Martin F1 Team",     teamColor: "#229971", nationality: "CAN", points: 18,  wins: 0 },
  TSU: { number: "22", name: "Yuki Tsunoda",       shortName: "TSU", team: "Oracle Red Bull Racing",   teamColor: "#3671C6", nationality: "JPN", points: 14,  wins: 0 },
  GAS: { number: "10", name: "Pierre Gasly",       shortName: "GAS", team: "Alpine F1 Team",           teamColor: "#FF87BC", nationality: "FRA", points: 11,  wins: 0 },
  HUL: { number: "27", name: "Nico Hülkenberg",    shortName: "HUL", team: "Stake F1 Team Kick",       teamColor: "#52E252", nationality: "GER", points: 9,   wins: 0 },
  ALB: { number: "23", name: "Alexander Albon",    shortName: "ALB", team: "Williams Racing",          teamColor: "#37BEDD", nationality: "THA", points: 7,   wins: 0 },
  BEA: { number: "87", name: "Oliver Bearman",     shortName: "BEA", team: "Haas F1 Team",             teamColor: "#B6BABD", nationality: "GBR", points: 6,   wins: 0 },
  DOO: { number: "7",  name: "Jack Doohan",        shortName: "DOO", team: "Alpine F1 Team",           teamColor: "#FF87BC", nationality: "AUS", points: 4,   wins: 0 },
  OCO: { number: "31", name: "Esteban Ocon",       shortName: "OCO", team: "Haas F1 Team",             teamColor: "#B6BABD", nationality: "FRA", points: 2,   wins: 0 },
  LAW: { number: "30", name: "Liam Lawson",        shortName: "LAW", team: "RB Formula One Team",      teamColor: "#6692FF", nationality: "NZL", points: 2,   wins: 0 },
  HAD: { number: "41", name: "Isack Hadjar",       shortName: "HAD", team: "RB Formula One Team",      teamColor: "#6692FF", nationality: "FRA", points: 0,   wins: 0 },
  BOR: { number: "5",  name: "Gabriel Bortoleto",  shortName: "BOR", team: "Stake F1 Team Kick",       teamColor: "#52E252", nationality: "BRA", points: 0,   wins: 0 },
};

/* ─── NASCAR 2026 Cup drivers ────────────────────────────────────────────── */

const NASCAR_DRIVERS: Driver[] = [
  { number: "5",  name: "Kyle Larson",           shortName: "LARSON",   team: "Hendrick Motorsports",   teamColor: "#E31837", nationality: "USA", points: 582, wins: 4 },
  { number: "9",  name: "Chase Elliott",         shortName: "ELLIOTT",  team: "Hendrick Motorsports",   teamColor: "#0078D4", nationality: "USA", points: 561, wins: 3 },
  { number: "12", name: "Ryan Blaney",           shortName: "BLANEY",   team: "Team Penske",            teamColor: "#FF6B00", nationality: "USA", points: 548, wins: 3 },
  { number: "11", name: "Denny Hamlin",          shortName: "HAMLIN",   team: "Joe Gibbs Racing",       teamColor: "#D50000", nationality: "USA", points: 531, wins: 2 },
  { number: "22", name: "Joey Logano",           shortName: "LOGANO",   team: "Team Penske",            teamColor: "#003087", nationality: "USA", points: 517, wins: 2 },
  { number: "24", name: "William Byron",         shortName: "BYRON",    team: "Hendrick Motorsports",   teamColor: "#FFC20E", nationality: "USA", points: 509, wins: 2 },
  { number: "20", name: "Christopher Bell",      shortName: "BELL",     team: "Joe Gibbs Racing",       teamColor: "#2C2F33", nationality: "USA", points: 501, wins: 1 },
  { number: "45", name: "Tyler Reddick",         shortName: "REDDICK",  team: "23XI Racing",            teamColor: "#7B1FA2", nationality: "USA", points: 492, wins: 2 },
  { number: "23", name: "Bubba Wallace",         shortName: "WALLACE",  team: "23XI Racing",            teamColor: "#1565C0", nationality: "USA", points: 478, wins: 1 },
  { number: "4",  name: "Josh Berry",            shortName: "BERRY",    team: "Stewart-Haas Racing",    teamColor: "#388E3C", nationality: "USA", points: 462, wins: 0 },
];

/* ─── NHRA 2026 Top Fuel ─────────────────────────────────────────────────── */

const NHRA_TOP_FUEL: Driver[] = [
  { number: "1", name: "Austin Prock",       shortName: "PROCK",    team: "John Force Racing",     teamColor: "#E53935", nationality: "USA", points: 847, wins: 5 },
  { number: "2", name: "Brittany Force",     shortName: "B.FORCE",  team: "John Force Racing",     teamColor: "#E53935", nationality: "USA", points: 801, wins: 4 },
  { number: "3", name: "Mike Salinas",       shortName: "SALINAS",  team: "Scrappers Racing",      teamColor: "#7B1FA2", nationality: "USA", points: 788, wins: 3 },
  { number: "4", name: "Tony Schumacher",    shortName: "SCHUMACHER", team: "Tony Stewart Racing", teamColor: "#FF6F00", nationality: "USA", points: 762, wins: 3 },
  { number: "5", name: "Antron Brown",       shortName: "BROWN",    team: "Matco Tools AB/MC",     teamColor: "#1565C0", nationality: "USA", points: 741, wins: 2 },
  { number: "6", name: "Clay Millican",      shortName: "MILLICAN", team: "Parts Plus",            teamColor: "#2E7D32", nationality: "USA", points: 718, wins: 1 },
  { number: "7", name: "Josh Hart",          shortName: "HART",     team: "Don Schumacher Racing", teamColor: "#F57F17", nationality: "USA", points: 692, wins: 1 },
  { number: "8", name: "Doug Kalitta",       shortName: "KALITTA",  team: "Mac Tools",             teamColor: "#37474F", nationality: "USA", points: 674, wins: 0 },
];

/* ─── 2026 Race calendar ─────────────────────────────────────────────────── */

const NOW = new Date("2026-03-25T06:00:00Z");

function isToday(dateStr: string): boolean {
  return dateStr.startsWith(NOW.toISOString().split("T")[0] ?? "");
}

function daysDiff(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - NOW.getTime()) / 86400000);
}

const F1_CALENDAR: RaceEvent[] = [
  {
    id: "f1-2026-aus",
    series: "f1", round: 3,
    name: "Formula 1 Heineken Australian Grand Prix 2026",
    shortName: "Australian GP",
    circuit: "Albert Park Circuit",
    city: "Melbourne", country: "Australia", countryCode: "AU",
    date: "2026-03-30",
    sessions: [
      { type: "practice",    date: "2026-03-27", time: "02:30", status: "upcoming", durationMin: 60 },
      { type: "qualifying",  date: "2026-03-28", time: "08:00", status: "upcoming", durationMin: 60 },
      { type: "sprint",      date: "2026-03-29", time: "04:00", status: "upcoming", durationMin: 30 },
      { type: "race",        date: "2026-03-30", time: "05:00", status: "upcoming", durationMin: 120 },
    ],
    status: "upcoming",
    laps: 58, lapDistance: "5.278 km",
    broadcast: ["ESPN", "F1TV Pro"],
  },
  {
    id: "f1-2026-jap",
    series: "f1", round: 4,
    name: "Formula 1 MSC Cruises Japanese Grand Prix 2026",
    shortName: "Japanese GP",
    circuit: "Suzuka Circuit",
    city: "Suzuka", country: "Japan", countryCode: "JP",
    date: "2026-04-06",
    sessions: [
      { type: "practice",   date: "2026-04-04", time: "03:30", status: "upcoming", durationMin: 60 },
      { type: "qualifying", date: "2026-04-05", time: "08:00", status: "upcoming", durationMin: 60 },
      { type: "race",       date: "2026-04-06", time: "06:00", status: "upcoming", durationMin: 120 },
    ],
    status: "upcoming",
    laps: 53, lapDistance: "5.807 km",
    broadcast: ["ESPN", "F1TV Pro"],
  },
  {
    id: "f1-2026-bah",
    series: "f1", round: 1,
    name: "Formula 1 Gulf Air Bahrain Grand Prix 2026",
    shortName: "Bahrain GP",
    circuit: "Bahrain International Circuit",
    city: "Sakhir", country: "Bahrain", countryCode: "BH",
    date: "2026-03-02",
    sessions: [
      { type: "practice",   date: "2026-02-28", time: "15:30", status: "completed", durationMin: 60 },
      { type: "qualifying", date: "2026-03-01", time: "19:00", status: "completed", durationMin: 60 },
      { type: "race",       date: "2026-03-02", time: "18:00", status: "completed", durationMin: 120 },
    ],
    status: "completed",
    winner: "Max Verstappen",
    laps: 57, lapDistance: "5.412 km",
    broadcast: ["ESPN", "F1TV Pro"],
  },
  {
    id: "f1-2026-sau",
    series: "f1", round: 2,
    name: "Formula 1 STC Saudi Arabian Grand Prix 2026",
    shortName: "Saudi Arabian GP",
    circuit: "Jeddah Corniche Circuit",
    city: "Jeddah", country: "Saudi Arabia", countryCode: "SA",
    date: "2026-03-16",
    sessions: [
      { type: "practice",   date: "2026-03-14", time: "17:30", status: "completed", durationMin: 60 },
      { type: "qualifying", date: "2026-03-15", time: "20:00", status: "completed", durationMin: 60 },
      { type: "race",       date: "2026-03-16", time: "20:00", status: "completed", durationMin: 120 },
    ],
    status: "completed",
    winner: "Lando Norris",
    laps: 50, lapDistance: "6.174 km",
    broadcast: ["ESPN", "F1TV Pro"],
  },
];

const NASCAR_CALENDAR: RaceEvent[] = [
  {
    id: "nascar-2026-bristol",
    series: "nascar", round: 5,
    name: "Food City 500 — Bristol Motor Speedway",
    shortName: "Bristol 500",
    circuit: "Bristol Motor Speedway",
    city: "Bristol", country: "USA", countryCode: "US",
    date: "2026-03-29",
    sessions: [
      { type: "practice",   date: "2026-03-28", time: "13:00", status: "upcoming", durationMin: 50 },
      { type: "qualifying", date: "2026-03-28", time: "15:30", status: "upcoming", durationMin: 60 },
      { type: "race",       date: "2026-03-29", time: "19:00", status: "upcoming", durationMin: 180 },
    ],
    status: "upcoming",
    laps: 500, lapDistance: "0.533 mile oval",
    broadcast: ["FOX", "MRN Radio"],
  },
  {
    id: "nascar-2026-daytona",
    series: "nascar", round: 1,
    name: "Daytona 500 — Daytona International Speedway",
    shortName: "Daytona 500",
    circuit: "Daytona International Speedway",
    city: "Daytona Beach", country: "USA", countryCode: "US",
    date: "2026-02-15",
    sessions: [
      { type: "qualifying", date: "2026-02-13", time: "14:00", status: "completed", durationMin: 120 },
      { type: "race",       date: "2026-02-15", time: "14:30", status: "completed", durationMin: 240 },
    ],
    status: "completed",
    winner: "Kyle Larson",
    laps: 200, lapDistance: "2.5 mile superspeedway",
    broadcast: ["FOX", "MRN Radio"],
  },
];

const NHRA_CALENDAR: RaceEvent[] = [
  {
    id: "nhra-2026-gatornationals",
    series: "nhra", round: 3,
    name: "AMALIE Motor Oil NHRA Gatornationals",
    shortName: "Gatornationals",
    circuit: "Gainesville Raceway",
    city: "Gainesville", country: "USA", countryCode: "US",
    date: "2026-03-27",
    sessions: [
      { type: "qualifying", date: "2026-03-25", time: "10:00", status: "live", durationMin: 120 },
      { type: "qualifying", date: "2026-03-26", time: "14:00", status: "upcoming", durationMin: 120 },
      { type: "race",       date: "2026-03-27", time: "11:00", status: "upcoming", durationMin: 480 },
    ],
    status: "live",
    currentSession: "qualifying",
    broadcast: ["FS1", "NHRA.tv"],
  },
];

/* ─── Live session mock (NHRA qualifying is happening today) ─────────────── */

const LIVE_NHRA_RUNS: NHRARun[] = [
  { round: "Q1", driver: "Austin Prock",    car: "Montana Brand / Rocky Mountain Twist TF", team: "John Force Racing",     et: "3.637", mph: "334.65", result: "win", reactionTime: "0.043" },
  { round: "Q1", driver: "Brittany Force",  car: "Monster Energy / Flav-R-Pac TF",           team: "John Force Racing",     et: "3.641", mph: "332.18", result: "win", reactionTime: "0.067" },
  { round: "Q1", driver: "Mike Salinas",    car: "Scrappers Racing TF",                       team: "Scrappers Racing",      et: "3.658", mph: "330.47", result: "win", reactionTime: "0.051" },
  { round: "Q1", driver: "Tony Schumacher", car: "U.S. Army TF",                              team: "Tony Stewart Racing",   et: "3.674", mph: "328.90", result: "win", reactionTime: "0.039" },
  { round: "Q1", driver: "Antron Brown",    car: "Matco Tools Dragster",                      team: "Matco Tools AB/MC",     et: "3.681", mph: "327.35", result: "win", reactionTime: "0.058" },
];

/* ─── Simulated live F1 session ──────────────────────────────────────────── */

function buildLiveF1Session(): LiveSession {
  const positions: LivePosition[] = [
    { pos: 1, driver: F1_DRIVERS["VER"]!, gap: "LEADER",   interval: "",       lastLap: "1:17.842", s1: "21.1", s2: "28.7", s3: "27.9", drs: false, pitCount: 1, tire: "medium", tireAge: 12 },
    { pos: 2, driver: F1_DRIVERS["NOR"]!, gap: "+1.847",   interval: "+1.847", lastLap: "1:18.104", s1: "21.3", s2: "28.8", s3: "27.9", drs: true,  pitCount: 1, tire: "medium", tireAge: 12 },
    { pos: 3, driver: F1_DRIVERS["LEC"]!, gap: "+3.211",   interval: "+1.364", lastLap: "1:18.241", s1: "21.4", s2: "28.9", s3: "28.0", drs: true,  pitCount: 1, tire: "hard",   tireAge: 8  },
    { pos: 4, driver: F1_DRIVERS["PIA"]!, gap: "+4.892",   interval: "+1.681", lastLap: "1:18.389", s1: "21.5", s2: "29.0", s3: "28.1", drs: true,  pitCount: 1, tire: "soft",   tireAge: 3  },
    { pos: 5, driver: F1_DRIVERS["HAM"]!, gap: "+7.201",   interval: "+2.309", lastLap: "1:18.512", s1: "21.6", s2: "29.1", s3: "28.2", drs: true,  pitCount: 2, tire: "hard",   tireAge: 18 },
    { pos: 6, driver: F1_DRIVERS["RUS"]!, gap: "+9.441",   interval: "+2.240", lastLap: "1:18.714", s1: "21.7", s2: "29.3", s3: "28.3", drs: false, pitCount: 1, tire: "medium", tireAge: 15 },
    { pos: 7, driver: F1_DRIVERS["SAI"]!, gap: "+11.205",  interval: "+1.764", lastLap: "1:18.891", s1: "21.8", s2: "29.4", s3: "28.4", drs: false, pitCount: 1, tire: "medium", tireAge: 12 },
    { pos: 8, driver: F1_DRIVERS["ALO"]!, gap: "+15.887",  interval: "+4.682", lastLap: "1:19.122", s1: "22.0", s2: "29.6", s3: "28.6", drs: false, pitCount: 2, tire: "hard",   tireAge: 22 },
    { pos: 9, driver: F1_DRIVERS["ANT"]!, gap: "+19.344",  interval: "+3.457", lastLap: "1:19.341", s1: "22.1", s2: "29.8", s3: "28.7", drs: false, pitCount: 1, tire: "medium", tireAge: 8  },
    { pos: 10, driver: F1_DRIVERS["TSU"]!, gap: "+22.108", interval: "+2.764", lastLap: "1:19.612", s1: "22.2", s2: "30.0", s3: "28.9", drs: false, pitCount: 1, tire: "soft",   tireAge: 5  },
  ];

  return {
    eventId: "f1-2026-aus",
    series: "f1",
    eventName: "Australian Grand Prix",
    sessionType: "qualifying",
    status: "live",
    lap: 0,
    totalLaps: 0,
    safetyCarOut: false,
    vscOut: false,
    redFlag: false,
    timeRemaining: "00:22:14",
    fastestLap: { driver: "VER", time: "1:15.204", lap: 0 },
    positions,
    lastUpdated: new Date().toISOString(),
  };
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */

// GET /racing/live
router.get("/racing/live", optionalAuth, (_req: Request, res: Response) => {
  const nhraEvent = NHRA_CALENDAR.find(e => e.status === "live");

  const liveSessions = [];

  // NHRA is live today (qualifying)
  if (nhraEvent) {
    liveSessions.push({
      series: "nhra",
      seriesLabel: "NHRA Top Fuel",
      eventId: nhraEvent.id,
      eventName: nhraEvent.shortName,
      circuit: nhraEvent.circuit,
      city: nhraEvent.city,
      sessionType: "qualifying" as SessionType,
      status: "live" as SessionStatus,
      description: "Q1 Qualifying sessions in progress — Top Fuel dragsters laying down their first passes",
      keyStats: {
        fastestET: "3.637s",
        fastestMPH: "334.65 mph",
        leader: "Austin Prock",
        runsCompleted: 5,
      },
      topRuns: LIVE_NHRA_RUNS.slice(0, 3),
      broadcast: nhraEvent.broadcast,
    });
  }

  // Next upcoming F1 event
  const nextF1 = F1_CALENDAR.filter(e => e.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (nextF1) {
    const daysOut = daysDiff(nextF1.date);
    const nextSession = nextF1.sessions.find(s => s.status === "upcoming");
    liveSessions.push({
      series: "f1",
      seriesLabel: "Formula 1",
      eventId: nextF1.id,
      eventName: nextF1.shortName,
      circuit: nextF1.circuit,
      city: nextF1.city,
      sessionType: nextSession?.type ?? "race",
      status: "upcoming" as SessionStatus,
      description: `${nextF1.shortName} — ${daysOut === 0 ? "TODAY" : daysOut === 1 ? "TOMORROW" : `in ${daysOut} days`}`,
      countdown: { days: Math.max(0, daysOut), hours: 0, minutes: 0 },
      broadcast: nextF1.broadcast,
    });
  }

  // Next NASCAR event
  const nextNASCAR = NASCAR_CALENDAR.filter(e => e.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (nextNASCAR) {
    const daysOut = daysDiff(nextNASCAR.date);
    liveSessions.push({
      series: "nascar",
      seriesLabel: "NASCAR Cup Series",
      eventId: nextNASCAR.id,
      eventName: nextNASCAR.shortName,
      circuit: nextNASCAR.circuit,
      city: nextNASCAR.city,
      sessionType: "race" as SessionType,
      status: "upcoming" as SessionStatus,
      description: `${nextNASCAR.shortName} — in ${daysOut} days`,
      countdown: { days: Math.max(0, daysOut), hours: 0, minutes: 0 },
      broadcast: nextNASCAR.broadcast,
    });
  }

  res.json({
    live: liveSessions,
    liveCount: liveSessions.filter(s => s.status === "live").length,
    upcomingCount: liveSessions.filter(s => s.status === "upcoming").length,
    hasLiveAction: liveSessions.some(s => s.status === "live"),
    nhraRuns: LIVE_NHRA_RUNS,
    ts: new Date().toISOString(),
  });
});

// GET /racing/calendar
router.get("/racing/calendar", optionalAuth, (req: Request, res: Response) => {
  const { series } = req.query;
  let events: RaceEvent[] = [...F1_CALENDAR, ...NASCAR_CALENDAR, ...NHRA_CALENDAR];
  if (series) events = events.filter(e => e.series === String(series));
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    events,
    total: events.length,
    nextRace: events.find(e => e.status === "upcoming" || e.status === "live"),
    ts: new Date().toISOString(),
  });
});

// GET /racing/standings/f1
router.get("/racing/standings/f1", optionalAuth, (_req: Request, res: Response) => {
  const standings: StandingEntry[] = Object.values(F1_DRIVERS)
    .sort((a, b) => b.points - a.points)
    .map((d, i) => ({
      pos: i + 1,
      driver: d,
      gap: i === 0 ? "LEADER" : `-${Object.values(F1_DRIVERS).sort((a, b) => b.points - a.points)[0]!.points - d.points} pts`,
      lastResult: i === 0 ? "1st" : `${i + 1}th`,
      streak: i < 3 ? "🔥 Hot" : undefined,
    }));

  const constructors = [
    { name: "McLaren Formula 1 Team", color: "#FF8000", points: F1_DRIVERS["NOR"]!.points + F1_DRIVERS["PIA"]!.points, wins: 3 },
    { name: "Oracle Red Bull Racing", color: "#3671C6", points: F1_DRIVERS["VER"]!.points + F1_DRIVERS["TSU"]!.points, wins: 4 },
    { name: "Scuderia Ferrari",       color: "#E8002D", points: F1_DRIVERS["LEC"]!.points + F1_DRIVERS["HAM"]!.points, wins: 4 },
    { name: "Mercedes-AMG Petronas",  color: "#27F4D2", points: F1_DRIVERS["RUS"]!.points + F1_DRIVERS["ANT"]!.points, wins: 0 },
    { name: "Aston Martin F1 Team",   color: "#229971", points: F1_DRIVERS["ALO"]!.points + F1_DRIVERS["STR"]!.points, wins: 0 },
  ].sort((a, b) => b.points - a.points);

  res.json({
    series: "f1",
    season: 2026,
    racesCompleted: 2,
    totalRaces: 24,
    drivers: standings,
    constructors,
    ts: new Date().toISOString(),
  });
});

// GET /racing/standings/nascar
router.get("/racing/standings/nascar", optionalAuth, (_req: Request, res: Response) => {
  const standings: StandingEntry[] = NASCAR_DRIVERS
    .sort((a, b) => b.points - a.points)
    .map((d, i) => ({
      pos: i + 1,
      driver: d,
      gap: i === 0 ? "LEADER" : `-${NASCAR_DRIVERS.sort((a, b) => b.points - a.points)[0]!.points - d.points}`,
      lastResult: `${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}`,
      streak: i === 0 ? "🔥 Playoffs" : undefined,
    }));

  res.json({
    series: "nascar",
    season: 2026,
    racesCompleted: 4,
    totalRaces: 36,
    drivers: standings,
    playoffPositions: standings.slice(0, 16),
    ts: new Date().toISOString(),
  });
});

// GET /racing/standings/nhra
router.get("/racing/standings/nhra", optionalAuth, (_req: Request, res: Response) => {
  const standings: StandingEntry[] = NHRA_TOP_FUEL
    .map((d, i) => ({
      pos: i + 1,
      driver: d,
      gap: i === 0 ? "LEADER" : `-${NHRA_TOP_FUEL[0]!.points - d.points}`,
      lastResult: LIVE_NHRA_RUNS.find(r => r.driver === d.name)?.et ?? "—",
      streak: i === 0 ? "🔥 Current leader" : undefined,
    }));

  res.json({
    series: "nhra",
    season: 2026,
    eventsCompleted: 2,
    totalEvents: 22,
    topFuel: standings,
    funnyCar: [],
    proStock: [],
    ts: new Date().toISOString(),
  });
});

// GET /racing/telemetry/:driverId
router.get("/racing/telemetry/:driverId", optionalAuth, (req: Request, res: Response) => {
  const driverId = String(req.params["driverId"] ?? "").toUpperCase();
  const driver = F1_DRIVERS[driverId];
  if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }

  res.json({
    driver,
    session: "Australian GP — Qualifying Q2",
    sectors: {
      s1: { best: "21.087", personal: "21.214", gap: "+0.127", color: "yellow" },
      s2: { best: "28.641", personal: "28.791", gap: "+0.150", color: "green" },
      s3: { best: "27.862", personal: "27.910", gap: "+0.048", color: "purple" },
    },
    fastestLap: "1:17.915",
    currentTire: driver.teamColor,
    drsActivations: 7,
    gForce: { peak: "5.4g", corner: "Turns 11-12" },
    topSpeed: "321.4 km/h",
    ts: new Date().toISOString(),
  });
});

// GET /racing/feed
router.get("/racing/feed", optionalAuth, (_req: Request, res: Response) => {
  const feed = [
    {
      id: "rf-001",
      series: "nhra",
      type: "qualifying-run",
      headline: "Austin Prock goes 3.637s/334.65 mph in Q1 — NHRA Gatornationals",
      detail: "Prock takes top spot in Top Fuel qualifying at Gainesville. John Force Racing is looking strong this weekend.",
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      urgency: "live",
      icon: "⚡",
    },
    {
      id: "rf-002",
      series: "nhra",
      type: "qualifying-run",
      headline: "Brittany Force responds with 3.641s — JFR 1-2 in Q1",
      detail: "Force makes it a John Force Racing 1-2 with an impressive 332.18 mph blast.",
      timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
      urgency: "live",
      icon: "🔥",
    },
    {
      id: "rf-003",
      series: "f1",
      type: "session-preview",
      headline: "Australian GP Practice 1 begins Thursday 2:30 AM ET",
      detail: "McLaren's Lando Norris heads to Melbourne with championship momentum after Saudi win.",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      urgency: "upcoming",
      icon: "🏁",
    },
    {
      id: "rf-004",
      series: "nascar",
      type: "entry-list",
      headline: "Bristol 500 entry list: 40 cars set for the Thunder Valley short track",
      detail: "Kyle Larson #5 starts from pole after a blistering 130.1 mph qualifying lap at Bristol Motor Speedway.",
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      urgency: "upcoming",
      icon: "🏎️",
    },
    {
      id: "rf-005",
      series: "f1",
      type: "championship",
      headline: "Verstappen leads Norris by 6 points — tightest WDC battle since 2021",
      detail: "After 2 rounds, the championship fight is razor-thin heading into Melbourne.",
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      urgency: "normal",
      icon: "🏆",
    },
    {
      id: "rf-006",
      series: "nhra",
      type: "stat",
      headline: "3.637s — The speed of a Top Fuel dragster in context",
      detail: "A Top Fuel dragster covers the quarter mile faster than a Formula 1 car covers the first 100 meters.",
      timestamp: new Date(Date.now() - 7 * 3600000).toISOString(),
      urgency: "normal",
      icon: "⏱️",
    },
  ];

  res.json({ feed, total: feed.length, hasLive: true, ts: new Date().toISOString() });
});

export default router;
