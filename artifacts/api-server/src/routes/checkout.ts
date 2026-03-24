/**
 * 3C Onyx — Checkout Routes
 *
 * POST /checkout/vehicle   — Create Stripe PaymentIntent + open escrow
 * POST /checkout/release   — Release escrow on confirmed delivery
 * GET  /checkout/orders    — List orders for current user
 * GET  /checkout/orders/:id — Single order detail
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";
import { getUncachableStripeClient } from "../lib/stripeClient";
import * as wsHub from "../lib/wsHub";

const router: IRouter = Router();

/* ─── In-memory order store (swap for DB in production) ──────────────────── */
interface EscrowOrder {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vin: string;
  buyerId: number;
  buyerEmail: string;
  price: number;
  platformFee: number;
  totalAmount: number;
  paymentIntentId: string | null;
  status: "pending" | "escrowed" | "in_transit" | "delivered" | "released" | "refunded";
  runnerId: string | null;
  blockchainHash: string;
  createdAt: string;
  deliveredAt: string | null;
  releasedAt: string | null;
}

const ORDERS = new Map<string, EscrowOrder>();

function makeHash(data: string): string {
  return crypto.createHash("sha256").update(data + Date.now()).digest("hex");
}

/* ─── POST /checkout/vehicle ─────────────────────────────────────────────── */
router.post("/checkout/vehicle", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { vehicleId, vin, vehicleName, price, platformFee, totalAmount } = req.body as {
      vehicleId: string;
      vin: string;
      vehicleName: string;
      price: number;
      platformFee: number;
      totalAmount: number;
    };

    if (!vehicleId || !vin || !vehicleName || !price) {
      res.status(400).json({ error: "Missing required checkout fields" });
      return;
    }

    const orderId = `3C-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const blockchainHash = makeHash(`${orderId}:${vin}:${price}`);

    let paymentIntentId: string | null = null;

    // Attempt real Stripe PaymentIntent
    try {
      const stripe = await getUncachableStripeClient();
      const pi = await stripe.paymentIntents.create({
        amount: Math.round((totalAmount ?? price + (platformFee ?? 0)) * 100),
        currency: "usd",
        metadata: {
          orderId,
          vehicleId,
          vin,
          buyerEmail: user.email,
          type: "vehicle_escrow",
        },
        description: `3C Onyx Escrow — ${vehicleName}`,
      });
      paymentIntentId = pi.id;
    } catch {
      // Stripe unavailable — create order without payment intent (sandbox mode)
      paymentIntentId = null;
    }

    const order: EscrowOrder = {
      id: orderId,
      vehicleId,
      vehicleName,
      vin,
      buyerId: user.id,
      buyerEmail: user.email,
      price,
      platformFee: platformFee ?? Math.round(price * 0.015),
      totalAmount: totalAmount ?? price + (platformFee ?? 0),
      paymentIntentId,
      status: "escrowed",
      runnerId: null,
      blockchainHash,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      releasedAt: null,
    };

    ORDERS.set(orderId, order);

    // Broadcast to runner pool — new job available
    wsHub.broadcast("notify", {
      type: "new_task",
      title: "New Delivery Task",
      body: `${vehicleName} — available for pickup`,
      orderId,
      ts: new Date().toISOString(),
    });

    // Notify buyer
    wsHub.broadcast("notify", {
      type: "escrow_opened",
      title: "Escrow Opened",
      body: `$${totalAmount.toLocaleString()} secured for ${vehicleName}`,
      orderId,
      ts: new Date().toISOString(),
    });

    res.status(201).json({
      orderId,
      paymentIntentId,
      blockchainHash,
      status: "escrowed",
      message: "Escrow opened. Runner will be dispatched shortly.",
    });
  } catch (err) {
    console.error("[checkout/vehicle]", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─── POST /checkout/release ─────────────────────────────────────────────── */
router.post("/checkout/release", requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderId, deliveryCode } = req.body as { orderId: string; deliveryCode: string };
    const order = ORDERS.get(orderId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Verify QR delivery code (SHA-256 of orderId + vin)
    const expectedCode = crypto
      .createHash("sha256")
      .update(`${orderId}:${order.vin}`)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase();

    if (deliveryCode !== expectedCode) {
      res.status(400).json({ error: "Invalid delivery confirmation code" });
      return;
    }

    order.status = "released";
    order.deliveredAt = new Date().toISOString();
    order.releasedAt = new Date().toISOString();

    // In production: trigger Stripe Transfer to seller + runner payout
    // stripe.transfers.create({ amount: ..., destination: seller.stripeAccountId })

    wsHub.broadcast("notify", {
      type: "escrow_released",
      title: "Delivery Confirmed",
      body: `Funds released for ${order.vehicleName}. Transaction complete.`,
      orderId,
      ts: new Date().toISOString(),
    });

    res.json({ success: true, status: "released", orderId });
  } catch (err) {
    console.error("[checkout/release]", err);
    res.status(500).json({ error: "Release failed" });
  }
});

/* ─── GET /checkout/orders ───────────────────────────────────────────────── */
router.get("/checkout/orders", requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const orders = Array.from(ORDERS.values())
    .filter((o) => o.buyerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders });
});

/* ─── GET /checkout/orders/:id ──────────────────────────────────────────── */
router.get("/checkout/orders/:id", requireAuth, (req: Request, res: Response) => {
  const order = ORDERS.get(req.params.id);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ order });
});

export default router;
