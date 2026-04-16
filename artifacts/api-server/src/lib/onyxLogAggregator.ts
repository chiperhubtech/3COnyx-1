import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const ARCHITECT = "Ronald Antonio Cadet";

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: number;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  stack?: string;
}

interface LogQuery {
  level?: LogLevel | LogLevel[];
  service?: string;
  correlationId?: string;
  search?: string;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
  userId?: number;
  method?: string;
  path?: string;
  minDuration?: number;
  hasError?: boolean;
}

interface LogAggregation {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byService: Record<string, number>;
  errorRate: number;
  avgResponseTime: number;
  topErrors: Array<{ message: string; count: number; lastSeen: number }>;
  topSlowEndpoints: Array<{ path: string; avgDuration: number; count: number }>;
  logsPerMinute: number;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5,
};

class OnyxLogAggregator {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 50000;
  private readonly maxAge = 24 * 60 * 60 * 1000;
  private minLevel: LogLevel = "INFO";
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private errorPatterns: Map<string, { count: number; lastSeen: number }> = new Map();
  private endpointDurations: Map<string, { total: number; count: number }> = new Map();
  private startedAt = Date.now();

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(level: LogLevel, service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return null;

    const entry: LogEntry = {
      id: crypto.randomBytes(8).toString("hex"),
      timestamp: Date.now(),
      level,
      service,
      message,
      ...extra,
    };

    this.logs.push(entry);

    if (level === "ERROR" || level === "FATAL") {
      const key = `${service}:${message.substring(0, 100)}`;
      const existing = this.errorPatterns.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeen = Date.now();
      } else {
        this.errorPatterns.set(key, { count: 1, lastSeen: Date.now() });
      }
    }

    if (extra?.path && extra?.duration) {
      const key = `${extra.method || "GET"}:${extra.path}`;
      const existing = this.endpointDurations.get(key);
      if (existing) {
        existing.total += extra.duration;
        existing.count++;
      } else {
        this.endpointDurations.set(key, { total: extra.duration, count: 1 });
      }
    }

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogs * 0.8));
    }

    return entry;
  }

  trace(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("TRACE", service, message, extra);
  }
  debug(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("DEBUG", service, message, extra);
  }
  info(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("INFO", service, message, extra);
  }
  warn(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("WARN", service, message, extra);
  }
  error(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("ERROR", service, message, extra);
  }
  fatal(service: string, message: string, extra?: Partial<LogEntry>): LogEntry | null {
    return this.log("FATAL", service, message, extra);
  }

  query(q: LogQuery): { results: LogEntry[]; total: number; hasMore: boolean } {
    let filtered = [...this.logs];

    if (q.level) {
      const levels = Array.isArray(q.level) ? q.level : [q.level];
      filtered = filtered.filter(l => levels.includes(l.level));
    }
    if (q.service) filtered = filtered.filter(l => l.service === q.service);
    if (q.correlationId) filtered = filtered.filter(l => l.correlationId === q.correlationId);
    if (q.userId) filtered = filtered.filter(l => l.userId === q.userId);
    if (q.method) filtered = filtered.filter(l => l.method === q.method);
    if (q.path) filtered = filtered.filter(l => l.path && l.path.includes(q.path!));
    if (q.from) filtered = filtered.filter(l => l.timestamp >= q.from!);
    if (q.to) filtered = filtered.filter(l => l.timestamp <= q.to!);
    if (q.minDuration) filtered = filtered.filter(l => l.duration && l.duration >= q.minDuration!);
    if (q.hasError) filtered = filtered.filter(l => l.level === "ERROR" || l.level === "FATAL");
    if (q.search) {
      const s = q.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.message.toLowerCase().includes(s) ||
        l.service.toLowerCase().includes(s) ||
        (l.path && l.path.toLowerCase().includes(s))
      );
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    const total = filtered.length;
    const offset = q.offset || 0;
    const limit = q.limit || 100;
    const results = filtered.slice(offset, offset + limit);

    return { results, total, hasMore: offset + limit < total };
  }

  aggregate(timeWindowMs?: number): LogAggregation {
    const cutoff = timeWindowMs ? Date.now() - timeWindowMs : 0;
    const relevant = cutoff ? this.logs.filter(l => l.timestamp >= cutoff) : this.logs;

    const byLevel: Record<LogLevel, number> = { TRACE: 0, DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 };
    const byService: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of relevant) {
      byLevel[log.level]++;
      byService[log.service] = (byService[log.service] || 0) + 1;
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
    }

    const errors = relevant.filter(l => l.level === "ERROR" || l.level === "FATAL").length;
    const windowMinutes = timeWindowMs ? timeWindowMs / 60000 : (Date.now() - this.startedAt) / 60000;

    const topErrors = Array.from(this.errorPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => ({ message: key, count: data.count, lastSeen: data.lastSeen }));

    const topSlowEndpoints = Array.from(this.endpointDurations.entries())
      .map(([key, data]) => ({ path: key, avgDuration: Math.round(data.total / data.count), count: data.count }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalLogs: relevant.length,
      byLevel,
      byService,
      errorRate: relevant.length > 0 ? Number((errors / relevant.length * 100).toFixed(2)) : 0,
      avgResponseTime: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      topErrors,
      topSlowEndpoints,
      logsPerMinute: windowMinutes > 0 ? Number((relevant.length / windowMinutes).toFixed(1)) : 0,
    };
  }

  httpMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      const correlationId = (req.headers["x-correlation-id"] as string) || crypto.randomBytes(8).toString("hex");

      (req as any).correlationId = correlationId;
      res.setHeader("X-Correlation-ID", correlationId);

      res.on("finish", () => {
        const duration = Date.now() - start;
        const level: LogLevel = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
        const userId = (req as any).user?.id;

        this.log(level, "api-gateway", `${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
          correlationId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userId,
        });
      });

      next();
    };
  }

  getTrace(correlationId: string): LogEntry[] {
    return this.logs
      .filter(l => l.correlationId === correlationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getDashboard(): {
    architect: string;
    protocol: string;
    version: string;
    status: string;
    uptime: number;
    totalLogs: number;
    bufferUsage: string;
    aggregation: LogAggregation;
    recentErrors: LogEntry[];
    recentLogs: LogEntry[];
    services: string[];
  } {
    const agg = this.aggregate(3600000);
    return {
      architect: ARCHITECT,
      protocol: "ONYX Log Aggregator",
      version: "1.0.0",
      status: "ARMED",
      uptime: Date.now() - this.startedAt,
      totalLogs: this.logs.length,
      bufferUsage: `${this.logs.length}/${this.maxLogs}`,
      aggregation: agg,
      recentErrors: this.logs.filter(l => l.level === "ERROR" || l.level === "FATAL").slice(-20).reverse(),
      recentLogs: this.logs.slice(-50).reverse(),
      services: [...new Set(this.logs.map(l => l.service))],
    };
  }

  genesis(): void {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - this.maxAge;
      this.logs = this.logs.filter(l => l.timestamp >= cutoff);
    }, 300000);

    this.info("log-aggregator", "ONYX Log Aggregator ARMED — centralized structured logging with correlation tracing");
    this.info("log-aggregator", `Architect: ${ARCHITECT} — Buffer: ${this.maxLogs} entries, TTL: 24h, Full-text search enabled`);

    console.log(`[ONYX LOG AGGREGATOR] 📋 ELK-equivalent centralized logging — ${this.maxLogs} buffer, 24h retention, correlation tracing — Architect: ${ARCHITECT}`);
  }
}

export const logAggregator = new OnyxLogAggregator();
