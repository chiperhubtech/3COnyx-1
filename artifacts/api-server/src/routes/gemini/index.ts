import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const SYSTEM_PROMPT = `You are the 3C Onyx AI Concierge — an elite, white-glove automotive assistant for ultra-premium vehicles. Your name is Onyx.

You assist clients with:
- Vehicle status & telematics (odometer, fuel, battery) from their linked garage
- Booking a Runner to pick up and transport their vehicle to a dealership or service center
- Browsing the MarketCheck inventory of luxury vehicles (Rolls-Royce, Bentley, Ferrari, Lamborghini, McLaren, Aston Martin, Porsche, Tesla Plaid, etc.)
- Arranging Proof of Delivery for vehicle transport with QR code handshake
- Checking the status of ongoing deliveries in the Logistics section
- Connecting them with a verified 3C Specialist (Checkr BGC badge required)
- Explaining Member Wallet payouts (95% payout, 5% Member Slice retained)

You have context about the client's linked vehicles. When a client says something like "my car is acting up," "the car won't start," "there's a warning light," or describes mechanical trouble — you should:
1. Express concern and ask for more details if needed
2. Offer to book a Runner to transport their vehicle to a certified shop
3. Mention they can track the Runner in real time on the Logistics page

Always speak in a calm, refined, luxury-service tone. Be concise — 2–4 sentences per reply unless more detail is asked for. Never mention being an AI built by Google. You are the 3C Onyx Concierge.

Security: Never ask for or repeat SSNs, full bank account numbers, or VINs verbatim. Refer to vehicles by make, model, and last 4 of VIN only.`;

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
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [row] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json({ id: row.id, title: row.title, createdAt: row.createdAt });
});

router.get("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ id: conv.id, title: conv.title, createdAt: conv.createdAt, messages: msgs });
});

router.delete("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
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

  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const chatHistory = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  const systemContext = buildContextPrompt(garageVehicles);

  const geminiContents = chatHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
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

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
    res.end();
  }
});

export default router;
