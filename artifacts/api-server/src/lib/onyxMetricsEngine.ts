import type { Request, Response, NextFunction } from "express";

const ARCHITECT = "Ronald Antonio Cadet";

interface Counter {
  name: string;
  help: string;
  value: number;
  labels: Record<string, number>;
}

interface Gauge {
  name: string;
  help: string;
  value: number;
  labels: Record<string, number>;
}

interface HistogramBucket {
  le: number;
  count: number;
}

interface Histogram {
  name: string;
  help: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
  labels: Record<string, { buckets: HistogramBucket[]; sum: number; count: number }>;
}

interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

interface TimeSeries {
  name: string;
  points: TimeSeriesPoint[];
  maxPoints: number;
}

class OnyxMetricsEngine {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private timeSeries: Map<string, TimeSeries> = new Map();
  private startedAt = Date.now();
  private collectInterval: ReturnType<typeof setInterval> | null = null;

  private readonly DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

  createCounter(name: string, help: string): void {
    this.counters.set(name, { name, help, value: 0, labels: {} });
  }

  incrementCounter(name: string, amount = 1, label?: string): void {
    const counter = this.counters.get(name);
    if (!counter) return;
    counter.value += amount;
    if (label) {
      counter.labels[label] = (counter.labels[label] || 0) + amount;
    }
  }

  createGauge(name: string, help: string, initialValue = 0): void {
    this.gauges.set(name, { name, help, value: initialValue, labels: {} });
  }

  setGauge(name: string, value: number, label?: string): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;
    gauge.value = value;
    if (label) gauge.labels[label] = value;
  }

  incrementGauge(name: string, amount = 1): void {
    const gauge = this.gauges.get(name);
    if (gauge) gauge.value += amount;
  }

  decrementGauge(name: string, amount = 1): void {
    const gauge = this.gauges.get(name);
    if (gauge) gauge.value = Math.max(0, gauge.value - amount);
  }

  createHistogram(name: string, help: string, buckets?: number[]): void {
    const b = (buckets || this.DEFAULT_BUCKETS).map(le => ({ le, count: 0 }));
    b.push({ le: Infinity, count: 0 });
    this.histograms.set(name, { name, help, buckets: b, sum: 0, count: 0, labels: {} });
  }

  observeHistogram(name: string, value: number, label?: string): void {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    histogram.sum += value;
    histogram.count++;
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) bucket.count++;
    }

    if (label) {
      if (!histogram.labels[label]) {
        histogram.labels[label] = {
          buckets: this.DEFAULT_BUCKETS.map(le => ({ le, count: 0 })).concat([{ le: Infinity, count: 0 }]),
          sum: 0,
          count: 0,
        };
      }
      const lb = histogram.labels[label];
      lb.sum += value;
      lb.count++;
      for (const bucket of lb.buckets) {
        if (value <= bucket.le) bucket.count++;
      }
    }
  }

  createTimeSeries(name: string, maxPoints = 360): void {
    this.timeSeries.set(name, { name, points: [], maxPoints });
  }

  recordTimeSeriesPoint(name: string, value: number): void {
    const ts = this.timeSeries.get(name);
    if (!ts) return;
    ts.points.push({ timestamp: Date.now(), value });
    if (ts.points.length > ts.maxPoints) {
      ts.points = ts.points.slice(-ts.maxPoints);
    }
  }

  httpMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        const method = req.method;
        const statusCode = res.statusCode;
        const path = this.normalizePath(req.path);

        this.incrementCounter("http_requests_total", 1, `${method}:${statusCode}`);
        this.observeHistogram("http_request_duration_ms", duration, method);

        if (statusCode >= 400 && statusCode < 500) {
          this.incrementCounter("http_client_errors_total", 1, path);
        } else if (statusCode >= 500) {
          this.incrementCounter("http_server_errors_total", 1, path);
        }

        this.recordTimeSeriesPoint("rps", 1);
        this.recordTimeSeriesPoint("latency", duration);

        this.decrementGauge("http_active_requests");
      });

      this.incrementGauge("http_active_requests");
      next();
    };
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, "/:id")
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
      .substring(0, 60);
  }

  getPercentile(histogramName: string, percentile: number): number {
    const histogram = this.histograms.get(histogramName);
    if (!histogram || histogram.count === 0) return 0;

    const target = histogram.count * (percentile / 100);
    for (const bucket of histogram.buckets) {
      if (bucket.count >= target) {
        if (bucket.le === Infinity) return histogram.sum / histogram.count;
        return bucket.le;
      }
    }
    return 0;
  }

  getDashboard(): {
    architect: string;
    protocol: string;
    version: string;
    uptime: number;
    summary: {
      totalRequests: number;
      requestRate: number;
      avgLatency: number;
      p50Latency: number;
      p95Latency: number;
      p99Latency: number;
      errorRate: number;
      activeRequests: number;
      clientErrors: number;
      serverErrors: number;
    };
    counters: Array<{ name: string; help: string; value: number; topLabels: Array<{ label: string; count: number }> }>;
    gauges: Array<{ name: string; help: string; value: number }>;
    histograms: Array<{ name: string; help: string; count: number; sum: number; avg: number; p50: number; p95: number; p99: number }>;
    timeSeries: Record<string, { points: TimeSeriesPoint[]; latest: number }>;
  } {
    const now = Date.now();
    const totalReqs = this.counters.get("http_requests_total")?.value || 0;
    const uptimeSeconds = (now - this.startedAt) / 1000;
    const clientErrors = this.counters.get("http_client_errors_total")?.value || 0;
    const serverErrors = this.counters.get("http_server_errors_total")?.value || 0;

    const counterList = Array.from(this.counters.values()).map(c => ({
      name: c.name,
      help: c.help,
      value: c.value,
      topLabels: Object.entries(c.labels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, count]) => ({ label, count })),
    }));

    const gaugeList = Array.from(this.gauges.values()).map(g => ({
      name: g.name, help: g.help, value: g.value,
    }));

    const histList = Array.from(this.histograms.values()).map(h => ({
      name: h.name, help: h.help, count: h.count,
      sum: Number(h.sum.toFixed(2)),
      avg: h.count > 0 ? Number((h.sum / h.count).toFixed(2)) : 0,
      p50: this.getPercentile(h.name, 50),
      p95: this.getPercentile(h.name, 95),
      p99: this.getPercentile(h.name, 99),
    }));

    const tsData: Record<string, { points: TimeSeriesPoint[]; latest: number }> = {};
    for (const [name, ts] of this.timeSeries) {
      const last50 = ts.points.slice(-50);
      tsData[name] = { points: last50, latest: last50.length > 0 ? last50[last50.length - 1].value : 0 };
    }

    return {
      architect: ARCHITECT,
      protocol: "ONYX Metrics Engine",
      version: "1.0.0",
      uptime: now - this.startedAt,
      summary: {
        totalRequests: totalReqs,
        requestRate: uptimeSeconds > 0 ? Number((totalReqs / uptimeSeconds).toFixed(2)) : 0,
        avgLatency: this.histograms.get("http_request_duration_ms")?.count
          ? Number((this.histograms.get("http_request_duration_ms")!.sum / this.histograms.get("http_request_duration_ms")!.count).toFixed(2)) : 0,
        p50Latency: this.getPercentile("http_request_duration_ms", 50),
        p95Latency: this.getPercentile("http_request_duration_ms", 95),
        p99Latency: this.getPercentile("http_request_duration_ms", 99),
        errorRate: totalReqs > 0 ? Number(((clientErrors + serverErrors) / totalReqs * 100).toFixed(2)) : 0,
        activeRequests: this.gauges.get("http_active_requests")?.value || 0,
        clientErrors,
        serverErrors,
      },
      counters: counterList,
      gauges: gaugeList,
      histograms: histList,
      timeSeries: tsData,
    };
  }

  getPrometheusFormat(): string {
    const lines: string[] = [];
    for (const counter of this.counters.values()) {
      lines.push(`# HELP ${counter.name} ${counter.help}`, `# TYPE ${counter.name} counter`, `${counter.name} ${counter.value}`);
      for (const [label, value] of Object.entries(counter.labels)) {
        lines.push(`${counter.name}{label="${label}"} ${value}`);
      }
    }
    for (const gauge of this.gauges.values()) {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`, `# TYPE ${gauge.name} gauge`, `${gauge.name} ${gauge.value}`);
    }
    for (const hist of this.histograms.values()) {
      lines.push(`# HELP ${hist.name} ${hist.help}`, `# TYPE ${hist.name} histogram`);
      for (const bucket of hist.buckets) {
        lines.push(`${hist.name}_bucket{le="${bucket.le === Infinity ? "+Inf" : bucket.le}"} ${bucket.count}`);
      }
      lines.push(`${hist.name}_sum ${hist.sum}`, `${hist.name}_count ${hist.count}`);
    }
    return lines.join("\n");
  }

  genesis(): void {
    this.createCounter("http_requests_total", "Total HTTP requests");
    this.createCounter("http_client_errors_total", "Total 4xx errors");
    this.createCounter("http_server_errors_total", "Total 5xx errors");
    this.createCounter("deals_created_total", "Total deals created");
    this.createCounter("settlements_processed_total", "Total settlements processed");
    this.createCounter("referrals_generated_total", "Total referrals generated");
    this.createCounter("auth_logins_total", "Total login attempts");
    this.createCounter("circuit_breaker_trips_total", "Total circuit breaker trips");

    this.createGauge("http_active_requests", "Currently active HTTP requests");
    this.createGauge("connected_websockets", "Active WebSocket connections");
    this.createGauge("active_deals", "Currently active deals");
    this.createGauge("node_cpu_percent", "Node process CPU usage", 0);
    this.createGauge("node_memory_mb", "Node process memory usage MB", 0);
    this.createGauge("db_pool_active", "Active database connections", 0);

    this.createHistogram("http_request_duration_ms", "HTTP request latency in ms");
    this.createHistogram("deal_processing_time_ms", "Deal processing time in ms", [100, 500, 1000, 5000, 10000, 30000]);
    this.createHistogram("settlement_time_ms", "Settlement processing time in ms", [50, 100, 500, 1000, 5000]);
    this.createHistogram("db_query_duration_ms", "Database query duration in ms", [1, 5, 10, 25, 50, 100, 500]);

    this.createTimeSeries("rps", 360);
    this.createTimeSeries("latency", 360);
    this.createTimeSeries("errors", 360);
    this.createTimeSeries("cpu", 360);
    this.createTimeSeries("memory", 360);

    this.collectInterval = setInterval(() => {
      const mem = process.memoryUsage();
      this.setGauge("node_memory_mb", Number((mem.heapUsed / 1024 / 1024).toFixed(1)));
      this.recordTimeSeriesPoint("memory", mem.heapUsed / 1024 / 1024);
    }, 10000);

    console.log(`[ONYX METRICS ENGINE] 📊 Prometheus-compatible metrics — 8 counters, 6 gauges, 4 histograms, 5 time series — Architect: ${ARCHITECT}`);
  }
}

export const metricsEngine = new OnyxMetricsEngine();
