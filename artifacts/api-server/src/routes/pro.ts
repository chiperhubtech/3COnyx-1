import { Router } from "express";

const router = Router();

const stableRand = (min: number, max: number, salt: number = 0) => {
  const seed = (Math.floor(Date.now() / 60_000) + salt) % 1000;
  return Math.floor(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min));
};

// ── Apprentice Guide data ─────────────────────────────────────────────────────
const GUIDES = [
  {
    id: "g1",
    title: "P0300 Random Misfire — Step-by-Step Diagnostic",
    difficulty: "APPRENTICE",
    estimatedTime: "45 min",
    safetyLevel: "STANDARD",
    requiresSignOff: false,
    steps: [
      { step: 1, action: "Connect OBD-II scanner. Confirm P0300 + any cylinder-specific codes.", tool: "OBD-II Scanner", tip: "Check for P030X codes alongside — they pinpoint the specific cylinder." },
      { step: 2, action: "Inspect spark plugs on misfiring cylinder. Look for fouling, gap wear, or cracks.", tool: "Torque wrench, gap tool", tip: "Standard gap: 0.028–0.060 in. Always replace in sets." },
      { step: 3, action: "Perform coil swap test — move suspect coil to a confirmed-good cylinder.", tool: "None", tip: "If misfire follows the coil, coil is the culprit. If not, suspect injector or compression." },
      { step: 4, action: "Check fuel injector pulse with noid light.", tool: "Noid light kit", tip: "No pulse = wiring or PCM issue. Weak pulse = injector failure." },
      { step: 5, action: "Run compression test on affected cylinder. Spec: 140–190 PSI.", tool: "Compression gauge", tip: "< 100 PSI = internal engine issue — escalate to Foreman immediately." },
      { step: 6, action: "Clear codes, road test 15 min, re-scan.", tool: "OBD-II Scanner", tip: "If P0300 returns: escalate. If clear: document repair and stamp DVP." },
    ],
    agentNote: "Guardian AI pre-analysed 3,412 similar cases. Coil failure is root cause in 61% of P0300 complaints.",
  },
  {
    id: "g2",
    title: "HV Battery Service — Hybrid / EV High-Voltage Procedure",
    difficulty: "ADVANCED",
    estimatedTime: "2–3 hrs",
    safetyLevel: "HIGH_VOLTAGE",
    requiresSignOff: true,
    signOffRole:     "FOREMAN",
    steps: [
      { step: 1, action: "DON HV PPE: Class-0 insulated gloves, face shield, insulated tools.", tool: "HV PPE kit", tip: "⚠️ STOP — Foreman digital sign-off required before proceeding." },
      { step: 2, action: "Disable HV system via service disconnect plug per OEM procedure.", tool: "OEM service manual", tip: "Wait minimum 5 min after disconnect for capacitors to discharge." },
      { step: 3, action: "Verify HV is de-energized with CAT III multimeter. Must read < 60V DC.", tool: "CAT III Multimeter", tip: "Never assume — always verify with meter. Both orange cable pairs." },
      { step: 4, action: "Proceed with approved battery service per OEM specification.", tool: "OEM-specified tools", tip: "Any deviation from OEM spec requires escalation to OEM support channel." },
    ],
    agentNote: "⚠️ SAFETY OVERRIDE ACTIVE — Foreman digital sign-off is MANDATORY. Guardian will not clear this job without confirmed sign-off.",
  },
  {
    id: "g3",
    title: "Brake Fluid Flush — Full System Service",
    difficulty: "APPRENTICE",
    estimatedTime: "30 min",
    safetyLevel: "STANDARD",
    requiresSignOff: false,
    steps: [
      { step: 1, action: "Check brake fluid condition. Dark/cloudy = immediate flush required.", tool: "Fluid test strips", tip: "DOT 3/4 absorbs moisture — test every 12 months." },
      { step: 2, action: "Attach vacuum bleeder to reservoir. Fill with fresh DOT fluid.", tool: "Vacuum bleeder", tip: "Never let reservoir drop below 1/4 — air in system = comeback." },
      { step: 3, action: "Bleed sequence: RF → LR → LF → RR (furthest from master first).", tool: "Bleeder kit", tip: "Bleed until clean, bubble-free fluid emerges at each caliper." },
      { step: 4, action: "Top off reservoir to MAX line. Road test — firm pedal check.", tool: "None", tip: "Spongy pedal = air remains — repeat bleed sequence." },
    ],
    agentNote: "Preventive brake flushes eliminate 89% of brake-related comebacks in Guardian data.",
  },
];

// ── GET /api/pro/apprentice/guides ────────────────────────────────────────────
router.get("/pro/apprentice/guides", (_req, res) => {
  res.json({
    guides: GUIDES,
    skillLevel:    "APPRENTICE",
    mentorAgent:   "Guardian + Concierge AI",
    updatedAt:     new Date().toISOString(),
  });
});

// ── POST /api/pro/apprentice/signoff ─────────────────────────────────────────
router.post("/pro/apprentice/signoff", (req, res) => {
  const { guideId, foremanId, techId, procedure } = req.body;
  const signoffId = `signoff-${Date.now()}`;
  res.json({
    signoffId,
    guideId,
    foremanId:  foremanId ?? "FOREMAN_001",
    techId:     techId   ?? "APPRENTICE_001",
    procedure,
    status:     "APPROVED",
    timestamp:  new Date().toISOString(),
    blockchainRef: `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`,
  });
});

// ── GET /api/pro/foreman/command ──────────────────────────────────────────────
router.get("/pro/foreman/command", (_req, res) => {
  const alerts = [
    { id: "a1", severity: "HIGH",   vin: "WP0AC2999NS117842", tech: "J. Rivera",   desc: "P0301 misfire — cylinder 1 compression low (88 PSI)", elapsed: "12m ago",  pending: true  },
    { id: "a2", severity: "MEDIUM", vin: "1G1ZB5ST2NF142388", tech: "T. Brooks",   desc: "ABS module communication fault — C1214", elapsed: "28m ago",  pending: false },
    { id: "a3", severity: "HIGH",   vin: "JM1GL1WY8M1617934", tech: "M. Santos",   desc: "HV battery alert — requires sign-off before service", elapsed: "5m ago",   pending: true  },
    { id: "a4", severity: "LOW",    vin: "3VW2B7AJXLM008421", tech: "C. Williams", desc: "Scheduled oil change — customer waiting", elapsed: "45m ago", pending: false },
  ];

  const pendingSignoffs = [
    { id: "so1", tech: "M. Santos",  procedure: "HV Battery Service",   guide: "g2", urgency: "HIGH"   },
    { id: "so2", tech: "A. Okafor",  procedure: "Transmission Flush",   guide: "g4", urgency: "LOW"    },
  ];

  const shopQueue = [
    { bay: 1, vin: "WP0AC2999NS117842", make: "Porsche", model: "911 Carrera", status: "IN_PROGRESS", tech: "J. Rivera",   eta: "45 min" },
    { bay: 2, vin: "1G1ZB5ST2NF142388", make: "Chevy",   model: "Camaro SS",   status: "WAITING",     tech: "T. Brooks",   eta: "20 min" },
    { bay: 3, vin: "JM1GL1WY8M1617934", make: "Mazda",   model: "MX-5 Miata",  status: "SIGN_OFF_REQ",tech: "M. Santos",   eta: "Blocked" },
    { bay: 4, vin: "3VW2B7AJXLM008421", make: "VW",      model: "Jetta GLI",   status: "COMPLETE",    tech: "C. Williams", eta: "Ready" },
  ];

  const gumloopAutomation = [
    { task: "Parts order submitted", vendor: "AutoZone Pro", part: "Denso Coil Pack x4", status: "ORDERED", eta: "2 hrs" },
    { task: "Customer SMS sent",     customer: "Alex Harrington", message: "Your 911 is 45 min from completion", status: "DELIVERED" },
    { task: "Carfax stamped",        vin: "WP0AC2999NS117842", event: "Diagnostic completed", status: "LOGGED" },
  ];

  res.json({
    alerts,
    pendingSignoffs,
    shopQueue,
    gumloopAutomation,
    shopStats: {
      totalBays:     4,
      active:        3,
      waiting:       1,
      completed:     stableRand(8, 14, 1),
      avgCycleTime:  "58 min",
    },
    updatedAt: new Date().toISOString(),
  });
});

// ── GET /api/pro/oem/heatmap ──────────────────────────────────────────────────
router.get("/pro/oem/heatmap", (_req, res) => {
  const corridorCities = [
    { city: "Miami",        state: "FL", lat: 25.77, lng: -80.19, failureCount: stableRand(180, 240, 1), topPart: "Turbocharger",    topMake: "BMW"     },
    { city: "Jacksonville", state: "FL", lat: 30.33, lng: -81.65, failureCount: stableRand(90,  130, 2), topPart: "Fuel Injector",   topMake: "Chevy"   },
    { city: "Savannah",     state: "GA", lat: 32.08, lng: -81.09, failureCount: stableRand(60,  90,  3), topPart: "Transmission",    topMake: "Ford"    },
    { city: "Charlotte",    state: "NC", lat: 35.22, lng: -80.84, failureCount: stableRand(140, 190, 4), topPart: "Coil Pack",       topMake: "Audi"    },
    { city: "Richmond",     state: "VA", lat: 37.54, lng: -77.43, failureCount: stableRand(110, 150, 5), topPart: "Brake Caliper",   topMake: "Mercedes"},
    { city: "Baltimore",    state: "MD", lat: 39.29, lng: -76.61, failureCount: stableRand(130, 170, 6), topPart: "Water Pump",      topMake: "BMW"     },
    { city: "Philadelphia", state: "PA", lat: 39.95, lng: -75.16, failureCount: stableRand(160, 210, 7), topPart: "Alternator",      topMake: "VW"      },
    { city: "New York",     state: "NY", lat: 40.71, lng: -74.00, failureCount: stableRand(290, 380, 8), topPart: "Turbocharger",    topMake: "Porsche" },
    { city: "New Haven",    state: "CT", lat: 41.30, lng: -72.92, failureCount: stableRand(70,  100, 9), topPart: "Oxygen Sensor",   topMake: "Toyota"  },
    { city: "Boston",       state: "MA", lat: 42.36, lng: -71.06, failureCount: stableRand(190, 250,10), topPart: "Timing Chain",    topMake: "BMW"     },
  ];

  const trendingFailures = [
    { part: "Turbocharger — Low-Pressure",       count: stableRand(280, 340, 11), makeModel: "BMW 3/5 Series 2019–2022", trend: "+18%", alert: "SOFT_RECALL_CANDIDATE" },
    { part: "EGR Valve Carbon Buildup",          count: stableRand(190, 240, 12), makeModel: "VW/Audi 2.0T (EA888)",    trend: "+12%", alert: "SERVICE_BULLETIN"      },
    { part: "Transfer Case Actuator",            count: stableRand(140, 180, 13), makeModel: "Ford Explorer 2020–2023", trend: "+9%",  alert: "MONITOR"               },
    { part: "High-Pressure Fuel Pump",           count: stableRand(110, 150, 14), makeModel: "BMW N54/N55 Engine",      trend: "+22%", alert: "SOFT_RECALL_CANDIDATE" },
    { part: "Intake Manifold Gasket",            count: stableRand(80,  120, 15), makeModel: "GM 3.6L V6 (LGX)",       trend: "+7%",  alert: "SERVICE_BULLETIN"      },
  ];

  res.json({
    corridor:        "I-95 (Boston → Miami)",
    totalDataPoints: stableRand(11_000, 13_000, 0),
    cities:          corridorCities,
    trendingFailures,
    oemAlerts: {
      softRecallCandidates: 2,
      serviceBulletins:     2,
      monitored:            1,
    },
    dataLatency:  "Live — 60s refresh",
    updatedAt:    new Date().toISOString(),
  });
});

// ── GET /api/pro/ledger ───────────────────────────────────────────────────────
router.get("/pro/ledger", (_req, res) => {
  const apprentices = [
    { id: "t1", name: "Jordan Rivera",   level: "APPRENTICE",    tokens: stableRand(1_200, 1_400, 1),  repairs: stableRand(38, 48, 2),  badge: "RISING_STAR",    specialty: "Diagnostics"   },
    { id: "t2", name: "Taylor Brooks",   level: "TECHNICIAN",    tokens: stableRand(3_400, 3_800, 3),  repairs: stableRand(142, 162, 4), badge: "VERIFIED_TECH",  specialty: "EV/Hybrid"     },
    { id: "t3", name: "Marcus Santos",   level: "JOURNEYMAN",    tokens: stableRand(6_100, 6_600, 5),  repairs: stableRand(290, 320, 6), badge: "HV_CERTIFIED",   specialty: "High-Voltage"  },
    { id: "t4", name: "Chen Williams",   level: "SENIOR_TECH",   tokens: stableRand(9_800, 10_400, 7), repairs: stableRand(480, 510, 8), badge: "MASTER_BADGE",   specialty: "German Import" },
    { id: "t5", name: "Aisha Okafor",    level: "APPRENTICE",    tokens: stableRand(890, 1_100, 9),    repairs: stableRand(22, 32, 10),  badge: "FAST_LEARNER",   specialty: "Brake/Chassis" },
    { id: "t6", name: "Devon Marchetti", level: "MASTER_TECH",   tokens: stableRand(18_200, 19_000, 11),repairs: stableRand(820, 870, 12),badge: "LEGEND",         specialty: "All-Make"      },
  ];

  const skillTokenEvents = [
    { tech: "Jordan Rivera",   event: "P0300 Misfire Resolved",         tokens: "+50",  timestamp: "2m ago"  },
    { tech: "Marcus Santos",   event: "HV Battery Sign-Off Completed",  tokens: "+120", timestamp: "18m ago" },
    { tech: "Taylor Brooks",   event: "EV Brake Regen Calibration",     tokens: "+80",  timestamp: "31m ago" },
    { tech: "Chen Williams",   event: "Transmission Rebuild Complete",  tokens: "+200", timestamp: "1h ago"  },
    { tech: "Aisha Okafor",    event: "First Brake Flush — Solo",       tokens: "+30",  timestamp: "2h ago"  },
  ];

  res.json({
    apprentices,
    recentActivity:     skillTokenEvents,
    ledgerStats: {
      totalTokensIssued: stableRand(280_000, 310_000, 0),
      activeEarners:     stableRand(180, 220, 1),
      masterTechs:       stableRand(12, 18, 2),
      avgTokensPerRepair: 67,
      blockchainStatus:  "Active — Immutable Ledger",
    },
    updatedAt: new Date().toISOString(),
  });
});

export default router;
