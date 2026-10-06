---
name: Smartcar API generation
description: Current Smartcar credentials differ from the legacy per-vehicle OAuth integration.
---

Use current Smartcar v3 documentation when completing the garage integration, rather than assuming legacy v2 OAuth conventions.

**Why:** In October 2026, the supplied API credentials successfully authenticated with Smartcar's client-credentials endpoint. Current Connect documentation requires an Application ID separately from the API Client ID. The existing garage scaffold was based on older per-vehicle tokens.

**How to apply:** Confirm the Application ID explicitly. Keep application-level tokens server-side, enforce owner-level access to connections, and do not infer that successful application authentication means a vehicle owner has authorized access.
