import { Router, type Request, type Response } from "express";
import { db, dealsTable, dealerflowTasksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { structureDeal } from "../lib/brokerDesk";
import { writeAudit } from "../lib/auditService";
import { createHash } from "crypto";

const router = Router();

function requireUserId(req: Request, res: Response): number | null {
  const sub = (req as any).user?.sub ?? (req as any).userId;
  if (!sub) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const id = parseInt(String(sub), 10);
  if (!Number.isFinite(id)) { res.status(401).json({ error: "Invalid user identity" }); return null; }
  return id;
}

router.post("/deals/text-to-deal", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { text } = req.body as { text?: string };
    if (!text?.trim()) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const raw = text.trim();
    const parsed: Record<string, any> = {
      customerName: null,
      vin: null,
      vehicleLabel: null,
      dealType: "Used_Sale",
      salePrice: null,
      monthlyPayment: null,
      downPayment: null,
      tradeInValue: null,
      creditTier: null,
      term: null,
      rawText: raw,
    };

    const vinMatch = raw.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) parsed.vin = vinMatch[0].toUpperCase();

    const priceMatch = raw.match(/\$[\d,]+\.?\d*/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseFloat(p.replace(/[$,]/g, ""))).filter(p => !isNaN(p));
      if (prices.length >= 1) {
        const maxPrice = Math.max(...prices);
        if (maxPrice > 5000) parsed.salePrice = maxPrice;
        else parsed.downPayment = maxPrice;
      }
      if (prices.length >= 2) {
        const sorted = prices.sort((a, b) => a - b);
        if (sorted[0] < 2000) parsed.monthlyPayment = sorted[0];
        if (sorted[sorted.length - 1] > 5000) parsed.salePrice = sorted[sorted.length - 1];
        if (sorted.length >= 3) parsed.downPayment = sorted[1];
      }
    }

    const monthlyMatch = raw.match(/(\$?[\d,]+)\s*(?:\/\s*(?:mo|month)|per\s*month|a\s*month)/i);
    if (monthlyMatch) {
      parsed.monthlyPayment = parseFloat(monthlyMatch[1].replace(/[$,]/g, ""));
    }

    const downMatch = raw.match(/(\$?[\d,]+)\s*(?:down|dp)/i);
    if (downMatch) {
      parsed.downPayment = parseFloat(downMatch[1].replace(/[$,]/g, ""));
    }

    const tradeMatch = raw.match(/(?:trade|trade-in|trading)\s*(?:in|value)?\s*(?:of|at|for|worth)?\s*\$?([\d,]+)/i);
    if (tradeMatch) {
      parsed.tradeInValue = parseFloat(tradeMatch[1].replace(/,/g, ""));
    }

    const termMatch = raw.match(/(\d{2,3})\s*(?:mo|month)/i);
    if (termMatch) parsed.term = parseInt(termMatch[1], 10);

    const yearMakeModel = raw.match(/(?:20[0-2]\d|19\d{2})\s+[A-Za-z]+(?:\s+[A-Za-z0-9]+)*/);
    if (yearMakeModel) parsed.vehicleLabel = yearMakeModel[0].trim();

    const nameMatch = raw.match(/(?:customer|buyer|client|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (nameMatch) parsed.customerName = nameMatch[1].trim();

    if (/lease/i.test(raw)) parsed.dealType = "Lease";
    else if (/new/i.test(raw) && /sale|buy|purchase/i.test(raw)) parsed.dealType = "New_Sale";
    else if (/trade/i.test(raw)) parsed.dealType = "Trade_In";

    if (/tier\s*1|excellent|prime|7[2-9]\d|8\d{2}/i.test(raw)) parsed.creditTier = "Tier1";
    else if (/tier\s*2|good|6[89]\d|7[01]\d/i.test(raw)) parsed.creditTier = "Tier2";
    else if (/tier\s*3|fair|6[4-7]\d/i.test(raw)) parsed.creditTier = "Tier3";
    else if (/tier\s*4|poor|sub\s*prime|5[89]\d|6[0-3]\d/i.test(raw)) parsed.creditTier = "Tier4";

    const confidence = [
      parsed.vin ? 0.25 : 0,
      parsed.vehicleLabel ? 0.15 : 0,
      parsed.salePrice ? 0.2 : 0,
      parsed.monthlyPayment || parsed.downPayment ? 0.15 : 0,
      parsed.customerName ? 0.1 : 0,
      parsed.creditTier ? 0.1 : 0,
      parsed.dealType !== "Used_Sale" ? 0.05 : 0,
    ].reduce((a, b) => a + b, 0);

    await writeAudit({
      eventType: "API_CALL",
      action: `Text-to-Deal parsed: confidence ${Math.round(confidence * 100)}%`,
      actorId: userId,
      severity: "INFO",
      metadata: { rawText: raw.substring(0, 200), confidence },
    });

    res.json({
      parsed,
      confidence: Math.round(confidence * 100),
      missingFields: Object.entries(parsed)
        .filter(([k, v]) => v === null && !["rawText"].includes(k))
        .map(([k]) => k),
      suggestion: confidence >= 0.5
        ? "Deal structure is ready. Tap 'Structure Deal' to proceed."
        : "Need more details. Try adding vehicle info, price, or customer name.",
    });
  } catch (err: any) {
    console.error("Text-to-Deal error:", err.message);
    res.status(500).json({ error: "Failed to parse deal text" });
  }
});

router.post("/deals/:id/desk", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    if (!Number.isFinite(dealId)) { res.status(400).json({ error: "Invalid deal ID" }); return; }

    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, dealId), eq(dealsTable.dealershipId, userId)));

    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const {
      msrp, sellingPrice, tradeInValue, downPayment,
      creditTier, financeTerm, leaseTerm, includeFiProducts, lenderName,
    } = req.body as {
      msrp?: number; sellingPrice?: number; tradeInValue?: number;
      downPayment?: number; creditTier?: string; financeTerm?: number;
      leaseTerm?: number; includeFiProducts?: boolean; lenderName?: string;
    };

    const sp = sellingPrice || parseFloat(deal.salePrice || "0");
    const ms = msrp || sp * 1.08;

    if (sp <= 0) {
      res.status(400).json({ error: "Sale price is required" });
      return;
    }

    const structure = structureDeal({
      vin: deal.vin || "UNKNOWN",
      vehicleLabel: deal.vehicleLabel || "Vehicle",
      msrp: ms,
      sellingPrice: sp,
      tradeInValue: tradeInValue || 0,
      downPayment: downPayment || 0,
      creditTier: (creditTier as any) || "Tier2",
      financeTerm: (financeTerm as any) || 72,
      leaseTerm: (leaseTerm as any) || 36,
      includeFiProducts: includeFiProducts !== false,
      lenderName: lenderName || deal.lenderName || "3C Auto Finance",
      buyerName: deal.customerName,
    });

    await writeAudit({
      eventType: "API_CALL",
      action: `Mobile desk: Deal #${deal.dealNumber} structured — best option: ${structure.recommendation.bestOption}`,
      actorId: userId,
      severity: "INFO",
    });

    res.json({ structure });
  } catch (err: any) {
    console.error("Desk error:", err.message);
    res.status(500).json({ error: "Failed to structure deal" });
  }
});

router.post("/deals/:id/bind-insurance", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, dealId), eq(dealsTable.dealershipId, userId)));

    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const { coverageType } = req.body as { coverageType?: string };
    const coverage = coverageType || "Full Coverage";
    const price = deal.salePrice ? parseFloat(deal.salePrice) : 35000;
    const monthlyPremium = Math.round((price * 0.004 + 45) * 100) / 100;

    const policyNumber = `3CX-INS-${Date.now().toString(36).toUpperCase()}`;

    const insuranceTasks = await db.select().from(dealerflowTasksTable)
      .where(and(
        eq(dealerflowTasksTable.dealId, dealId),
      ));

    const insTask = insuranceTasks.find(t =>
      t.title.toLowerCase().includes("insurance")
    );

    if (insTask) {
      await db.update(dealerflowTasksTable)
        .set({
          status: "Completed",
          metadata: {
            ...(insTask.metadata as object || {}),
            policyNumber,
            coverage,
            monthlyPremium,
            boundAt: new Date().toISOString(),
            boundBy: "ONYX Insurance Agent",
          },
        })
        .where(eq(dealerflowTasksTable.id, insTask.id));
    }

    await writeAudit({
      eventType: "API_CALL",
      action: `Insurance bound: Deal #${deal.dealNumber} — ${coverage} — $${monthlyPremium}/mo — Policy ${policyNumber}`,
      actorId: userId,
      severity: "INFO",
    });

    res.json({
      success: true,
      policy: {
        policyNumber,
        coverage,
        monthlyPremium,
        provider: "3C ONYX Insurance Network",
        effectiveDate: new Date().toISOString(),
        status: "Active",
      },
      message: `Insurance bound instantly. Policy ${policyNumber} is active.`,
    });
  } catch (err: any) {
    console.error("Insurance bind error:", err.message);
    res.status(500).json({ error: "Failed to bind insurance" });
  }
});

router.get("/deals/:id/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, dealId), eq(dealsTable.dealershipId, userId)));

    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const tasks = await db.select().from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.dealId, dealId))
      .orderBy(desc(dealerflowTasksTable.createdAt));

    const timeline = tasks.map(t => ({
      taskId: t.id,
      title: t.title,
      status: t.status,
      department: t.department,
      agent: t.routedByAgent,
      createdAt: t.createdAt,
      slaMinutes: t.slaMinutes,
      slaDueAt: t.slaDueAt,
    }));

    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const totalTasks = tasks.length;
    const trustScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const dealData = JSON.stringify({
      dealNumber: deal.dealNumber,
      customer: deal.customerName,
      vehicle: deal.vehicleLabel || deal.vin,
      status: deal.status,
      salePrice: deal.salePrice,
      createdAt: deal.createdAt,
      timeline,
    });
    const proofHash = createHash("sha256").update(dealData).digest("hex");

    res.json({
      dealNumber: deal.dealNumber,
      status: deal.status,
      trustScore,
      proofHash,
      verifiedAt: new Date().toISOString(),
      completedSteps: completedTasks,
      totalSteps: totalTasks,
      timeline,
      customer: {
        name: deal.customerName,
        phone: deal.customerPhone,
        email: deal.customerEmail,
      },
      vehicle: {
        vin: deal.vin,
        label: deal.vehicleLabel,
      },
      financials: {
        salePrice: deal.salePrice,
        grossProfit: deal.grossProfit,
        commission: deal.commissionAmount,
        commissionStatus: deal.commissionStatus,
      },
      architect: "Ronald Antonio Cadet",
      platform: "3C ONYX — Autonomous Automotive OS",
    });
  } catch {
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/deals/:id/complete-step", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    const { step } = req.body as { step?: string };
    if (!step) { res.status(400).json({ error: "step is required" }); return; }

    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, dealId), eq(dealsTable.dealershipId, userId)));
    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const statusMap: Record<string, string> = {
      "structure": "In_Progress",
      "credit": "Pending_Finance",
      "insurance": "Pending_Insurance",
      "locate": "In_Progress",
      "contract": "Pending_Finance",
      "complete": "Delivered",
    };

    const newStatus = statusMap[step] || deal.status;
    await db.update(dealsTable)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(dealsTable.id, dealId));

    await writeAudit({
      eventType: "API_CALL",
      action: `Deal step completed: ${step} → status ${newStatus} — Deal #${deal.dealNumber}`,
      actorId: userId,
      severity: "INFO",
    });

    res.json({ success: true, status: newStatus, step });
  } catch {
    res.status(500).json({ error: "Failed to complete step" });
  }
});

router.post("/deals/:id/agent/:agentName", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    const agentName = req.params.agentName as string;

    const { AGENTS } = await import("../lib/dealAgents");
    const validAgents = Object.keys(AGENTS);
    if (!validAgents.includes(agentName)) {
      res.status(400).json({ error: `Unknown agent: ${agentName}. Valid: ${validAgents.join(", ")}` });
      return;
    }

    const agentFn = AGENTS[agentName as keyof typeof AGENTS];
    const result = await (agentFn as any)(dealId, userId, req.body || {});

    res.json(result);
  } catch (err: any) {
    console.error("Agent execution error:", err.message);
    res.status(500).json({ error: "Agent execution failed" });
  }
});

const PIPELINE_STAGES = [
  { id: "lead",       label: "Lead",           status_match: ["Open"] },
  { id: "structure",  label: "Structure",      status_match: ["In_Progress"] },
  { id: "credit",     label: "Credit",         status_match: ["Pending_Finance"] },
  { id: "lender",     label: "Lender",         status_match: ["Pending_Finance"] },
  { id: "insurance",  label: "Insurance",      status_match: ["Pending_Insurance"] },
  { id: "vehicle",    label: "Vehicle",        status_match: ["In_Progress"] },
  { id: "transport",  label: "Transport",      status_match: ["In_Progress"] },
  { id: "delivery",   label: "Delivery",       status_match: ["Delivered"] },
  { id: "funding",    label: "Funding",        status_match: ["Funded", "Delivered"] },
] as const;

router.get("/deals/:id/pipeline", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const dealId = parseInt(req.params.id as string, 10);
    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, dealId), eq(dealsTable.dealershipId, userId)));

    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const statusOrder = ["Open", "In_Progress", "Pending_Finance", "Pending_Insurance", "Delivered", "Funded"];
    const currentIndex = statusOrder.indexOf(deal.status);

    const pipeline = PIPELINE_STAGES.map((stage, i) => {
      const stageIndex = stage.status_match
        .map(s => statusOrder.indexOf(s))
        .reduce((a, b) => Math.max(a, b), 0);

      let state: "completed" | "active" | "pending" = "pending";
      if (currentIndex > stageIndex) state = "completed";
      else if (currentIndex === stageIndex) state = "active";
      if (deal.status === "Funded" || deal.status === "Delivered") {
        if (i <= 7) state = "completed";
        if (stage.id === "funding" && deal.status === "Funded") state = "completed";
        if (stage.id === "funding" && deal.status === "Delivered") state = "active";
      }

      return { ...stage, state, status_match: undefined };
    });

    res.json({
      dealId,
      dealNumber: deal.dealNumber,
      currentStatus: deal.status,
      pipeline,
      progress: Math.round(
        (pipeline.filter(s => s.state === "completed").length / pipeline.length) * 100
      ),
    });
  } catch {
    res.status(500).json({ error: "Failed to load pipeline" });
  }
});

export default router;
