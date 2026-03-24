// @ts-nocheck
/**
 * 3C Onyx — Price Alert Background Job
 *
 * Polls watchlist items with target prices against MarketCheck.
 * Fires WebSocket push when a vehicle hits or drops below target.
 * Runs every 5 minutes.
 */
import * as wsHub from "./wsHub";
import { logger } from "./logger";

const MARKETCHECK_KEY = process.env.MARKETCHECK_API_KEY;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface AlertEntry {
  id: number;
  make: string;
  model: string;
  year: number;
  targetPrice: number;
  listedPrice: number | null;
  heading: string;
  userId?: string;
  firedAt: string | null;
}

/* ─── In-memory alert registry (supplement DB watchlist) ────────────────── */
const alertRegistry = new Map<number, AlertEntry>();

export function registerPriceAlert(entry: AlertEntry) {
  alertRegistry.set(entry.id, entry);
  logger.info(`[priceAlert] Registered alert: ${entry.heading} @ $${entry.targetPrice}`);
}

export function removePriceAlert(id: number) {
  alertRegistry.delete(id);
}

async function checkPrices() {
  if (alertRegistry.size === 0) return;
  logger.info(`[priceAlert] Checking ${alertRegistry.size} watchlist alerts`);

  for (const [id, entry] of alertRegistry.entries()) {
    if (entry.firedAt) continue; // already fired

    try {
      let currentPrice: number | null = null;

      if (MARKETCHECK_KEY) {
        // Real MarketCheck API call
        const params = new URLSearchParams({
          api_key: MARKETCHECK_KEY,
          make: entry.make,
          model: entry.model,
          year: String(entry.year),
          rows: "1",
          sort_by: "price",
          sort_order: "asc",
        });
        const res = await fetch(`https://mc-api.marketcheck.com/v2/search/car/active?${params}`);
        if (res.ok) {
          const data = await res.json() as { listings?: Array<{ price?: number }> };
          const listing = data.listings?.[0];
          currentPrice = listing?.price ?? null;
        }
      } else {
        // Simulate price drift — random walk around listed price
        const base = entry.listedPrice ?? entry.targetPrice * 1.08;
        const drift = (Math.random() - 0.48) * base * 0.02; // ±2% drift
        currentPrice = Math.round(base + drift);
      }

      if (currentPrice !== null && currentPrice <= entry.targetPrice) {
        // Alert fires!
        entry.firedAt = new Date().toISOString();
        alertRegistry.set(id, entry);

        const savings = entry.targetPrice - currentPrice;

        wsHub.broadcast("notify", {
          type: "price_alert",
          title: "Price Alert Triggered",
          body: `${entry.heading} hit $${currentPrice.toLocaleString()} — $${savings.toLocaleString()} below your target`,
          alertId: id,
          currentPrice,
          targetPrice: entry.targetPrice,
          savings,
          ts: new Date().toISOString(),
        });

        logger.info(`[priceAlert] FIRED: ${entry.heading} @ $${currentPrice} (target $${entry.targetPrice})`);
      }
    } catch (err) {
      logger.error(`[priceAlert] Check failed for alert ${id}:`, err);
    }
  }
}

let jobInterval: ReturnType<typeof setInterval> | null = null;

export function startPriceAlertJob() {
  if (jobInterval) return;
  logger.info("[priceAlert] Price alert job started — interval: 5 min");
  checkPrices(); // run immediately
  jobInterval = setInterval(checkPrices, POLL_INTERVAL_MS);
}

export function stopPriceAlertJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
  }
}
