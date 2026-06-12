---
name: Public manifesto route wiring (3c-onyx)
description: The 4 places a new public page must be registered in the 3c-onyx web artifact, and why.
---

When adding a new public (no-auth) manifesto/strategy page to `artifacts/3c-onyx`, the route must be registered in **four** places or it silently breaks:

1. `src/App.tsx` — add the lazy/static import for the page component.
2. `src/App.tsx` — add the path (and any aliases) to the `PUBLIC_PATHS` array. Matching is `location === p || location.startsWith(p)`, so a public path also whitelists anything beneath it.
3. `src/App.tsx` — add a `<Route path="..." component={...} />` for the canonical path **and each alias** (wouter matches exact patterns, so one Route per alias).
4. `src/components/AccessGate.tsx` — add the same paths to `PUBLIC_DOOR_PATHS` so the invite-gate lets anonymous visitors through.

Optionally also add a tile to the `PORTALS` array in `src/pages/everything.tsx` so it appears on the `/everything` hub.

**Why:** `PUBLIC_PATHS` controls sidebar/auth chrome; `PUBLIC_DOOR_PATHS` controls the invite (Golden Key) gate. Registering in only one array means either the page demands auth, or it renders but is blocked by the access gate. Missing the `<Route>` means a 404. They must stay mirrored.

**How to apply:** any time you ship a new public page (e.g. /hardening, /genius, /tycoons), update all four, then `pnpm --filter @workspace/3c-onyx run build` to confirm clean.

Note on the mobile artifact: `artifacts/3c-onyx-mobile` is invite-only via a "Golden Key" gate in `components/OnboardingFlow.tsx`, which validates the entered code against existing users' `referralCode` through `GET /api/auth/validate-code`. There is no static bypass — a valid code must exist as a member's referral code in the DB.
