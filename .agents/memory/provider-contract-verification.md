---
name: Provider contract verification
description: Verify integration activation against real provider records, not just status flags or synthetic fixtures.
---

Treat provider activation as complete only after actual records survive normalization and user-facing filters affect results.

**Why:** Activating MarketCheck exposed false confidence from successful HTTP responses and synthetic tests: the provider reported matches while the app discarded every record. A second live check exposed filters that the provider silently ignored.

**How to apply:** When enabling or modifying a provider, inspect a minimal, non-sensitive sample of its real response and verify both an ordinary query and one constrained query through the app endpoint. A configured flag or HTTP 200 alone is insufficient.
