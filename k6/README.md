# 3C ONYX — Load Testing with k6

## Quick Start

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running the Tests

```bash
# Against local dev server
k6 run k6/load-test.js

# Against staging (with auth)
k6 run \
  --env BASE_URL=https://staging-api.3conyx.com \
  --env TEST_TOKEN=your-jwt-token \
  k6/load-test.js

# Against production (read-only, health probes only)
k6 run \
  --env BASE_URL=https://api.3conyx.com \
  --scenario health_probes \
  k6/load-test.js
```

## Scenarios

| Scenario | Target | Duration | Purpose |
|---|---|---|---|
| `health_probes` | 100 req/s | 5 min | ALB health probe simulation |
| `public_reads` | 100→1000 req/s | 18 min | Ramp + sustained load |
| `auth_flows` | 0→500 VUs | 12 min | Authenticated user journeys |
| `agent_mesh` | 50 constant VUs | 10 min | AI agent stress test |
| `spike_test` | 0→2000 req/s | 2 min | Bot attack / DDoS simulation |

## SLO Thresholds

- Health probes: p95 < 100ms, error rate < 0.1%
- Public reads: p95 < 500ms, error rate < 1%
- Auth flows: p95 < 1000ms, error rate < 1%
- Agent mesh: p95 < 3000ms, error rate < 5%
- During spike: No 500 errors (429s from rate limiter are acceptable)

## What a Pass Looks Like

```
✓ health_check_errors.............: 0
✓ success_rate....................: 97.34%
✓ http_req_duration{scenario:public_reads}: p(95)=423ms
✓ http_req_failed{scenario:spike_test}: rate=0.76 (76% = 429s, no 500s)
```
