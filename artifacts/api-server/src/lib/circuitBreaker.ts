/**
 * 3C ONYX — Lightweight Circuit Breaker
 *
 * Prevents cascading failures when external services (Stripe, Twilio, AI APIs,
 * MarketCheck, Oracle) become slow or unavailable.
 *
 * States:
 *   CLOSED   — normal operation; requests pass through
 *   OPEN     — service is down; requests fail immediately with a known error
 *   HALF_OPEN — probe phase; one request is allowed to test recovery
 *
 * No dependencies — pure TypeScript implementation (no opossum needed).
 *
 * Based on Netflix Hystrix patterns + Martin Fowler's CircuitBreaker pattern.
 */
import { logger } from "./logger";

export type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  name:              string;
  failureThreshold?: number;   // failures before opening (default: 5)
  successThreshold?: number;   // successes in HALF_OPEN to close (default: 2)
  timeout?:          number;   // ms to stay OPEN before probing (default: 30_000)
  requestTimeout?:   number;   // ms before a single call is considered failed (default: 8_000)
}

export class CircuitBreaker {
  private readonly name:             string;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout:          number;
  private readonly requestTimeout:   number;

  private state:          CBState = "CLOSED";
  private failureCount:   number  = 0;
  private successCount:   number  = 0;
  private nextAttemptAt:  number  = 0;

  constructor(opts: CircuitBreakerOptions) {
    this.name             = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.timeout          = opts.timeout          ?? 30_000;
    this.requestTimeout   = opts.requestTimeout   ?? 8_000;
  }

  get currentState(): CBState { return this.state; }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttemptAt) {
        const msg = `Circuit OPEN for '${this.name}' — service unavailable`;
        logger.warn({ circuit: this.name, state: this.state }, msg);
        throw new Error(msg);
      }
      // Transition to HALF_OPEN for a probe request
      this.state = "HALF_OPEN";
      logger.info({ circuit: this.name }, "Circuit transitioning to HALF_OPEN — probing");
    }

    try {
      const result = await this.withTimeout(fn);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private withTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Circuit '${this.name}' request timed out after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      fn()
        .then((v) => { clearTimeout(timer); resolve(v); })
        .catch((e) => { clearTimeout(timer); reject(e); });
    });
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state        = "CLOSED";
        this.successCount = 0;
        logger.info({ circuit: this.name }, "Circuit CLOSED — service recovered");
      }
    }
  }

  private onFailure(err: unknown): void {
    this.failureCount++;
    this.successCount = 0;

    logger.warn({
      circuit:       this.name,
      state:         this.state,
      failureCount:  this.failureCount,
      failureThreshold: this.failureThreshold,
      err,
    }, `Circuit failure #${this.failureCount}`);

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state         = "OPEN";
      this.nextAttemptAt = Date.now() + this.timeout;
      logger.error({
        circuit:      this.name,
        nextAttemptAt: new Date(this.nextAttemptAt).toISOString(),
      }, "Circuit OPENED — requests will fail fast until probe");
    }
  }

  /** Returns current circuit status for health checks */
  status() {
    return {
      name:         this.name,
      state:        this.state,
      failureCount: this.failureCount,
      nextAttemptAt: this.state === "OPEN" ? new Date(this.nextAttemptAt).toISOString() : null,
    };
  }
}

// ── Pre-configured circuit breakers for every external service ──────────────
export const circuits = {
  stripe:      new CircuitBreaker({ name: "stripe",      failureThreshold: 3, timeout: 60_000 }),
  twilio:      new CircuitBreaker({ name: "twilio",      failureThreshold: 5, timeout: 30_000 }),
  openai:      new CircuitBreaker({ name: "openai",      failureThreshold: 5, timeout: 30_000 }),
  anthropic:   new CircuitBreaker({ name: "anthropic",   failureThreshold: 5, timeout: 30_000 }),
  gemini:      new CircuitBreaker({ name: "gemini",      failureThreshold: 5, timeout: 30_000 }),
  marketcheck: new CircuitBreaker({ name: "marketcheck", failureThreshold: 3, timeout: 45_000 }),
  oracle:      new CircuitBreaker({ name: "oracle",      failureThreshold: 3, timeout: 60_000 }),
  plaid:       new CircuitBreaker({ name: "plaid",       failureThreshold: 3, timeout: 30_000 }),
  places:      new CircuitBreaker({ name: "places",      failureThreshold: 5, timeout: 30_000 }),
};

/** Returns all circuit statuses — wired into /healthz */
export function allCircuitStatuses() {
  return Object.values(circuits).map((c) => c.status());
}
