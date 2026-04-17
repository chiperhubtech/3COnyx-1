import { pool } from "@workspace/db";
import { logAggregator } from "./onyxLogAggregator";
import { allCircuitStatuses } from "./circuitBreaker";
import * as wsHub from "./wsHub";
import { logger } from "./logger";
import crypto from "crypto";

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  service: string;
  condition: string;
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  traceContext: string;
  resolvedAt?: number;
}

interface AlertThresholds {
  errorRatePercent: number;
  heapPercent: number;
  dbPoolWaiting: number;
  checkIntervalMs: number;
}

interface AlertLogPayload {
  level: "ALERT";
  severity: AlertSeverity;
  service: string;
  condition: string;
  message: string;
  currentValue: number;
  threshold: number;
  traceContext: string;
  timestamp: string;
}

interface RollingWindowEntry {
  timestamp: number;
  isError: boolean;
}

function loadThresholds(): AlertThresholds {
  return {
    errorRatePercent: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD ?? "5"),
    heapPercent: parseFloat(process.env.ALERT_HEAP_PERCENT ?? "85"),
    dbPoolWaiting: parseInt(process.env.ALERT_DB_POOL_WAITING ?? "5", 10),
    checkIntervalMs: parseInt(process.env.ALERT_CHECK_INTERVAL_MS ?? "60000", 10),
  };
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;

class AlertEngine {
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private cooldowns: Map<string, number> = new Map();
  private readonly maxHistory = 5000;
  private readonly historyTtl = 24 * 60 * 60 * 1000;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private thresholds: AlertThresholds;
  private idCounter = 0;
  private requestWindow: RollingWindowEntry[] = [];

  constructor() {
    this.thresholds = loadThresholds();
  }

  private generateTraceContext(): string {
    const traceId = crypto.randomBytes(16).toString("hex");
    const spanId = crypto.randomBytes(8).toString("hex");
    return `00-${traceId}-${spanId}-01`;
  }

  private nextId(): string {
    return `alert-${Date.now()}-${++this.idCounter}`;
  }

  recordRequest(isError: boolean): void {
    this.requestWindow.push({ timestamp: Date.now(), isError });
  }

  private pruneRequestWindow(): void {
    const cutoff = Date.now() - FIVE_MINUTES_MS;
    this.requestWindow = this.requestWindow.filter(e => e.timestamp >= cutoff);
  }

  private emitStructuredAlertLog(alert: Alert): void {
    const payload: AlertLogPayload = {
      level: "ALERT",
      severity: alert.severity,
      service: alert.service,
      condition: alert.condition,
      message: alert.message,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      traceContext: alert.traceContext,
      timestamp: new Date(alert.timestamp).toISOString(),
    };
    console.log(JSON.stringify(payload));
  }

  private fireAlert(severity: AlertSeverity, service: string, condition: string, message: string, currentValue: number, threshold: number): void {
    const key = `${service}:${condition}`;

    if (this.activeAlerts.has(key)) {
      return;
    }

    const cooldownExpiry = this.cooldowns.get(key);
    if (cooldownExpiry && Date.now() < cooldownExpiry) {
      return;
    }

    const traceContext = this.generateTraceContext();

    const alert: Alert = {
      id: this.nextId(),
      severity,
      service,
      condition,
      message,
      currentValue,
      threshold,
      timestamp: Date.now(),
      traceContext,
    };

    this.activeAlerts.set(key, alert);
    this.alertHistory.push(alert);

    this.emitStructuredAlertLog(alert);

    logger.error({
      alertSeverity: severity,
      service,
      condition,
      currentValue,
      threshold,
      traceContext,
    }, `[ALERT] ${message}`);

    logAggregator.log("FATAL", "alert-engine", message, {
      traceId: traceContext,
    });

    if (severity === "critical") {
      wsHub.broadcast("alerts", {
        type: "alert",
        alert,
      });
    }

    this.dispatchWebhook(alert).catch(() => {});
  }

  private resolveAlert(service: string, condition: string): void {
    const key = `${service}:${condition}`;
    const existing = this.activeAlerts.get(key);
    if (existing) {
      existing.resolvedAt = Date.now();
      this.activeAlerts.delete(key);
      this.cooldowns.set(key, Date.now() + COOLDOWN_MS);

      logger.info({ service, condition }, `[ALERT RESOLVED] ${condition} on ${service}`);

      wsHub.broadcast("alerts", {
        type: "alert_resolved",
        alert: existing,
      });
    }
  }

  private async dispatchWebhook(alert: Alert): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    const payload = {
      text: `[${alert.severity.toUpperCase()}] ${alert.message}`,
      username: "3C ONYX Alert Engine",
      embeds: [{
        title: `${alert.severity.toUpperCase()}: ${alert.condition}`,
        description: alert.message,
        color: alert.severity === "critical" ? 0xff0000 : alert.severity === "warning" ? 0xffa500 : 0x0000ff,
        fields: [
          { name: "Service", value: alert.service, inline: true },
          { name: "Current Value", value: String(alert.currentValue), inline: true },
          { name: "Threshold", value: String(alert.threshold), inline: true },
          { name: "Trace", value: alert.traceContext, inline: false },
        ],
        timestamp: new Date(alert.timestamp).toISOString(),
      }],
      content: `**[${alert.severity.toUpperCase()}]** ${alert.message}`,
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      logger.warn({ err }, "Alert webhook dispatch failed");
    }
  }

  evaluate(): void {
    this.pruneRequestWindow();
    this.pruneCooldowns();
    this.checkCircuitBreakers();
    this.checkDbPool();
    this.checkErrorRate();
    this.checkHeapMemory();
    this.checkWebhookFailures();
    this.pruneHistory();
  }

  private pruneCooldowns(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cooldowns.entries()) {
      if (now >= expiry) {
        this.cooldowns.delete(key);
      }
    }
  }

  private checkCircuitBreakers(): void {
    const statuses = allCircuitStatuses();
    for (const cb of statuses) {
      if (cb.state === "OPEN") {
        this.fireAlert("critical", cb.name, "circuit_breaker_open", `Circuit breaker OPEN for ${cb.name}`, 1, 0);
      } else {
        this.resolveAlert(cb.name, "circuit_breaker_open");
      }
    }
  }

  private checkDbPool(): void {
    const waiting = pool.waitingCount;
    if (waiting > this.thresholds.dbPoolWaiting) {
      this.fireAlert("critical", "database", "db_pool_exhaustion", `DB pool exhaustion: ${waiting} requests waiting (threshold: ${this.thresholds.dbPoolWaiting})`, waiting, this.thresholds.dbPoolWaiting);
    } else {
      this.resolveAlert("database", "db_pool_exhaustion");
    }
  }

  private checkErrorRate(): void {
    const totalInWindow = this.requestWindow.length;
    if (totalInWindow < 10) {
      this.resolveAlert("api-gateway", "high_error_rate");
      return;
    }
    const errorsInWindow = this.requestWindow.filter(e => e.isError).length;
    const errorRate = (errorsInWindow / totalInWindow) * 100;

    if (errorRate > this.thresholds.errorRatePercent) {
      this.fireAlert(
        "warning",
        "api-gateway",
        "high_error_rate",
        `Error rate ${errorRate.toFixed(2)}% exceeds threshold ${this.thresholds.errorRatePercent}% (${errorsInWindow}/${totalInWindow} requests in 5-min window)`,
        Number(errorRate.toFixed(2)),
        this.thresholds.errorRatePercent,
      );
    } else {
      this.resolveAlert("api-gateway", "high_error_rate");
    }
  }

  private checkHeapMemory(): void {
    const mem = process.memoryUsage();
    const heapPercent = (mem.heapUsed / mem.heapTotal) * 100;
    if (heapPercent > this.thresholds.heapPercent) {
      this.fireAlert("warning", "node-runtime", "heap_memory_high", `Heap memory at ${heapPercent.toFixed(1)}% (threshold: ${this.thresholds.heapPercent}%)`, Math.round(heapPercent), this.thresholds.heapPercent);
    } else {
      this.resolveAlert("node-runtime", "heap_memory_high");
    }
  }

  private checkWebhookFailures(): void {
    const windowMs = FIVE_MINUTES_MS;
    const cutoff = Date.now() - windowMs;
    const recentLogs = logAggregator.query({
      level: ["ERROR", "FATAL"],
      from: cutoff,
      search: "webhook",
      limit: 1000,
    });
    const totalWebhookFailures = recentLogs.total;

    if (totalWebhookFailures > 3) {
      this.fireAlert("warning", "webhooks", "webhook_processing_failures", `${totalWebhookFailures} webhook processing failures in last 5 minutes`, totalWebhookFailures, 3);
    } else {
      this.resolveAlert("webhooks", "webhook_processing_failures");
    }
  }

  private pruneHistory(): void {
    const cutoff = Date.now() - this.historyTtl;
    this.alertHistory = this.alertHistory.filter(a => a.timestamp >= cutoff);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistory);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(): Alert[] {
    return [...this.alertHistory].reverse();
  }

  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  getDashboard() {
    return {
      activeAlerts: this.getActiveAlerts(),
      activeCount: this.activeAlerts.size,
      history: this.getAlertHistory().slice(0, 100),
      historyCount: this.alertHistory.length,
      thresholds: this.getThresholds(),
      ts: new Date().toISOString(),
    };
  }

  genesis(): void {
    this.thresholds = loadThresholds();
    this.checkInterval = setInterval(() => {
      try {
        this.evaluate();
      } catch (err) {
        logger.error({ err }, "[AlertEngine] Evaluation cycle failed");
      }
    }, this.thresholds.checkIntervalMs);

    this.evaluate();

    logger.info({
      thresholds: this.thresholds,
      protocol: "ONYX Alert Engine",
    }, "[genesis] Alert Engine — ARMED");
    console.log(`[ONYX ALERT ENGINE] Production alerting — interval ${this.thresholds.checkIntervalMs}ms, ${Object.keys(this.thresholds).length} thresholds configured`);
  }

  shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const alertEngine = new AlertEngine();
