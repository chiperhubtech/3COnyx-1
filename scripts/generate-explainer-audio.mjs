import { createRequire } from "module";
const require = createRequire(
  new URL("../artifacts/api-server/package.json", import.meta.url),
);
const OpenAI = require("openai").default;
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const AUDIO_DIR = join(ROOT, "artifacts/onyx-explainer/public/audio");

const SCENES = [
  {
    id: "scene0",
    text: "Two point seven trillion dollars. That's the global automotive industry. And it still runs on fax machines and handshake deals. 3C ONYX. The Global Automotive Liquidity Network. Where every human, automobile, and transaction goes from ordinary to extraordinary.",
  },
  {
    id: "scene1",
    text: "Twelve handoffs per deal. Fourteen days to close. Five vendors that don't talk to each other. The car business loses billions every year to inefficiency, fraud, and broken trust. This isn't disruption. This is reconstruction.",
  },
  {
    id: "scene2",
    text: "While others write pitch decks, we built the protocol. Live today: over twenty operational systems. Seven autonomous AI agents. SHA-256 proof engine. Sovereign wallet. Split payments. Global remittance across twenty-eight currencies. Bank payoff integration. Location node network. Twenty culture-driven themes. Ask ONYX natural language processing. Developer platform. Federation protocol. Settlement layer. Data intelligence. IoT gateway. All operational. Right now.",
  },
  {
    id: "scene3",
    text: "Scan. Diagnose. Execute. The member taps once. ONYX coordinates seven agents simultaneously. Sales, Finance, Service, Parts, Delivery, Support, and Referral. Under two minutes. No phone calls. No paperwork. No waiting.",
  },
  {
    id: "scene4",
    text: "Seven AI agents. One event bus. Zero human coordination required. Each agent operates autonomously. When a deal enters the system, the sales agent qualifies it. The finance agent structures terms. The service agent schedules inspection. The parts agent sources components. All happening simultaneously. The future of automotive commerce.",
  },
  {
    id: "scene5",
    text: "Every vehicle gets a digital passport. Every transaction cryptographically stamped with SHA-256 hash chains. Every record tamper-evident and immutable. CarFax tells you what happened. ONYX proves it mathematically.",
  },
  {
    id: "scene6",
    text: "Kilocorn infrastructure. This is not an app. This is protocol-level infrastructure designed for one trillion dollars and beyond. Developer Platform with API keys, rate limiting, and webhooks. Federation Protocol connecting dealerships, mechanics, and service nodes worldwide. Settlement Layer with instant multi-party split payments. IoT Gateway for connected vehicles and telematics. Governance engine. Data intelligence. The AWS of automotive.",
  },
  {
    id: "scene7",
    text: "The Global Automotive Economic Network. ONYX Wallet: Cash App for cars. Send, receive, split, and settle, all in one tap. Global remittance across twenty-eight currencies, Haiti to Florida in seconds. Location nodes turning every gas station and mechanic shop into a revenue-generating point on the network. Twenty culture-driven visual themes from Motorsport to Military, GTA to Luxury. This platform lives and breathes culture.",
  },
  {
    id: "scene8",
    text: "One hundred fifty to three hundred dollars per vehicle deal. Three to twenty percent on parts and service. Recurring subscription spreads. The tollbooth model. Every transaction on the network generates revenue. The tollbooth never closes.",
  },
  {
    id: "scene9",
    text: "A gas station clerk tapes a QR code to a pump. A driver scans it while filling up. ONYX dispatches. A deal closes. The clerk gets paid. The mechanic gets paid. The referrer gets paid. Everyone gets paid. Automatically. Viral coefficient greater than one. Phase one: Bootstrap. Phase two: ten million users. Phase three: one hundred million users. Global standard.",
  },
  {
    id: "scene10",
    text: "Five walls deep. The moat is permanent. Wall one: one hundred percent built. Every system operational. Wall two: forensic intellectual property. Every line of code traced to the architect. Wall three: distribution moat. Street-level QR network expanding daily. Wall four: institutional value. Protocol-level infrastructure. Wall five: network effects. Every new node makes the entire network more valuable.",
  },
  {
    id: "scene11",
    text: "This is the money network for the entire automotive industry. The protocol that every gas station, every mechanic, every dealership, and every smartphone runs on. A broker closes a deal. A mechanic services the vehicle. A random clerk referred the customer. Everyone gets paid automatically. All tracked. All verified. All visible. Making the life of the ordinary become extraordinary. Designed, architected, and owned exclusively by Ronald Antonio Cadet. CUXTOMCANDYCLUB LLC. 3C ONYX. The standard is set.",
  },
];

async function generateAudio(scene) {
  console.log(`Generating audio for ${scene.id}...`);
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "onyx",
      input: scene.text,
      response_format: "mp3",
      speed: 0.9,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = join(AUDIO_DIR, `${scene.id}.mp3`);
    await writeFile(outputPath, buffer);
    console.log(
      `  Saved ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`,
    );
    return true;
  } catch (err) {
    console.error(`  Error generating ${scene.id}:`, err.message);
    return false;
  }
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });
  console.log("Generating AI narration audio for 3C ONYX Explainer...");
  console.log(`Voice: onyx | Format: mp3 | Scenes: ${SCENES.length}\n`);

  let success = 0;
  let failed = 0;

  for (const scene of SCENES) {
    const ok = await generateAudio(scene);
    if (ok) success++;
    else failed++;
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
}

main().catch(console.error);
