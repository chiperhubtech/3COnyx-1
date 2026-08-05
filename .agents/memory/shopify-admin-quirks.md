---
name: Shopify Admin proxy quirks
description: Non-standard GraphQL requirements when seeding catalog via the Replit/OpenInt Shopify Admin proxy
---

The Shopify Admin API reached through the OpenInt proxy (shopify-admin-api.mjs) diverges from stock Shopify docs:

- `inventoryActivate` and `inventorySetQuantities` **require an `@idempotent(key: "...")` directive on the mutation field** (not the operation) or they fail with BAD_REQUEST. Use a stable unique key per call.
- `InventorySetQuantitiesInput` does **not** accept `ignoreCompareQuantity` or `compareQuantity`; instead each quantity entry requires **`changeFromQuantity`** (read the current level first via `inventoryItem.inventoryLevel.quantities(names:["available"])`).

**How to apply:** any catalog/inventory seeding script must query current stock and pass `changeFromQuantity`, and add `@idempotent` keys to inventory mutations. Make seed scripts resume-safe (look up product by title before creating) since partial failures leave products half-configured.

Store facts (dev store, pre-claim): Replit sales-channel publication is the one returned by `currentAppInstallation.publication`. Checkout URLs need `channel=online_store` until the merchant claims the store (handled in /shop/checkout route, dev only).

**Known gap (disclosed to user 2026-08-05):** membership/service products have no post-payment fulfillment — no Shopify order webhook or entitlement provisioning. Golden Key purchase does not yet grant app access automatically.
