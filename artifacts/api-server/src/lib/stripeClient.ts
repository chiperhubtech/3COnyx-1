import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new Stripe(key, { apiVersion: "2025-01-27.acacia" });
  }
  return _client;
}

export const MEMBER_SLICE_PCT = 0.05; // 5%
export const PLATFORM_FEE_PCT = 0.025; // 2.5% platform fee on top
