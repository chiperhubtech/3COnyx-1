---
name: 3c-onyx launch readiness
description: What blocks a production deploy of the api-server, and the correct go-live sequence.
---

# Launch / production readiness (3C ONYX)

## Hard boot blockers (production only)
- `JWT_SECRET` (≥64 chars) and `ENCRYPTION_KEY` (64-char hex = 32 bytes) are **required in production**. The startupGuard (`artifacts/api-server/src/lib/startupGuard.ts`) REFUSES to start the server without them.
- **Why:** in development the app uses fallbacks and only WARNs, so a missing secret is invisible until you deploy. Generate with `crypto.randomBytes(64).toString('hex')` and `crypto.randomBytes(32).toString('hex')`.
- These cannot be set programmatically (the secrets API only requests from the user); must be added via `requestEnvVar` / the Secrets UI.

## Soft (feature-degrading, do NOT block boot)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — payments degrade without them but server still boots.
- `MARKETCHECK_API_KEY` (live vehicle data), `TWILIO_*` (SMS/WhatsApp invites), Object Storage ("not yet configured" at startup).

## Go-live sequence (order matters)
1. Add `JWT_SECRET` + `ENCRYPTION_KEY` (hard blockers).
2. Add `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` (from Stripe dashboard).
3. Publish/deploy → obtain the production URL.
4. **Then** create the Stripe webhook at `{prodURL}/api/webhooks/stripe` → that yields `STRIPE_WEBHOOK_SECRET` → add it → redeploy. (Chicken-and-egg: webhook secret can't exist before the prod URL does.)
5. Point `3conyx.ai` DNS (NameCheap) at the deployment.

## Smoke test (non-destructive, dev)
- `GET /api/healthz|/api/readyz|/api/livez` → 200. Health routes live under `/api` prefix, not root.
- Golden Key gate: `GET /api/auth/validate-code?code=RAC-0001` → `{valid:true, inviterName:"Ronald"}`; bad code → 404.
- `GET /api/auth/me` and `GET /api/deals` with no token → 401. Empty `POST /api/auth/login` → 400.

## Recurring non-break
- API Server workflow sometimes FAILS with `EADDRINUSE 0.0.0.0:8080` from a stale process — it is NOT a code break. Restart the workflow to clear it; confirm with build-api + typecheck staying green.
