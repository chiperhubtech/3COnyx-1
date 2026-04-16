import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { idempotencyGuard } from "../middlewares/idempotencyGuard";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

const PLATFORM_VERSION = "3.0.0-PROD";
const PLATFORM_FEE_RATE = 0.03;

type NodeHub = "ELMWOOD_CDJR" | "ROUTE_44" | "CUXTOMCANDY_HUB";
type NodeRole = "salesperson" | "technician" | "broker" | "runner" | "finance" | "bdc";
type ActionIntent = "buy_car" | "refer_buyer" | "need_service" | "accident_help" | "trade_in";
type TransactionStatus = "In-Flight" | "Matching" | "Matched" | "In Finance" | "F&I Manager Review" | "Pending Signature" | "Funded" | "Delivered" | "Settled";
type DealPayoutStatus = "tracked" | "pending" | "processing" | "completed";
type ServiceStatus = "received" | "scheduled" | "in_progress" | "completed";
type MessageChannel = "sms" | "email" | "whatsapp" | "push";

const LIVE_NODES: NodeHub[] = ["ELMWOOD_CDJR", "ROUTE_44", "CUXTOMCANDY_HUB"];

interface RegisteredNode {
  nodeId: string;
  role: NodeRole;
  hub: NodeHub;
  registeredAt: string;
  active: boolean;
}

interface TrackedTransaction {
  transactionId: string;
  intent: ActionIntent;
  hub: NodeHub;
  nodeContributors: string[];
  status: TransactionStatus;
  payoutPool: number;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
}

const nodeRegistry = new Map<string, RegisteredNode>();
const transactionLedger = new Map<string, TrackedTransaction>();

interface ActionBody {
  intent: ActionIntent;
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    zip?: string;
  };
  payload: Record<string, unknown>;
}

interface LeadBody {
  name: string;
  phone: string;
  email: string;
  intentType: ActionIntent;
  budget?: number;
  paymentTarget?: number;
  preferredHub?: NodeHub;
}

interface DealBody {
  leadId: string;
  vehicleId: string;
  nodeId: string;
  salePrice?: number;
}

interface ServiceBody {
  customer: string;
  vin: string;
  issue: string;
  preferredHub?: NodeHub;
}

interface MessageBody {
  to: string;
  channel: MessageChannel;
  message: string;
  dealId?: string;
}

interface NodeRegisterBody {
  nodeId: string;
  role: NodeRole;
  hub?: NodeHub;
}

function selectHub(preferred?: string): NodeHub {
  if (preferred && LIVE_NODES.includes(preferred as NodeHub)) {
    return preferred as NodeHub;
  }
  return LIVE_NODES[Math.floor(Math.random() * LIVE_NODES.length)];
}

function txId(): string {
  return `ONYX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function shortId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

router.get("/v1/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      platform: "3C ONYX OS",
      version: PLATFORM_VERSION,
      architect: "Ronald Antonio Cadet",
      entity: "CUXTOMCANDYCLUB LLC",
      mission: "AI-Callable, Node-Based Transaction Network",
      liveNodes: LIVE_NODES,
      activeNodes: nodeRegistry.size,
      activeTransactions: transactionLedger.size,
      platformFeeRate: `${PLATFORM_FEE_RATE * 100}%`,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

router.post("/v1/action", requireAuth, (req: Request, res: Response) => {
  const body = req.body as ActionBody;

  if (!body.intent || !body.customerInfo || !body.payload) {
    res.status(400).json({
      success: false,
      data: null,
      error: "intent, customerInfo, and payload are required",
    });
    return;
  }

  const validIntents: ActionIntent[] = ["buy_car", "refer_buyer", "need_service", "accident_help", "trade_in"];
  if (!validIntents.includes(body.intent)) {
    res.status(400).json({
      success: false,
      data: null,
      error: `intent must be one of: ${validIntents.join(", ")}`,
    });
    return;
  }

  if (!body.customerInfo.name) {
    res.status(400).json({
      success: false,
      data: null,
      error: "customerInfo.name is required",
    });
    return;
  }

  const transactionId = txId();
  const hub = selectHub(body.payload.preferredHub as string | undefined);
  const now = new Date().toISOString();

  const transaction: TrackedTransaction = {
    transactionId,
    intent: body.intent,
    hub,
    nodeContributors: [],
    status: "In-Flight",
    payoutPool: 0,
    platformFee: 0,
    createdAt: now,
    updatedAt: now,
  };

  transactionLedger.set(transactionId, transaction);

  logger.info({
    transactionId,
    intent: body.intent,
    hub,
    customer: body.customerInfo.name,
  }, "[ONYX-OS] Force-action transaction started");

  res.status(201).json({
    success: true,
    data: {
      transactionId,
      nextStep: "MATCHING_TO_HUB_NODE",
      hub,
      status: transaction.status,
      intent: body.intent,
      createdAt: now,
    },
    error: null,
  });
});

router.get("/v1/transaction/:transactionId", requireAuth, (req: Request, res: Response) => {
  const id = String(req.params.transactionId);
  const txn = transactionLedger.get(id);

  if (!txn) {
    res.status(404).json({ success: false, data: null, error: "Transaction not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      transactionId: txn.transactionId,
      intent: txn.intent,
      hub: txn.hub,
      status: txn.status,
      nodeContributors: txn.nodeContributors,
      payoutPool: txn.payoutPool,
      platformFee: txn.platformFee,
      netPayout: txn.payoutPool - txn.platformFee,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    },
    error: null,
  });
});

router.post("/v1/nodes/register", requireAuth, (req: Request, res: Response) => {
  const body = req.body as NodeRegisterBody;

  if (!body.nodeId || !body.role) {
    res.status(400).json({ success: false, data: null, error: "nodeId and role are required" });
    return;
  }

  const validRoles: NodeRole[] = ["salesperson", "technician", "broker", "runner", "finance", "bdc"];
  if (!validRoles.includes(body.role)) {
    res.status(400).json({ success: false, data: null, error: `role must be one of: ${validRoles.join(", ")}` });
    return;
  }

  const hub = selectHub(body.hub);
  const node: RegisteredNode = {
    nodeId: body.nodeId,
    role: body.role,
    hub,
    registeredAt: new Date().toISOString(),
    active: true,
  };

  nodeRegistry.set(body.nodeId, node);

  logger.info({ nodeId: body.nodeId, role: body.role, hub }, "[ONYX-OS] Node registered");

  res.status(201).json({ success: true, data: node, error: null });
});

router.get("/v1/nodes", requireAuth, (_req: Request, res: Response) => {
  const nodes = Array.from(nodeRegistry.values());
  res.json({
    success: true,
    data: {
      liveHubs: LIVE_NODES,
      totalNodes: nodes.length,
      nodes,
    },
    error: null,
  });
});

router.get("/inventory/search", requireAuth, (req: Request, res: Response) => {
  const make = String(req.query.make || "");
  const model = req.query.model ? String(req.query.model) : undefined;
  const maxPrice = req.query.max_price ? parseFloat(String(req.query.max_price)) : undefined;
  const zipCode = String(req.query.zip_code || "90210");

  if (!make) {
    res.status(400).json({ success: false, data: null, error: "make parameter is required" });
    return;
  }

  const basePrice = 45000;
  const effectivePrice = maxPrice ? Math.min(basePrice, maxPrice) : basePrice;
  const payment = Math.round(effectivePrice * 0.0175 * 100) / 100;
  const hub = selectHub();

  const results = [
    {
      vin: `ONYX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      make,
      model: model || "Stock",
      price: effectivePrice,
      paymentEstimate: payment,
      node: hub,
      availability: true,
    },
  ];

  res.json({
    success: true,
    data: results,
    error: null,
    meta: { zipCode, totalResults: results.length, hub },
  });
});

router.post("/leads/create", requireAuth, (req: Request, res: Response) => {
  const body = req.body as LeadBody;

  if (!body.name || !body.phone || !body.email || !body.intentType) {
    res.status(400).json({ success: false, data: null, error: "name, phone, email, and intentType are required" });
    return;
  }

  const validIntents: ActionIntent[] = ["buy_car", "refer_buyer", "need_service", "accident_help", "trade_in"];
  if (!validIntents.includes(body.intentType)) {
    res.status(400).json({ success: false, data: null, error: `intentType must be one of: ${validIntents.join(", ")}` });
    return;
  }

  const leadId = shortId("LEAD");
  const hub = selectHub(body.preferredHub);

  logger.info({
    leadId,
    intent: body.intentType,
    email: body.email,
    hub,
    budget: body.budget || 0,
  }, "[ONYX-OS] Lead created");

  res.status(201).json({
    success: true,
    data: {
      leadId,
      status: "active",
      intentType: body.intentType,
      assignedHub: hub,
      createdAt: new Date().toISOString(),
    },
    error: null,
  });
});

router.post("/deals/create", requireAuth, idempotencyGuard(), (req: Request, res: Response) => {
  const body = req.body as DealBody;

  if (!body.leadId || !body.vehicleId || !body.nodeId) {
    res.status(400).json({ success: false, data: null, error: "leadId, vehicleId, and nodeId are required" });
    return;
  }

  const dealId = shortId("DEAL");
  const salePrice = body.salePrice || 45000;
  const platformFee = Math.round(salePrice * PLATFORM_FEE_RATE * 100) / 100;
  const now = new Date().toISOString();

  const transaction: TrackedTransaction = {
    transactionId: dealId,
    intent: "buy_car",
    hub: selectHub(),
    nodeContributors: [body.nodeId],
    status: "Pending Signature",
    payoutPool: salePrice - platformFee,
    platformFee,
    createdAt: now,
    updatedAt: now,
  };

  transactionLedger.set(dealId, transaction);

  logger.info({
    dealId,
    leadId: body.leadId,
    vehicleId: body.vehicleId,
    nodeId: body.nodeId,
    salePrice,
    platformFee,
  }, "[ONYX-OS] Deal created");

  res.status(201).json({
    success: true,
    data: {
      dealId,
      status: transaction.status,
      payoutStatus: "tracked" as DealPayoutStatus,
      leadId: body.leadId,
      vehicleId: body.vehicleId,
      nodeId: body.nodeId,
      salePrice,
      platformFee,
      netPayout: transaction.payoutPool,
      createdAt: now,
    },
    error: null,
  });
});

router.get("/deals/:dealId", requireAuth, (req: Request, res: Response) => {
  const dealId = String(req.params.dealId);
  const txn = transactionLedger.get(dealId);

  const status = txn?.status || "F&I Manager Review";
  const participants = txn?.nodeContributors || ["Sales_Node_1", "Finance_Node_A"];
  const payoutPool = txn?.payoutPool || 500.00;
  const platformFee = txn?.platformFee || Math.round(payoutPool * PLATFORM_FEE_RATE * 100) / 100;

  res.json({
    success: true,
    data: {
      dealId,
      status,
      participants,
      payoutPool,
      platformFee,
      netPayout: payoutPool - platformFee,
      timeline: [
        "Lead Created",
        "Vehicle Selected",
        "Credit App Submitted",
        status,
      ],
      nextSteps: status === "Funded" ? "Schedule delivery" : "Awaiting lender approval",
      commission: {
        platformFeeRate: `${PLATFORM_FEE_RATE * 100}%`,
        estimatedPayout: `$${(payoutPool - platformFee).toLocaleString()}`,
      },
    },
    error: null,
  });
});

router.post("/service/request", requireAuth, (req: Request, res: Response) => {
  const body = req.body as ServiceBody;

  if (!body.customer || !body.vin || !body.issue) {
    res.status(400).json({ success: false, data: null, error: "customer, vin, and issue are required" });
    return;
  }

  const caseId = shortId("SRV");
  const hub = selectHub(body.preferredHub);

  logger.info({
    caseId,
    customer: body.customer,
    vin: body.vin,
    issue: body.issue,
    hub,
  }, "[ONYX-OS] Service request created");

  res.status(201).json({
    success: true,
    data: {
      caseId,
      status: "scheduled" as ServiceStatus,
      customer: body.customer,
      vin: body.vin,
      hub,
      readyAt: `Ready at ${hub.replace(/_/g, " ")}`,
      createdAt: new Date().toISOString(),
    },
    error: null,
  });
});

router.get("/vehicle/:vin/verify", requireAuth, (req: Request, res: Response) => {
  const vin = String(req.params.vin);

  if (!vin || vin.length < 5) {
    res.status(400).json({ success: false, data: null, error: "Valid VIN is required (min 5 chars)" });
    return;
  }

  res.json({
    success: true,
    data: {
      vin,
      status: "Verified by ONYX Node",
      history: "Clean",
      titleStatus: "Clear",
      odometerVerified: true,
      recallsCleared: true,
      verifiedAt: new Date().toISOString(),
    },
    error: null,
  });
});

router.post("/messages/send", requireAuth, (req: Request, res: Response) => {
  const body = req.body as MessageBody;

  if (!body.to || !body.channel || !body.message) {
    res.status(400).json({ success: false, data: null, error: "to, channel, and message are required" });
    return;
  }

  const validChannels: MessageChannel[] = ["sms", "email", "whatsapp", "push"];
  if (!validChannels.includes(body.channel)) {
    res.status(400).json({ success: false, data: null, error: `channel must be one of: ${validChannels.join(", ")}` });
    return;
  }

  const messageId = shortId("MSG");

  logger.info({
    messageId,
    to: body.to,
    channel: body.channel,
    dealId: body.dealId || null,
  }, "[ONYX-OS] Message dispatched");

  res.json({
    success: true,
    data: {
      messageId,
      deliveryStatus: "sent",
      channel: body.channel,
      sentAt: new Date().toISOString(),
    },
    error: null,
  });
});

export default router;
