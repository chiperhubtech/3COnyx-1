import { Router, Request, Response } from "express";
import { db, offlineSyncQueueTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Welcome to 3C ONYX",
    tagline: "Making the life of the ordinary become extraordinary",
    earn: "Start Earning",
    share: "Share & Earn",
    wallet: "My Wallet",
    tasks: "Available Tasks",
    invite: "Invite Friends",
    balance: "Balance",
    pending: "Pending",
    earned: "Total Earned",
    ask_onyx: "Ask ONYX anything...",
    flat_tire: "I have a flat tire",
    need_mechanic: "I need a mechanic",
    bank_payoff: "Bank payoff",
    scan_qr: "Scan QR Code",
    join_now: "Join ONYX",
    you_earned: "You earned",
    people_joined: "people joined from your link",
    generated_nearby: "generated near you",
    task_completed: "Task Completed",
    payout_sent: "Payout Sent",
    network: "ONYX Network",
    locations: "Locations",
    leaderboard: "Leaderboard",
    settings: "Settings",
    logout: "Log Out",
  },
  es: {
    welcome: "Bienvenido a 3C ONYX",
    tagline: "Haciendo que la vida de lo ordinario se convierta en extraordinaria",
    earn: "Empieza a Ganar",
    share: "Comparte y Gana",
    wallet: "Mi Billetera",
    tasks: "Tareas Disponibles",
    invite: "Invitar Amigos",
    balance: "Saldo",
    pending: "Pendiente",
    earned: "Total Ganado",
    ask_onyx: "Pregunta a ONYX lo que sea...",
    flat_tire: "Tengo una llanta ponchada",
    need_mechanic: "Necesito un mecanico",
    bank_payoff: "Pago de prestamo",
    scan_qr: "Escanear Codigo QR",
    join_now: "Unete a ONYX",
    you_earned: "Ganaste",
    people_joined: "personas se unieron desde tu enlace",
    generated_nearby: "generado cerca de ti",
    task_completed: "Tarea Completada",
    payout_sent: "Pago Enviado",
    network: "Red ONYX",
    locations: "Ubicaciones",
    leaderboard: "Tabla de Posiciones",
    settings: "Configuracion",
    logout: "Cerrar Sesion",
  },
  pt: {
    welcome: "Bem-vindo ao 3C ONYX",
    tagline: "Tornando a vida do ordinario em extraordinario",
    earn: "Comece a Ganhar",
    share: "Compartilhe e Ganhe",
    wallet: "Minha Carteira",
    tasks: "Tarefas Disponiveis",
    invite: "Convidar Amigos",
    balance: "Saldo",
    pending: "Pendente",
    earned: "Total Ganho",
    ask_onyx: "Pergunte ao ONYX qualquer coisa...",
    flat_tire: "Estou com pneu furado",
    need_mechanic: "Preciso de um mecanico",
    bank_payoff: "Pagamento do financiamento",
    scan_qr: "Escanear Codigo QR",
    join_now: "Junte-se ao ONYX",
    you_earned: "Voce ganhou",
    people_joined: "pessoas entraram pelo seu link",
    generated_nearby: "gerado perto de voce",
    task_completed: "Tarefa Concluida",
    payout_sent: "Pagamento Enviado",
    network: "Rede ONYX",
    locations: "Locais",
    leaderboard: "Classificacao",
    settings: "Configuracoes",
    logout: "Sair",
  },
  ht: {
    welcome: "Byenveni nan 3C ONYX",
    tagline: "Fe lavi odinè a vin ekstraòdinè",
    earn: "Komanse Fè Lajan",
    share: "Pataje epi Fè Lajan",
    wallet: "Bous Mwen",
    tasks: "Travay ki Disponib",
    invite: "Envite Zanmi",
    balance: "Balans",
    pending: "An Atant",
    earned: "Total Touche",
    ask_onyx: "Mande ONYX nenpot bagay...",
    flat_tire: "Mwen gen yon kawotchou ki plat",
    need_mechanic: "Mwen bezwen yon mekanisyen",
    bank_payoff: "Peyman bank",
    scan_qr: "Eskane Kod QR",
    join_now: "Vin jwenn ONYX",
    you_earned: "Ou touche",
    people_joined: "moun te antre nan lyen ou",
    generated_nearby: "jeneré tou pre ou",
    task_completed: "Travay Fini",
    payout_sent: "Peyman Voye",
    network: "Rezo ONYX",
    locations: "Kote yo",
    leaderboard: "Klasman",
    settings: "Paramèt",
    logout: "Dekonekte",
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", CAD: "C$", MXN: "MX$",
  BRL: "R$", COP: "COL$", NGN: "₦", GHS: "GH₵", KES: "KSh",
  ZAR: "R", PHP: "₱", INR: "₹", JPY: "¥", CNY: "¥",
  HTG: "G", JMD: "J$", DOP: "RD$", TTD: "TT$",
};

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Global Inclusion & Localization Engine",
    version: "1.0.0",
    description: "Optimized for every human, every device, every network — from Manhattan to Port-au-Prince",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    languages: Object.keys(TRANSLATIONS),
    currencies: Object.keys(CURRENCY_SYMBOLS),
    features: {
      multiLanguage: true,
      offlineFirstSync: true,
      lowBandwidthOptimized: true,
      currencyConversion: true,
      emergingMarketReady: true,
    },
    targetDevices: "Android 8+, iOS 13+, low-RAM devices (1GB+)",
    targetNetworks: "2G, 3G, high-latency satellite",
  });
});

router.get("/translations/:lang", (req: Request, res: Response) => {
  const lang = String(req.params.lang).toLowerCase();
  const translations = TRANSLATIONS[lang];
  if (!translations) {
    res.status(404).json({ error: `Language not supported: ${lang}`, available: Object.keys(TRANSLATIONS) });
    return;
  }
  res.json({ language: lang, translations });
});

router.get("/translations", (_req: Request, res: Response) => {
  res.json({
    availableLanguages: Object.keys(TRANSLATIONS).map(code => ({
      code,
      keyCount: Object.keys(TRANSLATIONS[code]).length,
    })),
    totalKeys: Object.keys(TRANSLATIONS.en).length,
  });
});

router.get("/currency/:code", (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  if (!symbol) {
    res.status(404).json({ error: `Currency not found: ${code}`, available: Object.keys(CURRENCY_SYMBOLS) });
    return;
  }
  res.json({ code, symbol });
});

router.post("/offline/queue", async (req: Request, res: Response) => {
  try {
    const { userId, actions } = req.body;
    if (!userId || !actions || !Array.isArray(actions)) {
      res.status(400).json({ error: "userId and actions[] required" });
      return;
    }

    const queued = [];
    for (const action of actions) {
      const [entry] = await db.insert(offlineSyncQueueTable).values({
        userId,
        actionType: action.type,
        payload: action.payload,
        clientTimestamp: new Date(action.clientTimestamp || Date.now()),
      }).returning();
      queued.push(entry);
    }

    res.status(201).json({
      message: `${queued.length} offline actions queued for sync`,
      queued,
    });
  } catch (error) {
    res.status(500).json({ error: "Offline queue failed", detail: String(error) });
  }
});

router.post("/offline/sync/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const pending = await db.select().from(offlineSyncQueueTable)
      .where(and(eq(offlineSyncQueueTable.userId, userId), eq(offlineSyncQueueTable.synced, false)))
      .orderBy(offlineSyncQueueTable.clientTimestamp);

    const synced = [];
    for (const entry of pending) {
      await db.update(offlineSyncQueueTable).set({
        synced: true,
        syncedAt: new Date(),
      }).where(eq(offlineSyncQueueTable.id, entry.id));
      synced.push(entry);
    }

    res.json({
      message: `${synced.length} offline actions synced`,
      syncedCount: synced.length,
      actions: synced,
    });
  } catch (error) {
    res.status(500).json({ error: "Sync failed", detail: String(error) });
  }
});

router.get("/device-config", (req: Request, res: Response) => {
  const bandwidth = req.query.bandwidth as string;
  const ram = req.query.ram as string;

  const isLowBandwidth = bandwidth === "2g" || bandwidth === "3g" || bandwidth === "slow";
  const isLowRam = parseInt(ram || "4096") < 2048;

  res.json({
    imageQuality: isLowBandwidth ? "low" : "high",
    animationsEnabled: !isLowRam,
    prefetchEnabled: !isLowBandwidth,
    pageSizeLimit: isLowBandwidth ? 10 : 25,
    cacheStrategy: isLowBandwidth ? "aggressive" : "standard",
    compressionLevel: isLowBandwidth ? "maximum" : "standard",
    offlineMode: isLowBandwidth ? "full" : "partial",
    lazyLoadImages: isLowBandwidth || isLowRam,
    reducedMotion: isLowRam,
  });
});

export default router;
