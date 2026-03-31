/**
 * 3C Onyx — VIN Digital Passport API
 *
 * GET  /api/vin/decode?vin=...        — Decode VIN via NHTSA (free, no key)
 * POST /api/vin/passport              — Full passport: NHTSA + AI summary + ledger entry
 * GET  /api/vin/passport/:vin         — Retrieve saved passport
 */
import { Router, type Request, type Response } from "express";
import { db, vinPassportsTable, blockchainRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";
import { indexVehicle } from "../lib/vehicleSearch";
import crypto from "crypto";

const router = Router();

const NHTSA = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";

function pickNhtsa(r: Record<string, string>) {
  return {
    make:      r["Make"]      || null,
    model:     r["Model"]     || null,
    year:      r["ModelYear"] ? Number(r["ModelYear"]) : null,
    trim:      r["Trim"]      || null,
    bodyClass: r["BodyClass"] || null,
    driveType: r["DriveType"] || null,
    engineType:`${r["EngineNumberOfCylinders"] ?? ""}cyl ${r["DisplacementL"] ?? ""}L`.trim() || null,
    fuelType:  r["FuelTypePrimary"] || null,
    doors:     r["Doors"] ? Number(r["Doors"]) : null,
    plant:     r["PlantCity"] ? `${r["PlantCity"]}, ${r["PlantCountry"]}` : null,
    errorCode: r["ErrorCode"] || null,
  };
}

async function getGeminiSummary(vin: string, vehicle: Record<string, unknown>, lang: "en" | "es" = "en"): Promise<string> {
  const key  = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const base = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  if (!key || !base) return "";
  const prompt = lang === "es"
    ? `Eres un experto automotriz. Resume este vehículo en 3 oraciones concisas para un comprador en México o Latinoamérica. VIN: ${vin}. Datos: ${JSON.stringify(vehicle)}. Incluye año, marca, modelo, motor y valor de mercado aproximado. Solo el resumen, sin formato Markdown.`
    : `You are an expert auto analyst. Summarize this vehicle in 3 concise sentences for a buyer in North America. VIN: ${vin}. Data: ${JSON.stringify(vehicle)}. Include year, make, model, engine, and approximate market value. Return only the summary text, no Markdown.`;
  try {
    const resp = await fetch(`${base}/chat/completions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body:    JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      }),
    });
    const json = await resp.json() as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? "";
  } catch { return ""; }
}

// ─── GET /api/vin/decode ──────────────────────────────────────────────────────
router.get("/vin/decode", async (req: Request, res: Response) => {
  const { vin } = req.query as { vin?: string };
  if (!vin?.trim() || vin.trim().length !== 17) {
    res.status(400).json({ error: "A valid 17-character VIN is required." });
    return;
  }
  const cleanVin = vin.trim().toUpperCase();
  try {
    const nhtsaRes = await fetch(`${NHTSA}/${cleanVin}?format=json`);
    const nhtsaJson = await nhtsaRes.json() as { Results?: Record<string, string>[] };
    const raw = nhtsaJson.Results?.[0] ?? {};
    const decoded = pickNhtsa(raw);
    res.json({ vin: cleanVin, ...decoded, raw });
  } catch {
    res.status(502).json({ error: "VIN lookup service temporarily unavailable." });
  }
});

// ─── POST /api/vin/passport ───────────────────────────────────────────────────
router.post("/vin/passport", requireAuth, async (req: Request, res: Response) => {
  const { vin } = req.body as { vin?: string };
  if (!vin?.trim() || vin.trim().length !== 17) {
    res.status(400).json({ error: "A valid 17-character VIN is required." });
    return;
  }
  const cleanVin = vin.trim().toUpperCase();

  const existing = await db.select().from(vinPassportsTable).where(eq(vinPassportsTable.vin, cleanVin)).limit(1);
  if (existing[0]) {
    res.json(existing[0]);
    return;
  }

  let decoded: ReturnType<typeof pickNhtsa> & { raw?: unknown } = { make: null, model: null, year: null, trim: null, bodyClass: null, driveType: null, engineType: null, fuelType: null, doors: null, plant: null, errorCode: null };
  let rawNhtsa: unknown = null;
  try {
    const nhtsaRes  = await fetch(`${NHTSA}/${cleanVin}?format=json`);
    const nhtsaJson = await nhtsaRes.json() as { Results?: Record<string, string>[] };
    rawNhtsa        = nhtsaJson.Results?.[0] ?? {};
    decoded         = pickNhtsa(rawNhtsa as Record<string, string>);
  } catch {}

  const [summaryEn, summaryEs] = await Promise.all([
    getGeminiSummary(cleanVin, decoded as Record<string, unknown>, "en"),
    getGeminiSummary(cleanVin, decoded as Record<string, unknown>, "es"),
  ]);

  const passportData = { vin: cleanVin, ...decoded };
  const hash = crypto.createHash("sha256").update(JSON.stringify(passportData)).digest("hex");

  const [passport] = await db.insert(vinPassportsTable).values({
    vin:           cleanVin,
    make:          decoded.make,
    model:         decoded.model,
    year:          decoded.year ?? undefined,
    trim:          decoded.trim,
    bodyClass:     decoded.bodyClass,
    driveType:     decoded.driveType,
    engineType:    decoded.engineType,
    fuelType:      decoded.fuelType,
    doors:         decoded.doors ?? undefined,
    rawNhtsa:      rawNhtsa ?? {},
    aiSummaryEn:   summaryEn,
    aiSummaryEs:   summaryEs,
    blockchainHash: hash,
  }).returning();

  indexVehicle({
    id: String(passport!.id),
    make: decoded.make,
    model: decoded.model,
    year: decoded.year,
    trim: decoded.trim,
    vin: cleanVin,
    fuelType: decoded.fuelType,
    bodyClass: decoded.bodyClass,
    condition: "used",
    createdAt: new Date().toISOString(),
  }).catch(() => {});

  await writeAudit({
    eventType: "DB_CHANGE",
    action:    `VIN passport created: ${cleanVin}`,
    actorId:   (req as Request & { user?: { id: number } }).user?.id,
    severity:  "INFO",
  });

  res.status(201).json(passport);
});

// ─── GET /api/vin/passport/:vin ───────────────────────────────────────────────
router.get("/vin/passport/:vin", async (req: Request, res: Response) => {
  const cleanVin = String(req.params["vin"] ?? "").trim().toUpperCase();
  if (cleanVin.length !== 17) { res.status(400).json({ error: "Invalid VIN" }); return; }
  const rows = await db.select().from(vinPassportsTable).where(eq(vinPassportsTable.vin, cleanVin)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "No passport found. Decode this VIN first." }); return; }
  res.json(rows[0]);
});

export default router;
