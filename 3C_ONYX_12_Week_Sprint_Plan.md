# 3C ONYX — 12-Week Engineering Sprint Plan
## 100x Reliability · Security · Scalability

**Owner:** Ronald Antonio Cadet (Ron3C) | CUXTOMCANDYCLUB LLC  
**Platform:** 3C ONYX Sovereign AI Super App  
**Fingerprint:** 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED

---

## Executive Summary

**Top 3 Risks & Mitigations**

| Risk | Severity | Mitigation |
|---|---|---|
| External service failure cascades to platform downtime | HIGH | Circuit breakers deployed on all 9 external services (Stripe, Twilio, OpenAI, Anthropic, Gemini, MarketCheck, Oracle, Plaid, Places) |
| Unplanned deployment breaks production | HIGH | GitHub Actions CI/CD gate: typecheck → build → security scan → canary → prod. No merge without all checks green |
| Secrets rotation gap leaves stale credentials exploitable | MEDIUM | Dependabot weekly audit + startup guard rejects server boot if secrets are weak or missing |

---

## Weeks 1–2: Foundation & Security Hardening ✅ COMPLETED

**Deliverables:**
- [x] Graceful shutdown — SIGTERM/SIGINT with 15s connection draining
- [x] Unhandled rejection / uncaught exception crash-fast handlers
- [x] Circuit breaker — 9 external services (Stripe, Twilio, AI APIs, Oracle, Plaid, Places)
- [x] W3C Trace Context (traceparent) middleware — distributed tracing headers
- [x] Zod validation middleware — `validateBody`, `validateQuery`, `validateParams`
- [x] GitHub Actions CI pipeline — typecheck, build, security scan, gitleaks
- [x] GitHub Actions weekly security audit — audit, SBOM, secret scan
- [x] Dependabot — weekly dependency updates (patch grouped, no auto-majors)
- [x] k6 load test — 5-scenario suite (health, reads, auth, agent mesh, spike)
- [x] Health check — circuit breaker status exposed at `/api/health/healthz`

**Success Metrics:**
- API server starts clean with all new middleware
- `/api/health/healthz` returns `circuitBreakers.status: "all_closed"`
- CI pipeline passes on first run

---

## Weeks 3–4: Observability & Alerting

**Deliverables:**
- [ ] OpenTelemetry SDK — instrument all route handlers with spans
- [ ] Pino transport → Grafana Loki or AWS CloudWatch Logs
- [ ] Grafana dashboard — p95 latency per route, error rate, circuit breaker state
- [ ] Alert rules — PagerDuty/Slack on: DB degraded, circuit OPEN, error rate >1%
- [ ] SLO dashboard — 99.9% uptime, p95 <500ms, error <1%
- [ ] Structured error codes — every error response has a unique code for traceability

**Commands:**
```bash
# Run with structured log output
NODE_ENV=production pnpm --filter @workspace/api-server run dev 2>&1 | npx pino-pretty
```

**Success Metrics:**
- Every request traceable from trace ID in logs
- Grafana shows real-time p95 latency per route
- Alert fires within 60s of DB going degraded

---

## Weeks 5–6: Performance & Caching

**Deliverables:**
- [ ] Redis cache layer — VIN lookup, vehicle history, insurance quotes cached 5 min
- [ ] Response caching headers validated — CDN-Cache-Control on public routes
- [ ] DB connection pool tuning — Neon serverless max connections reviewed
- [ ] Pagination enforcement — all list endpoints required to use cursor or page/limit
- [ ] Background job queue — Bull/BullMQ for price alerts, notifications, outreach

**k6 Validation:**
```bash
k6 run --env BASE_URL=https://staging-api.3conyx.com k6/load-test.js
```
Target: p95 public reads < 200ms after Redis cache is live

**Success Metrics:**
- VIN lookup p95 drops from ~400ms to <100ms (cache hit)
- DB connection errors = 0 under 500 concurrent users

---

## Weeks 7–8: Infrastructure as Code

**Deliverables:**
- [ ] Dockerfile — multi-stage build for API server (node:22-alpine final image)
- [ ] docker-compose.yml — local dev stack (API + Postgres + Redis)
- [ ] Terraform skeleton — AWS VPC, subnets, ALB, ECS task definition
- [ ] Terraform skeleton — OCI FastConnect placeholder for Oracle interconnect
- [ ] GitHub Actions CD pipeline — staging deploy on merge to `dev`
- [ ] GitHub Actions CD pipeline — production deploy on merge to `main` (canary 10% → 100%)

**Terraform Structure:**
```
infra/
  terraform/
    aws/
      vpc.tf          # VPC, subnets, NAT gateway
      alb.tf          # Application Load Balancer
      ecs.tf          # ECS Fargate cluster + task definitions
      rds.tf          # RDS Proxy for connection pooling (optional)
      kms.tf          # KMS keys for secrets encryption
    oci/
      fastconnect.tf  # Oracle FastConnect placeholder
      object_storage.tf
    variables.tf
    outputs.tf
```

**Success Metrics:**
- `terraform plan` runs without errors
- Staging environment deployable from CI in < 5 minutes

---

## Weeks 9–10: Secrets & PKI Hardening

**Deliverables:**
- [ ] AWS KMS — JWT_SECRET and ENCRYPTION_KEY stored in KMS, not env vars
- [ ] AWS Secrets Manager — Stripe, Twilio, MarketCheck secrets rotated monthly
- [ ] X.509 device certificate issuance flow — for vehicle telematics / IoT
- [ ] Secrets rotation script — automated 90-day rotation with zero-downtime reload
- [ ] Production startup guard — hard fail if any secret older than 90 days

**Rotation Script:**
```bash
# Rotate JWT_SECRET — generates new key, updates KMS, triggers rolling restart
node scripts/rotate-secret.js --secret JWT_SECRET --kms-key-id alias/3c-onyx-prod
```

**Success Metrics:**
- Zero secrets in environment variables (all in KMS/Secrets Manager)
- Rotation happens without downtime (dual-key verification window)

---

## Weeks 11–12: Load Test at Scale & DR Drill

**Deliverables:**
- [ ] k6 cloud run — 1M simulated devices against staging
- [ ] Autoscaling validation — ECS task count scales from 2 → 20 under load
- [ ] Disaster recovery drill — full DB restore from backup in < 30 minutes
- [ ] Runbook — incident response for: DB down, payment service OPEN, AI outage
- [ ] Chaos engineering — kill one ECS task mid-load-test; validate zero user impact
- [ ] Security penetration test — OWASP Top 10 checklist against staging

**DR Test Script:**
```bash
# Simulate DB failure
# 1. Pause Neon DB
# 2. Verify /readyz returns 503
# 3. Verify circuit breaker opens
# 4. Restore DB
# 5. Verify /readyz returns 200
# 6. Verify circuit breaker closes (HALF_OPEN → CLOSED)
# Target: < 30s to detect, < 2 min to recover
```

**Final Success Metrics:**
- Platform handles 10,000 events/sec with p95 < 500ms
- Zero 500 errors during spike test (all excess traffic → 429)
- DR drill completes in < 30 minutes
- All circuit breakers remain CLOSED under normal load
- Security scan: zero critical CVEs in production dependencies

---

## Immediate Actions — Next 7 Days

| Priority | Action | Owner | Deadline |
|---|---|---|---|
| P0 | Add JWT_SECRET (64+ chars) to Replit secrets | Ron3C | Day 1 |
| P0 | Add ENCRYPTION_KEY (64-char hex) to Replit secrets | Ron3C | Day 1 |
| P0 | Add Stripe webhook secret (STRIPE_WEBHOOK_SECRET) | Ron3C | Day 1 |
| P1 | Restart API server — validate new middleware compiles | ONYX | Day 1 |
| P1 | Verify `/api/health/healthz` returns circuit breaker status | ONYX | Day 1 |
| P1 | Run k6 smoke test against local dev server | ONYX | Day 2 |
| P2 | Add Twilio credentials (TWILIO_ACCOUNT_SID, AUTH_TOKEN, FROM) | Ron3C | Day 3 |
| P2 | Add MARKETCHECK_API_KEY | Ron3C | Day 3 |
| P2 | Set up Oracle Cloud account (free tier) + add 6 Oracle secrets | Ron3C | Day 5 |
| P3 | Push code to GitHub — trigger CI pipeline for first run | ONYX | Day 7 |

---

## Attack Surface Reduction Checklist

- [x] No secrets in source code — all via environment variables
- [x] Startup guard rejects server if secrets missing/weak
- [x] HSTS enforced (2 years, preload)
- [x] CSP enforced (no unsafe-eval, no inline scripts)
- [x] Rate limiting on all routes (5 tiers)
- [x] Auth limiter skips successful requests (no brute-force counting for legit users)
- [x] Scanner detector auto-bans reconnaissance IPs
- [x] IP guard with progressive penalties (temp ban → permanent)
- [x] Request body capped at 2MB (16KB for auth routes)
- [x] All inputs sanitized (XSS / injection prevention)
- [x] Token blacklist active (JWT revocation)
- [x] Honey token deployed (attacker fingerprinting)
- [x] Chain of custody for all transactions
- [x] Audit log for every state change
- [x] Graceful shutdown (no zombie processes)
- [x] Circuit breakers (no cascade failures)
- [x] W3C tracing (every request traceable)
- [x] Dependabot (weekly dep updates)
- [x] CI security scan (gitleaks, audit)
- [ ] Secrets moved to KMS (Week 9-10)
- [ ] Penetration test (Week 12)

---

*© 2026 CUXTOMCANDYCLUB LLC. All rights reserved. Proprietary and confidential.*  
*3C ONYX — ONYX ACTS · MEMBER CONFIRMS · EVERYTHING LOGGED*
