import { Router } from "express";

const router = Router();

// ── Corridor Geography ─────────────────────────────────────────────────────────
export const CORRIDOR_STOPS = [
  { id: 0, name: "Hunts Point, Bronx", state: "NY", abbr: "HP" },
  { id: 1, name: "Lower Manhattan", state: "NY", abbr: "MH" },
  { id: 2, name: "Jersey City", state: "NJ", abbr: "JC" },
  { id: 3, name: "Newark", state: "NJ", abbr: "NWK" },
  { id: 4, name: "Philadelphia", state: "PA", abbr: "PHL" },
  { id: 5, name: "Wilmington", state: "DE", abbr: "WIL" },
  { id: 6, name: "Baltimore", state: "MD", abbr: "BAL" },
  { id: 7, name: "Washington, DC", state: "DC", abbr: "DC" },
  { id: 8, name: "Stamford", state: "CT", abbr: "STM" },
  { id: 9, name: "New Haven", state: "CT", abbr: "NHV" },
  { id: 10, name: "Providence", state: "RI", abbr: "PVD" },
  { id: 11, name: "Boston Seaport", state: "MA", abbr: "BOS" },
];

// ── 50 Vehicle Profiles ────────────────────────────────────────────────────────
const VEHICLES = [
  // STOP 0 · Hunts Point, Bronx (8)
  { id:"v001", year:2023, make:"Porsche", model:"911 GT3 RS", color:"Chalk", mileage:2100, corridorStop:0, wholesalePrice:224500, retailPrice:271800, condition:"Flawless", vin:"WP0CF2A9XPS273841" },
  { id:"v002", year:2022, make:"Lamborghini", model:"Huracán STO", color:"Bianco Monocerus", mileage:4800, corridorStop:0, wholesalePrice:214000, retailPrice:258200, condition:"Excellent", vin:"ZHWUA4ZF4NLA13024" },
  { id:"v003", year:2023, make:"Ferrari", model:"SF90 Spider", color:"Rosso Corsa", mileage:1200, corridorStop:0, wholesalePrice:481000, retailPrice:592000, condition:"Flawless", vin:"ZFF95NLA0P0274811" },
  { id:"v004", year:2021, make:"McLaren", model:"765LT Spider", color:"Papaya Spark", mileage:7300, corridorStop:0, wholesalePrice:298000, retailPrice:361400, condition:"Excellent", vin:"SBM14DCA7MW007341" },
  { id:"v005", year:2023, make:"Rolls-Royce", model:"Ghost Extended", color:"Mystic White", mileage:2900, corridorStop:0, wholesalePrice:371000, retailPrice:451200, condition:"Flawless", vin:"SCA664S5XPU218923" },
  { id:"v006", year:2022, make:"Bentley", model:"Flying Spur Mulliner", color:"Beluga", mileage:11200, corridorStop:0, wholesalePrice:218000, retailPrice:264100, condition:"Excellent", vin:"SCBCP9ZA3NC082741" },
  { id:"v007", year:2024, make:"Porsche", model:"Cayenne Turbo GT", color:"Carrara White", mileage:980, corridorStop:0, wholesalePrice:172000, retailPrice:208500, condition:"Flawless", vin:"WP1AF2A9XRS273841" },
  { id:"v008", year:2021, make:"Ferrari", model:"Roma Coupe", color:"Grigio Titanio", mileage:8400, corridorStop:0, wholesalePrice:189000, retailPrice:229600, condition:"Good", vin:"ZFF96NMA0M0274711" },

  // STOP 1 · Lower Manhattan (5)
  { id:"v009", year:2023, make:"Lamborghini", model:"Urus S Pearl Capsule", color:"Pearl White", mileage:3200, corridorStop:1, wholesalePrice:241000, retailPrice:291800, condition:"Flawless", vin:"ZPBUA1ZL4PLA10023" },
  { id:"v010", year:2022, make:"Porsche", model:"Panamera Turbo S E-Hybrid", color:"Jet Black Metallic", mileage:12800, corridorStop:1, wholesalePrice:148000, retailPrice:179400, condition:"Excellent", vin:"WP0AE2A72NS217841" },
  { id:"v011", year:2023, make:"Mercedes-Benz", model:"AMG GT Black Series", color:"Obsidian Black", mileage:1800, corridorStop:1, wholesalePrice:301000, retailPrice:364200, condition:"Flawless", vin:"W1K7X7HB0PA001800" },
  { id:"v012", year:2022, make:"Aston Martin", model:"DBS 770 Ultimate", color:"Lunar White", mileage:4100, corridorStop:1, wholesalePrice:298000, retailPrice:361100, condition:"Excellent", vin:"SCFRMFCW8NGT13049" },
  { id:"v013", year:2023, make:"Tesla", model:"Roadster", color:"Ultra Red", mileage:510, corridorStop:1, wholesalePrice:198000, retailPrice:239200, condition:"Flawless", vin:"7SAYGDEF0PF141923" },

  // STOP 2 · Jersey City (4)
  { id:"v014", year:2022, make:"Porsche", model:"911 Turbo S Cabriolet", color:"GT Silver Metallic", mileage:5600, corridorStop:2, wholesalePrice:198000, retailPrice:239800, condition:"Excellent", vin:"WP0CB2A92NS221749" },
  { id:"v015", year:2021, make:"Ferrari", model:"F8 Tributo Spider", color:"Giallo Triplo Strato", mileage:9100, corridorStop:2, wholesalePrice:271000, retailPrice:328300, condition:"Good", vin:"ZFF92LLA0M0247813" },
  { id:"v016", year:2023, make:"McLaren", model:"Artura Spider", color:"Volcano Red", mileage:2400, corridorStop:2, wholesalePrice:218000, retailPrice:264100, condition:"Excellent", vin:"SBM15ECA0PW003814" },
  { id:"v017", year:2022, make:"Bentley", model:"Continental GT Speed", color:"Storm Blue", mileage:7800, corridorStop:2, wholesalePrice:241000, retailPrice:291900, condition:"Excellent", vin:"SCBEN2ZA5NC080821" },

  // STOP 3 · Newark (4)
  { id:"v018", year:2022, make:"Lamborghini", model:"Aventador LP 780-4 Ultimae", color:"Verde Ermes", mileage:3900, corridorStop:3, wholesalePrice:514000, retailPrice:622800, condition:"Excellent", vin:"ZHWEC4ZF1NLA09003" },
  { id:"v019", year:2023, make:"Porsche", model:"718 Spyder RS", color:"Chalk", mileage:1400, corridorStop:3, wholesalePrice:131000, retailPrice:158700, condition:"Flawless", vin:"WP0CB2A96PS222419" },
  { id:"v020", year:2021, make:"Mercedes-Benz", model:"G 63 AMG", color:"Obsidian Black", mileage:18400, corridorStop:3, wholesalePrice:178000, retailPrice:215600, condition:"Good", vin:"W1NYC7HJ3MX424829" },
  { id:"v021", year:2022, make:"Aston Martin", model:"Vantage F1 Edition", color:"Racing Green", mileage:6200, corridorStop:3, wholesalePrice:168000, retailPrice:203400, condition:"Excellent", vin:"SCFSMGAW2NGT09841" },

  // STOP 4 · Philadelphia (5)
  { id:"v022", year:2023, make:"Ferrari", model:"296 GTB", color:"Blu Corsa", mileage:2800, corridorStop:4, wholesalePrice:298000, retailPrice:361100, condition:"Flawless", vin:"ZFF96NNA0P0281413" },
  { id:"v023", year:2022, make:"Porsche", model:"992 Targa 4S", color:"Gentian Blue Metallic", mileage:8100, corridorStop:4, wholesalePrice:148000, retailPrice:179300, condition:"Excellent", vin:"WP0BB2A95NS222713" },
  { id:"v024", year:2023, make:"Rolls-Royce", model:"Spectre", color:"Arctic White", mileage:1100, corridorStop:4, wholesalePrice:418000, retailPrice:506500, condition:"Flawless", vin:"SCA999C57PU219041" },
  { id:"v025", year:2021, make:"McLaren", model:"720S Performance", color:"Cerulean Blue", mileage:11800, corridorStop:4, wholesalePrice:248000, retailPrice:300300, condition:"Good", vin:"SBM12FA60MW003419" },
  { id:"v026", year:2022, make:"Bentley", model:"Bentayga EWB Azure", color:"White Sand", mileage:14200, corridorStop:4, wholesalePrice:214000, retailPrice:259100, condition:"Good", vin:"SCBBP9ZA3NC082741" },

  // STOP 5 · Wilmington (3)
  { id:"v027", year:2023, make:"Porsche", model:"Macan Turbo Electric", color:"Carmine Red", mileage:3400, corridorStop:5, wholesalePrice:98000, retailPrice:118700, condition:"Flawless", vin:"WP1AA2A97PS211413" },
  { id:"v028", year:2022, make:"Ferrari", model:"Portofino M Spider", color:"Rosso Fiorano", mileage:7400, corridorStop:5, wholesalePrice:241000, retailPrice:291900, condition:"Excellent", vin:"ZFF89FLA0N0250813" },
  { id:"v029", year:2021, make:"Lamborghini", model:"Huracán EVO Spyder", color:"Grigio Titans", mileage:19800, corridorStop:5, wholesalePrice:181000, retailPrice:219200, condition:"Good", vin:"ZHWUA4ZF8MLA08014" },

  // STOP 6 · Baltimore (4)
  { id:"v030", year:2023, make:"Mercedes-Benz", model:"AMG GT 63 S 4-Door", color:"High-Tech Silver", mileage:4800, corridorStop:6, wholesalePrice:178000, retailPrice:215600, condition:"Excellent", vin:"W1K7X7HBXPA002801" },
  { id:"v031", year:2022, make:"Porsche", model:"Taycan Turbo S Cross Turismo", color:"Night Blue Metallic", mileage:9800, corridorStop:6, wholesalePrice:148000, retailPrice:179300, condition:"Excellent", vin:"WP0CF2A71NS218714" },
  { id:"v032", year:2023, make:"Bentley", model:"Flying Spur S", color:"Barnato Green", mileage:2100, corridorStop:6, wholesalePrice:221000, retailPrice:267800, condition:"Flawless", vin:"SCBDH4ZA7PC085742" },
  { id:"v033", year:2021, make:"Rolls-Royce", model:"Cullinan Black Badge", color:"Darkest Tungsten", mileage:16400, corridorStop:6, wholesalePrice:398000, retailPrice:482200, condition:"Good", vin:"SCA999C55MU218092" },

  // STOP 7 · Washington, DC (4)
  { id:"v034", year:2023, make:"Ferrari", model:"Purosangue", color:"Verde Bottiglia", mileage:1400, corridorStop:7, wholesalePrice:398000, retailPrice:482200, condition:"Flawless", vin:"ZFF97PNA0P0284813" },
  { id:"v035", year:2022, make:"Lamborghini", model:"Huracán Tecnica", color:"Arancio Borealis", mileage:6400, corridorStop:7, wholesalePrice:218000, retailPrice:264200, condition:"Excellent", vin:"ZHWUA4ZF4NLA12041" },
  { id:"v036", year:2023, make:"Porsche", model:"911 Dakar", color:"Mamba Green Metallic", mileage:8800, corridorStop:7, wholesalePrice:178000, retailPrice:215600, condition:"Excellent", vin:"WP0CB2A97PS234819" },
  { id:"v037", year:2022, make:"Aston Martin", model:"DBX 707", color:"Iridescent Emerald", mileage:11200, corridorStop:7, wholesalePrice:218000, retailPrice:264200, condition:"Good", vin:"SCFMUAAT9NGT12048" },

  // STOP 8 · Stamford (3)
  { id:"v038", year:2022, make:"Ferrari", model:"812 GTS", color:"Rosso Corsa", mileage:8900, corridorStop:8, wholesalePrice:368000, retailPrice:445900, condition:"Excellent", vin:"ZFF87YLA0N0249801" },
  { id:"v039", year:2021, make:"Rolls-Royce", model:"Dawn Landspeed Collection", color:"English White", mileage:12400, corridorStop:8, wholesalePrice:398000, retailPrice:482200, condition:"Good", vin:"SCA664S57MU218049" },
  { id:"v040", year:2023, make:"McLaren", model:"750S Spider", color:"Storm Blue", mileage:2100, corridorStop:8, wholesalePrice:348000, retailPrice:421700, condition:"Flawless", vin:"SBM15ECA3PW004801" },

  // STOP 9 · New Haven (3)
  { id:"v041", year:2023, make:"Porsche", model:"911 GT3 Touring", color:"Python Green", mileage:3800, corridorStop:9, wholesalePrice:164500, retailPrice:199300, condition:"Excellent", vin:"WP0AC2A94PS241819" },
  { id:"v042", year:2022, make:"Bentley", model:"Continental GT Convertible", color:"Topaz", mileage:4200, corridorStop:9, wholesalePrice:248000, retailPrice:300300, condition:"Flawless", vin:"SCBDG4ZA2NC081041" },
  { id:"v043", year:2021, make:"Tesla", model:"Model S Plaid", color:"Midnight Silver", mileage:21400, corridorStop:9, wholesalePrice:78000, retailPrice:94500, condition:"Good", vin:"5YJSA1E63MF418092" },

  // STOP 10 · Providence (3)
  { id:"v044", year:2023, make:"Ferrari", model:"488 Pista Spider", color:"Rosso Pilota", mileage:5800, corridorStop:10, wholesalePrice:414000, retailPrice:501700, condition:"Excellent", vin:"ZFF90RLA0P0271413" },
  { id:"v045", year:2022, make:"Lamborghini", model:"Urus Performante", color:"Verde Gea", mileage:2800, corridorStop:10, wholesalePrice:261000, retailPrice:316300, condition:"Flawless", vin:"ZPBUA1ZL1PLA13041" },
  { id:"v046", year:2023, make:"Mercedes-Benz", model:"SL 63 AMG", color:"Patagoniarot", mileage:4100, corridorStop:10, wholesalePrice:148000, retailPrice:179300, condition:"Excellent", vin:"W1KRK5HB0PA004801" },

  // STOP 11 · Boston Seaport (4)
  { id:"v047", year:2023, make:"Rolls-Royce", model:"Phantom Series II", color:"Arctic White", mileage:1800, corridorStop:11, wholesalePrice:498000, retailPrice:603400, condition:"Flawless", vin:"SCA999C51PU219041" },
  { id:"v048", year:2023, make:"Ferrari", model:"Daytona SP3", color:"Rosso Magma", mileage:800, corridorStop:11, wholesalePrice:2100000, retailPrice:2544000, condition:"Flawless", vin:"ZFF97PMA0P0280413" },
  { id:"v049", year:2023, make:"Porsche", model:"918 Spyder", color:"Silver Blue", mileage:4100, corridorStop:11, wholesalePrice:1400000, retailPrice:1696000, condition:"Flawless", vin:"WP0ZZZ91ZDS800149" },
  { id:"v050", year:2021, make:"Bentley", model:"Mulsanne Speed", color:"Dark Sapphire", mileage:9800, corridorStop:11, wholesalePrice:281000, retailPrice:340400, condition:"Excellent", vin:"SCBZB4ZA2LC079841" },
];

// ── 20 Professional Partners ───────────────────────────────────────────────────
const PARTNERS = [
  { id:"p001", name:"M. Rodriguez", shop:"Manhattan Euro Specialists", location:"New York, NY", corridorStop:0, specialty:["Porsche","Ferrari","Lamborghini"], reputationScore:94, aiAccuracy:97, rate:185, totalJobs:412, badge:"platinum", bgcVerified:true },
  { id:"p002", name:"A. Chen", shop:"Bronx Exotic Auto", location:"Bronx, NY", corridorStop:0, specialty:["McLaren","Bentley","Rolls-Royce"], reputationScore:88, aiAccuracy:91, rate:165, totalJobs:287, badge:"gold", bgcVerified:true },
  { id:"p003", name:"D. Washington", shop:"Tribeca Motor Works", location:"Manhattan, NY", corridorStop:1, specialty:["Ferrari","Aston Martin","McLaren"], reputationScore:92, aiAccuracy:94, rate:180, totalJobs:341, badge:"platinum", bgcVerified:true },
  { id:"p004", name:"S. Patel", shop:"Hudson Euro Performance", location:"Jersey City, NJ", corridorStop:2, specialty:["Porsche","Mercedes-Benz"], reputationScore:87, aiAccuracy:89, rate:155, totalJobs:198, badge:"gold", bgcVerified:true },
  { id:"p005", name:"T. Russo", shop:"Newark Prestige Auto", location:"Newark, NJ", corridorStop:3, specialty:["Lamborghini","McLaren","Ferrari"], reputationScore:84, aiAccuracy:86, rate:148, totalJobs:164, badge:"gold", bgcVerified:true },
  { id:"p006", name:"V. Kim", shop:"Garden State Exotics", location:"Elizabeth, NJ", corridorStop:3, specialty:["Porsche","Ferrari"], reputationScore:81, aiAccuracy:83, rate:142, totalJobs:137, badge:"silver", bgcVerified:true },
  { id:"p007", name:"C. Marchetti", shop:"Philly Euro Service", location:"Philadelphia, PA", corridorStop:4, specialty:["Porsche","Bentley","Rolls-Royce"], reputationScore:89, aiAccuracy:91, rate:162, totalJobs:278, badge:"platinum", bgcVerified:true },
  { id:"p008", name:"R. Okafor", shop:"Main Line Exotics", location:"Wayne, PA", corridorStop:4, specialty:["Ferrari","Lamborghini"], reputationScore:86, aiAccuracy:88, rate:158, totalJobs:214, badge:"gold", bgcVerified:true },
  { id:"p009", name:"J. Kowalski", shop:"Delaware Valley Prestige", location:"Wilmington, DE", corridorStop:5, specialty:["Mercedes-Benz","Aston Martin"], reputationScore:83, aiAccuracy:85, rate:145, totalJobs:156, badge:"silver", bgcVerified:true },
  { id:"p010", name:"A. Thompson", shop:"Chesapeake Euro", location:"Baltimore, MD", corridorStop:6, specialty:["Porsche","Tesla"], reputationScore:86, aiAccuracy:89, rate:155, totalJobs:201, badge:"gold", bgcVerified:true },
  { id:"p011", name:"N. Osei", shop:"DC Exotic Specialists", location:"Washington, DC", corridorStop:7, specialty:["Ferrari","Lamborghini","McLaren"], reputationScore:90, aiAccuracy:92, rate:172, totalJobs:318, badge:"platinum", bgcVerified:true },
  { id:"p012", name:"L. Chen", shop:"Capitol Hill Prestige", location:"Washington, DC", corridorStop:7, specialty:["Rolls-Royce","Bentley"], reputationScore:87, aiAccuracy:90, rate:160, totalJobs:243, badge:"gold", bgcVerified:true },
  { id:"p013", name:"B. Hendricks", shop:"Stamford Exotic Auto", location:"Stamford, CT", corridorStop:8, specialty:["Porsche","McLaren"], reputationScore:88, aiAccuracy:90, rate:165, totalJobs:187, badge:"gold", bgcVerified:true },
  { id:"p014", name:"F. Nakamura", shop:"New Haven Euro Works", location:"New Haven, CT", corridorStop:9, specialty:["Ferrari","Lamborghini"], reputationScore:85, aiAccuracy:87, rate:158, totalJobs:172, badge:"gold", bgcVerified:true },
  { id:"p015", name:"E. Santos", shop:"Providence Prestige", location:"Providence, RI", corridorStop:10, specialty:["Porsche","Bentley"], reputationScore:82, aiAccuracy:84, rate:145, totalJobs:128, badge:"silver", bgcVerified:true },
  { id:"p016", name:"G. Murphy", shop:"Rhode Island Exotics", location:"Cranston, RI", corridorStop:10, specialty:["Ferrari","Mercedes-Benz"], reputationScore:79, aiAccuracy:81, rate:138, totalJobs:104, badge:"silver", bgcVerified:false },
  { id:"p017", name:"A. Patel", shop:"Back Bay Exotic Service", location:"Boston, MA", corridorStop:11, specialty:["Porsche","Lamborghini","McLaren"], reputationScore:91, aiAccuracy:93, rate:178, totalJobs:287, badge:"platinum", bgcVerified:true },
  { id:"p018", name:"H. Fitzgerald", shop:"Seaport Prestige Auto", location:"Boston, MA", corridorStop:11, specialty:["Rolls-Royce","Bentley","Ferrari"], reputationScore:89, aiAccuracy:91, rate:172, totalJobs:241, badge:"platinum", bgcVerified:true },
  { id:"p019", name:"K. Yamamoto", shop:"Commonwealth Euro", location:"Cambridge, MA", corridorStop:11, specialty:["Porsche","Aston Martin"], reputationScore:86, aiAccuracy:88, rate:158, totalJobs:198, badge:"gold", bgcVerified:true },
  { id:"p020", name:"T. O'Brien", shop:"Beacon Hill Motors", location:"Boston, MA", corridorStop:11, specialty:["Ferrari","McLaren"], reputationScore:84, aiAccuracy:86, rate:152, totalJobs:164, badge:"gold", bgcVerified:true },
];

// ── 12 Scan Alert Types ────────────────────────────────────────────────────────
const SCAN_ALERTS = [
  { issue:"Turbo Wastegate Actuator Degradation", category:"Powertrain", severity:"CRITICAL", predictedFailureMiles:847, retailCost:18400, wholesaleCost:4200, urgency:"Immediate action required" },
  { issue:"Carbon Ceramic Brake Pad Delamination", category:"Braking System", severity:"CRITICAL", predictedFailureMiles:320, retailCost:12800, wholesaleCost:2900, urgency:"URGENT — Schedule this week" },
  { issue:"PDK Dual-Clutch Synchronizer Wear", category:"Transmission", severity:"WARNING", predictedFailureMiles:2100, retailCost:24600, wholesaleCost:7400, urgency:"Schedule within 30 days" },
  { issue:"Active Ride Height Sensor Malfunction", category:"Suspension", severity:"WARNING", predictedFailureMiles:1200, retailCost:6800, wholesaleCost:1800, urgency:"Schedule this month" },
  { issue:"Supercharger Coolant Loop Micro-Leak", category:"EV System", severity:"CRITICAL", predictedFailureMiles:640, retailCost:9200, wholesaleCost:2100, urgency:"Immediate action required" },
  { issue:"Side-Pod Intercooler Hose Fracture", category:"Cooling", severity:"WARNING", predictedFailureMiles:1800, retailCost:4200, wholesaleCost:980, urgency:"Schedule within 14 days" },
  { issue:"Naim Audio Amplifier Thermal Runaway", category:"Electronics", severity:"WARNING", predictedFailureMiles:0, retailCost:11400, wholesaleCost:2800, urgency:"Cosmetic — schedule at convenience" },
  { issue:"Pirelli Trofeo R Sidewall Stress Fractures", category:"Tires", severity:"CRITICAL", predictedFailureMiles:240, retailCost:8400, wholesaleCost:3200, urgency:"URGENT — Do not drive" },
  { issue:"Transfer Case Fluid Contamination", category:"Drivetrain", severity:"WARNING", predictedFailureMiles:3200, retailCost:3800, wholesaleCost:920, urgency:"Schedule within 60 days" },
  { issue:"V10 Lambda Sensor Array Fault Code P2197", category:"Engine", severity:"WARNING", predictedFailureMiles:1600, retailCost:7600, wholesaleCost:1900, urgency:"Schedule this month" },
  { issue:"Adaptive Damper Cavitation (Rear Pair)", category:"Suspension", severity:"WARNING", predictedFailureMiles:2400, retailCost:14200, wholesaleCost:3800, urgency:"Schedule within 30 days" },
  { issue:"Carbon Fibre Rear Diffuser Delamination", category:"Bodywork", severity:"INFO", predictedFailureMiles:0, retailCost:22000, wholesaleCost:6200, urgency:"Cosmetic — schedule within 90 days" },
];

// ── Ticker State ───────────────────────────────────────────────────────────────
let tickerState = { signups: 8564, timestamp: Date.now() };

// ── Routes ─────────────────────────────────────────────────────────────────────

router.get("/status", (_req, res) => {
  res.json({
    ok: true,
    engine: "Unity Simulated API Layer v1.0",
    corridor: "Hunts Point → Boston Seaport",
    vehicles: VEHICLES.length,
    partners: PARTNERS.length,
    corridorStops: CORRIDOR_STOPS.length,
    states: 7,
    totalCorridorMiles: 218,
  });
});

router.get("/vehicles", (req, res) => {
  const { stop, make, limit } = req.query;
  let filtered = [...VEHICLES];
  if (stop !== undefined) filtered = filtered.filter(v => v.corridorStop === Number(stop));
  if (make) filtered = filtered.filter(v => v.make.toLowerCase().includes(String(make).toLowerCase()));
  if (limit) filtered = filtered.slice(0, Number(limit));
  res.json({ vehicles: filtered, total: filtered.length, corridorStops: CORRIDOR_STOPS });
});

router.get("/partners", (req, res) => {
  const { stop } = req.query;
  let filtered = [...PARTNERS];
  if (stop !== undefined) filtered = filtered.filter(p => p.corridorStop === Number(stop));
  const stats = {
    total: filtered.length,
    platinum: filtered.filter(p => p.badge === "platinum").length,
    avgScore: Math.round(filtered.reduce((a, p) => a + p.reputationScore, 0) / filtered.length),
    avgAiAccuracy: Math.round(filtered.reduce((a, p) => a + p.aiAccuracy, 0) / filtered.length),
    bgcVerified: filtered.filter(p => p.bgcVerified).length,
  };
  res.json({ partners: filtered, stats, corridorStops: CORRIDOR_STOPS });
});

router.post("/scan", (req, res) => {
  const { vehicleId } = req.body ?? {};
  const vehicle = vehicleId
    ? (VEHICLES.find(v => v.id === vehicleId) ?? VEHICLES[Math.floor(Math.random() * VEHICLES.length)])
    : VEHICLES[Math.floor(Math.random() * VEHICLES.length)];

  const alert = SCAN_ALERTS[Math.floor(Math.random() * SCAN_ALERTS.length)];

  // Match best specialist for this make
  const eligible = PARTNERS.filter(p =>
    p.specialty.some(s => s.toLowerCase().includes(vehicle.make.toLowerCase()))
  ).sort((a, b) => b.reputationScore - a.reputationScore);
  const specialist = eligible[0] ?? PARTNERS.sort((a, b) => b.reputationScore - a.reputationScore)[0];

  const savings = alert.retailCost - alert.wholesaleCost;
  const savingsPct = Math.round((savings / alert.retailCost) * 100);
  const corridorStop = CORRIDOR_STOPS[vehicle.corridorStop];

  res.json({
    scanId: `SCN-${Date.now()}`,
    vehicle,
    corridorStop,
    alert: {
      ...alert,
      savings,
      savingsPct,
      retailLabel: "IGNORANCE TAX",
      wholesaleLabel: "3C WHOLESALE",
    },
    specialist: {
      id: specialist.id,
      name: specialist.name,
      shop: specialist.shop,
      location: specialist.location,
      reputationScore: specialist.reputationScore,
      aiAccuracy: specialist.aiAccuracy,
      badge: specialist.badge,
      rate: specialist.rate,
      routingNote: specialist.reputationScore >= 85 ? "+20% priority routing" : "Standard routing",
    },
    scannedAt: new Date().toISOString(),
    meshNodes: ["V2X Guardian", "Gemini AI", "Fullpath Intent", "MarketCheck", "Mission Agent", "Vault NIST-MCP", "Dynasty Stripe"],
  });
});

router.get("/ticker", (_req, res) => {
  const elapsed = (Date.now() - tickerState.timestamp) / 1000;
  const newSignups = Math.floor(elapsed / 30);
  if (newSignups > 0) {
    tickerState.signups += newSignups;
    tickerState.timestamp = Date.now();
  }
  const signups = tickerState.signups;
  const mrr = signups * 99;
  const arr = mrr * 12;
  const hectocornPct = (arr / 100_000_000) * 100;
  return res.json({
    signups,
    mrr,
    arr,
    gmv: 32_800_000 + (signups - 8564) * 1200,
    hectocornPct: Number(hectocornPct.toFixed(4)),
    hectocornTarget: 100_000_000,
    nextMilestone: Math.ceil(signups / 1000) * 1000,
    toNextMilestone: Math.ceil(signups / 1000) * 1000 - signups,
    corridorVehicles: VEHICLES.length,
    corridorPartners: PARTNERS.length,
  });
});

router.post("/transaction", (req, res) => {
  const { vehicleId } = req.body ?? {};
  const found = vehicleId ? VEHICLES.find(v => v.id === vehicleId) : null;
  const vehicle = found ?? VEHICLES[Math.floor(Math.random() * 15)];

  const amount = vehicle.wholesalePrice;
  const vendorPayout   = Math.round(amount * 0.850);
  const transport      = Math.round(amount * 0.025);
  const platformFee    = Math.round(amount * 0.125);
  const memberSlice    = Math.round(platformFee * 0.20);
  const netPlatform    = platformFee - memberSlice;

  res.json({
    txnId: `TXN-UNITY-${Date.now()}`,
    vehicle,
    amount,
    splits: [
      { label: "Dealer / Vendor Payout", amount: vendorPayout, pct: 85.0, color: "#10B981", icon: "building", transferId: `tr_${Math.random().toString(36).slice(2, 12)}` },
      { label: "Transport (Ship.cars)", amount: transport, pct: 2.5, color: "#3B82F6", icon: "truck", transferId: `tr_${Math.random().toString(36).slice(2, 12)}` },
      { label: "Member Slice (Dynasty)", amount: memberSlice, pct: Math.round((memberSlice / amount) * 1000) / 10, color: "#C9A227", icon: "user", transferId: `tr_${Math.random().toString(36).slice(2, 12)}` },
      { label: "3C Platform Net", amount: netPlatform, pct: Math.round((netPlatform / amount) * 1000) / 10, color: "#8B5CF6", icon: "zap", transferId: `tr_${Math.random().toString(36).slice(2, 12)}` },
    ],
    stripePaymentIntentId: `pi_unity_${Math.random().toString(36).slice(2, 14)}`,
    settledAt: new Date().toISOString(),
    amlCleared: true,
    kycVerified: true,
  });
});

router.post("/rate", (req, res) => {
  const { direction, targetId, stars, tags, note } = req.body ?? {};
  const reputationDelta = Number(stars) >= 4 ? 0.3 : Number(stars) >= 3 ? 0 : -0.5;
  res.json({
    ok: true,
    ratingId: `RTG-${Date.now()}`,
    direction,
    targetId,
    stars: Number(stars),
    tags: tags ?? [],
    note: note ?? "",
    timestamp: new Date().toISOString(),
    ledgerHash: `sha256:${Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join("")}`,
    reputationDelta,
    newScore: direction === "member_to_shop"
      ? Math.min(100, 87 + reputationDelta)
      : Math.min(100, 91 + reputationDelta * 0.5),
  });
});

export default router;
