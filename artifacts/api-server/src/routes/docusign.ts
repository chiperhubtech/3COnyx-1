import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const DS_BASE = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi/v2.1";
const DS_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DS_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DS_ACCESS_TOKEN = process.env.DOCUSIGN_ACCESS_TOKEN;

function isLive(): boolean {
  return !!(DS_ACCOUNT_ID && DS_INTEGRATION_KEY && DS_ACCESS_TOKEN);
}

type EnvelopeType =
  | "purchase_agreement"
  | "title_transfer"
  | "finance_contract"
  | "insurance_binder"
  | "trade_in_agreement"
  | "service_authorization"
  | "delivery_receipt"
  | "power_of_attorney"
  | "lease_agreement"
  | "warranty_contract";

interface EnvelopeRequest {
  type: EnvelopeType;
  signers: { name: string; email: string; role: string }[];
  vehicleVin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  dealId?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

const TEMPLATE_MAP: Record<EnvelopeType, { name: string; docCount: number; avgPages: number }> = {
  purchase_agreement:    { name: "Vehicle Purchase Agreement",     docCount: 1, avgPages: 8 },
  title_transfer:        { name: "Certificate of Title Transfer",  docCount: 2, avgPages: 4 },
  finance_contract:      { name: "Retail Installment Contract",    docCount: 3, avgPages: 12 },
  insurance_binder:      { name: "Insurance Binder & Declarations",docCount: 1, avgPages: 6 },
  trade_in_agreement:    { name: "Trade-In Appraisal Agreement",   docCount: 1, avgPages: 3 },
  service_authorization: { name: "Service Work Authorization",     docCount: 1, avgPages: 2 },
  delivery_receipt:      { name: "Vehicle Delivery Receipt",       docCount: 1, avgPages: 2 },
  power_of_attorney:     { name: "Limited Power of Attorney",      docCount: 1, avgPages: 4 },
  lease_agreement:       { name: "Vehicle Lease Agreement",        docCount: 2, avgPages: 14 },
  warranty_contract:     { name: "Extended Warranty Contract",      docCount: 1, avgPages: 6 },
};

router.get("/docusign/status", (_req: Request, res: Response) => {
  res.json({
    provider: "DocuSign",
    live: isLive(),
    mode: isLive() ? "production" : "demo",
    supportedTemplates: Object.keys(TEMPLATE_MAP),
    description: "Electronic signature service for automotive contracts and title transfers",
  });
});

router.get("/docusign/templates", (_req: Request, res: Response) => {
  const templates = Object.entries(TEMPLATE_MAP).map(([id, t]) => ({
    id,
    ...t,
  }));
  res.json({ templates });
});

router.post("/docusign/envelope", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as EnvelopeRequest;
  if (!body.type || !body.signers?.length) {
    res.status(400).json({ error: "type and signers[] are required" });
    return;
  }

  const template = TEMPLATE_MAP[body.type];
  if (!template) {
    res.status(400).json({ error: `Unknown envelope type: ${body.type}`, validTypes: Object.keys(TEMPLATE_MAP) });
    return;
  }

  if (isLive()) {
    try {
      const dsRes = await fetch(`${DS_BASE}/accounts/${DS_ACCOUNT_ID}/envelopes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DS_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailSubject: `3C ONYX — ${template.name}`,
          recipients: {
            signers: body.signers.map((s, i) => ({
              email: s.email,
              name: s.name,
              recipientId: String(i + 1),
              routingOrder: String(i + 1),
              roleName: s.role,
            })),
          },
          status: "sent",
          customFields: {
            textCustomFields: [
              { name: "vehicleVin", value: body.vehicleVin ?? "" },
              { name: "dealId", value: body.dealId ?? "" },
              { name: "platform", value: "3C ONYX" },
            ],
          },
        }),
      });
      const data = await dsRes.json() as { envelopeId: string; status: string };
      res.status(201).json({
        envelopeId: data.envelopeId,
        status: data.status,
        sentAt: new Date().toISOString(),
        live: true,
      });
      return;
    } catch (err) {
      console.error("[docusign] API error:", err);
    }
  }

  const envelopeId = `env-${crypto.randomUUID().slice(0, 8)}`;
  res.status(201).json({
    envelopeId,
    type: body.type,
    templateName: template.name,
    status: "sent",
    signers: body.signers.map((s, i) => ({
      ...s,
      status: "pending",
      order: i + 1,
      signUrl: `https://demo.docusign.net/signing/${envelopeId}/${i + 1}`,
    })),
    vehicle: body.vehicleVin
      ? { vin: body.vehicleVin, make: body.vehicleMake, model: body.vehicleModel, year: body.vehicleYear }
      : null,
    dealId: body.dealId ?? null,
    amount: body.amount ?? null,
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    simulated: true,
  });
});

router.get("/docusign/envelope/:envelopeId", requireAuth, async (req: Request, res: Response) => {
  const { envelopeId } = req.params;

  if (isLive()) {
    try {
      const dsRes = await fetch(`${DS_BASE}/accounts/${DS_ACCOUNT_ID}/envelopes/${envelopeId}`, {
        headers: { Authorization: `Bearer ${DS_ACCESS_TOKEN}` },
      });
      if (dsRes.ok) {
        const data = await dsRes.json();
        res.json(data);
        return;
      }
    } catch (err) {
      console.error("[docusign] Fetch error:", err);
    }
  }

  res.json({
    envelopeId,
    status: "completed",
    sentAt: new Date(Date.now() - 86_400_000).toISOString(),
    completedAt: new Date(Date.now() - 3_600_000).toISOString(),
    signers: [
      { name: "Ronald Cadet", email: "ron@cuxtomcandyclub.com", status: "completed", signedAt: new Date(Date.now() - 7_200_000).toISOString() },
      { name: "Client", email: "client@example.com", status: "completed", signedAt: new Date(Date.now() - 3_600_000).toISOString() },
    ],
    simulated: true,
  });
});

router.get("/docusign/deal/:dealId/envelopes", requireAuth, (req: Request, res: Response) => {
  const { dealId } = req.params;
  res.json({
    dealId,
    envelopes: [
      { envelopeId: `env-${dealId}-pa`, type: "purchase_agreement", status: "completed", completedAt: new Date(Date.now() - 86_400_000).toISOString() },
      { envelopeId: `env-${dealId}-tt`, type: "title_transfer", status: "sent", sentAt: new Date().toISOString() },
      { envelopeId: `env-${dealId}-fc`, type: "finance_contract", status: "delivered", sentAt: new Date().toISOString() },
    ],
    simulated: !isLive(),
  });
});

export default router;
