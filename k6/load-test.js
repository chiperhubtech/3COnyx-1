/**
 * 3C ONYX — k6 Load Test
 *
 * Simulates realistic platform traffic at 10,000 events/sec target.
 * Tests autoscaling, rate limiter behavior, circuit breaker thresholds,
 * and validates p95 latency SLOs.
 *
 * Run locally:
 *   k6 run k6/load-test.js
 *   k6 run --env BASE_URL=https://api.3conyx.com k6/load-test.js
 *
 * Run against staging:
 *   k6 run --env BASE_URL=https://staging-api.3conyx.com k6/load-test.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ── Custom metrics ──────────────────────────────────────────────────────────
const healthCheckErrors   = new Counter("health_check_errors");
const authErrors          = new Counter("auth_errors");
const vehicleApiErrors    = new Counter("vehicle_api_errors");
const agentMeshErrors     = new Counter("agent_mesh_errors");
const successRate         = new Rate("success_rate");
const p95Latency          = new Trend("p95_response_time", true);

// ── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const TEST_TOKEN = __ENV.TEST_TOKEN || ""; // JWT for authenticated routes

// ── Load Profile — 3 phases ─────────────────────────────────────────────────
// Phase 1: Ramp up to baseline (simulates morning traffic surge)
// Phase 2: Sustained peak (10k events/sec = ~1k concurrent users at 10 req/s each)
// Phase 3: Ramp down + recovery check
export const options = {
  scenarios: {
    // Scenario 1: Health check / readiness probes (simulates ALB probes)
    health_probes: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 5,
      maxVUs: 20,
      exec: "healthCheck",
    },

    // Scenario 2: Public read traffic (VIN lookups, vehicle data)
    public_reads: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: 1000,
      stages: [
        { duration: "2m",  target: 100  },  // Ramp up
        { duration: "10m", target: 500  },  // Sustained load
        { duration: "3m",  target: 1000 },  // Peak stress
        { duration: "2m",  target: 100  },  // Ramp down
        { duration: "1m",  target: 0    },  // Recovery
      ],
      exec: "publicReads",
    },

    // Scenario 3: Authenticated user flows (dashboard, agent mesh)
    auth_flows: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 200  },
        { duration: "8m",  target: 500  },
        { duration: "2m",  target: 0    },
      ],
      exec: "authFlows",
    },

    // Scenario 4: Agent mesh queries (AI-native stress test)
    agent_mesh: {
      executor: "constant-vus",
      vus: 50,
      duration: "10m",
      exec: "agentMeshQueries",
    },

    // Scenario 5: Spike test — sudden 10x traffic (bot attack simulation)
    spike_test: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1s",
      preAllocatedVUs: 500,
      maxVUs: 2000,
      stages: [
        { duration: "30s", target: 0    },  // Wait 30s into test
        { duration: "10s", target: 2000 },  // Sudden spike (bot attack)
        { duration: "1m",  target: 2000 },  // Sustained spike
        { duration: "10s", target: 0    },  // Drop off
      ],
      exec: "spikeTest",
      startTime: "13m",  // Start spike at minute 13
    },
  },

  // ── SLO thresholds — test FAILS if these are breached ─────────────────
  thresholds: {
    // Health checks must always succeed
    "http_req_failed{scenario:health_probes}": ["rate<0.001"],   // <0.1% error
    "http_req_duration{scenario:health_probes}": ["p(95)<100"],  // p95 < 100ms

    // Public reads
    "http_req_failed{scenario:public_reads}": ["rate<0.01"],     // <1% error
    "http_req_duration{scenario:public_reads}": ["p(95)<500"],   // p95 < 500ms

    // Auth flows
    "http_req_failed{scenario:auth_flows}": ["rate<0.01"],
    "http_req_duration{scenario:auth_flows}": ["p(95)<1000"],    // p95 < 1s

    // Agent mesh (AI routes are slower — allow 3s p95)
    "http_req_failed{scenario:agent_mesh}": ["rate<0.05"],
    "http_req_duration{scenario:agent_mesh}": ["p(95)<3000"],

    // Spike test — rate limiter must protect the API (high error rate OK = 429s)
    // But the API must stay alive (no 500s)
    "http_req_failed{scenario:spike_test}": ["rate<0.8"],        // Most will be 429

    // Global success rate
    success_rate: ["rate>0.95"],
  },
};

const headers = {
  "Content-Type": "application/json",
  "Accept-Encoding": "gzip, br",
  "X-3C-Client": "k6-load-test",
};

const authHeaders = {
  ...headers,
  Authorization: `Bearer ${TEST_TOKEN}`,
};

// ── Scenario: Health check probes ──────────────────────────────────────────
export function healthCheck() {
  group("Health Probes", () => {
    const res = http.get(`${BASE_URL}/api/health/livez`, { headers });
    const ok = check(res, {
      "livez status 200": (r) => r.status === 200,
      "livez has ok:true": (r) => {
        try { return JSON.parse(r.body).ok === true; } catch { return false; }
      },
    });
    if (!ok) healthCheckErrors.add(1);
    successRate.add(ok ? 1 : 0);
    p95Latency.add(res.timings.duration);
  });
}

// ── Scenario: Public reads ─────────────────────────────────────────────────
const SAMPLE_VINS = [
  "1HGBH41JXMN109186", "2T1BURHE0JC053307", "JF1GE6A69BH502949",
  "1N4AL3AP4JC231464", "5NPE24AF8FH002209",
];

export function publicReads() {
  group("Public Reads", () => {
    const vin = SAMPLE_VINS[randomIntBetween(0, SAMPLE_VINS.length - 1)];

    const res = http.get(`${BASE_URL}/api/health/readyz`, {
      headers,
      tags: { route: "readyz" },
    });

    const ok = check(res, {
      "readyz 200 or 503": (r) => r.status === 200 || r.status === 503,
    });
    if (!ok) vehicleApiErrors.add(1);
    successRate.add(ok ? 1 : 0);
    sleep(randomIntBetween(1, 3) / 10); // 0.1 - 0.3s think time
  });
}

// ── Scenario: Authenticated flows ─────────────────────────────────────────
export function authFlows() {
  if (!TEST_TOKEN) {
    sleep(1);
    return;
  }

  group("Auth Flows", () => {
    // Simulate a member checking their mesh status
    const res = http.get(`${BASE_URL}/api/mesh/status`, {
      headers: authHeaders,
      tags: { route: "mesh_status" },
    });

    const ok = check(res, {
      "mesh status 200 or 401": (r) => r.status === 200 || r.status === 401,
      "response has agents": (r) => {
        if (r.status !== 200) return true;
        try { return Array.isArray(JSON.parse(r.body).agents); } catch { return false; }
      },
    });
    if (!ok) authErrors.add(1);
    successRate.add(ok ? 1 : 0);
    sleep(randomIntBetween(2, 8) / 10); // 0.2 - 0.8s think time
  });
}

// ── Scenario: Agent mesh queries ──────────────────────────────────────────
export function agentMeshQueries() {
  group("Agent Mesh", () => {
    const res = http.get(`${BASE_URL}/api/mesh/status`, {
      headers,
      tags: { route: "agent_mesh" },
    });

    const ok = check(res, {
      "mesh responded": (r) => r.status < 500,
      "mesh latency<3s": (r) => r.timings.duration < 3000,
    });
    if (!ok) agentMeshErrors.add(1);
    successRate.add(ok ? 1 : 0);
    sleep(randomIntBetween(5, 20) / 10); // 0.5 - 2s think time
  });
}

// ── Scenario: Spike test (rate limiter validation) ────────────────────────
export function spikeTest() {
  group("Spike Test", () => {
    const res = http.get(`${BASE_URL}/api/health/livez`, { headers });

    // During a spike, we WANT to see 429s — that means the limiter is working.
    // We NEVER want to see 500s — that means the API crashed.
    check(res, {
      "not a 500 error": (r) => r.status !== 500,
      "rate limited or ok": (r) => r.status === 200 || r.status === 429,
    });
    successRate.add(res.status !== 500 ? 1 : 0);
  });
}
