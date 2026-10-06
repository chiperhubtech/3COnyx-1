---
name: Smartcar API generation
description: Current Smartcar credentials differ from the legacy per-vehicle OAuth integration.
---

Use current Smartcar v3 documentation when completing the garage integration, rather than assuming legacy v2 OAuth conventions.

**Why:** In October 2026, the supplied API credentials successfully authenticated with Smartcar's client-credentials endpoint. Current Connect documentation requires an Application ID separately from the API Client ID. The existing garage scaffold was based on older per-vehicle tokens.

**How to apply:** Confirm the Application ID explicitly. Keep application-level tokens server-side, enforce owner-level access to connections, and do not infer that successful application authentication means a vehicle owner has authorized access.

Keep this garage integration read-only unless vehicle-control features are explicitly requested. Owner mappings are persisted by Smartcar through opaque external IDs rather than local per-vehicle token storage.

**Why:** Smartcar v3 tokens authorize the whole application, so the backend must independently scope every vehicle operation to the authenticated owner. Provider-persisted connections avoid losing linked vehicles on an app restart.

**How to apply:** Preserve the stable mapping secret across deployments. Rotating the encryption key changes derived owner IDs; plan a mapping migration or explicit reconnection rather than silently hiding existing vehicles. Preview and production must use separately configured, allowlisted redirect URIs.
