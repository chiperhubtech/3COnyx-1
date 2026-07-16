---
name: Shared cache backend (api-server)
description: Why the api-server caches are two-tier and the one constraint that shapes the design.
---

# Shared cache backend

The api-server caches are two-tier: an in-process near-cache (L1) with an optional
shared store (L2) behind it, so cache data can be shared across instances and survive
restarts. The L2 layer is **opt-in** and degrades safely.

**Key decisions / why:**
- L2 is enabled only when a shared-store URL is configured; with none, or on any
  connection failure, it falls back to pure in-memory. A shared-store outage must never
  take the API down — that requirement drives the fast-fail + catch-everything posture.
- Invalidations fan out via pub/sub so no instance serves stale data after a write. The
  pub/sub *subscription must re-bind on every reconnect* (not once at startup), or an
  instance silently stops receiving invalidations after a blip.
- The structured async cache fully reads L2 (true cross-instance + survive-restart). The
  other cache has a **synchronous** get and therefore can only write-through + hydrate L1
  in the background — it is eventually-shared, not synchronously survive-restart. Do not
  "fix" this by making that get async: it would break every synchronous caller.
