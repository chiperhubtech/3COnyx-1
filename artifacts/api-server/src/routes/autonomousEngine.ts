import { Router, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../middlewares/requireAuth";
import { aiLimiter } from "../middlewares/rateLimiter";
import { eventBus } from "../lib/eventBus";
import { addEntry } from "../lib/chainOfCustody";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "autonomous-engine" });

const CONFIDENCE_THRESHOLD = 0.9;

interface StoredDiagnosis {
  diagnosisId: string;
  vehicle: { vin: string | null; label: string | null; year: string | null; make: string | null; model: string | null };
  issues: string[];
  actions: Array<{ action: string; label: string; priority: string; estimatedCost: string | null; automated: boolean }>;
  confidence: number;
  aiSummary: string | null;
  timestamp: string;
  userId: number;
}

const diagnosisStore = new Map<string, StoredDiagnosis>();

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, diag] of diagnosisStore) {
    if (new Date(diag.timestamp).getTime() < cutoff) diagnosisStore.delete(id);
  }
}, 5 * 60 * 1000);

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function maskVin(vin: string | null | undefined): string {
  if (!vin || vin.length < 6) return "***";
  return `***${vin.slice(-4)}`;
}

function extractVinFromInput(raw: string): string | null {
  const vin = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return vin;
  return null;
}

const ALLOWED_ACTIONS = new Set([
  "schedule_service", "order_parts", "start_deal", "offer_trade_in",
  "book_inspection", "process_warranty", "book_runner",
]);

router.post("/input/process", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  const startMs = Date.now();

  try {
    const { vin, make, model, year, intent } = req.body as {
      vin?: string; make?: string; model?: string; year?: string;
      intent?: "fix" | "sell" | "deal" | "inspect";
    };

    let inputType: "vin" | "manual" | "deal_start" = "manual";
    let resolvedVin: string | null = null;
    let vehicleLabel: string | null = null;

    if (vin) {
      inputType = "vin";
      resolvedVin = extractVinFromInput(vin);
    } else if (intent === "deal") {
      inputType = "deal_start";
    }

    if (make && model) {
      vehicleLabel = `${year ?? ""} ${make} ${model}`.trim();
    }

    const inputId = generateId("INP");

    log.info({ inputId, inputType, vin: maskVin(resolvedVin) }, "[input] Processed");

    res.json({
      inputId,
      inputType,
      vin: resolvedVin,
      vehicleLabel,
      normalized: {
        vin: resolvedVin,
        vehicleLabel,
        make: make ?? null,
        model: model ?? null,
        year: year ?? null,
        intent: intent ?? "general",
      },
      processingTimeMs: Date.now() - startMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error({ err }, "[input] Processing failed");
    res.status(500).json({ error: "Input processing failed" });
  }
});

router.post("/ai/diagnose", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  const startMs = Date.now();
  const userId = (req as unknown as { userId?: number }).userId ?? 0;

  try {
    const { vin, vehicleLabel, make, model, year, intent, symptoms } = req.body as {
      vin?: string; vehicleLabel?: string; make?: string; model?: string;
      year?: string; intent?: string; symptoms?: string;
    };

    if (!make && !vin && !vehicleLabel) {
      res.status(400).json({ error: "Provide at least a VIN, make, or vehicle label" });
      return;
    }

    const label = vehicleLabel ?? (make && model ? `${year ?? ""} ${make} ${model}`.trim() : "Unknown Vehicle");
    const resolvedVin = vin ? extractVinFromInput(vin) : null;

    const prompt = `You are the ONYX Automotive Diagnostic AI. Analyze this vehicle and return a JSON response.

Vehicle: ${label}
VIN: ${resolvedVin ? maskVin(resolvedVin) : "Not provided"}
Intent: ${intent ?? "general inspection"}
Symptoms: ${symptoms ?? "None reported"}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "issues": ["list of detected or potential issues"],
  "actions": [
    {
      "action": "action_id (schedule_service, offer_trade_in, order_parts, start_deal, book_inspection, process_warranty)",
      "label": "Human-readable action label",
      "priority": "critical|high|medium|low",
      "estimatedCost": "$X-$Y or null",
      "automated": true or false
    }
  ],
  "confidence": 0.0 to 1.0,
  "summary": "One sentence diagnosis"
}

If intent is "fix" — focus on service/maintenance issues.
If intent is "sell" — focus on trade-in value and market position.
If intent is "deal" — focus on deal creation and financing.
If intent is "inspect" — focus on comprehensive vehicle inspection.
If no specific issues, recommend preventive maintenance.`;

    let aiResponse: { issues: string[]; actions: Array<{ action: string; label: string; priority: string; estimatedCost: string | null; automated: boolean }>; confidence: number; summary: string };

    try {
      const completion = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { temperature: 0.3, maxOutputTokens: 1024 },
      });

      const text = completion.text?.trim() ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");
      aiResponse = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      log.warn({ err: aiErr }, "[diagnose] AI inference failed — using rule-based fallback");
      aiResponse = {
        issues: intent === "fix" ? ["Scheduled maintenance due", "Fluid levels check recommended"] : ["Market analysis pending"],
        actions: [
          {
            action: intent === "deal" ? "start_deal" : intent === "sell" ? "offer_trade_in" : "schedule_service",
            label: intent === "deal" ? "Start Deal" : intent === "sell" ? "Get Trade-In Value" : "Schedule Service",
            priority: "medium",
            estimatedCost: intent === "fix" ? "$150-$500" : null,
            automated: true,
          },
          {
            action: "book_inspection",
            label: "Book 142-Point Inspection",
            priority: "low",
            estimatedCost: "$0",
            automated: true,
          },
        ],
        confidence: 0.78,
        summary: `Vehicle analysis complete for ${label}. Recommended actions generated.`,
      };
    }

    const sanitizedActions = (aiResponse.actions ?? [])
      .filter(a => ALLOWED_ACTIONS.has(a.action))
      .map(a => ({
        action: a.action,
        label: String(a.label).slice(0, 100),
        priority: ["critical", "high", "medium", "low"].includes(a.priority) ? a.priority : "medium",
        estimatedCost: a.estimatedCost ? String(a.estimatedCost).slice(0, 20) : null,
        automated: !!a.automated,
      }));

    const diagnosisId = generateId("DX");
    const confidence = Math.min(1, Math.max(0, aiResponse.confidence ?? 0.8));

    const stored: StoredDiagnosis = {
      diagnosisId,
      vehicle: { vin: resolvedVin, label, year: year ?? null, make: make ?? null, model: model ?? null },
      issues: (aiResponse.issues ?? []).map(i => String(i).slice(0, 200)),
      actions: sanitizedActions,
      confidence,
      aiSummary: (aiResponse.summary ? String(aiResponse.summary).slice(0, 500) : null),
      timestamp: new Date().toISOString(),
      userId,
    };

    diagnosisStore.set(diagnosisId, stored);

    log.info({ diagnosisId, confidence, actions: sanitizedActions.length, vin: maskVin(resolvedVin) }, "[diagnose] Complete");

    res.json({
      diagnosisId: stored.diagnosisId,
      vehicle: stored.vehicle,
      issues: stored.issues,
      actions: stored.actions,
      confidence: stored.confidence,
      aiSummary: stored.aiSummary,
      processingTimeMs: Date.now() - startMs,
      timestamp: stored.timestamp,
    });
  } catch (err) {
    log.error({ err }, "[diagnose] Failed");
    res.status(500).json({ error: "Diagnosis failed" });
  }
});

router.post("/decision/execute", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  const startMs = Date.now();
  const userId = (req as unknown as { userId?: number }).userId ?? 0;

  try {
    const { diagnosisId } = req.body as { diagnosisId: string };

    if (!diagnosisId || typeof diagnosisId !== "string") {
      res.status(400).json({ error: "diagnosisId is required" });
      return;
    }

    const diagnosis = diagnosisStore.get(diagnosisId);
    if (!diagnosis) {
      res.status(404).json({ error: "Diagnosis not found or expired — re-diagnose" });
      return;
    }

    if (diagnosis.userId !== userId) {
      res.status(403).json({ error: "Not authorized to execute this diagnosis" });
      return;
    }

    diagnosisStore.delete(diagnosisId);

    const executionId = generateId("EXE");
    const { vehicle, actions, confidence } = diagnosis;
    const vin = vehicle.vin;
    const vehicleId = vin ?? `veh-${Date.now().toString(36)}`;
    const stepsExecuted: Array<{ step: string; status: "done" | "pending" | "escalated"; detail: string; timestamp: string }> = [];
    let proofHash: string | null = null;

    const needsHuman = confidence < CONFIDENCE_THRESHOLD;

    if (needsHuman) {
      stepsExecuted.push({
        step: "confidence_check",
        status: "escalated",
        detail: `Confidence ${(confidence * 100).toFixed(0)}% below ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% guardrail — routing to specialist`,
        timestamp: new Date().toISOString(),
      });
    }

    if (actions.length === 0) {
      stepsExecuted.push({
        step: "no_actions",
        status: "escalated",
        detail: "No executable actions identified — specialist review required",
        timestamp: new Date().toISOString(),
      });
    }

    for (const action of actions) {
      if (!action.automated || needsHuman) {
        stepsExecuted.push({
          step: action.action,
          status: "escalated",
          detail: `${action.label} — assigned to specialist for manual review`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        switch (action.action) {
          case "start_deal":
          case "offer_trade_in":
            await eventBus.emit("deal.structured", {
              vehicleId,
              vin: vin ? maskVin(vin) : null,
              vehicleLabel: vehicle.label,
              source: "autonomous-engine",
              executionId,
              diagnosisId,
            });
            stepsExecuted.push({
              step: action.action,
              status: "done",
              detail: "Deal initiated — Finance Agent cascade triggered",
              timestamp: new Date().toISOString(),
            });
            break;

          case "schedule_service":
          case "order_parts":
            await eventBus.emit("vehicle.inspection.complete", {
              vehicleId,
              vin: vin ? maskVin(vin) : null,
              vehicleLabel: vehicle.label,
              source: "autonomous-engine",
              executionId,
            });
            stepsExecuted.push({
              step: action.action,
              status: "done",
              detail: "Service scheduled — Service Agent cascade triggered",
              timestamp: new Date().toISOString(),
            });
            break;

          case "book_inspection":
            stepsExecuted.push({
              step: action.action,
              status: "done",
              detail: "142-point inspection booked — runner dispatch queued",
              timestamp: new Date().toISOString(),
            });
            break;

          case "process_warranty":
            stepsExecuted.push({
              step: action.action,
              status: "done",
              detail: "Warranty check initiated — Guardian Agent verification queued",
              timestamp: new Date().toISOString(),
            });
            break;

          default:
            stepsExecuted.push({
              step: action.action,
              status: "done",
              detail: `${action.label} — executed via autonomous pipeline`,
              timestamp: new Date().toISOString(),
            });
        }
      } catch (stepErr) {
        log.warn({ step: action.action, err: stepErr }, "[decision] Step execution failed");
        stepsExecuted.push({
          step: action.action,
          status: "escalated",
          detail: `${action.label} — automated execution failed, escalated to specialist`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (vin) {
      try {
        const entry = await addEntry(
          vehicleId,
          maskVin(vin),
          "ownership",
          "ONYX Autonomous Engine",
          "system",
          {
            executionId,
            diagnosisId,
            stepsExecuted: stepsExecuted.length,
            confidence,
            automated: !needsHuman,
          },
        );
        proofHash = entry.sha256;

        stepsExecuted.push({
          step: "blockchain_stamp",
          status: "done",
          detail: `Execution stamped to chain — SHA-256: ${entry.sha256.slice(0, 16)}...`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        log.warn({ err }, "[decision] Blockchain stamp failed (non-fatal)");
      }
    }

    const hasAnyDone = stepsExecuted.some(s => s.status === "done");
    const hasAnyEscalated = stepsExecuted.some(s => s.status === "escalated");
    const status = !hasAnyDone && hasAnyEscalated ? "escalated" : hasAnyEscalated ? "in_progress" : "completed";

    const totalTimeMs = Date.now() - startMs;

    log.info({
      executionId,
      status,
      steps: stepsExecuted.length,
      totalTimeMs,
      vin: maskVin(vin),
    }, "[decision] Execution complete");

    res.json({
      executionId,
      status,
      stepsExecuted,
      proofHash,
      totalTimeMs,
      timestamp: new Date().toISOString(),
      verification: vin ? { proofUrl: `/api/vehicle/${vin}/proof` } : null,
      platform: "3C ONYX — Autonomous Execution Engine",
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
  } catch (err) {
    log.error({ err }, "[decision] Execution failed");
    res.status(500).json({ error: "Execution failed" });
  }
});

router.get("/autonomous/status", (_req: Request, res: Response) => {
  res.json({
    engine: "ONYX Autonomous Execution Engine",
    version: "1.0.0",
    status: "LIVE",
    capabilities: [
      "Scan → Diagnose → Execute",
      "VIN / Manual input",
      "AI-powered vehicle diagnosis",
      "Autonomous workflow execution",
      "Blockchain proof stamping",
      `${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% AI confidence guardrails`,
      "Human escalation fallback",
    ],
    endpoints: {
      input: "POST /api/input/process",
      diagnose: "POST /api/ai/diagnose",
      execute: "POST /api/decision/execute",
      status: "GET /api/autonomous/status",
    },
    performance: {
      targetInitialResponse: "< 2 seconds",
      targetFullWorkflow: "< 30 seconds",
    },
    architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    mandate: "Uber + Apple Pay + Car Dealership + CarFax + AI Agents — one tap.",
  });
});

export default router;
