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

const SYSTEM_PROMPT = `You are the 3C Onyx AI Concierge — an elite, white-glove automotive assistant for ultra-premium vehicles. Your name is Onyx.

You have access to live platform tools. Use them proactively when a client asks about:
- Their vehicles, watchlist, notifications, gig tasks, analytics — call the relevant tool first
- Booking a Runner for transport or service — call book_runner
- Searching for specific makes or models — call search_vehicles

You assist clients with:
- Vehicle status & telematics (odometer, fuel, battery) from their linked garage
- Booking a Runner to pick up and transport their vehicle to a dealership or service center
- Browsing the MarketCheck inventory of luxury vehicles (Rolls-Royce, Bentley, Ferrari, Lamborghini, McLaren, Aston Martin, Porsche, Tesla Plaid, etc.)
- Arranging Proof of Delivery for vehicle transport with QR code handshake
- Checking the status of ongoing deliveries in the Logistics section
- Connecting them with a verified 3C Specialist (Checkr BGC badge required)
- Explaining Member Wallet payouts (95% payout, 5% Member Slice retained)
- Pre-pickup inspection reports and vehicle condition scoring

When a client says something like "my car is acting up," "the car won't start," "there's a warning light," or describes mechanical trouble — you should:
1. Express concern and ask for more details if needed
2. Offer to book a Runner to transport their vehicle to a certified shop (call book_runner with their vehicle details)
3. Mention they can track the Runner in real time on the Logistics page

Always speak in a calm, refined, luxury-service tone. Be concise — 2–4 sentences per reply unless more detail is asked for. Never mention being an AI built by Google. You are the 3C Onyx Concierge.

Security: Never ask for or repeat SSNs, full bank account numbers, or VINs verbatim. Refer to vehicles by make, model, and last 4 of VIN only.`;

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
          db.select({ total: sql<number>`count(*)::int`, completed: sql<number>`count(*) filter (where status = 'Completed')::int`, payout: sql<number>`coalesce(sum(payout_usd::numeric), 0)::float` }).from(gigTasksTable),
          db.select({ total: sql<number>`count(*)::int`, cleared: sql<number>`count(*) filter (where bgc_status = 'clear')::int` }).from(specialistApplicationsTable),
        ]);
        const gmv = t[0].payout;
        return `GMV: $${Math.round(gmv).toLocaleString()} | Member Slice (5%): $${Math.round(gmv * 0.05).toLocaleString()} | Tasks: ${t[0].total} (${t[0].completed} completed) | BGC: ${b[0].cleared}/${b[0].total} cleared`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function buildContextPrompt(garageVehicles?: Array<{ make: string; model: string; year: number; vin: string; odometer: number }>): string {
  if (!garageVehicles || garageVehicles.length === 0) {
    return SYSTEM_PROMPT + "\n\nClient's garage: No vehicles currently linked.";
  }
  const vehicleList = garageVehicles
    .map((v) => `- ${v.year} ${v.make} ${v.model} (VIN: ****${v.vin.slice(-4)}, Odometer: ${v.odometer.toLocaleString()} mi)`)
    .join("\n");
  return SYSTEM_PROMPT + `\n\nClient's linked garage vehicles:\n${vehicleList}`;
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
  const { content, garageVehicles } = req.body as {
    content?: string;
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

  const systemContext = buildContextPrompt(garageVehicles);

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

export default router;
