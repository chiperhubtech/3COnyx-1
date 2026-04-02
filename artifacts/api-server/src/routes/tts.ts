import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Rate limit exceeded. Try again later." },
});

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Text-to-Speech Engine",
    version: "1.0.0",
    voice: "onyx",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
  });
});

router.post("/generate", ttsLimiter, async (req: Request, res: Response) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { text, voice = "onyx", format = "mp3" } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text is required" });
      return;
    }
    if (text.length > 4096) {
      res.status(400).json({ error: "text exceeds 4096 character limit" });
      return;
    }

    let textToSpeech: any;
    try {
      const audioModule = await import("@workspace/integrations-openai-ai-server/audio");
      textToSpeech = audioModule.textToSpeech;
    } catch {
      res.status(503).json({ error: "TTS service not configured" });
      return;
    }

    const audioBuffer = await textToSpeech(text, voice, format);
    const contentType = format === "mp3" ? "audio/mpeg" : format === "wav" ? "audio/wav" : "audio/ogg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (err: any) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS generation failed", details: err.message });
  }
});

export default router;
