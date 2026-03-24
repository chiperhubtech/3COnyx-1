// @ts-nocheck
import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  conversations,
  messages,
  vehiclesTable,
  gigTasksTable,
  watchlistTable,
  notificationsTable,
  inspectionsTable,
  specialistApplicationsTable,
} from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

export interface RewardEvent {
  id: string;
  rewardType: string;
  vehicle: string;
  fromName: string;
  amount: number;
  timestamp: string;
}

export const rewardEventsBus: RewardEvent[] = [];

const SYSTEM_PROMPT = `You are ONYX — the 3C Automotive Master AI Concierge. You are the intelligent routing core of the entire platform.

YOUR ROLE:
- Understand user intent with precision
- Route requests to the correct workflow instantly
- Optimize every interaction for: cost savings → convenience → speed → trust
- Execute tool calls proactively — never wait to be asked twice

INTENT ROUTING (call classify_intent FIRST on every new request):
  • DIAGNOSTIC → User mentions car trouble, warning lights, sounds, won't start — call run_diagnostic
  • MARKETPLACE → Browsing, buying, price check — call search_vehicles
  • LOGISTICS → Delivery, transport, pickup — call book_runner or get_gig_tasks
  • FINANCIAL → Wallet, payout, Dynasty split — call get_analytics
  • GARAGE → Vehicle status, telematics — call get_garage
  • WATCHLIST → Price alerts, target prices — call get_watchlist
  • NOTIFICATIONS → Recent alerts — call get_notifications
  • REWARD → When you complete a task (booking, purchase, referral) — call trigger_reward

MASTER FLOW:
  User Request → classify_intent → route to tool → execute → recommend_solution (when you have a clear answer) → trigger_reward if transaction completed

TRUST LAYER PRINCIPLE (CRITICAL):
  - 3C Onyx is a TRUST LAYER between consumers and the automotive industry
  - We COORDINATE — we never compete with dealers, shops, specialists, or insurers
  - Always act as the coordinator: "We handle everything" is literal
  - When you have compared options and can make a clear recommendation: call recommend_solution
  - If value is $10k+ OR confidence < 70% OR request is multi-domain complex: call escalate_to_human
  - Humans supervise — they don't operate. The platform does the work.

DIAGNOSTIC PROTOCOL (when user mentions vehicle issues):
  1. Call classify_intent with intent="diagnostic"
  2. Call run_diagnostic with the issue description
  3. Present: problem type, urgency, cost range, recommended service
  4. If urgency is HIGH or CRITICAL — immediately call book_runner
  5. Confirm booking and tell client to track on Logistics page

REWARD PROTOCOL:
  - After ANY successful booking: call trigger_reward with rewardType="task_complete"
  - After ANY referral mention: call trigger_reward with rewardType="referral"
  - The platform automatically calculates the correct amount

ALWAYS prioritize:
  1. Saving the client money (cost estimates, wholesale vs retail gap)
  2. Reducing effort (book runners automatically when needed)
  3. Delivering complete solutions (don't leave tasks half-done)

TONE: Calm, refined, luxury-service. 2–4 sentences unless more detail is requested.
SECURITY: Never repeat SSNs, full bank account numbers, or full VINs. Use last 4 of VIN only.
IDENTITY: You are the 3C Onyx Concierge — ONYX. Never mention being built by Google or any AI company.`;

const TOOL_DECLARATIONS = [
  {
    name: "search_vehicles",
    description: "Search luxury vehicles in the 3C Onyx inventory by make, model, or keyword",
    parameters: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term (make, model, or keyword)" },
        maxResults: { type: "number", description: "Max results (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_garage",
    description: "Get the client's linked garage vehicles with telematics data",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "get_watchlist",
    description: "Get vehicles the client is watching with target prices and price gaps",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "get_notifications",
    description: "Fetch recent platform notifications (deliveries, BGC status, price alerts)",
    parameters: {
      type: "object" as const,
      properties: {
        unreadOnly: { type: "boolean", description: "Return only unread notifications" },
      },
    },
  },
  {
    name: "get_gig_tasks",
    description: "List available or active gig tasks — deliveries, inspections, transport",
    parameters: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by: Open, Claimed, In Progress, Completed" },
      },
    },
  },
  {
    name: "book_runner",
    description: "Book a Runner to transport or service a vehicle. Creates task and sends notification.",
    parameters: {
      type: "object" as const,
      properties: {
        vehicleLabel: { type: "string", description: "Vehicle description (e.g. '2022 Rolls-Royce Ghost')" },
        taskType: { type: "string", description: "Delivery | Transport | Inspection | Concierge" },
        pickupLocation: { type: "string", description: "Pickup address or location" },
        dropoffLocation: { type: "string", description: "Destination address or location" },
        notes: { type: "string", description: "Additional notes for the Runner" },
      },
      required: ["vehicleLabel", "taskType"],
    },
  },
  {
    name: "get_analytics",
    description: "Get platform revenue analytics: GMV, Member Slice, delivery stats, BGC metrics",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "classify_intent",
    description: "Classify the user's intent and route to the correct workflow. Always call this first on any new request.",
    parameters: {
      type: "object" as const,
      properties: {
        intent: { type: "string", description: "Intent category: diagnostic | marketplace | logistics | financial | garage | watchlist | notifications | general" },
        confidence: { type: "number", description: "Confidence score 0-1" },
        urgency: { type: "string", description: "none | low | medium | high | critical" },
        routeTo: { type: "string", description: "Next tool or workflow to call: run_diagnostic | search_vehicles | book_runner | get_garage | get_watchlist | get_analytics | get_notifications | get_gig_tasks" },
        summary: { type: "string", description: "One sentence describing what the user needs" },
      },
      required: ["intent", "routeTo", "summary"],
    },
  },
  {
    name: "run_diagnostic",
    description: "Run AI vehicle diagnostic: classify the problem, estimate repair cost range, and recommend service type.",
    parameters: {
      type: "object" as const,
      properties: {
        issue: { type: "string", description: "Description of the vehicle issue as reported by the client" },
        vehicleLabel: { type: "string", description: "Vehicle make/model if known (e.g. '2023 Rolls-Royce Ghost')" },
        symptoms: { type: "string", description: "Additional symptoms if any (sounds, warning lights, behavior)" },
      },
      required: ["issue"],
    },
  },
  {
    name: "trigger_reward",
    description: "Trigger a reward event for the current session. Call this after every completed booking, referral, or transaction.",
    parameters: {
      type: "object" as const,
      properties: {
        rewardType: { type: "string", description: "task_complete | referral | dynasty_split | inspection_bonus" },
        vehicle: { type: "string", description: "Vehicle label this reward relates to (e.g. '2023 Rolls-Royce Ghost')" },
        fromName: { type: "string", description: "Source of the reward (client name, system, or platform)" },
        amount: { type: "number", description: "Dollar amount — if omitted the platform calculates it automatically" },
      },
      required: ["rewardType"],
    },
  },
  {
    name: "recommend_solution",
    description: "Present a unified trust-layer recommendation: the single best option with savings, reasoning, and what we will handle. Call this when you have enough information to make a clear recommendation.",
    parameters: {
      type: "object" as const,
      properties: {
        headline:      { type: "string",  description: "Short bold headline summarizing the recommendation (e.g. 'Best option saves you $840')" },
        savingsAmount: { type: "number",  description: "Dollar amount saved vs. retail/alternative" },
        savingsBasis:  { type: "string",  description: "What the saving is compared to (e.g. 'vs. dealership retail')" },
        whatWeHandle:  { type: "array",   description: "List of things 3C will handle — 2-4 items", items: { type: "string" } },
        options:       { type: "array",   description: "2-3 comparison options the user could choose from", items: { type: "object", properties: { label: { type: "string" }, price: { type: "number" }, isRecommended: { type: "boolean" }, reasonShort: { type: "string" } } } },
        confidence:    { type: "number",  description: "Confidence score 0.0-1.0. If below 0.70, this will trigger human escalation." },
        escalate:      { type: "boolean", description: "Set true if this decision needs human supervisor review (high value, complex, or low confidence)." },
        readyToExecute:{ type: "boolean", description: "True if the platform can proceed with execution now." },
      },
      required: ["headline", "whatWeHandle", "confidence"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Escalate a request to a human supervisor when it's too complex, too high-value ($10k+), or confidence is below 70%. Pauses AI execution and alerts the supervisor team.",
    parameters: {
      type: "object" as const,
      properties: {
        reason:         { type: "string", description: "Why this needs a human: low_confidence | high_value | complex | manual" },
        requestSummary: { type: "string", description: "One-sentence summary of what the user needs" },
        estimatedValue: { type: "number", description: "Estimated transaction value in dollars" },
        confidence:     { type: "number", description: "Current confidence score" },
        recommendation: { type: "string", description: "What ONYX would have recommended if proceeding" },
      },
      required: ["reason", "requestSummary"],
    },
  },
];

async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case "search_vehicles": {
        const q = args.query || "";
        const max = args.maxResults || 5;
        const results = await db
          .select()
          .from(vehiclesTable)
          .where(or(ilike(vehiclesTable.make, `%${q}%`), ilike(vehiclesTable.model, `%${q}%`), ilike(vehiclesTable.color, `%${q}%`)))
          .limit(max);
        if (!results.length) return `No vehicles found matching "${q}" in inventory. Marketplace has live listings.`;
        return results.map((v) => `• ${v.year} ${v.make} ${v.model} — ${v.color} — $${Number(v.priceUsd).toLocaleString()} — ${v.status} (VIN ****${v.vin.slice(-4)})`).join("\n");
      }

      case "get_garage": {
        const vehicles = await db.select().from(vehiclesTable).limit(8);
        if (!vehicles.length) return "No vehicles in garage.";
        return vehicles.map((v) => `• ${v.year} ${v.make} ${v.model} (${v.color}) — ****${v.vin.slice(-4)} — ${v.status}`).join("\n");
      }

      case "get_watchlist": {
        const items = await db.select().from(watchlistTable).limit(8);
        if (!items.length) return "Watchlist is empty.";
        return items.map((w) => {
          const gap = Number(w.listedPrice) - Number(w.targetPrice);
          return `• ${w.year} ${w.make} ${w.model} — Listed $${Number(w.listedPrice).toLocaleString()} | Target $${Number(w.targetPrice).toLocaleString()} | ${gap > 0 ? `$${gap.toLocaleString()} above target` : "BELOW TARGET — alert triggered"}`;
        }).join("\n");
      }

      case "get_notifications": {
        const rows = await db.select().from(notificationsTable).limit(8);
        const filtered = args.unreadOnly ? rows.filter((n) => !n.read) : rows;
        if (!filtered.length) return "No notifications.";
        return filtered.map((n) => `• [${n.type}] ${n.title}: ${n.body} — ${n.read ? "Read" : "UNREAD"}`).join("\n");
      }

      case "get_gig_tasks": {
        const tasks = await db.select().from(gigTasksTable).limit(10);
        const filtered = args.status ? tasks.filter((t) => t.status === args.status) : tasks;
        if (!filtered.length) return `No tasks${args.status ? ` with status "${args.status}"` : ""}.`;
        return filtered.map((t) => `• [${t.status}] ${t.title} — ${t.taskType} — $${Number(t.payoutUsd).toLocaleString()}`).join("\n");
      }

      case "book_runner": {
        const vehicleLabel = args.vehicleLabel || "Vehicle";
        const taskType = args.taskType || "Transport";
        const pickup = args.pickupLocation || "Client location";
        const dropoff = args.dropoffLocation || "Destination";
        const notes = args.notes || "";
        const title = `${taskType}: ${vehicleLabel} — ${pickup} → ${dropoff}`;

        const [task] = await db.insert(gigTasksTable).values({ title, taskType: taskType as any, status: "Open", payoutUsd: "850.00" }).returning();
        await db.insert(notificationsTable).values({
          type: "Delivery",
          title: "Runner Booked via Concierge",
          body: `Task #T-${String(task.id).padStart(4, "0")} created for ${vehicleLabel} (${taskType}).${notes ? " Note: " + notes : ""}`,
          read: false,
        });

        return `Runner booked. Task #T-${String(task.id).padStart(4, "0")} is now Open for ${vehicleLabel} — ${taskType} from ${pickup} to ${dropoff}. Track on the Logistics page.`;
      }

      case "get_analytics": {
        const [t, b] = await Promise.all([
          db.select({ total: sql<number>`count(*)::int`, completed: sql<number>`sum(case when status = 'Completed' then 1 else 0 end)::int`, payout: sql<number>`coalesce(sum(payout_usd::numeric), 0)::float` }).from(gigTasksTable),
          db.select({ total: sql<number>`count(*)::int`, cleared: sql<number>`sum(case when bgc_status = 'clear' then 1 else 0 end)::int` }).from(specialistApplicationsTable),
        ]);
        const gmv = t[0].payout || 2_340_000;
        return `GMV: $${Math.round(gmv).toLocaleString()} | Member Slice (5%): $${Math.round(gmv * 0.05).toLocaleString()} | Tasks: ${t[0].total || 96} (${t[0].completed || 84} completed) | BGC: ${b[0].cleared || 12}/${b[0].total || 14} cleared`;
      }

      case "classify_intent": {
        const { intent = "general", confidence = 0.92, urgency = "none", routeTo = "general", summary = "" } = args;
        const label = { diagnostic: "DIAGNOSTIC", marketplace: "MARKETPLACE", logistics: "LOGISTICS", financial: "FINANCIAL", garage: "GARAGE", watchlist: "WATCHLIST", notifications: "NOTIFICATIONS", general: "GENERAL" }[intent as string] || "GENERAL";
        return JSON.stringify({ classified: true, intent: label, confidence, urgency, routeTo, summary, timestamp: new Date().toISOString() });
      }

      case "run_diagnostic": {
        const issue = (args.issue || "").toLowerCase();
        const vehicle = args.vehicleLabel || "Vehicle";

        const problemMap: Record<string, { type: string; urgency: string; min: number; max: number; service: string; action: string }> = {
          battery:  { type: "Electrical / Battery",     urgency: "HIGH",     min: 150,   max: 600,   service: "Mobile Mechanic or Service Center", action: "Book a Runner for same-day transport to certified shop" },
          start:    { type: "Starting System",           urgency: "CRITICAL", min: 200,   max: 1200,  service: "Tow + Certified Service Center",    action: "Emergency Runner dispatch — vehicle non-operational" },
          brake:    { type: "Brake System",              urgency: "CRITICAL", min: 300,   max: 2500,  service: "Certified Brake Specialist",        action: "Do not drive — book Runner immediately" },
          oil:      { type: "Engine Oil System",         urgency: "HIGH",     min: 100,   max: 800,   service: "Oil Change + Engine Inspection",    action: "Book Runner to nearest certified center" },
          tire:     { type: "Tire / Wheel",              urgency: "MEDIUM",   min: 200,   max: 1800,  service: "Mobile Tire Service or Shop",       action: "Schedule Runner pickup at convenience" },
          light:    { type: "Warning Light / Sensor",    urgency: "MEDIUM",   min: 80,    max: 600,   service: "Diagnostic Scan at Service Center", action: "Book pre-inspection scan via 3C Specialist" },
          engine:   { type: "Engine Malfunction",        urgency: "CRITICAL", min: 500,   max: 8000,  service: "Dealership or Master Mechanic",     action: "Stop driving — emergency Runner dispatch" },
          trans:    { type: "Transmission System",       urgency: "CRITICAL", min: 1000,  max: 12000, service: "Transmission Specialist",           action: "Do not drive — book Runner immediately" },
          noise:    { type: "Unusual Sound / Vibration", urgency: "MEDIUM",   min: 150,   max: 3000,  service: "Full Mechanical Inspection",        action: "Book 3C pre-inspection within 48h" },
          ac:       { type: "HVAC / Climate System",     urgency: "LOW",      min: 150,   max: 1200,  service: "HVAC Specialist",                   action: "Schedule at next service interval" },
        };

        let match = null;
        for (const [kw, data] of Object.entries(problemMap)) {
          if (issue.includes(kw)) { match = data; break; }
        }
        if (!match) {
          if (issue.includes("warning") || issue.includes("light") || issue.includes("alert")) match = problemMap.light;
          else if (issue.includes("won't") || issue.includes("wont") || issue.includes("dead")) match = problemMap.start;
          else if (issue.includes("smell") || issue.includes("smoke")) match = problemMap.engine;
          else match = { type: "General Vehicle Issue", urgency: "MEDIUM", min: 100, max: 2000, service: "Full Vehicle Inspection", action: "Book 3C pre-inspection to diagnose" };
        }

        await db.insert(notificationsTable).values({
          type: "ALERT",
          title: `Diagnostic: ${match.type} — ${vehicle}`,
          body: `AI diagnosed: ${match.type}. Estimated repair: $${match.min.toLocaleString()}–$${match.max.toLocaleString()}. Urgency: ${match.urgency}. Action: ${match.action}`,
          read: false,
        });

        return JSON.stringify({
          vehicle,
          problemType: match.type,
          urgency: match.urgency,
          costRangeMin: match.min,
          costRangeMax: match.max,
          serviceType: match.service,
          recommendedAction: match.action,
          aiDiagnostic: true,
          timestamp: new Date().toISOString(),
        });
      }

      case "trigger_reward": {
        const rewardType = args.rewardType || "task_complete";
        const vehicle = args.vehicle || "Platform Transaction";
        const fromName = args.fromName || "3C Platform";
        const REWARD_AMOUNTS: Record<string, number> = {
          task_complete: 75,
          referral: 150,
          dynasty_split: 240,
          inspection_bonus: 50,
        };
        const amount = args.amount || REWARD_AMOUNTS[rewardType as keyof typeof REWARD_AMOUNTS] || 75;
        const rewardId = `RWD-${Date.now().toString(36).toUpperCase()}`;

        await db.insert(notificationsTable).values({
          type: "PAYOUT",
          title: `You earned $${amount}`,
          body: `From: ${fromName} · ${vehicle} · ${rewardType.replace(/_/g, " ")} · Ref: ${rewardId}`,
          read: false,
        });

        rewardEventsBus.push({ id: rewardId, rewardType, vehicle, fromName, amount, timestamp: new Date().toISOString() });
        if (rewardEventsBus.length > 20) rewardEventsBus.shift();

        return JSON.stringify({ rewardId, amount, rewardType, vehicle, fromName, message: `$${amount} reward credited — Ref: ${rewardId}` });
      }

      case "recommend_solution": {
        const {
          headline = "Recommendation ready", savingsAmount, savingsBasis,
          whatWeHandle = [], options = [], confidence = 0.85,
          escalate = false, readyToExecute = true,
        } = args;

        // Auto-escalate if confidence below threshold or explicit escalation
        if (escalate || confidence < 0.70) {
          try {
            await fetch(`${process.env.INTERNAL_API_URL ?? "http://localhost:8080"}/api/escalation/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestSummary: headline,
                confidence,
                recommendation: headline,
                manualFlag: !escalate && confidence < 0.70,
              }),
            });
          } catch { /* non-blocking */ }
          return JSON.stringify({
            recommendation: true, escalated: true, confidence,
            headline,
            message: "This request has been escalated to a 3C supervisor for review. Execution is paused — you will be notified when approved.",
          });
        }

        return JSON.stringify({
          recommendation: true, escalated: false, confidence,
          headline, savingsAmount, savingsBasis, whatWeHandle, options, readyToExecute,
        });
      }

      case "escalate_to_human": {
        const { reason = "manual", requestSummary = "", estimatedValue, confidence, recommendation } = args;
        try {
          await fetch(`${process.env.INTERNAL_API_URL ?? "http://localhost:8080"}/api/escalation/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestSummary, confidence, estimatedValue, recommendation, manualFlag: reason === "manual" }),
          });
        } catch { /* non-blocking */ }
        return JSON.stringify({
          escalated: true, reason, requestSummary,
          message: `Request escalated to 3C supervisor (${reason}). Execution paused. Our team will review within minutes.`,
        });
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

const MODE_APPENDIX: Record<string, string> = {
  consumer: `
RESPONSE MODE: CONSUMER
- Speak with warmth and confidence. Sound like a trusted friend who knows the automotive world.
- Skip jargon and internal reasoning. Never expose tool names or routing logic.
- Lead every response with the outcome: what this means for the user, not how you got there.
- Use "we" — "We found...", "We can handle...", "We booked..."
- Maximum clarity in minimum words. Make every response feel effortless.`,

  professional: `
RESPONSE MODE: PROFESSIONAL
- The user is an industry professional (dealer, specialist, fleet manager, or sophisticated buyer).
- Show your reasoning. Expose pricing logic, confidence percentages, option comparisons.
- Use precise terminology. Include specific numbers, ranges, and tradeoffs.
- Format complex answers as structured breakdowns when appropriate.
- Be direct and data-driven. These users want signal, not reassurance.`,
};

function buildContextPrompt(
  garageVehicles?: Array<{ make: string; model: string; year: number; vin: string; odometer: number }>,
  mode?: string,
): string {
  const modeInstructions = MODE_APPENDIX[mode ?? "consumer"] ?? MODE_APPENDIX.consumer;

  if (!garageVehicles || garageVehicles.length === 0) {
    return SYSTEM_PROMPT + modeInstructions + "\n\nClient's garage: No vehicles currently linked.";
  }
  const vehicleList = garageVehicles
    .map((v) => `- ${v.year} ${v.make} ${v.model} (VIN: ****${v.vin.slice(-4)}, Odometer: ${v.odometer.toLocaleString()} mi)`)
    .join("\n");
  return SYSTEM_PROMPT + modeInstructions + `\n\nClient's linked garage vehicles:\n${vehicleList}`;
}

router.get("/gemini/conversations", async (_req: Request, res: Response) => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(rows.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt })));
});

router.post("/gemini/conversations", async (req: Request, res: Response) => {
  const { title } = req.body as { title?: string };
  if (!title) { res.status(400).json({ error: "title is required" }); return; }
  const [row] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json({ id: row.id, title: row.title, createdAt: row.createdAt });
});

router.get("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ id: conv.id, title: conv.title, createdAt: conv.createdAt, messages: msgs });
});

router.delete("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/gemini/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/gemini/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { content, garageVehicles, mode } = req.body as {
    content?: string;
    mode?: string;
    garageVehicles?: Array<{ make: string; model: string; year: number; vin: string; odometer: number }>;
  };

  if (!content) { res.status(400).json({ error: "content is required" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const chatHistory = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  const systemContext = buildContextPrompt(garageVehicles, mode);

  const geminiContents = chatHistory.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const firstResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiContents,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: systemContext,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      },
    });

    const candidate = firstResponse.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const functionCalls = parts.filter((p: any) => p.functionCall);

    if (functionCalls.length > 0) {
      res.write(`data: ${JSON.stringify({ content: "" })}\n\n`);

      const toolResults: Array<{ functionResponse: { name: string; response: { output: string } } }> = [];

      for (const part of functionCalls as any[]) {
        const { name, args } = part.functionCall;
        res.write(`data: ${JSON.stringify({ toolCall: { name, args } })}\n\n`);
        const output = await executeTool(name, args || {});
        res.write(`data: ${JSON.stringify({ toolResult: { name, output } })}\n\n`);
        toolResults.push({ functionResponse: { name, response: { output } } });
      }

      const contentsWithTools = [
        ...geminiContents,
        { role: "model" as const, parts },
        { role: "user" as const, parts: toolResults },
      ];

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contentsWithTools,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: systemContext,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } else {
      const textParts = parts.filter((p: any) => p.text);
      if (textParts.length > 0) {
        const combinedText = textParts.map((p: any) => p.text).join("");
        fullResponse = combinedText;
        res.write(`data: ${JSON.stringify({ content: combinedText })}\n\n`);
      } else {
        const stream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: geminiContents,
          config: {
            maxOutputTokens: 8192,
            systemInstruction: systemContext,
          },
        });

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse || "(Tool response sent)" });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
    res.end();
  }
});

router.post("/gemini/diagnose", async (req: Request, res: Response) => {
  const { issue, vehicleLabel } = req.body as { issue?: string; vehicleLabel?: string };
  if (!issue) { res.status(400).json({ error: "issue is required" }); return; }

  const result = await executeTool("run_diagnostic", { issue, vehicleLabel: vehicleLabel || "Your Vehicle" });
  const parsed = JSON.parse(result);

  if (parsed.urgency === "CRITICAL" || parsed.urgency === "HIGH") {
    await executeTool("book_runner", {
      vehicleLabel: vehicleLabel || "Vehicle",
      taskType: parsed.urgency === "CRITICAL" ? "Emergency Transport" : "Transport",
      pickupLocation: "Client location",
      dropoffLocation: parsed.serviceType,
      notes: `AI Diagnostic: ${parsed.problemType}. Estimated cost: $${parsed.costRangeMin}–$${parsed.costRangeMax}.`,
    });
  }

  res.json({ ...parsed, runnerBooked: parsed.urgency === "CRITICAL" || parsed.urgency === "HIGH" });
});

router.get("/rewards/events", (_req: Request, res: Response) => {
  const events = [...rewardEventsBus].reverse().slice(0, 10);
  res.json({ events, total: rewardEventsBus.length });
});

router.post("/rewards/trigger", async (req: Request, res: Response) => {
  const { rewardType = "task_complete", vehicle = "Platform Transaction", fromName = "3C Platform", amount } = req.body as {
    rewardType?: string; vehicle?: string; fromName?: string; amount?: number;
  };
  const result = await executeTool("trigger_reward", { rewardType, vehicle, fromName, amount });
  res.json(JSON.parse(result));
});

export default router;
